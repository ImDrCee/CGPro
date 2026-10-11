"""One command to refresh Jan Darpan with the latest information and publish it.

  python scripts/update.py            full update: headlines, outlet feeds, followed accounts, social (if configured),
                                      any new clipping PDFs, then commit, push and wait for the site to update
  python scripts/update.py --quick    headlines and accounts only, no YouTube (a few minutes)
  python scripts/update.py --no-push  collect and tag only; do not commit or publish

New clipping PDFs are picked up when they are placed in pulse_data/ (the scanned images are read with OCR; this needs
Tesseract). Nothing from pulse_data/ is ever committed.
"""
import datetime
import glob
import json
import os
import re
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = sys.executable
SITE = "https://imdrcee.github.io/CGPro/JanDarpan.html"


def say(msg):
    print(msg, flush=True)


def step(title, args, timeout):
    say("\n== " + title)
    t0 = time.time()
    try:
        r = subprocess.run([PY] + args, cwd=ROOT, timeout=timeout)
        ok = r.returncode == 0
    except subprocess.TimeoutExpired:
        ok = False
        say("   stopped after %d minutes; keeping what was collected" % (timeout // 60))
    say("   %s in %ds" % ("done" if ok else "had problems", time.time() - t0))
    return ok


def load_js(path, prefix):
    try:
        t = open(path, encoding="utf-8").read()
        return json.loads(t[len(prefix):].rstrip().rstrip(";"))
    except Exception:
        return None


def has_social_credentials():
    keys = ("X_BEARER_TOKEN", "IG_TOKEN", "FB_TOKEN")
    if any(os.environ.get(k) for k in keys):
        return True
    env = os.path.join(ROOT, ".env")
    return os.path.exists(env) and any(re.match(r"\s*(%s)\s*=" % "|".join(keys), line) for line in open(env, encoding="utf-8"))


def new_pdfs():
    done = set()
    p = os.path.join(ROOT, "pulse_data", "clips.json")
    if os.path.exists(p):
        done = set(json.load(open(p, encoding="utf-8")).get("files", []))
    return [os.path.basename(x) for x in glob.glob(os.path.join(ROOT, "pulse_data", "*.pdf")) if os.path.basename(x) not in done]


def bump_version():
    stamp = datetime.datetime.now().strftime("%Y%m%d%H%M")
    p = os.path.join(ROOT, "JanDarpan.html")
    s = open(p, encoding="utf-8").read()
    s2 = re.sub(r"\?v=\w+", "?v=" + stamp, s)
    if s2 != s:
        open(p, "w", encoding="utf-8", newline="").write(s2)
    return stamp


def summary():
    live = load_js(os.path.join(ROOT, "data", "live.js"), "window.CGP_LIVE = ")
    acc = load_js(os.path.join(ROOT, "data", "accounts.js"), "window.CGP_ACCOUNTS = ")
    clips = load_js(os.path.join(ROOT, "data", "clippings.js"), "window.CGP_CLIPS = ")
    soc = load_js(os.path.join(ROOT, "data", "social.js"), "window.CGP_SOCIAL = ")
    say("\n== What is in the data now")
    newest = 0
    if live:
        items = live["items"]
        newest = max([i["ts"] for i in items] + [0])
        say("   headlines: %d (to %s)" % (len(items), datetime.datetime.fromtimestamp(newest / 1000).strftime("%d %b %Y %H:%M")))
    if acc:
        say("   followed accounts: %d accounts, %d items" % (len(acc["accounts"]), sum(len(a["items"]) for a in acc["accounts"])))
    if soc:
        say("   social posts: %d" % len(soc["items"]))
    if clips:
        say("   clippings: %d from %d days (%s to %s)" % (len(clips["items"]), clips["meta"]["issues"], clips["meta"]["from"], clips["meta"]["to"]))


def git(*args):
    return subprocess.run(["git"] + list(args), cwd=ROOT, capture_output=True, text=True)


def publish(stamp):
    say("\n== Publishing")
    git("add", "data", "scripts", "darpan", "JanDarpan.html", "README.md", "JanDarpan-update.cmd")
    if not git("status", "--porcelain").stdout.strip():
        say("   nothing changed")
        return
    msg = "Data update %s\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    c = git("commit", "-q", "-m", msg)
    if c.returncode:
        say("   commit failed: " + c.stderr.strip()[:200]); return
    p = git("push", "origin", "main")
    if p.returncode:
        say("   push failed: " + p.stderr.strip()[:300]); return
    say("   pushed; waiting for the site to update")
    for _ in range(16):
        try:
            html = urllib.request.urlopen(SITE + "?x=%d" % time.time(), timeout=20).read().decode("utf-8", "replace")
            if stamp in html:
                say("   live: " + SITE)
                return
        except Exception:
            pass
        time.sleep(15)
    say("   pushed, but the site has not shown the new version yet; it usually appears within a few minutes")


def main():
    quick = "--quick" in sys.argv
    push = "--no-push" not in sys.argv
    say("Jan Darpan update, %s%s" % (datetime.datetime.now().strftime("%d %b %Y %H:%M"), " (quick)" if quick else ""))

    step("Latest headlines", ["scripts/scrape.py", "--resume", "--latest", "--phases=" + ("google" if quick else "google,rss")], 40 * 60)
    step("Followed accounts (last 30 days)", ["scripts/track.py", "--days=30"] + (["--no-youtube"] if quick else []), 40 * 60)
    if has_social_credentials():
        step("Social posts (official APIs)", ["scripts/social.py"], 15 * 60)
    else:
        say("\n== Social posts: skipped (no X, Instagram or Facebook access configured)")

    pdfs = new_pdfs()
    if pdfs:
        say("\n== New clipping files: " + ", ".join(pdfs))
        if step("Reading new clippings (OCR)", ["scripts/build_clippings.py"], 60 * 60):
            step("Tagging clippings", ["scripts/tag_clippings.py"], 15 * 60)
    else:
        say("\n== Clippings: no new files in pulse_data/")

    stamp = bump_version()
    summary()
    if push:
        publish(stamp)
    else:
        say("\nNot published (--no-push).")


if __name__ == "__main__":
    main()
