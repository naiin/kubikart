#!/usr/bin/env python3
"""
Create the new Kubikart product categories and Business Kit products.

Pattern (Polylang WC):
  1. POST category with lang=en → get EN id
  2. POST category with lang=de + translations={"en": en_id} → links them
  3. For Business Kit products: same pattern (EN first, DE linked)
"""

import json
import subprocess
import sys
import time

BASE = "https://kubikart-backend.lndo.site/wp-json/wc/v3"
CK   = "ck_f545e33b18fe34ffa271bd73d525b9f305f2ceab"
CS   = "cs_e2396ccd68bb0c1fbc4380c53d01cfd023e00892"
AUTH = f"consumer_key={CK}&consumer_secret={CS}"


def api(method, endpoint, data=None):
    url = f"{BASE}/{endpoint}?{AUTH}"
    cmd = ["curl", "-sk", "-X", method, url, "-H", "Content-Type: application/json"]
    if data:
        cmd += ["-d", json.dumps(data)]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        resp = json.loads(result.stdout)
    except json.JSONDecodeError:
        print(f"  PARSE ERROR: {result.stdout[:200]}", file=sys.stderr)
        return {}
    if isinstance(resp, dict) and "id" not in resp and "code" in resp:
        print(f"  API ERROR [{resp.get('code')}]: {resp.get('message')}", file=sys.stderr)
    return resp


def create_bilingual_category(en_name, en_slug, en_desc, de_name, de_slug, de_desc, parent_en=None):
    en_payload = {"name": en_name, "slug": en_slug, "description": en_desc, "lang": "en"}
    if parent_en:
        en_payload["parent"] = parent_en
    en_resp = api("POST", "products/categories", en_payload)
    en_id   = en_resp.get("id")
    if not en_id:
        print(f"  FAILED creating EN: {en_name}")
        return None, None

    de_payload = {
        "name":         de_name,
        "slug":         de_slug,
        "description":  de_desc,
        "lang":         "de",
        "translations": {"en": en_id},
    }
    if parent_en:
        # For DE we need the DE parent — but we only have EN parent here.
        # Polylang resolves it from the translation link, so passing EN parent is fine.
        de_payload["parent"] = parent_en
    de_resp = api("POST", "products/categories", de_payload)
    de_id   = de_resp.get("id")
    if not de_id:
        print(f"  FAILED creating DE: {de_name}")
        return en_id, None

    print(f"  ✓ {en_name} (EN:{en_id}) / {de_name} (DE:{de_id})")
    return en_id, de_id


# ──────────────────────────────────────────────────────────────
# TOP-LEVEL CATEGORIES
# ──────────────────────────────────────────────────────────────
print("\n═══ Creating top-level categories ═══\n")

CATS = [
    {
        "en": ("QR & NFC Stands",           "qr-nfc-stands",          "Acrylic and wooden stands for QR codes and NFC chips – for Google Reviews, social media, menus, and more."),
        "de": ("QR & NFC Ständer",          "qr-nfc-staender",        "Acryl- und Holzständer für QR-Codes und NFC-Chips – für Google Bewertungen, Social Media, Speisekarten und mehr."),
    },
    {
        "en": ("Google Review Tools",        "google-review-tools",    "Tap-to-review stands, stickers, and displays that drive Google Review collection for local businesses."),
        "de": ("Google Bewertungs-Tools",    "google-bewertungs-tools","Tap-to-Review Ständer, Aufkleber und Displays für mehr Google Bewertungen für lokale Unternehmen."),
    },
    {
        "en": ("Opening-Hours Stickers",     "opening-hours-stickers", "Durable window and door stickers showing your opening hours – customised with your exact times."),
        "de": ("Öffnungszeiten-Aufkleber",   "oeffnungszeiten-aufkleber", "Langlebige Fenster- und Türaufkleber mit Ihren individuellen Öffnungszeiten."),
    },
    {
        "en": ("Menus & Menu Boards",        "menus-menu-boards",      "Printed and engraved menus, chalkboard-style menu boards, and framed displays for restaurants and cafés."),
        "de": ("Speisekarten & Menütafeln",  "speisekarten-menue-tafeln", "Gedruckte und gravierte Speisekarten, Menütafeln und gerahmte Displays für Restaurants und Cafés."),
    },
    {
        "en": ("Window & Glass Stickers",    "window-glass-stickers",  "High-quality adhesive stickers for shop windows and glass surfaces – logos, hours, promotions."),
        "de": ("Fenster- & Glasaufkleber",   "fenster-glasaufkleber",  "Hochwertige Klebefolien für Schaufenster und Glasflächen – Logos, Öffnungszeiten, Aktionen."),
    },
    {
        "en": ("Frosted Glass & Privacy",    "frosted-glass-privacy",  "Frosted window film and decorative privacy stickers for office partitions, shop windows, and glass doors."),
        "de": ("Milchglas & Sichtschutz",    "milchglas-sichtschutz",  "Milchglasfolie und dekorative Sichtschutzaufkleber für Bürotrennwände, Schaufenster und Glastüren."),
    },
    {
        "en": ("Mirror Stickers",            "mirror-stickers",        "Self-adhesive mirror-effect foil stickers – decorative lettering, logos, and patterns for mirrors and glass."),
        "de": ("Spiegel-Aufkleber",          "spiegel-aufkleber",      "Selbstklebende Spiegelfolie-Aufkleber – dekorative Schriften, Logos und Muster für Spiegel und Glas."),
    },
    {
        "en": ("Payment & Booking Displays", "payment-booking-displays","Small acrylic and NFC displays for contactless payment QR codes, table booking, and reservation links."),
        "de": ("Zahlungs- & Buchungsdisplays","zahlungs-buchungsdisplays","Kleine Acryl- und NFC-Displays für kontaktlose Zahlungs-QR-Codes, Tischreservierungen und Buchungslinks."),
    },
    {
        "en": ("Business Kits",              "business-kits",          "Complete visibility starter kits for local businesses – everything you need to get found, reviewed, and remembered."),
        "de": ("Business Kits",              "business-kits-de",       "Komplette Sichtbarkeits-Starter-Pakete für lokale Unternehmen – alles was Sie brauchen, um gefunden, bewertet und erinnert zu werden."),
    },
]

cat_ids = {}  # slug -> {"en": id, "de": id}

for cat in CATS:
    en_name, en_slug, en_desc = cat["en"]
    de_name, de_slug, de_desc = cat["de"]
    en_id, de_id = create_bilingual_category(en_name, en_slug, en_desc, de_name, de_slug, de_desc)
    cat_ids[en_slug] = {"en": en_id, "de": de_id}
    time.sleep(0.3)

biz_kits_en_id = cat_ids.get("business-kits", {}).get("en")
biz_kits_de_id = cat_ids.get("business-kits", {}).get("de")

print(f"\nBusiness Kits category: EN={biz_kits_en_id}, DE={biz_kits_de_id}")


# ──────────────────────────────────────────────────────────────
# BUSINESS KIT PRODUCTS
# ──────────────────────────────────────────────────────────────
print("\n═══ Creating Business Kit products ═══\n")

KITS = [
    {
        "en": {
            "name":              "Starter Visibility Kit",
            "slug":              "starter-visibility-kit",
            "regular_price":     "49.90",
            "short_description": "The essential starter pack for local businesses – QR Review stand + opening-hours sticker + window sticker.",
            "description":       "<p>The <strong>Starter Visibility Kit</strong> gives local businesses a quick, affordable boost in local visibility. Includes an acrylic QR/NFC Google Review stand, a custom opening-hours window sticker, and a logo window sticker. Ready to use within days.</p><ul><li>Acrylic QR & NFC Google Review stand</li><li>Custom opening-hours sticker (A5)</li><li>Logo window sticker (15 cm)</li><li>Setup guide included</li></ul>",
            "status":            "publish",
        },
        "de": {
            "name":              "Starter Visibility Kit",
            "slug":              "starter-visibility-kit-de",
            "regular_price":     "49.90",
            "short_description": "Das ideale Einsteiger-Paket für lokale Unternehmen – QR-Bewertungsständer + Öffnungszeiten-Aufkleber + Fensteraufkleber.",
            "description":       "<p>Das <strong>Starter Visibility Kit</strong> verleiht lokalen Unternehmen schnell und günstig mehr lokale Sichtbarkeit. Enthält einen Acryl-QR/NFC-Google-Bewertungsständer, einen individuellen Öffnungszeiten-Fensteraufkleber und einen Logo-Fensteraufkleber. Einsatzbereit innerhalb weniger Tage.</p><ul><li>Acryl QR & NFC Google Bewertungsständer</li><li>Individueller Öffnungszeiten-Aufkleber (A5)</li><li>Logo-Fensteraufkleber (15 cm)</li><li>Einrichtungsanleitung inklusive</li></ul>",
            "status":            "publish",
        },
    },
    {
        "en": {
            "name":              "Gastro Visibility Kit",
            "slug":              "gastro-visibility-kit",
            "regular_price":     "89.90",
            "short_description": "The complete kit for restaurants & cafés – QR menu stand + review stand + opening-hours sticker + table displays.",
            "description":       "<p>The <strong>Gastro Visibility Kit</strong> is tailored for restaurants, cafés, bars, and food trucks. Get your guests reviewing, your menus digitally accessible, and your windows looking professional – all in one package.</p><ul><li>Acrylic QR menu stand (A5, tabletop)</li><li>Acrylic QR & NFC Google Review stand</li><li>Custom opening-hours sticker (A5)</li><li>2× table QR payment/booking display</li><li>Setup guide included</li></ul>",
            "status":            "publish",
        },
        "de": {
            "name":              "Gastro Visibility Kit",
            "slug":              "gastro-visibility-kit-de",
            "regular_price":     "89.90",
            "short_description": "Das komplette Paket für Restaurants & Cafés – QR-Menüständer + Bewertungsständer + Öffnungszeiten-Aufkleber + Tisch-Displays.",
            "description":       "<p>Das <strong>Gastro Visibility Kit</strong> ist maßgeschneidert für Restaurants, Cafés, Bars und Food-Trucks. Lassen Sie Ihre Gäste Bewertungen hinterlassen, machen Sie Ihre Speisekarten digital zugänglich und verleihen Sie Ihren Fenstern ein professionelles Aussehen – alles in einem Paket.</p><ul><li>Acryl QR-Menüständer (A5, Tisch)</li><li>Acryl QR & NFC Google Bewertungsständer</li><li>Individueller Öffnungszeiten-Aufkleber (A5)</li><li>2× Tisch QR-Zahlungs-/Buchungsdisplay</li><li>Einrichtungsanleitung inklusive</li></ul>",
            "status":            "publish",
        },
    },
    {
        "en": {
            "name":              "Barber & Salon Kit",
            "slug":              "barber-salon-kit",
            "regular_price":     "79.90",
            "short_description": "Built for barbers, hairdressers, and beauty salons – review stand + booking QR display + mirror sticker + window sticker.",
            "description":       "<p>The <strong>Barber & Salon Kit</strong> is designed for hair salons, barbers, nail studios, and beauty professionals. Drive online bookings and reviews while giving your salon a sleek, branded look.</p><ul><li>Acrylic QR & NFC Google Review stand (counter)</li><li>Booking QR display (counter/mirror)</li><li>Decorative mirror sticker (custom text)</li><li>Logo window sticker (20 cm)</li><li>Setup guide included</li></ul>",
            "status":            "publish",
        },
        "de": {
            "name":              "Barber & Salon Kit",
            "slug":              "barber-salon-kit-de",
            "regular_price":     "79.90",
            "short_description": "Für Friseure, Barbershops und Beauty-Studios – Bewertungsständer + Buchungs-QR-Display + Spiegel-Aufkleber + Fensteraufkleber.",
            "description":       "<p>Das <strong>Barber & Salon Kit</strong> ist für Friseursalons, Barbershops, Nagelstudios und Beauty-Profis konzipiert. Steigern Sie Online-Buchungen und Bewertungen und verleihen Sie Ihrem Salon ein elegantes, markentreues Aussehen.</p><ul><li>Acryl QR & NFC Google Bewertungsständer (Tresen)</li><li>Buchungs-QR-Display (Tresen/Spiegel)</li><li>Dekorativer Spiegel-Aufkleber (Wunschtext)</li><li>Logo-Fensteraufkleber (20 cm)</li><li>Einrichtungsanleitung inklusive</li></ul>",
            "status":            "publish",
        },
    },
    {
        "en": {
            "name":              "Reception Kit",
            "slug":              "reception-kit",
            "regular_price":     "69.90",
            "short_description": "For offices, medical practices, and service businesses – review stand + frosted privacy film + payment QR display.",
            "description":       "<p>The <strong>Reception Kit</strong> is perfect for doctors' offices, physiotherapy practices, law firms, insurance agencies, and any service business with a reception area. Build trust and collect reviews while keeping your space looking professional.</p><ul><li>Acrylic QR & NFC Google Review stand (desk)</li><li>Frosted privacy window film (A4 strip)</li><li>Payment/booking QR display (A6)</li><li>Custom opening-hours sticker</li><li>Setup guide included</li></ul>",
            "status":            "publish",
        },
        "de": {
            "name":              "Reception Kit",
            "slug":              "reception-kit-de",
            "regular_price":     "69.90",
            "short_description": "Für Büros, Arztpraxen und Dienstleister – Bewertungsständer + Milchglas-Sichtschutzfolie + Zahlungs-QR-Display.",
            "description":       "<p>Das <strong>Reception Kit</strong> ist perfekt für Arztpraxen, Physiotherapeuten, Anwaltskanzleien, Versicherungen und alle Dienstleister mit einem Empfangsbereich. Bauen Sie Vertrauen auf und sammeln Sie Bewertungen, während Ihr Raum professionell aussieht.</p><ul><li>Acryl QR & NFC Google Bewertungsständer (Schreibtisch)</li><li>Milchglas-Sichtschutzfolie (A4-Streifen)</li><li>Zahlungs-/Buchungs-QR-Display (A6)</li><li>Individueller Öffnungszeiten-Aufkleber</li><li>Einrichtungsanleitung inklusive</li></ul>",
            "status":            "publish",
        },
    },
    {
        "en": {
            "name":              "Local Shop Window Kit",
            "slug":              "local-shop-window-kit",
            "regular_price":     "59.90",
            "short_description": "Make your shopfront work harder – review QR sticker + opening-hours sticker + logo window sticker + frosted accent film.",
            "description":       "<p>The <strong>Local Shop Window Kit</strong> transforms your shop window into a 24/7 marketing tool. Perfect for boutiques, florists, bookshops, gift shops, and any independent retailer wanting to stand out on the high street.</p><ul><li>Google Review QR window sticker (A5)</li><li>Custom opening-hours window sticker (A5)</li><li>Logo window sticker (25 cm)</li><li>Frosted decorative accent strip</li><li>Setup guide included</li></ul>",
            "status":            "publish",
        },
        "de": {
            "name":              "Local Shop Window Kit",
            "slug":              "local-shop-window-kit-de",
            "regular_price":     "59.90",
            "short_description": "Mehr aus Ihrem Schaufenster herausholen – Bewertungs-QR-Aufkleber + Öffnungszeiten-Aufkleber + Logo-Aufkleber + Milchglas-Akzentfolie.",
            "description":       "<p>Das <strong>Local Shop Window Kit</strong> verwandelt Ihr Schaufenster in ein 24/7-Marketinginstrument. Perfekt für Boutiquen, Blumenläden, Buchhandlungen, Geschenkeläden und alle unabhängigen Einzelhändler, die in der Fußgängerzone auffallen wollen.</p><ul><li>Google Bewertungs-QR-Fensteraufkleber (A5)</li><li>Individueller Öffnungszeiten-Fensteraufkleber (A5)</li><li>Logo-Fensteraufkleber (25 cm)</li><li>Dekorativer Milchglas-Akzentstreifen</li><li>Einrichtungsanleitung inklusive</li></ul>",
            "status":            "publish",
        },
    },
]


def create_bilingual_product(en_data, de_data, en_cat_id, de_cat_id):
    en_payload = {
        **en_data,
        "type":       "simple",
        "lang":       "en",
        "categories": [{"id": en_cat_id}],
    }
    en_resp = api("POST", "products", en_payload)
    en_id   = en_resp.get("id")
    if not en_id:
        print(f"  FAILED creating EN product: {en_data['name']}")
        return None, None

    de_payload = {
        **de_data,
        "type":         "simple",
        "lang":         "de",
        "translations": {"en": en_id},
        "categories":   [{"id": de_cat_id}],
    }
    de_resp = api("POST", "products", de_payload)
    de_id   = de_resp.get("id")
    if not de_id:
        print(f"  FAILED creating DE product: {de_data['name']}")
        return en_id, None

    print(f"  ✓ {en_data['name']} (EN:{en_id}) / {de_data['name']} (DE:{de_id})")
    return en_id, de_id


if biz_kits_en_id and biz_kits_de_id:
    for kit in KITS:
        create_bilingual_product(kit["en"], kit["de"], biz_kits_en_id, biz_kits_de_id)
        time.sleep(0.4)
else:
    print("  Skipping products – Business Kits category IDs missing.")

print("\n═══ Done ═══\n")
