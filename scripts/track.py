"""Collects the latest public updates for every tracked account and writes data/accounts.js.

Accounts come from (1) the catalogue in darpan/js/data.js (the "Verified accounts to add" list) and
(2) an optional data/watchlist.json exported from the app (Library > Tracked accounts > Download).

What can be collected without breaking platform terms:
  * Websites   : the site's own RSS feed (robots.txt respected) plus Google News results for site:<domain>.
  * YouTube    : the channel's public RSS feed (latest videos with view counts).
  * X / Facebook / Instagram : these platforms do not allow scraping. For each handle the tool collects
    news articles that cite the handle or the account holder ("reported mentions"). Posts themselves need
    an official API or a licensed social-data vendor, or can be pasted into Library > Saved links.

Usage: python scripts/track.py [--days=30] [--max-per-account=40] [--no-youtube] [--only=name,name]
"""
import datetime
import json
import os
import re
import sys
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scrape as S  # noqa: E402

ROOT = S.ROOT_DIR
CATALOG_JS = os.path.join(ROOT, "darpan", "js", "data.js")
WATCHLIST = os.path.join(ROOT, "data", "watchlist.json")
OUT_JS = os.path.join(ROOT, "data", "accounts.js")
OUT_JSON = os.path.join(ROOT, "data", "accounts.json")

# Outlets whose whole feed is about Chhattisgarh; others are filtered for Chhattisgarh relevance.
CG_SPECIFIC = {"IBC24", "Bansal News", "Lalluram", "Dainik Chhattisgarh", "Khabar36", "Deshbandhu"}
CG_TERMS = "(Chhattisgarh OR छत्तीसगढ़ OR Raipur OR रायपुर OR Bastar OR बस्तर)"

# Government sources that are not in the media catalogue.
EXTRA_ENTITIES = [
    {"name": "Directorate of Public Relations (website)", "group": "govt", "site": "dprcg.gov.in", "handles": []},
    {"name": "Chhattisgarh Government portal", "group": "govt", "site": "cg.gov.in", "handles": []},
]


def read_catalog():
    text = open(CATALOG_JS, encoding="utf-8").read()
    media = []
    for m in re.finditer(r"\{ name: '([^']+)', type: '([^']*)'.*?site: '([^']*)', x: '([^']*)', fb: '([^']*)', ig: '([^']*)', yt: '([^']*)'", text):
        name, typ, site, x, fb, ig, yt = m.groups()
        handles = []
        if x:
            handles.append({"platform": "X", "handle": "@" + x})
        if fb:
            handles.append({"platform": "Facebook", "handle": fb})
        if ig:
            handles.append({"platform": "Instagram", "handle": "@" + ig})
        if yt:
            handles.append({"platform": "YouTube", "handle": yt})
        media.append({"name": name, "group": "media", "type": typ, "site": site, "handles": handles})
    gov = {}
    for m in re.finditer(r"\{ platform: '([^']+)', handle: '([^']+)', owner: '([^']+)', status: 'verified' \}", text):
        platform, handle, owner = m.groups()
        gov.setdefault(owner, []).append({"platform": platform, "handle": handle})
    nice = {"Chief Minister": "Chief Minister Vishnu Deo Sai", "CM Office": "Chhattisgarh CM Office"}
    govs = [{"name": nice.get(owner, owner), "group": "govt", "site": "", "handles": hs} for owner, hs in gov.items()]
    return govs + media


def read_watchlist():
    if not os.path.exists(WATCHLIST):
        return []
    j = json.load(open(WATCHLIST, encoding="utf-8"))
    rows = j if isinstance(j, list) else j.get("tracked") or j.get("items") or []
    out = []
    for r in rows:
        if not isinstance(r, dict) or not r.get("handle"):
            continue
        plat = r.get("platform", "Web")
        h = r["handle"].strip()
        site = ""
        if plat == "Web" or h.startswith("http"):
            site = urllib.parse.urlsplit(h if "://" in h else "https://" + h).netloc.replace("www.", "")
            out.append({"name": r.get("name") or site, "group": r.get("group", "other"), "site": site, "handles": [], "user": True})
        else:
            out.append({"name": r.get("name") or h, "group": r.get("group", "other"), "site": "", "handles": [{"platform": plat, "handle": h}], "user": True})
    return out


def key_of(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


class Tracker(S.Collector):
    def __init__(self, days, cap, youtube):
        super().__init__()
        self.days, self.cap, self.youtube = days, cap, youtube
        self.cutoff = S.utc_now() - datetime.timedelta(days=days)

    def keep(self, entry_dt):
        return entry_dt is not None and entry_dt >= self.cutoff

    def item(self, e, title, url, source, channel, tag, dt, kind, views=None):
        return {"id": S.stable_id(url, title), "ts": int(dt.timestamp() * 1000), "t": title.strip(), "u": url.strip(), "s": source,
                "c": channel, "l": S.detect_language(title), "q": tag, "v": views, "k": None, "kind": kind}

    def google(self, query, lang="hi"):
        url = self.google_feed_url(query, lang)
        text, err = self.fetch_text(url, bypass_robots=True)
        if err or not text:
            return [], err
        try:
            return self.parse_google_items(text), None
        except Exception as exc:  # malformed feed
            return [], str(exc)

    def collect(self, ent):
        key = key_of(ent["name"])
        items, notes, seen = [], [], set()

        def add(it):
            k = (S.normalize_link(it["u"]), S.normalize_title(it["t"]))
            if k[0] in seen or k[1] in seen:
                return
            seen.add(k[0]); seen.add(k[1])
            items.append(it)

        site = ent.get("site", "")
        if site:
            cg = ent["name"] in CG_SPECIFIC
            q = f"site:{site} when:{self.days}d" if cg else f"site:{site} {CG_TERMS} when:{self.days}d"
            got, err = self.google(q)
            if not got and not err:
                got, err = self.google(q, "en")
            notes.append({"type": "site", "ok": not err, "note": err or f"{len(got)} items from Google News site search"})
            for g in got:
                if self.keep(g["published_dt"]):
                    add(self.item(ent, g["title"], g["link"], ent["name"], S.classify_channel(ent["name"]), "acct_site", g["published_dt"], "site"))
            feed = {"slug": key, "name": ent["name"], "home": "https://" + site}
            try:
                cands = self.discover_feed_candidates(feed)[:2]
            except Exception:
                cands = []
            for fu in cands:
                text, err = self.fetch_text(fu)
                if err or not text:
                    continue
                try:
                    _t, entries = self.parse_generic_feed(text)
                except Exception:
                    continue
                n = 0
                for e in entries:
                    if self.keep(e["published_dt"]) and (cg or S.CG_RELEVANT_RE.search(e["title"] or "")):
                        add(self.item(ent, e["title"], e["link"], ent["name"], S.classify_channel(ent["name"]), "acct_rss", e["published_dt"], "rss")); n += 1
                notes.append({"type": "rss", "ok": True, "note": f"{n} items from {fu}"})
                break

        for h in ent["handles"]:
            if h["platform"] == "YouTube" and self.youtube:
                tgt = h["handle"]
                targets = [tgt] if tgt.startswith("http") else [
                    "https://www.youtube.com/" + (tgt if tgt.startswith("@") or "/" in tgt else "@" + tgt)]
                chan = {"slug": key + "_yt", "label": ent["name"], "targets": targets}
                if tgt.startswith("channel/UC"):
                    chan["channel_id"] = tgt.split("/")[1]
                cid = self.resolve_youtube_channel_id(chan)
                if not cid:
                    notes.append({"type": "youtube", "ok": False, "note": "channel id not resolved"})
                    continue
                text, err = self.fetch_text(f"https://www.youtube.com/feeds/videos.xml?channel_id={urllib.parse.quote(cid)}",
                                            headers={"Cookie": "CONSENT=YES+1", "Accept-Language": "en"}, bypass_robots=True)
                if err or not text:
                    notes.append({"type": "youtube", "ok": False, "note": err or "empty feed"})
                    continue
                try:
                    cname, entries = self.parse_youtube_feed(text)
                except Exception as exc:
                    notes.append({"type": "youtube", "ok": False, "note": str(exc)})
                    continue
                n = 0
                for e in entries:
                    if self.keep(e["published_dt"]) and (ent["name"] in CG_SPECIFIC or ent["group"] == "govt" or S.CG_RELEVANT_RE.search(e["title"] or "")):
                        add(self.item(ent, e["title"], e["link"], cname or ent["name"], "YouTube", "acct_yt", e["published_dt"], "yt", e.get("views"))); n += 1
                notes.append({"type": "youtube", "ok": True, "note": f"{n} videos in the last {self.days} days"})
            elif h["platform"] in ("X", "Facebook", "Instagram"):
                handle = h["handle"]
                bare = handle.lstrip("@")
                if ent["group"] == "media":
                    continue  # an outlet's posts mirror its stories; the site and YouTube feeds already cover them
                got, err = self.google(f'"{handle}" OR "{bare}" when:{self.days}d', "hi")
                got2, _ = self.google(f'"{bare}" {CG_TERMS} when:{self.days}d', "en") if not got else ([], None)
                got = got + got2
                notes.append({"type": "mentions", "ok": not err, "note": f"{len(got)} articles citing {handle}; posts themselves are not scraped"})
                for g in got:
                    if self.keep(g["published_dt"]):
                        add(self.item(ent, g["title"], g["link"], g["outlet"], S.classify_channel(g["outlet"]), "acct_mention", g["published_dt"], "mention"))

        items.sort(key=lambda i: i["ts"], reverse=True)
        return {"key": key, "name": ent["name"], "group": ent["group"], "type": ent.get("type", ""), "site": site,
                "handles": ent["handles"], "user": bool(ent.get("user")), "items": items[: self.cap], "feeds": notes}


def main():
    days, cap, yt, only = 30, 40, True, []
    for a in sys.argv[1:]:
        if a.startswith("--days="):
            days = int(a.split("=")[1])
        elif a.startswith("--max-per-account="):
            cap = int(a.split("=")[1])
        elif a.startswith("--only="):
            only = [x.strip().lower() for x in a.split("=", 1)[1].split(",") if x.strip()]
        elif a == "--no-youtube":
            yt = False
    ents = read_catalog() + EXTRA_ENTITIES + read_watchlist()
    t = Tracker(days, cap, yt)
    accounts = []
    prior = {}
    if only and os.path.exists(OUT_JSON):
        prior = {a["name"].lower(): a for a in json.load(open(OUT_JSON, encoding="utf-8"))["accounts"]}
    for i, ent in enumerate(ents, 1):
        if only and not any(o in ent["name"].lower() for o in only):
            if ent["name"].lower() in prior:
                accounts.append(prior[ent["name"].lower()])
            continue
        t.log(f"[{i}/{len(ents)}] {ent['name']}")
        try:
            accounts.append(t.collect(ent))
        except Exception as exc:
            t.log(f"[error] {ent['name']}: {exc}")
            accounts.append({"key": key_of(ent["name"]), "name": ent["name"], "group": ent["group"], "type": ent.get("type", ""), "site": ent.get("site", ""),
                             "handles": ent["handles"], "user": bool(ent.get("user")), "items": [], "feeds": [{"type": "error", "ok": False, "note": str(exc)}]})
    payload = {"meta": {"generated": S.isoformat_z(S.utc_now()), "days": days, "tool": "track.py v1",
                        "note": "X, Facebook and Instagram posts are not scraped; those rows show news that cites the handle."},
               "accounts": accounts}
    with open(OUT_JSON, "w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
    with open(OUT_JS, "w", encoding="utf-8", newline="\n") as f:
        f.write("window.CGP_ACCOUNTS = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n")
    total = sum(len(a["items"]) for a in accounts)
    t.log(f"done: {len(accounts)} accounts, {total} items -> {OUT_JS}")


if __name__ == "__main__":
    main()
