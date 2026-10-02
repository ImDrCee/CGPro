# Jan Pulse · Chhattisgarh media and social intelligence (POC)

A zero-dependency web app that shows how a media and social "insight tool" for the Chief Minister of Chhattisgarh could work. It answers the POC questions: what was published about the CM, key concerns across 10 districts, MLA and constituency coverage, issues raised by the opposition, post traction, and post counts per topic. Sentiment is one of 25+ parameters per item, not the headline.

> **All data in this build is illustrative sample data** generated in the browser (`js/gen.js`). No real news, posts or quotes are used. A banner says so on every screen.

**Live demo:** <https://imdrcee.github.io/CGPro/PRO.html>

## Run locally

- Double-click `PRO.html`, or
- serve the folder: `python -m http.server 8791` then open <http://127.0.0.1:8791/PRO.html>.

Add `?still` to the URL to disable animations (useful for screenshots), and `?ask=<question>` (repeatable) to open the Ask view with pre-answered questions, for example <https://imdrcee.github.io/CGPro/PRO.html?ask=Key%20concerns%20from%20the%2010%20districts>.

The Districts screen embeds an interactive Google Map per district and links each constituency to Google Maps (no API key; it needs internet access).

## Screens

| Screen | What it answers |
|---|---|
| Pulse | CM coverage, stance, reach, channel mix, key concerns, district heat, alerts, top posts |
| Ask | Natural-language Q&A with interpretation chips and evidence links |
| Districts | Concerns, volume and net stance across the 10 districts, with a detail panel |
| Opposition | Issues raised, trend, traction, and whether there is a government-side response |
| Traction | Best posts, share of voice, and how many posts per topic and who made them |
| Leaders | CM, Deputy CMs, opposition leaders, and a constituency/MLA table |
| Brief | Shareable daily brief with suggested actions (copy or print) |
| Data | Connectors, handles to follow, the parameter list, JSON import, ground rules |

## Architecture

```
js/data.js     reference data: districts, topics, channels, leaders, handles, connectors
js/gen.js      sample-data generator (templates and injected events)
js/engine.js   analytics: scoping, stats, concerns, alerts, opposition, topics, brief
js/qa.js       intent parsing and answer builders (numbers are computed, never generated)
js/charts.js   SVG/HTML chart helpers     js/icons.js  icon set
js/views.js    screen templates           js/app.js    state, events, import, theme
```

Item schema (one record per article or post): channel, source, language, media type, prominence, speaker type, speaker, entities, mentions-CM, district, constituency, topic, scheme, issue, narrative, hashtags, stance, sentiment, emotion, intent, likes, shares, comments, views, traction, misinformation risk, urgency, headline, text.

## Going live

1. **Import now:** Data tab → Import items (JSON). Accepts an array or `{"items":[…]}`; missing fields get defaults and district/topic are inferred from text. Use this for the daily news analysis once it is parsed into JSON. The MLA roster loads the same way.
2. **Connectors (next):** news RSS and site feeds, X API (paid), a licensed vendor for Facebook and Instagram, YouTube Data API.
3. **LLM extraction (next):** replace the sample tagging with model-based topic, stance, claim and district extraction; keep the engine and Q&A unchanged.

## Ground rules

Public data only; focus on public figures and aggregate sentiment, no profiling of private citizens or journalists; rumour scores are flags for human review; respect platform terms and licences; check election-period rules before campaign use.
