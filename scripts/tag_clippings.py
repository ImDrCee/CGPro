"""Tags the OCR'd clippings with the app's own tagger and writes data/clippings.js.

Reads pulse_data/clips.json (full OCR text, private) and runs CGP.live.tag in a headless browser, so the tags are
exactly what the app would compute. The public file keeps only the headline and the computed tags and metrics;
the article text and the page images never leave pulse_data/.

Usage: python scripts/tag_clippings.py
"""
import asyncio
import json
import os
import sys
import time

from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "pulse_data", "clips.json")
OUT = os.path.join(ROOT, "data", "clippings.js")

JS = """
(recs) => recs.map(r => {
  const it = CGP.live.tag({ id: 'K' + r.id, ts: Date.parse(r.date + 'T06:30:00+05:30'), t: r.headline || '', text: r.text || '',
    s: r.paper || 'Daily clippings', c: 'News \\u00b7 Print', l: 'hi', u: 'JanDarpan.html#clippings:' + r.id });
  return it;
})
"""


async def main():
    recs = [r for r in json.load(open(SRC, encoding="utf-8"))["records"] if not r["cover"]]
    page_url = "file:///" + os.path.join(ROOT, "JanDarpan.html").replace("\\", "/") + "?still"
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="msedge")
        pg = await b.new_page()
        await pg.goto(page_url)
        await pg.wait_for_function("!!(window.CGP && CGP.live && CGP.live.tag)")
        tagged = await pg.evaluate(JS, recs)
        await b.close()
    items = []
    for r, it in zip(recs, tagged):
        it["text"] = ""
        it["raw"] = 0
        it["mediaType"] = "Clipping"
        it["origin"] = "clip"
        it["prominence"] = "p.%d" % r["page"]
        it["clipId"] = r["id"]
        it["clipDate"] = r["date"]
        it["clipPg"] = r["page"]
        it["clipEd"] = r["edition"]
        it["headline"] = r["headline"]
        it["auto"] = True
        items.append(it)
    dates = sorted({r["date"] for r in recs})
    meta = {"generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "issues": len(dates), "from": dates[0], "to": dates[-1], "count": len(items)}
    payload = {"meta": meta, "items": items}
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("window.CGP_CLIPS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print("clips", len(items), "bytes", os.path.getsize(OUT))


if __name__ == "__main__":
    asyncio.run(main())
