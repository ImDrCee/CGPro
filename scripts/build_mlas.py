"""Builds data/mlas.js (the 90-seat MLA roster) from public Wikipedia pages.

Sources: 2023 Chhattisgarh Legislative Assembly election (results table), Raipur City South
by-election 2024, Sai ministry (portfolios), Chhattisgarh Legislative Assembly (officers).
Hindi names come from Wikipedia language links. Verify against the Election Commission of India
(results.eci.gov.in) before relying on any single row.

Usage: python scripts/build_mlas.py
"""
import html
import json
import os
import re
import time
import urllib.parse
import urllib.request

UA = "JanDarpanBot/1.0 (+https://github.com/ImDrCee/CGPro; research POC)"
API = "https://en.wikipedia.org/w/api.php"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "data", "mlas.js")

FOCUS = {
    "Raipur": "raipur", "Durg": "durg", "Bilaspur": "bilaspur", "Korba": "korba",
    "Raigarh": "raigarh", "Rajnandgaon": "rajnandgaon", "Bastar": "bastar",
    "Dantewada": "dantewada", "Surguja": "surguja", "Janjgir-Champa": "janjgir",
}


HI_SEAT = {"Dharsiwa": "धरसींवा", "Raipur City Gramin": "रायपुर ग्रामीण", "Raipur City West": "रायपुर पश्चिम", "Raipur City North": "रायपुर उत्तर", "Raipur City South": "रायपुर दक्षिण", "Abhanpur": "अभनपुर", "Rajim": "राजिम", "Bindrawagarh": "बिंद्रानवागढ़", "Sihawa": "सिहावा", "Kurud": "कुरुद", "Dhamtari": "धमतरी", "Sanjari-Balod": "संजारी बालोद", "Dondi Lohara": "डौंडीलोहारा", "Gunderdehi": "गुंडरदेही"}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=40).read().decode("utf-8", "replace")


def parse_page(title):
    url = API + "?action=parse&format=json&prop=text&redirects=1&page=" + urllib.parse.quote(title)
    return json.loads(get(url))["parse"]["text"]["*"]


def clean(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()


def href_title(cell):
    m = re.search(r'href="/wiki/([^"#]+)"', cell)
    return urllib.parse.unquote(m.group(1)).replace("_", " ") if m else ""


def hindi_titles(titles):
    out = {}
    titles = [t for t in sorted(set(titles)) if t]
    for i in range(0, len(titles), 40):
        chunk = titles[i:i + 40]
        url = (API + "?action=query&format=json&redirects=1&prop=langlinks&lllang=hi&lllimit=500&titles="
               + urllib.parse.quote("|".join(chunk)))
        q = json.loads(get(url))["query"]
        back = {}
        for n in q.get("normalized", []):
            back[n["to"]] = n["from"]
        for r in q.get("redirects", []):
            back[r["to"]] = back.get(r["from"], r["from"])
        for p in q["pages"].values():
            for ll in p.get("langlinks", []):
                out[back.get(p["title"], p["title"])] = ll["*"]
                out[p["title"]] = ll["*"]
        time.sleep(0.5)
    return out


def results():
    t = parse_page("2023_Chhattisgarh_Legislative_Assembly_election")
    tb = re.findall(r"<table.*?</table>", t, re.S)[12]
    rows = re.findall(r"<tr.*?</tr>", tb, re.S)[2:]
    out, dist = [], ""
    for r in rows:
        raw = []
        for _tag, attrs, body in re.findall(r"<t([hd])([^>]*)>(.*?)</t[hd]>", r, re.S):
            if "data-sort-value" in attrs and not clean(body):
                continue
            raw.append(body)
        vals = [clean(b) for b in raw]
        if not vals:
            continue
        if not vals[0].isdigit():
            dist = vals[0].replace("\u2013", "-")
            vals, raw = vals[1:], raw[1:]
        no, name, win, party, votes, pct, run, rparty, rvotes, rpct, margin = vals[:11]
        res = re.search(r"\((ST|SC)\)", name)
        out.append({
            "no": int(no), "constituency": re.sub(r"\s*\((ST|SC)\)", "", name),
            "reserved": res.group(1) if res else "GEN", "district": dist,
            "name": win, "party": party, "votes": int(votes.replace(",", "")), "pct": float(pct),
            "runnerUp": run, "runnerUpParty": rparty, "margin": int(margin.replace(",", "")),
            "_cwiki": href_title(raw[1]), "_wiki": href_title(raw[2]),
        })
    return out


def portfolios():
    t = parse_page("Sai_ministry")
    out = {}
    for tb in re.findall(r"<table.*?</table>", t, re.S):
        rows = re.findall(r"<tr.*?</tr>", tb, re.S)
        if not rows or "Portfolio" not in clean(rows[0]):
            continue
        for r in rows[1:]:
            cells = re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", r, re.S)
            if len(cells) < 4:
                continue
            port = re.sub(r"<br\s*/?>", "; ", cells[0])
            port = re.sub(r"</?(?:li|ul|p|div)[^>]*>", "; ", port)
            port = re.sub(r"(?:;\s*)+", "; ", clean(port.replace("\n", " "))).strip("; ")
            out[clean(cells[1])] = {"portfolio": port, "left": clean(cells[3])}
        break
    return out


def main():
    rows = results()
    assert len(rows) == 90, len(rows)
    port = portfolios()
    hi = hindi_titles([r["_cwiki"] for r in rows] + [r["_wiki"] for r in rows])

    mlas = []
    for r in rows:
        m = {k: v for k, v in r.items() if not k.startswith("_")}
        m["focus"] = FOCUS.get(r["district"], "other")
        m["wiki"] = r["_wiki"]
        m["hi"] = re.sub(r",\s*छत्तीसगढ़$", "", re.sub(r"\s*(विधानसभा क्षेत्र|विधानसभा निर्वाचन क्षेत्र).*$", "", hi.get(r["_cwiki"], ""))) or HI_SEAT.get(r["constituency"], "")
        m["nameHi"] = re.sub(r"\s*\(.*?\)$", "", hi.get(r["_wiki"], ""))
        m["term"] = "2023 general election"
        if r["constituency"] == "Raipur City South":
            m.update({"name": "Sunil Kumar Soni", "party": "BJP", "votes": 89220, "pct": 65.03,
                      "runnerUp": "Akash Sharma", "runnerUpParty": "INC", "margin": 46167,
                      "wiki": "Sunil Kumar Soni", "nameHi": "", "term": "2024 by-election (Brijmohan Agrawal resigned after winning the Raipur Lok Sabha seat)"})
        p = port.get(m["name"])
        if p and p["left"] == "Incumbent":
            m["role"] = p["portfolio"].replace(" ; ", "; ")
        mlas.append(m)

    by = {m["name"]: m for m in mlas}
    for nm, role in (("Raman Singh", "Speaker of the Assembly"), ("Charan Das Mahant", "Leader of Opposition"), ("Bhupesh Baghel", "Former Chief Minister (2018-2023)")):
        if nm in by and not by[nm].get("role"):
            by[nm]["role"] = role

    payload = {
        "asOf": time.strftime("%Y-%m-%d"),
        "source": "Wikipedia (2023 Chhattisgarh Legislative Assembly election, Sai ministry); verify against ECI",
        "mlas": mlas,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("window.CGP_MLAS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n")
    parties = {}
    for m in mlas:
        parties[m["party"]] = parties.get(m["party"], 0) + 1
    print("seats", len(mlas), parties, "hindi consts", sum(1 for m in mlas if m["hi"]), "hindi names", sum(1 for m in mlas if m["nameHi"]),
          "roles", sum(1 for m in mlas if m.get("role")))


if __name__ == "__main__":
    main()

