import datetime
import hashlib
import html
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime


USER_AGENT = "JanDarpanBot/1.0 (+https://github.com/ImDrCee/CGPro; research POC)"
ARCHIVE_MONTHS = 3  # how far back a full collection reaches
HOST_DELAY_SECONDS = 1.6
REQUEST_TIMEOUT_SECONDS = 20
MAX_RETRIES = 2
MAX_ITEMS = 7000
MAX_JSON_BYTES = int(3.5 * 1024 * 1024)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "data")
LIVE_JSON_PATH = os.path.join(DATA_DIR, "live.json")
LIVE_JS_PATH = os.path.join(DATA_DIR, "live.js")

CG_RELEVANT_RE = re.compile(
    r"छत्तीसगढ़|chhattisgarh|raipur|रायपुर|bilaspur|बिलासपुर|bastar|बस्तर|"
    r"durg|दुर्ग|korba|कोरबा|raigarh|रायगढ़|\bcg\b|साय|बघेल",
    re.IGNORECASE,
)
DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
LETTER_RE = re.compile(r"[A-Za-z\u0900-\u097F]")

PRINT_BRAND_HINTS = [
    "dainik bhaskar",
    "दैनिक भास्कर",
    "bhaskar",
    "patrika",
    "पत्रिका",
    "haribhoomi",
    "हरिभूमि",
    "nai dunia",
    "नईदुनिया",
    "naidunia",
    "deshbandhu",
    "देशबंधु",
    "navbharat",
    "navabharat",
    "swadesh",
    "नवभारत",
    "dainik chhattisgarh",
    "amar ujala",
    "अमर उजाला",
    "dainik jagran",
    "जागरण",
    "hindustan",
    "हिन्दुस्तान",
    "hitavada",
    "times of india",
    "the hindu",
    "indian express",
    "free press journal",
    "central chronicle",
    "amrit sandesh",
    "tarun chhattisgarh",
]

GOOGLE_CORE_QUERIES = [
    {"slug": "cm_hi", "text": "छत्तीसगढ़ मुख्यमंत्री विष्णु देव साय", "lang": "hi"},
    {"slug": "cm_en", "text": "Chhattisgarh Chief Minister Vishnu Deo Sai", "lang": "en"},
    {"slug": "paddy_hi", "text": "छत्तीसगढ़ धान खरीदी", "lang": "hi"},
    {"slug": "paddy_en", "text": "Chhattisgarh paddy procurement", "lang": "en"},
    {"slug": "mahtari_hi", "text": "महतारी वंदन योजना", "lang": "hi"},
    {"slug": "mahtari_en", "text": "Mahtari Vandan Yojana", "lang": "en"},
    {"slug": "opp_hi", "text": "छत्तीसगढ़ कांग्रेस भूपेश बघेल चरणदास महंत दीपक बैज", "lang": "hi"},
    {"slug": "opp_en", "text": "Chhattisgarh Congress Baghel Mahant Baij", "lang": "en"},
    {"slug": "power_hi", "text": "छत्तीसगढ़ बिजली कटौती", "lang": "hi"},
    {"slug": "bastar_hi", "text": "बस्तर नक्सल छत्तीसगढ़", "lang": "hi"},
    {"slug": "bastar_en", "text": "Bastar Naxal Chhattisgarh", "lang": "en"},
    {"slug": "awas_hi", "text": "छत्तीसगढ़ प्रधानमंत्री आवास योजना", "lang": "hi"},
    {"slug": "assembly_hi", "text": "छत्तीसगढ़ विधानसभा", "lang": "hi"},
    {"slug": "law_hi", "text": "रायपुर क्राइम पुलिस", "lang": "hi"},
    {"slug": "health_hi", "text": "छत्तीसगढ़ स्वास्थ्य अस्पताल", "lang": "hi"},
    {"slug": "water_hi", "text": "छत्तीसगढ़ पेयजल संकट", "lang": "hi"},
]

DISTRICT_QUERIES = [
    {"slug": "dist_raipur", "text": "रायपुर छत्तीसगढ़ खबर"},
    {"slug": "dist_durg_bhilai", "text": "दुर्ग भिलाई छत्तीसगढ़ खबर"},
    {"slug": "dist_bilaspur", "text": "बिलासपुर छत्तीसगढ़ खबर"},
    {"slug": "dist_korba", "text": "कोरबा छत्तीसगढ़ खबर"},
    {"slug": "dist_raigarh", "text": "रायगढ़ छत्तीसगढ़ खबर"},
    {"slug": "dist_rajnandgaon", "text": "राजनांदगांव छत्तीसगढ़ खबर"},
    {"slug": "dist_bastar_jagdalpur", "text": "बस्तर जगदलपुर छत्तीसगढ़ खबर"},
    {"slug": "dist_dantewada", "text": "दंतेवाड़ा छत्तीसगढ़ खबर"},
    {"slug": "dist_surguja_ambikapur", "text": "सरगुजा अंबिकापुर छत्तीसगढ़ खबर"},
    {"slug": "dist_janjgir_champa", "text": "जांजगीर चांपा छत्तीसगढ़ खबर"},
]

YOUTUBE_CHANNELS = [
    {
        "slug": "yt_ibc24_in",
        "label": "IBC24InNews",
        "channel_id": "UCBc13XYipnBIBE3Ff8QaaGg",
        "cg_specific": True,
    },
    {
        "slug": "yt_ibc24_maidani",
        "label": "ibc24maidani",
        "channel_id": "UCTxQodVeIxXIZq64DbANWBg",
        "cg_specific": True,
    },
    {
        "slug": "yt_ibc24_jankarwan",
        "label": "ibc24jankarwan82",
        "channel_id": "UCGnqaEa5wmyxxXeP8NXo6qw",
        "cg_specific": True,
    },
    {
        "slug": "yt_bansal_news",
        "label": "bansalnewsofficial",
        "targets": [
            "https://www.youtube.com/bansalnewsofficial",
            "https://www.youtube.com/@bansalnewsofficial",
        ],
        "cg_specific": True,
    },
    {
        "slug": "yt_lalluram",
        "label": "LalluramNews",
        "targets": [
            "https://www.youtube.com/@LalluramNews",
            "https://www.youtube.com/c/LalluramNews",
        ],
        "cg_specific": True,
    },
    {
        "slug": "yt_haribhoomi_tv",
        "label": "haribhoomitv",
        "targets": ["https://www.youtube.com/@haribhoomitv"],
        "cg_specific": True,
    },
    {
        "slug": "yt_dblive",
        "label": "DBLive",
        "targets": [
            "https://www.youtube.com/@DBLive",
            "https://www.youtube.com/c/DBLive",
        ],
        "cg_specific": True,
    },
    {
        "slug": "yt_nai_dunia",
        "label": "NaiDunia-NavDunia",
        "targets": ["https://www.youtube.com/@NaiDunia-NavDunia"],
        "cg_specific": False,
    },
    {
        "slug": "yt_patrika_tv",
        "label": "RajasthanPatrikaTV",
        "targets": ["https://www.youtube.com/@RajasthanPatrikaTV"],
        "cg_specific": False,
    },
    {
        "slug": "yt_hitavada",
        "label": "TheHitavada1911",
        "targets": ["https://www.youtube.com/@TheHitavada1911"],
        "cg_specific": False,
    },
    {
        "slug": "yt_live_hindustan",
        "label": "Livehindustan",
        "targets": ["https://www.youtube.com/@Livehindustan"],
        "cg_specific": False,
    },
    {
        "slug": "yt_dainik_bhaskar",
        "label": "Dainik Bhaskar",
        "channel_id": "UCVZ57OkKPAuRJ_wA_Rt4XFg",
        "cg_specific": False,
    },
    {
        "slug": "yt_chhattisgarh_cmo",
        "label": "ChhattisgarhCMO",
        "targets": ["https://www.youtube.com/@ChhattisgarhCMO"],
        "cg_specific": True,
    },
]

OUTLETS = [
    {"slug": "ibc24", "name": "IBC24", "home": "https://www.ibc24.in", "cg_specific": True},
    {"slug": "bansalnews", "name": "Bansal News", "home": "https://www.bansalnews.com", "cg_specific": True},
    {"slug": "lalluram", "name": "Lalluram", "home": "https://lalluram.com", "cg_specific": True},
    {"slug": "haribhoomi", "name": "Haribhoomi", "home": "https://www.haribhoomi.com", "cg_specific": False},
    {"slug": "bhaskar", "name": "Dainik Bhaskar", "home": "https://www.bhaskar.com", "cg_specific": False},
    {"slug": "patrika", "name": "Patrika", "home": "https://www.patrika.com", "cg_specific": False},
    {"slug": "deshbandhu", "name": "Deshbandhu", "home": "https://www.deshbandhu.co.in", "cg_specific": False},
    {"slug": "naidunia", "name": "Nai Dunia", "home": "https://www.naidunia.com", "cg_specific": False},
    {"slug": "thehitavada", "name": "The Hitavada", "home": "https://www.thehitavada.com", "cg_specific": False},
    {"slug": "navabharat", "name": "Navbharat (Chhattisgarh)", "home": "https://www.navabharat.news", "cg_specific": False},
    {"slug": "swadesh", "name": "Swadesh", "home": "https://www.swadeshnews.in", "cg_specific": False},
    {"slug": "dainikchhattisgarh", "name": "Dainik Chhattisgarh", "home": "https://www.dainikchhattisgarh.com", "cg_specific": True},
    {"slug": "khabar36", "name": "Khabar36", "home": "https://khabar36.com", "cg_specific": True},
    {"slug": "livehindustan", "name": "Live Hindustan", "home": "https://www.livehindustan.com", "cg_specific": False},
    {"slug": "jagran", "name": "Dainik Jagran", "home": "https://www.jagran.com", "cg_specific": False},
    {"slug": "timesofindia", "name": "Times of India", "home": "https://timesofindia.indiatimes.com", "cg_specific": False},
    {"slug": "amarujala", "name": "Amar Ujala", "home": "https://www.amarujala.com", "cg_specific": False},
]

COMMON_FEED_PATHS = ["/feed", "/rss", "/rss.xml", "/feeds/rss"]
YOUTUBE_ID_RE = re.compile(r'"channelId":"(UC[\w-]{22})"|/channel/(UC[\w-]{22})|"externalId":"(UC[\w-]{22})"')


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


def isoformat_z(value):
    return value.astimezone(datetime.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def first_day_of_month(value):
    return datetime.date(value.year, value.month, 1)


def add_months(value, delta):
    month_index = value.month - 1 + delta
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    return datetime.date(year, month, 1)


def month_key_from_ts(ts_ms):
    return datetime.datetime.fromtimestamp(ts_ms / 1000, datetime.timezone.utc).strftime("%Y-%m")


def normalize_title(value):
    cleaned = html.unescape((value or "").strip())
    cleaned = re.sub(r"\s+-\s+[^-]+$", "", cleaned)
    cleaned = cleaned.lower()
    cleaned = re.sub(r"[\W_]+", "", cleaned, flags=re.UNICODE)
    return cleaned


def normalize_link(value):
    return html.unescape((value or "").strip())


def detect_language(title):
    letters = LETTER_RE.findall(title or "")
    if not letters:
        return "en"
    devanagari = DEVANAGARI_RE.findall(title or "")
    return "hi" if len(devanagari) / float(len(letters)) > 0.3 else "en"


def classify_channel(name):
    lowered = (name or "").lower()
    for hint in PRINT_BRAND_HINTS:
        if hint.lower() in lowered:
            return "News · Print"
    return "News · Online"


def stable_id(url, title):
    seed = normalize_link(url) or (title or "")
    return "L" + hashlib.sha1(seed.encode("utf-8")).hexdigest()[:10]


def local_name(tag):
    return tag.split("}", 1)[-1]


def safe_int(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def parse_datetime_value(value):
    raw = (value or "").strip()
    if not raw:
        return None
    try:
        parsed = parsedate_to_datetime(raw)
    except (TypeError, ValueError, IndexError):
        parsed = None
    if parsed is None:
        try:
            parsed = datetime.datetime.fromisoformat(raw.replace("Z", "+00:00"))
        except ValueError:
            parsed = None
    if parsed is None:
        for pattern in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                parsed = datetime.datetime.strptime(raw, pattern)
                break
            except ValueError:
                parsed = None
    if parsed is None:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=datetime.timezone.utc)
    return parsed.astimezone(datetime.timezone.utc)


def parse_tag_attributes(tag_text):
    attributes = {}
    for match in re.finditer(r'([A-Za-z_:][\w:.-]*)\s*=\s*(["\'])(.*?)\2', tag_text, re.IGNORECASE | re.DOTALL):
        attributes[match.group(1).lower()] = html.unescape(match.group(3).strip())
    return attributes


class Collector:
    def __init__(self):
        self.generated_at = None
        self.today = utc_now().date()
        self.date_from = self.today - datetime.timedelta(days=ARCHIVE_MONTHS * 31)
        self.date_to = self.today
        self.items = []
        self.seen_titles = set()
        self.seen_links = set()
        self.source_stats = {}
        self.host_last_request = {}
        self.blocked_hosts = {}
        self.robots_cache = {}
        self.robots_disallowed = set()
        self.base_notes = []
        self.trim_message = None
        self.google_window_mode = "after_before"
        self.google_window_note = None
        self.recent = False

    def note(self, message):
        if message and message not in self.base_notes:
            self.base_notes.append(message)

    def log(self, message):
        print(message, flush=True)

    def source(self, key, name, via):
        stats = self.source_stats.get(key)
        if stats is None:
            stats = {
                "name": name,
                "via": via,
                "requests": 0,
                "fetched": 0,
                "kept": 0,
                "error": None,
            }
            self.source_stats[key] = stats
        return stats

    def set_source_error(self, key, name, via, message):
        stats = self.source(key, name, via)
        stats["error"] = message
        return stats

    def sleep_for_host(self, host):
        last = self.host_last_request.get(host)
        if last is None:
            return
        remaining = HOST_DELAY_SECONDS - (time.monotonic() - last)
        if remaining > 0:
            time.sleep(remaining)

    def fetch_text(self, url, source_key=None, source_name=None, via=None, headers=None, bypass_robots=False, allow_404_empty=False):
        parsed = urllib.parse.urlsplit(url)
        host = parsed.netloc.lower()
        if host in self.blocked_hosts:
            message = self.blocked_hosts[host]
            if source_key:
                self.set_source_error(source_key, source_name, via, message)
            self.log(f"[skip] blocked host {host} {url}")
            return None, message

        if not bypass_robots:
            allowed, reason = self.robot_allowed(url)
            if not allowed:
                message = reason or "robots disallowed"
                if source_key:
                    self.set_source_error(source_key, source_name, via, message)
                self.log(f"[skip] {message}: {url}")
                return None, message

        request_headers = {"User-Agent": USER_AGENT}
        if headers:
            request_headers.update(headers)

        attempts = MAX_RETRIES + 1
        last_error = None
        for attempt in range(1, attempts + 1):
            self.sleep_for_host(host)
            if source_key:
                self.source(source_key, source_name, via)["requests"] += 1
            request = urllib.request.Request(url, headers=request_headers)
            try:
                with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                    self.host_last_request[host] = time.monotonic()
                    body = response.read()
                    charset = response.headers.get_content_charset() or "utf-8"
                    try:
                        text = body.decode(charset, "replace")
                    except LookupError:
                        text = body.decode("utf-8", "replace")
                    return text, None
            except urllib.error.HTTPError as exc:
                self.host_last_request[host] = time.monotonic()
                if exc.code in (403, 429):
                    last_error = f"HTTP {exc.code}"
                    self.blocked_hosts[host] = last_error
                    if source_key:
                        self.set_source_error(source_key, source_name, via, last_error)
                    self.log(f"[block] {host} {last_error} {url}")
                    return None, last_error
                if allow_404_empty and exc.code == 404:
                    return "", None
                last_error = f"HTTP {exc.code}"
            except Exception as exc:
                self.host_last_request[host] = time.monotonic()
                last_error = f"{exc.__class__.__name__}: {exc}"
            if attempt <= MAX_RETRIES:
                backoff = HOST_DELAY_SECONDS * attempt
                self.log(f"[retry] {url} in {backoff:.1f}s ({last_error})")
                time.sleep(backoff)
        if source_key:
            self.set_source_error(source_key, source_name, via, last_error)
        self.log(f"[error] {url} {last_error}")
        return None, last_error

    def robot_allowed(self, url):
        parsed = urllib.parse.urlsplit(url)
        host = parsed.netloc.lower()
        if host in self.blocked_hosts:
            return False, self.blocked_hosts[host]
        parser = self.robots_cache.get(host)
        if parser is None:
            robots_url = f"{parsed.scheme or 'https'}://{host}/robots.txt"
            robots_text, error = self.fetch_text(robots_url, bypass_robots=True, allow_404_empty=True)
            if error:
                if host in self.blocked_hosts:
                    return False, self.blocked_hosts[host]
                message = f"robots unavailable: {error}"
                self.robots_disallowed.add(host)
                self.robots_cache[host] = False
                return False, message
            parser = urllib.robotparser.RobotFileParser()
            parser.set_url(robots_url)
            parser.parse((robots_text or "").splitlines())
            self.robots_cache[host] = parser
        if parser is False:
            return False, "robots unavailable"
        allowed = parser.can_fetch(USER_AGENT, url)
        if not allowed:
            self.robots_disallowed.add(host)
            return False, "robots disallowed"
        return True, None

    def within_date_range(self, dt_value):
        published = dt_value.date()
        return self.date_from <= published <= self.date_to

    def add_item(self, title, url, source_name, category, query_tag, published_dt, views=None, likes=None):
        if not title or not url or not source_name or published_dt is None:
            return False
        if not self.within_date_range(published_dt):
            return False
        normalized_title = normalize_title(title)
        normalized_link = normalize_link(url)
        if normalized_link in self.seen_links or normalized_title in self.seen_titles:
            return False
        item = {
            "id": stable_id(url, title),
            "ts": int(published_dt.timestamp() * 1000),
            "t": title.strip(),
            "u": url.strip(),
            "s": source_name.strip(),
            "c": category,
            "l": detect_language(title),
            "q": query_tag,
            "v": views,
            "k": likes,
        }
        self.items.append(item)
        self.seen_links.add(normalized_link)
        self.seen_titles.add(normalized_title)
        return True

    def parse_google_items(self, xml_text):
        root = ET.fromstring(xml_text)
        items = []
        for item in root.findall("./channel/item"):
            raw_title = html.unescape(item.findtext("title", "")).strip()
            outlet = html.unescape(item.findtext("source", "")).strip()
            if " - " in raw_title:
                headline, outlet_from_title = raw_title.rsplit(" - ", 1)
                if not outlet:
                    outlet = outlet_from_title.strip()
                title = headline.strip()
            else:
                title = raw_title
            link = html.unescape(item.findtext("link", "")).strip()
            published_dt = parse_datetime_value(item.findtext("pubDate", ""))
            items.append(
                {
                    "title": title,
                    "link": link,
                    "outlet": outlet or "Unknown",
                    "published_dt": published_dt,
                }
            )
        return items

    def parse_generic_feed(self, xml_text):
        root = ET.fromstring(xml_text)
        entries = []
        feed_title = ""
        if local_name(root.tag) == "rss" or root.find("channel") is not None:
            channel = root.find("channel")
            if channel is not None:
                feed_title = html.unescape(channel.findtext("title", "")).strip()
                for item in channel.findall("item"):
                    title = html.unescape(item.findtext("title", "")).strip()
                    link = html.unescape(item.findtext("link", "")).strip()
                    if not link:
                        guid = html.unescape(item.findtext("guid", "")).strip()
                        if guid.startswith("http"):
                            link = guid
                    published_dt = parse_datetime_value(
                        item.findtext("pubDate", "")
                        or item.findtext("published", "")
                        or item.findtext("updated", "")
                        or item.findtext("date", "")
                    )
                    entries.append({"title": title, "link": link, "published_dt": published_dt})
                return feed_title, entries
        atom_ns = "{http://www.w3.org/2005/Atom}"
        if local_name(root.tag) == "feed":
            feed_title = html.unescape(root.findtext(atom_ns + "title", "")).strip()
            for entry in root.findall(atom_ns + "entry"):
                title = html.unescape(entry.findtext(atom_ns + "title", "")).strip()
                link = ""
                for link_elem in entry.findall(atom_ns + "link"):
                    href = (link_elem.attrib.get("href") or "").strip()
                    rel = (link_elem.attrib.get("rel") or "alternate").strip()
                    if href and rel in ("alternate", "", "self"):
                        link = href
                        break
                published_dt = parse_datetime_value(
                    entry.findtext(atom_ns + "published", "")
                    or entry.findtext(atom_ns + "updated", "")
                )
                entries.append({"title": title, "link": link, "published_dt": published_dt})
        return feed_title, entries

    def parse_youtube_feed(self, xml_text):
        root = ET.fromstring(xml_text)
        atom_ns = "{http://www.w3.org/2005/Atom}"
        channel_name = html.unescape(root.findtext(atom_ns + "author/" + atom_ns + "name", "")).strip()
        entries = []
        for entry in root.findall(atom_ns + "entry"):
            title = html.unescape(entry.findtext(atom_ns + "title", "")).strip()
            link = ""
            for link_elem in entry.findall(atom_ns + "link"):
                href = (link_elem.attrib.get("href") or "").strip()
                if href:
                    link = href
                    break
            published_dt = parse_datetime_value(
                entry.findtext(atom_ns + "published", "") or entry.findtext(atom_ns + "updated", "")
            )
            video_author = html.unescape(entry.findtext(atom_ns + "author/" + atom_ns + "name", "")).strip() or channel_name
            views = None
            likes = None
            for child in entry.iter():
                name = local_name(child.tag)
                if name == "statistics" and "views" in child.attrib:
                    views = safe_int(child.attrib.get("views"))
                elif name == "starRating" and "count" in child.attrib:
                    likes = safe_int(child.attrib.get("count"))
            entries.append(
                {
                    "title": title,
                    "link": link,
                    "published_dt": published_dt,
                    "author": video_author or channel_name or "YouTube",
                    "views": views,
                    "likes": likes,
                }
            )
        return channel_name or "YouTube", entries

    def google_feed_url(self, query_text, lang):
        encoded_query = urllib.parse.quote_plus(query_text)
        if lang == "hi":
            return f"https://news.google.com/rss/search?q={encoded_query}&hl=hi&gl=IN&ceid=IN:hi"
        return f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"

    def feed_requests_for_core_query(self, query):
        requests = []
        this_month = first_day_of_month(self.today)
        if self.google_window_mode == "after_before":
            for offset in (range(1, -1, -1) if self.recent else range(ARCHIVE_MONTHS, 0, -1)):
                start = add_months(this_month, -offset)
                end = add_months(start, 1)
                requests.append(
                    {
                        "label": start.strftime("%Y-%m"),
                        "query": f"{query['text']} after:{start.isoformat()} before:{end.isoformat()}",
                    }
                )
        else:
            for days in ((30,) if self.recent else range(360, 0, -30)):
                requests.append({"label": f"when:{days}d", "query": f"{query['text']} when:{days}d"})
        requests.append({"label": "when:7d", "query": f"{query['text']} when:7d"})
        return requests

    def feed_requests_for_district_query(self, query):
        requests = []
        this_month = first_day_of_month(self.today)
        if self.google_window_mode == "after_before":
            for offset in range(3, -1, -1):
                start = add_months(this_month, -offset)
                end = add_months(start, 1)
                requests.append(
                    {
                        "label": start.strftime("%Y-%m"),
                        "query": f"{query['text']} after:{start.isoformat()} before:{end.isoformat()}",
                    }
                )
        else:
            for days in (120, 90, 60, 30):
                requests.append({"label": f"when:{days}d", "query": f"{query['text']} when:{days}d"})
        return requests

    def verify_google_windowing(self):
        this_month = first_day_of_month(self.today)
        months = [add_months(this_month, -2), add_months(this_month, -1)]
        windows = []
        for start in months:
            end = add_months(start, 1)
            query_text = f"छत्तीसगढ़ विधानसभा after:{start.isoformat()} before:{end.isoformat()}"
            url = self.google_feed_url(query_text, "hi")
            self.log(f"[test] Google News month window {start.strftime('%Y-%m')}")
            text, error = self.fetch_text(url, bypass_robots=True)
            if error or not text:
                self.google_window_note = f"Google News month-window test inconclusive ({error or 'empty response'}); using after:/before:."
                self.note(self.google_window_note)
                return
            try:
                links = {entry["link"] for entry in self.parse_google_items(text) if entry["link"]}
            except ET.ParseError as exc:
                self.google_window_note = f"Google News month-window test parse error ({exc}); using after:/before:."
                self.note(self.google_window_note)
                return
            windows.append(links)
        if len(windows) == 2 and windows[0] != windows[1]:
            self.google_window_note = "Verified Google News after:/before: month windows with distinct adjacent-month results."
            self.note(self.google_window_note)
            return
        self.google_window_mode = "when_days"
        self.google_window_note = "Google News after:/before: month windows did not yield distinct adjacent-month results; used rolling when:Nd windows."
        self.note(self.google_window_note)

    def run_google_news(self):
        self.log("[phase] Google News RSS")
        self.verify_google_windowing()
        request_counter = 0
        for query in GOOGLE_CORE_QUERIES:
            source_key = f"googlenews:{query['slug']}"
            stats = self.source(source_key, query["slug"], "googlenews")
            for request_info in self.feed_requests_for_core_query(query):
                request_counter += 1
                self.log(f"[google] {query['slug']} {request_info['label']}")
                url = self.google_feed_url(request_info["query"], query["lang"])
                text, error = self.fetch_text(url, source_key, query["slug"], "googlenews", bypass_robots=True)
                if error or not text:
                    continue
                try:
                    entries = self.parse_google_items(text)
                except ET.ParseError as exc:
                    stats["error"] = f"parse error: {exc}"
                    self.log(f"[error] {query['slug']} parse {exc}")
                    continue
                stats["fetched"] += len(entries)
                kept = 0
                for entry in entries:
                    if self.add_item(
                        entry["title"],
                        entry["link"],
                        entry["outlet"],
                        classify_channel(entry["outlet"]),
                        query["slug"],
                        entry["published_dt"],
                    ):
                        kept += 1
                stats["kept"] += kept
            self.write_checkpoint(f"google-core-{query['slug']}")
        for index, query in enumerate(DISTRICT_QUERIES, start=1):
            source_key = f"googlenews:{query['slug']}"
            stats = self.source(source_key, query["slug"], "googlenews")
            for request_info in self.feed_requests_for_district_query(query):
                request_counter += 1
                self.log(f"[google] {query['slug']} {request_info['label']}")
                url = self.google_feed_url(request_info["query"], "hi")
                text, error = self.fetch_text(url, source_key, query["slug"], "googlenews", bypass_robots=True)
                if error or not text:
                    continue
                try:
                    entries = self.parse_google_items(text)
                except ET.ParseError as exc:
                    stats["error"] = f"parse error: {exc}"
                    self.log(f"[error] {query['slug']} parse {exc}")
                    continue
                stats["fetched"] += len(entries)
                kept = 0
                for entry in entries:
                    if self.add_item(
                        entry["title"],
                        entry["link"],
                        entry["outlet"],
                        classify_channel(entry["outlet"]),
                        query["slug"],
                        entry["published_dt"],
                    ):
                        kept += 1
                stats["kept"] += kept
            if index % 2 == 0:
                self.write_checkpoint(f"google-district-{index}")
        self.write_checkpoint("phase-google")

    def resolve_youtube_channel_id(self, channel):
        if channel.get("channel_id"):
            return channel["channel_id"]
        source_key = f"youtube:{channel['slug']}"
        headers = {"Cookie": "CONSENT=YES+1", "Accept-Language": "en"}
        for target in channel.get("targets", []):
            self.log(f"[youtube] resolve {channel['label']} {target}")
            text, error = self.fetch_text(
                target,
                source_key=source_key,
                source_name=channel["label"],
                via="youtube",
                headers=headers,
            )
            if error or not text:
                continue
            # A channel page also lists related channels, so the first "channelId" is often the wrong one.
            # The canonical link and externalId always belong to the page's own channel.
            found = (re.search(r'<link rel="canonical" href="https://www.youtube.com/channel/(UC[\w-]{22})"', text)
                     or re.search(r'"externalId":"(UC[\w-]{22})"', text)
                     or re.search(r'<meta itemprop="(?:identifier|channelId)" content="(UC[\w-]{22})"', text))
            if not found:
                continue
            return found.group(1)
        self.set_source_error(source_key, channel["label"], "youtube", "channel id not resolved")
        return None

    def run_youtube(self):
        self.log("[phase] YouTube feeds")
        for channel in YOUTUBE_CHANNELS:
            source_key = f"youtube:{channel['slug']}"
            stats = self.source(source_key, channel["label"], "youtube")
            channel_id = self.resolve_youtube_channel_id(channel)
            if not channel_id:
                continue
            feed_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={urllib.parse.quote(channel_id)}"
            self.log(f"[youtube] feed {channel['label']} {channel_id}")
            text, error = self.fetch_text(
                feed_url,
                source_key=source_key,
                source_name=channel["label"],
                via="youtube",
                headers={"Cookie": "CONSENT=YES+1", "Accept-Language": "en"},
                bypass_robots=True,
            )
            if error or not text:
                continue
            try:
                channel_name, entries = self.parse_youtube_feed(text)
            except ET.ParseError as exc:
                stats["error"] = f"parse error: {exc}"
                self.log(f"[error] {channel['label']} parse {exc}")
                continue
            stats["name"] = channel_name or channel["label"]
            stats["fetched"] += len(entries)
            kept = 0
            for entry in entries:
                if not channel["cg_specific"] and not CG_RELEVANT_RE.search(entry["title"] or ""):
                    continue
                if self.add_item(
                    entry["title"],
                    entry["link"],
                    channel_name or entry["author"] or channel["label"],
                    "YouTube",
                    channel["slug"],
                    entry["published_dt"],
                    views=entry["views"],
                    likes=entry["likes"],
                ):
                    kept += 1
            stats["kept"] += kept
        self.write_checkpoint("phase-youtube")

    def discover_feed_candidates(self, outlet):
        candidates = {}
        source_key = f"rss:{outlet['slug']}"
        base_url = outlet["home"]
        self.log(f"[rss] discover {outlet['name']}")
        homepage_text, error = self.fetch_text(base_url, source_key=source_key, source_name=outlet["name"], via="rss")
        if homepage_text:
            for tag in re.findall(r"(?is)<link\b[^>]*>", homepage_text):
                attrs = parse_tag_attributes(tag)
                rel = attrs.get("rel", "").lower()
                typ = attrs.get("type", "").lower()
                href = attrs.get("href", "")
                if href and "alternate" in rel and typ in ("application/rss+xml", "application/atom+xml"):
                    feed_url = urllib.parse.urljoin(base_url, href)
                    candidates[feed_url] = self.score_feed_url(feed_url, base_url)
            for match in re.finditer(r'https?://[^"\'>\s]+', homepage_text, re.IGNORECASE):
                candidate = html.unescape(match.group(0))
                lowered = candidate.lower()
                if any(token in lowered for token in ("rss", "feed", "atom")):
                    candidates[candidate] = self.score_feed_url(candidate, base_url)
        elif error:
            self.set_source_error(source_key, outlet["name"], "rss", error)
        for suffix in COMMON_FEED_PATHS:
            candidate = urllib.parse.urljoin(base_url, suffix)
            candidates[candidate] = max(candidates.get(candidate, -999), self.score_feed_url(candidate, base_url))
        ordered = [url for url, _ in sorted(candidates.items(), key=lambda item: (-item[1], item[0]))]
        return ordered[:3]

    def score_feed_url(self, url, base_url):
        lowered = url.lower()
        base_host = urllib.parse.urlsplit(base_url).netloc.lower()
        host = urllib.parse.urlsplit(url).netloc.lower()
        score = 0
        for keyword in ("chhattisgarh", "raipur", "cg", "bastar", "bilaspur", "durg", "korba", "raigarh", "state", "city"):
            if keyword in lowered:
                score += 3
        if host == base_host:
            score += 2
        if "rss" in lowered or "feed" in lowered or "atom" in lowered:
            score += 1
        if any(bad in lowered for bad in ("comment", "tag/", "/tags/", "author/")):
            score -= 2
        return score

    def run_outlet_rss(self):
        self.log("[phase] Outlet RSS/HTML discovery")
        for index, outlet in enumerate(OUTLETS, start=1):
            source_key = f"rss:{outlet['slug']}"
            stats = self.source(source_key, outlet["name"], "rss")
            candidates = self.discover_feed_candidates(outlet)
            if not candidates:
                stats["error"] = stats["error"] or "no feeds discovered"
                continue
            any_feed_success = False
            for feed_url in candidates:
                self.log(f"[rss] fetch {outlet['name']} {feed_url}")
                text, error = self.fetch_text(feed_url, source_key, outlet["name"], "rss")
                if error or not text:
                    continue
                any_feed_success = True
                try:
                    feed_title, entries = self.parse_generic_feed(text)
                except ET.ParseError as exc:
                    stats["error"] = f"parse error: {exc}"
                    self.log(f"[error] {outlet['name']} parse {exc}")
                    continue
                if feed_title and not stats["name"]:
                    stats["name"] = outlet["name"]
                stats["fetched"] += len(entries)
                kept = 0
                for entry in entries:
                    if not outlet["cg_specific"] and not CG_RELEVANT_RE.search(entry["title"] or ""):
                        continue
                    if self.add_item(
                        entry["title"],
                        entry["link"],
                        outlet["name"],
                        classify_channel(outlet["name"]),
                        f"rss_{outlet['slug']}",
                        entry["published_dt"],
                    ):
                        kept += 1
                stats["kept"] += kept
            if not any_feed_success and stats["error"] is None:
                stats["error"] = "no feed fetched"
            if index % 3 == 0:
                self.write_checkpoint(f"rss-{index}")
        self.write_checkpoint("phase-rss")

    def build_notes(self):
        notes = list(self.base_notes)
        if self.blocked_hosts:
            blocked = ", ".join(f"{host} ({reason})" for host, reason in sorted(self.blocked_hosts.items()))
            notes.append(f"Stopped hitting blocked hosts after 403/429: {blocked}.")
        if self.robots_disallowed:
            notes.append("Skipped some non-Google/YouTube-feed URLs due to robots.txt restrictions or robots fetch failures.")
        if self.trim_message:
            notes.append(self.trim_message)
        return notes

    def serialize(self, items):
        by_month = {}
        for item in items:
            key = month_key_from_ts(item["ts"])
            by_month[key] = by_month.get(key, 0) + 1
        sources = []
        for stats in self.source_stats.values():
            sources.append(
                {
                    "name": stats["name"],
                    "via": stats["via"],
                    "requests": stats["requests"],
                    "fetched": stats["fetched"],
                    "kept": stats["kept"],
                    "error": stats["error"],
                }
            )
        self.generated_at = utc_now()
        payload = {
            "meta": {
                "generated": isoformat_z(self.generated_at),
                "tool": "scrape.py v1",
                "dateFrom": self.date_from.isoformat(),
                "dateTo": self.date_to.isoformat(),
                "totalItems": len(items),
                "byMonth": by_month,
                "sources": sources,
                "notes": self.build_notes(),
            },
            "items": items,
        }
        json_text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        return payload, json_text

    def trim_items(self, items):
        working = list(items)
        payload, json_text = self.serialize(working)
        removed = 0
        while len(working) > MAX_ITEMS or len(json_text.encode("utf-8")) > MAX_JSON_BYTES:
            month_counts = {}
            for item in working:
                key = month_key_from_ts(item["ts"])
                month_counts[key] = month_counts.get(key, 0) + 1
            candidates = [(month, count) for month, count in month_counts.items() if count > 1]
            if not candidates:
                break
            target_month = sorted(candidates, key=lambda item: (-item[1], item[0]))[0][0]
            for index in range(len(working) - 1, -1, -1):
                if month_key_from_ts(working[index]["ts"]) == target_month:
                    del working[index]
                    removed += 1
                    break
            payload, json_text = self.serialize(working)
        if removed and not self.trim_message:
            self.trim_message = (
                f"Trimmed {removed} oldest items from the busiest months to stay within the 7000-item/3.5 MB limits while keeping every month represented."
            )
        return working

    def build_output(self):
        ordered = sorted(self.items, key=lambda item: item["ts"], reverse=True)
        trimmed = self.trim_items(ordered)
        return self.serialize(trimmed)

    def write_checkpoint(self, phase_name):
        os.makedirs(DATA_DIR, exist_ok=True)
        payload, json_text = self.build_output()
        with open(LIVE_JSON_PATH, "w", encoding="utf-8", newline="\n") as handle:
            handle.write(json_text)
        with open(LIVE_JS_PATH, "w", encoding="utf-8", newline="\n") as handle:
            handle.write("window.CGP_LIVE = " + json_text + ";")
        json_size = os.path.getsize(LIVE_JSON_PATH)
        js_size = os.path.getsize(LIVE_JS_PATH)
        self.log(f"[checkpoint] {phase_name}: {payload['meta']['totalItems']} items, {json_size} bytes json, {js_size} bytes js")
        return payload, json_size, js_size

    def print_summary(self, payload, json_size, js_size):
        self.log("[summary] total items: " + str(payload["meta"]["totalItems"]))
        self.log("[summary] date range: " + payload["meta"]["dateFrom"] + " to " + payload["meta"]["dateTo"])
        self.log("[summary] by month:")
        for month, count in sorted(payload["meta"]["byMonth"].items()):
            self.log(f"[summary]   {month}: {count}")
        self.log("[summary] per source:")
        for source in payload["meta"]["sources"]:
            suffix = f" error={source['error']}" if source["error"] else ""
            self.log(
                f"[summary]   {source['via']} {source['name']}: kept={source['kept']} fetched={source['fetched']} requests={source['requests']}{suffix}"
            )
        self.log(f"[summary] live.json={json_size} bytes")
        self.log(f"[summary] live.js={js_size} bytes")

    def load_existing(self):
        """Resume from data/live.json so a later run can add phases without refetching earlier ones."""
        with open(LIVE_JSON_PATH, "r", encoding="utf-8") as handle:
            payload = json.load(handle)
        self.items = list(payload.get("items", []))
        for item in self.items:
            self.seen_links.add(normalize_link(item.get("u", "")))
            self.seen_titles.add(normalize_title(item.get("t", "")))
        for index, stats in enumerate(payload.get("meta", {}).get("sources", [])):
            self.source_stats[f"prev:{index}"] = dict(stats)
        self.log(f"[resume] loaded {len(self.items)} items and {len(self.source_stats)} source records")

    def run(self, phases=("google", "youtube", "rss")):
        if "google" in phases:
            self.run_google_news()
        if "youtube" in phases:
            self.run_youtube()
        if "rss" in phases:
            self.run_outlet_rss()
        payload, json_size, js_size = self.write_checkpoint("final")
        self.print_summary(payload, json_size, js_size)


def main():
    """Usage: python scripts/scrape.py [--resume] [--recent] [--phases=google,youtube,rss]"""
    import sys

    phases = ("google", "youtube", "rss")
    resume = False
    recent = False
    for arg in sys.argv[1:]:
        if arg == "--resume":
            resume = True
        elif arg == "--recent":
            recent = True
        elif arg.startswith("--phases="):
            phases = tuple(p.strip() for p in arg.split("=", 1)[1].split(",") if p.strip())
    collector = Collector()
    collector.recent = recent
    try:
        if resume:
            collector.load_existing()
        collector.run(phases)
    except Exception as exc:
        collector.log(f"[fatal] {exc.__class__.__name__}: {exc}")
        try:
            collector.write_checkpoint("fatal")
        except Exception as checkpoint_exc:
            collector.log(f"[fatal] checkpoint failed: {checkpoint_exc.__class__.__name__}: {checkpoint_exc}")
        raise


if __name__ == "__main__":
    main()