"""Collects recent posts from X, Instagram and Facebook through their official APIs and writes data/social.js.

Credentials are read from environment variables or a git-ignored .env file in the project root:

  X_BEARER_TOKEN        X API v2 bearer token (a plan that includes recent search)
  IG_USER_ID, IG_TOKEN  Instagram Graph API: your own Instagram Business/Creator account id and a long-lived token.
                        Public business and creator accounts are read with the business_discovery field.
  FB_TOKEN              Facebook Graph API token with the Page Public Content Access feature (Meta app review).

Without a credential that platform is skipped and the app keeps showing it as needing API access.
Accounts come from the catalogue in darpan/js/data.js plus data/watchlist.json (X, Instagram and Facebook entries).

Usage: python scripts/social.py [--days=7] [--max=20]
"""
import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import track  # noqa: E402

ROOT = track.ROOT
OUT = os.path.join(ROOT, "data", "social.js")
UA = "JanDarpanBot/1.0 (+https://github.com/ImDrCee/CGPro)"


def load_env():
    path = os.path.join(ROOT, ".env")
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            m = re.match(r"\s*([A-Z_]+)\s*=\s*(.+?)\s*$", line)
            if m and m.group(1) not in os.environ:
                os.environ[m.group(1)] = m.group(2).strip("'\"")


def http_json(url, headers=None):
    req = urllib.request.Request(url, headers=dict({"User-Agent": UA}, **(headers or {})))
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8")), None
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:300]
        return None, "HTTP %s %s" % (e.code, body)
    except Exception as e:  # network problems
        return None, str(e)


def iso_ms(s):
    return int(datetime.datetime.fromisoformat(s.replace("Z", "+00:00").replace("+0000", "+00:00")).timestamp() * 1000)


def x_items(handle, tweets, name):
    out = []
    for t in tweets or []:
        m = t.get("public_metrics", {})
        out.append({"id": "X" + t["id"], "ts": iso_ms(t["created_at"]), "t": re.sub(r"\s+", " ", t["text"]).strip(), "u": "https://x.com/%s/status/%s" % (handle, t["id"]),
                    "s": name or "@" + handle, "c": "X", "l": t.get("lang", "hi")[:2], "k": m.get("like_count", 0), "shares": m.get("retweet_count", 0) + m.get("quote_count", 0),
                    "comments": m.get("reply_count", 0), "v": m.get("impression_count", 0), "q": "x_api"})
    return out


def collect_x(handles, days, cap, token):
    items, notes = [], []
    start = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=min(days, 7))).strftime("%Y-%m-%dT%H:%M:%SZ")
    for h in handles:
        q = urllib.parse.urlencode({"query": "from:%s -is:retweet" % h["handle"].lstrip("@"), "max_results": max(10, min(cap, 100)), "start_time": start,
                                    "tweet.fields": "created_at,public_metrics,lang"})
        j, err = http_json("https://api.x.com/2/tweets/search/recent?" + q, {"Authorization": "Bearer " + token})
        if err:
            notes.append({"account": h["handle"], "ok": False, "note": err}); time.sleep(1); continue
        got = x_items(h["handle"].lstrip("@"), j.get("data"), h["name"])
        items += got
        notes.append({"account": h["handle"], "ok": True, "note": "%d posts" % len(got)})
        time.sleep(1.1)
    return items, notes


def collect_ig(handles, days, cap, uid, token):
    items, notes = [], []
    since = time.time() - days * 86400
    for h in handles:
        user = h["handle"].lstrip("@")
        fields = "business_discovery.username(%s){media.limit(%d){caption,timestamp,permalink,like_count,comments_count}}" % (user, min(cap, 25))
        j, err = http_json("https://graph.facebook.com/v19.0/%s?%s" % (uid, urllib.parse.urlencode({"fields": fields, "access_token": token})))
        if err:
            notes.append({"account": h["handle"], "ok": False, "note": err}); continue
        media = (((j.get("business_discovery") or {}).get("media") or {}).get("data")) or []
        got = []
        for m in media:
            ts = iso_ms(m["timestamp"])
            if ts / 1000 < since or not m.get("caption"):
                continue
            got.append({"id": "I" + m["permalink"].rstrip("/").split("/")[-1], "ts": ts, "t": re.sub(r"\s+", " ", m["caption"]).strip()[:400], "u": m["permalink"],
                        "s": h["name"] or "@" + user, "c": "Instagram", "l": "hi", "k": m.get("like_count", 0), "comments": m.get("comments_count", 0), "q": "ig_api"})
        items += got
        notes.append({"account": h["handle"], "ok": True, "note": "%d posts" % len(got)})
        time.sleep(1)
    return items, notes


def collect_fb(handles, days, cap, token):
    items, notes = [], []
    since = time.time() - days * 86400
    for h in handles:
        page = h["handle"]
        q = urllib.parse.urlencode({"fields": "message,created_time,permalink_url,shares,reactions.summary(true).limit(0),comments.summary(true).limit(0)", "limit": min(cap, 25), "access_token": token})
        j, err = http_json("https://graph.facebook.com/v19.0/%s/posts?%s" % (urllib.parse.quote(page), q))
        if err:
            notes.append({"account": h["handle"], "ok": False, "note": err}); continue
        got = []
        for p in j.get("data", []):
            ts = iso_ms(p["created_time"])
            if ts / 1000 < since or not p.get("message"):
                continue
            got.append({"id": "F" + p["id"], "ts": ts, "t": re.sub(r"\s+", " ", p["message"]).strip()[:400], "u": p.get("permalink_url", ""), "s": h["name"] or page, "c": "Facebook", "l": "hi",
                        "k": ((p.get("reactions") or {}).get("summary") or {}).get("total_count", 0), "shares": (p.get("shares") or {}).get("count", 0),
                        "comments": ((p.get("comments") or {}).get("summary") or {}).get("total_count", 0), "q": "fb_api"})
        items += got
        notes.append({"account": h["handle"], "ok": True, "note": "%d posts" % len(got)})
        time.sleep(1)
    return items, notes


def accounts():
    ents = track.read_catalog() + track.read_watchlist()
    by = {"X": [], "Instagram": [], "Facebook": []}
    seen = set()
    for e in ents:
        for h in e.get("handles", []):
            p = h["platform"]
            if p in by and (p, h["handle"].lower()) not in seen:
                seen.add((p, h["handle"].lower()))
                by[p].append({"handle": h["handle"], "name": e["name"]})
    return by


def main():
    days, cap = 7, 20
    for a in sys.argv[1:]:
        if a.startswith("--days="):
            days = int(a.split("=")[1])
        elif a.startswith("--max="):
            cap = int(a.split("=")[1])
    load_env()
    by = accounts()
    items, status = [], {}
    tok = os.environ.get("X_BEARER_TOKEN")
    if tok:
        got, notes = collect_x(by["X"], days, cap, tok); items += got; status["X"] = {"connected": True, "accounts": len(by["X"]), "posts": len(got), "notes": notes}
    else:
        status["X"] = {"connected": False}
    uid, tok = os.environ.get("IG_USER_ID"), os.environ.get("IG_TOKEN")
    if uid and tok:
        got, notes = collect_ig(by["Instagram"], days, cap, uid, tok); items += got; status["Instagram"] = {"connected": True, "accounts": len(by["Instagram"]), "posts": len(got), "notes": notes}
    else:
        status["Instagram"] = {"connected": False}
    tok = os.environ.get("FB_TOKEN")
    if tok:
        got, notes = collect_fb(by["Facebook"], days, cap, tok); items += got; status["Facebook"] = {"connected": True, "accounts": len(by["Facebook"]), "posts": len(got), "notes": notes}
    else:
        status["Facebook"] = {"connected": False}
    items.sort(key=lambda i: -i["ts"])
    payload = {"meta": {"generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "days": days, "status": {k: {kk: vv for kk, vv in v.items() if kk != "notes"} for k, v in status.items()}}, "items": items}
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("window.CGP_SOCIAL = " + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n")
    for k, v in status.items():
        print(k, "connected" if v["connected"] else "no credential", v.get("posts", ""))
        for n in v.get("notes", []):
            if not n["ok"]:
                print("   ", n["account"], n["note"][:140])
    print("posts:", len(items))


if __name__ == "__main__":
    main()
