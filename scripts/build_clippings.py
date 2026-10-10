"""Turns the daily newspaper-clipping PDFs in pulse_data/ into clip records (local, private).

For every page it extracts the scanned image, saves a JPEG copy under pulse_data/clips/<date>/<nnn>.jpg,
OCRs it (Hindi + English, with word heights so the headline can be picked out), identifies the paper and edition,
and writes pulse_data/clips.json. That file holds the full OCR text and stays on this machine.

Needs: pymupdf, pillow, Tesseract with `hin` and `eng`.
Usage: python scripts/build_clippings.py [--workers=6] [--limit=N]
"""
import csv
import glob
import io
import json
import os
import re
import subprocess
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor

import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "pulse_data")
CLIPS = os.path.join(SRC, "clips")
TESS = os.environ.get("TESSERACT", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
os.environ.setdefault("TESSDATA_PREFIX", os.path.join(os.path.expanduser("~"), "tessdata"))

MONTHS = {"जनवरी": 1, "फरवरी": 2, "मार्च": 3, "अप्रैल": 4, "मई": 5, "जून": 6, "जुलाई": 7, "अगस्त": 8, "सितंबर": 9, "सितम्बर": 9,
          "अक्टूबर": 10, "october": 10, "september": 9}

PAPERS = [
    ("Navbharat (Chhattisgarh)", r"नव.?भारत|navabharat|navbharat|epaper\.nav"),
    ("Hari Bhoomi", r"हरिभूमि|हरिभमि|हशिभूमि|haribhoomi|भूमि न्यूज"),
    ("Dainik Bhaskar", r"भास्कर|bhaskar"),
    ("Patrika", r"पत्रिका|patrika|पत्रिक"),
    ("Nai Dunia", r"नईदुनिया|नई दुनिया|naidunia|दुनिया प्रतिनिधि|नईदुनिवा"),
    ("Swadesh", r"स्वदेश"),
]
NOISE = re.compile(r"^\W*(\d{1,2}\W?\d{1,2}\W?\d{2,4}|epaper\S*|\S*\.(com|in|news)\S*|raipur main.*|rajdhani.*|nyaydhani.*|रायपुर|बिलासपुर|दुर्ग|छत्तीसगढ़|पेज\s*\d*)\W*$", re.I)
JUNK = re.compile(r"[|\\_~`^<>{}\[\]«»•●■□◆▪]+")


def date_from_name(name):
    m = re.match(r"(\d{1,2})\s+(\S+)\s+(\d{4})", name)
    d, mon, y = int(m.group(1)), m.group(2).lower(), int(m.group(3))
    return "%04d-%02d-%02d" % (y, MONTHS[mon], d)


def resolve_date(name_date, texts):
    """The file name is a hint; the dates printed in the pages are the truth. Use the cover date when the
    pages agree with it or print no readable day, and the most common printed day otherwise."""
    from collections import Counter
    cnt = Counter()
    for t in texts:
        for m in re.finditer(r"(\d{2})\s*(Sep|Oct|Nov|Dec|Aug)\w*\s*2026", t):
            cnt["2026-%02d-%s" % ({"Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12}[m.group(2)], m.group(1))] += 1
    top = cnt.most_common(1)
    if top and top[0][1] >= 8:
        return top[0][0]
    cover = texts[0] if texts else ""
    m = re.search(r"(\d{1,2})\s*(जनवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|सितम्बर|अक्टूबर|नवंबर|दिसंबर)\s*(20\d\d)", cover)
    if m:
        mon = MONTHS.get(m.group(2))
        if mon:
            return "%04d-%02d-%02d" % (int(m.group(3)), mon, int(m.group(1)))
    return name_date


def clean(s):
    s = JUNK.sub(" ", s)
    return re.sub(r"\s+", " ", s).strip(" -:;,.")


def ocr_lines(png):
    run = subprocess.run([TESS, png, "stdout", "-l", "hin+eng", "--psm", "3", "tsv"], capture_output=True)
    rows = list(csv.reader(io.StringIO(run.stdout.decode("utf-8", "replace")), delimiter="\t", quoting=csv.QUOTE_NONE))
    head = rows[0]
    ix = {k: i for i, k in enumerate(head)}
    lines = {}
    for r in rows[1:]:
        if len(r) < len(head) or r[ix["level"]] != "5":
            continue
        txt = r[ix["text"]].strip()
        if not txt or float(r[ix["conf"]]) < 20:
            continue
        key = (r[ix["block_num"]], r[ix["par_num"]], r[ix["line_num"]])
        L = lines.setdefault(key, {"w": [], "h": [], "top": int(r[ix["top"]]), "left": int(r[ix["left"]]), "order": len(lines)})
        L["w"].append(txt)
        L["h"].append(int(r[ix["height"]]))
        L.setdefault("c", []).append(float(r[ix["conf"]]))
    out = []
    for key, L in lines.items():
        h = sorted(L["h"])[len(L["h"]) // 2]
        out.append({"text": " ".join(L["w"]), "h": h, "conf": sum(L["c"]) / len(L["c"]), "top": L["top"], "left": L["left"], "n": len(L["w"]), "order": L["order"], "key": key})
    return out


MAST = re.compile(r"दैनिक\s*भास्कर|भास्कर\s*न्यूज़?|बस्तर\s*भास्कर|नव.?भारत(\s*(ब्यूरो|रिपोर्टर|न्यूज़?))?|हरि\s*भूमि|हरिभमि|हशिभूमि|पत्रिका(\s*(न्यूज़?\s*नेटवर्क|ब्यूरो))?|नईदुनिया|नई\s*दुनिया|दुनिया\s*प्रतिनिधि|स्वदेश|"
                  r"the\s*hitavada|patrika\.com|epaper\S*|न्यूज़?\s*पेपर\s*कतरन|भाजपा\s*प्रदेश\s*मीडिया\s*विभाग|ओडिशा|अक्षम", re.I)


def letters_ratio(s):
    t = re.sub(r"\s", "", s)
    return (sum(1 for c in t if c.isalpha() or "\u0900" <= c <= "\u097f") / len(t)) if t else 0


def pick_headline(lines):
    cand = []
    for l in lines:
        t = clean(MAST.sub(" ", l["text"]))
        if len(t.split()) < 2 or NOISE.match(t) or len(t) < 8 or l["conf"] < 45 or letters_ratio(t) < 0.75:
            continue
        cand.append(dict(l, text=t))
    if not cand:
        return ""
    for big in sorted({l["h"] for l in cand}, reverse=True):
        top = sorted([l for l in cand if l["h"] >= 0.85 * big and l["h"] <= 1.2 * big], key=lambda l: (l["top"], l["left"]))
        chosen = [top[0]]
        for l in top[1:]:
            if abs(l["top"] - chosen[-1]["top"]) <= 3.2 * big and abs(l["left"] - top[0]["left"]) <= 12 * big and len(chosen) < 3:
                chosen.append(l)
        h = clean(" ".join(c["text"] for c in chosen))
        if len(h.split()) >= 3:
            return h[:170]
    return ""


def page_job(args):
    path, idx, date = args
    doc = pymupdf.open(path)
    page = doc[idx]
    imgs = page.get_images()
    if not imgs:
        return idx, None
    pix = pymupdf.Pixmap(doc, imgs[0][0])
    if pix.n > 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    folder = os.path.join(CLIPS, date)
    os.makedirs(folder, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, "p.png")
        pix.save(png)
        lines = ocr_lines(png)
        im = Image.open(png).convert("RGB")
        w, h = im.size
        if w > 1100:
            im = im.resize((1100, int(h * 1100 / w)), Image.LANCZOS)
        im.save(os.path.join(folder, "%03d.jpg" % idx), "JPEG", quality=72, optimize=True)
    lines.sort(key=lambda l: l["order"])
    text = "\n".join(l["text"] for l in lines)
    return idx, {"w": w, "h": h, "text": text, "headline": pick_headline(lines)}


def detect_paper(text):
    head = text[:700]
    for name, rx in PAPERS:
        if re.search(rx, head, re.I):
            return name
    for name, rx in PAPERS:
        if re.search(rx, text, re.I):
            return name
    return ""


def smooth(papers):
    out = list(papers)
    for i, p in enumerate(out):
        if p:
            continue
        prev = next((out[j] for j in range(i - 1, -1, -1) if out[j]), "")
        nxt = next((papers[j] for j in range(i + 1, len(papers)) if papers[j]), "")
        out[i] = prev if (prev and (prev == nxt or not nxt)) else (nxt or prev)
    return out


def main():
    workers, limit = 6, 0
    for a in sys.argv[1:]:
        if a.startswith("--workers="):
            workers = int(a.split("=")[1])
        elif a.startswith("--limit="):
            limit = int(a.split("=")[1])
    records = []
    with ProcessPoolExecutor(max_workers=workers) as ex:
        for path in sorted(glob.glob(os.path.join(SRC, "*.pdf"))):
            name = os.path.basename(path)
            date = date_from_name(name)
            n = len(pymupdf.open(path))
            if limit:
                n = min(n, limit)
            res = dict(ex.map(page_job, [(path, i, date) for i in range(n)], chunksize=3))
            texts = [(res[i] or {}).get("text", "") for i in range(n)]
            real = resolve_date(date, texts)
            if real != date:
                print("  note: %s holds the issue of %s" % (name, real), flush=True)
                src, dst = os.path.join(CLIPS, date), os.path.join(CLIPS, real)
                if os.path.isdir(src) and not os.path.exists(dst):
                    os.rename(src, dst)
                date = real
            papers = smooth([detect_paper(t) for t in texts])
            for i in range(n):
                r = res[i]
                if not r:
                    continue
                ed = re.search(r"(Raipur Main|Rajdhani|Nyaydhani)", r["text"], re.I)
                records.append({"id": "%s-%03d" % (date, i), "date": date, "page": i, "paper": papers[i], "edition": ed.group(1).title() if ed else "",
                                "headline": r["headline"], "text": r["text"], "w": r["w"], "h": r["h"], "img": "%s/%03d.jpg" % (date, i),
                                "cover": bool(re.search(r"न्यूज़? पेपर कतरन|पेपर कतरन", r["text"][:200]))})
            print("done", name, n, flush=True)
    with open(os.path.join(SRC, "clips.json"), "w", encoding="utf-8") as f:
        json.dump({"records": records}, f, ensure_ascii=False)
    print("records", len(records))


if __name__ == "__main__":
    main()
