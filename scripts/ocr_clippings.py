"""OCR the daily newspaper-clipping PDFs in pulse_data/ (scanned images, one clipping per page).

Writes pulse_data/ocr/<pdf name>.json with the text of every page. The PDFs and the OCR output are
git-ignored: they are the party's internal compilation and must not be published.

Needs: pip install pymupdf, Tesseract with the `hin` and `eng` models.
Usage: python scripts/ocr_clippings.py [--workers=6]
"""
import glob
import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ProcessPoolExecutor

import pymupdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "pulse_data")
OUT = os.path.join(SRC, "ocr")
TESS = os.environ.get("TESSERACT", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
os.environ.setdefault("TESSDATA_PREFIX", os.path.join(os.path.expanduser("~"), "tessdata"))


def page_text(args):
    path, idx = args
    doc = pymupdf.open(path)
    page = doc[idx]
    imgs = page.get_images()
    if not imgs:
        return idx, ""
    pix = pymupdf.Pixmap(doc, imgs[0][0])
    if pix.n > 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    with tempfile.TemporaryDirectory() as tmp:
        png = os.path.join(tmp, "p.png")
        pix.save(png)
        run = subprocess.run([TESS, png, "stdout", "-l", "hin+eng", "--psm", "3"], capture_output=True)
    return idx, run.stdout.decode("utf-8", "replace")


def main():
    workers = 6
    for a in sys.argv[1:]:
        if a.startswith("--workers="):
            workers = int(a.split("=")[1])
    os.makedirs(OUT, exist_ok=True)
    with ProcessPoolExecutor(max_workers=workers) as ex:
        for path in sorted(glob.glob(os.path.join(SRC, "*.pdf"))):
            name = os.path.basename(path)
            target = os.path.join(OUT, name + ".json")
            if os.path.exists(target):
                continue
            n = len(pymupdf.open(path))
            pages = dict(ex.map(page_text, [(path, i) for i in range(n)], chunksize=4))
            with open(target, "w", encoding="utf-8") as f:
                json.dump({"file": name, "pages": [pages[i] for i in range(n)]}, f, ensure_ascii=False)
            print("done", name, n, flush=True)


if __name__ == "__main__":
    main()
