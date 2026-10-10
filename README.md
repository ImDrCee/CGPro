# Jan Darpan · media memory and insight for Chhattisgarh (POC)

**Live app:** <https://imdrcee.github.io/CGPro/JanDarpan.html>  ·  the earlier version, Jan Pulse, is still at [PRO.html](https://imdrcee.github.io/CGPro/PRO.html)

Jan Darpan ("mirror") turns public Hindi and English media about Chhattisgarh into an insight tool with **memory**: it keeps what was said, promised and done, and shows every issue with its history, precedents and connections. Sentiment is one of 25+ parameters per item, not the headline.

> **Data.** *Live* mode uses real public headlines collected from news feeds and YouTube (title, link, date, outlet only; no article text). Topic, district and stance are **auto-tagged and unverified**. *Sample* mode is entirely fictional, with 24 months of seasons, episodes and logged responses so the memory features can be demonstrated. X, Facebook and Instagram are **not scraped**.

## What it does

| Screen | What you get |
|---|---|
| **Pulse** | CM coverage, concerns each with a *history line*, district heat, alerts, memory signals (seasonal watch, patterns, resurfacing) |
| **Ask** | Q&A with evidence. New: "Has this happened before?", "next 6 weeks", "promises due soon", "same period last year", "each year since 2025 in November", "who held the role as of…" |
| **Districts** | Concerns, sentiment, embedded Google Maps per district, constituency pin links |
| **Voices** | Attack lines with history, **rebuttal board**, **statement record**, position-shift detection, **quote check**, debate **prep pack** |
| **Social** | Traction, trending hashtags and issues, amplification candidates, official-content performance |
| **Memory** | Archive and back-fill, recurrence and chronic hotspots, seasonal profile and outlook, narratives (rumours and attack lines), same-period comparison, **response ledger** (action → outcome) |
| **Promises** | Commitment register, status per coverage, deadline early warning, rival promise record |
| **Patterns** | Systemic vs local, common factors, linked-issue chains, lead–lag and first-mover, analogue early warnings, coordinated patterns, media vs official data, association network |
| **People** | Leaders and MLAs, roles as of a date, term dossier per district or constituency |
| **Brief** | Shareable daily brief with history lines and suggested actions |
| **Library** | **Saved links** (add, paste many, import, export), **tracked accounts**, source catalogue and collection status, **review queue** for auto-tags, data and method |

Seven **role views** (social media lead, war room, spokesperson, party leadership, MLA office, CM office, media-cell analyst) change the home screen and shortcuts.

Every correlation shows its type, how many episodes support it, the time span and a confidence level, in non-causal wording ("appeared with", "followed by"). Mark cards useful or not; the usefulness rate is tracked against the 70% target.

## The Library: where links are added and saved

Add any article, post or video link (one by one, pasted in bulk, or by importing a JSON file such as the daily news analysis). Add engagement numbers for social posts when you have them. Links are **saved in your browser** (localStorage), tagged automatically, and join every dashboard; toggle "In analytics" per link. Export JSON or CSV, or back up everything from *Library → Data & method*. Nothing is uploaded.

Import format (array or `{"items":[…]}`): `url`, and optionally `title`, `text`, `date`, `channel`, `source`, `speakerType` (`media|opp|govt|bjp|citizen`), `topic`, `district`, `stance`, `likes`, `shares`, `comments`, `views`.

## Collecting public headlines

```
python scripts/scrape.py
```

Python standard library only. It reads Google News RSS month by month for 12 months, outlet RSS feeds where robots.txt allows, and official YouTube channel feeds, then writes `data/live.json` and `data/live.js` (the app loads the latter, so it also works from a double-click). It never fetches article bodies and never touches X, Facebook or Instagram. Re-run, commit and push to refresh the live site.

## Tracking accounts

*Library → Tracked accounts* lists the verified government and media handles. `python scripts/track.py` collects the latest public updates for every one of them (default last 30 days) and writes `data/accounts.js`; the page then shows key points from the last 7 days, an account-by-account table, and a per-account drill-down. Those items also join the Live dataset.

| Platform | What is collected |
|---|---|
| Website | The site's RSS feed (robots.txt respected) and Google News results for `site:<domain>` |
| YouTube | The channel's public RSS feed: titles, dates, view counts |
| X, Facebook, Instagram | **Not scraped** (platform terms). For government and political handles the tool collects news articles that cite the handle. Posts need an official API or a licensed vendor, or can be pasted into the Library |

Accounts you add with the **Track** button are saved in your browser only. To have the collector fetch them too, use *Download watch-list*, save the file as `data/watchlist.json`, run `python scripts/track.py`, then commit and push.

## The MLA roster

*People → Leaders & MLAs* lists all 90 seats with the sitting MLA, party, reservation, official district, 2023 votes, margin and runner-up, cabinet role, and Hindi names; click a row for a profile with maps, Wikipedia and ECI links and any coverage in the archive. `python scripts/build_mlas.py` rebuilds `data/mlas.js` from public Wikipedia pages (2023 results, the Raipur City South by-election of 2024, the Sai ministry). Check it against the Election Commission of India before external use; later by-elections, resignations and cabinet changes are not tracked automatically.
## Run locally

Double-click `JanDarpan.html`, or `python -m http.server 8793` and open <http://127.0.0.1:8793/JanDarpan.html>. Useful URL options: `?ask=<question>`, `?still` (no animations).

## Layout

```
JanDarpan.html            app shell (cache-busted asset URLs; bump ?v= on deploy)
darpan/js/data.js         taxonomy, media catalogue, roles, calendar, seeds
darpan/js/live.js         Hindi/English tagger, story clustering, link normalisation
darpan/js/memory.js       episodes, precedents, history lines, correlations, commitments
darpan/js/gen.js          24-month fictional sample generator
darpan/js/store.js        persistence (links, watch-list, ledger, corrections, verdicts)
darpan/js/qa.js           question parsing and answers (numbers are computed, never generated)
darpan/js/views*.js       screens                darpan/js/app.js  state, events, import/export
scripts/scrape.py         public-feed collector  data/live.js      collected headlines
scripts/track.py          tracked-account updates  data/accounts.js\nscripts/build_mlas.py     MLA roster builder      data/mlas.js  darpan/js/roster.js
PRO.html + js/ + css/     Jan Pulse (v1)
```

## Ground rules

Public data only, public figures in public roles, no profiling of private citizens or journalists, non-causal language, evidence or silence (thin memory is shown as thin), human review before external use. The sample data never puts invented quotes in real people's mouths: its speakers are fictional. Check the Model Code of Conduct and platform terms before any campaign use.

## Known limits

Auto-tags are rule-based and will be wrong sometimes (use the review queue). Memory depth in Live mode is one year and sparse; seasonal reads need more. Commitment status is "per coverage", not official data. Role dates and the seeded commitments come from public reports and need curator verification. The MLA roster is a Wikipedia snapshot and needs an ECI check. Not built: image/video fingerprints, calibrated risk bands, forecasts, multi-user accounts, SMS/WhatsApp alerts.
