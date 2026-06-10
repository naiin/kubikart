#!/usr/bin/env python3
"""
Create properly linked bilingual WooCommerce content using Polylang.

Polylang works by creating separate posts/terms for each language and linking them.
This is by design - it's NOT duplication, it's how WordPress multilingual plugins work.

When querying the API:
  ?lang=en → returns only English content
  ?lang=de → returns only German content
  No lang param → returns default language content

In WP Admin, Polylang shows linked translations with flag icons.
"""
import json
import subprocess
import time

BASE = "https://kubikart-backend.lndo.site/wp-json/wc/v3"
AUTH = "consumer_key=ck_f545e33b18fe34ffa271bd73d525b9f305f2ceab&consumer_secret=cs_e2396ccd68bb0c1fbc4380c53d01cfd023e00892"


def api_post(endpoint, data):
    url = f"{BASE}/{endpoint}?{AUTH}"
    result = subprocess.run(
        ["curl", "-sk", "-X", "POST", url, "-H", "Content-Type: application/json", "-d", json.dumps(data)],
        capture_output=True, text=True,
    )
    resp = json.loads(result.stdout)
    if "id" not in resp:
        print(f"  ERROR: {resp}")
    return resp


def api_put(endpoint, data):
    url = f"{BASE}/{endpoint}?{AUTH}"
    result = subprocess.run(
        ["curl", "-sk", "-X", "PUT", url, "-H", "Content-Type: application/json", "-d", json.dumps(data)],
        capture_output=True, text=True,
    )
    return json.loads(result.stdout)


# ═══════════════════════════════════════════════
# CATEGORIES - Create EN first, then DE linked
# ═══════════════════════════════════════════════

categories_data = [
    {
        "en": {"name": "Keychains", "slug": "keychains", "description": "Personalized keychains with engraving, paracord, and custom designs."},
        "de": {"name": "Schlüsselanhänger", "slug": "schluesselanhaenger", "description": "Personalisierte Anhänger mit Gravur, Paracord und individuellen Designs."},
    },
    {
        "en": {"name": "Personalized Gifts", "slug": "personalized-gifts", "description": "Unique gift ideas for special occasions."},
        "de": {"name": "Personalisierte Geschenke", "slug": "personalisierte-geschenke", "description": "Einzigartige Geschenkideen für besondere Anlässe."},
    },
    {
        "en": {"name": "Wood Products", "slug": "wood-products", "description": "Laser-engraved and laser-cut products made from wood."},
        "de": {"name": "Holzprodukte", "slug": "holzprodukte", "description": "Lasergravierte und lasergeschnittene Produkte aus Holz."},
    },
    {
        "en": {"name": "Acrylic Products", "slug": "acrylic-products", "description": "Modern signs, stands, and decor made from acrylic."},
        "de": {"name": "Acrylprodukte", "slug": "acrylprodukte", "description": "Moderne Schilder, Ständer und Deko aus Acryl."},
    },
    {
        "en": {"name": "3D Printing", "slug": "3d-printing", "description": "Decorative objects, prototypes, and custom 3D-printed products."},
        "de": {"name": "3D-Druck", "slug": "3d-druck", "description": "Dekorative Objekte, Prototypen und individuelle 3D-Druck-Produkte."},
    },
    {
        "en": {"name": "NFC & Social Stands", "slug": "nfc-social-stands", "description": "QR code and NFC stands for social media and reviews."},
        "de": {"name": "NFC & Social Stands", "slug": "nfc-social-stands-de", "description": "QR-Code- und NFC-Ständer für Social Media und Bewertungen."},
    },
]

print("═══ STEP 1: Creating categories ═══\n")

# Store mapping: index -> {en: id, de: id}
cat_ids = []

for i, cat in enumerate(categories_data):
    # Create English category
    en_payload = {**cat["en"], "lang": "en"}
    en_resp = api_post("products/categories", en_payload)
    en_id = en_resp["id"]
    print(f"  EN category {en_id}: {cat['en']['name']}")

    # Create German category linked to English
    de_payload = {**cat["de"], "lang": "de", "translations": {"en": en_id}}
    de_resp = api_post("products/categories", de_payload)
    de_id = de_resp["id"]
    print(f"  DE category {de_id}: {cat['de']['name']} (linked to EN {en_id})")

    cat_ids.append({"en": en_id, "de": de_id})
    print()

# Build lookup: cat slug -> {en: id, de: id}
cat_by_slug = {}
for i, cat in enumerate(categories_data):
    cat_by_slug[cat["en"]["slug"]] = cat_ids[i]


# ═══════════════════════════════════════════════
# PRODUCTS - Create EN first, then DE linked
# ═══════════════════════════════════════════════

products_data = [
    {
        "en": {
            "name": "Personalized Paracord Keychain",
            "slug": "personalized-paracord-keychain",
            "regular_price": "14.90",
            "description": "<p>A handcrafted paracord keychain personalized with your name. Choose from a variety of colors and add custom charms. Perfect as a gift or everyday accessory.</p>",
            "short_description": "Custom paracord keychain with name and color choice.",
        },
        "de": {
            "name": "Personalisierter Paracord Schlüsselanhänger",
            "slug": "personalisierter-paracord-schluesselanhaenger",
            "regular_price": "14.90",
            "description": "<p>Ein handgefertigter Paracord-Schlüsselanhänger, personalisiert mit deinem Namen. Wähle aus verschiedenen Farben und füge individuelle Anhänger hinzu. Perfekt als Geschenk oder Alltagsaccessoire.</p>",
            "short_description": "Paracord-Schlüsselanhänger mit Wunschname und Farbauswahl.",
        },
        "categories": ["keychains", "personalized-gifts"],
    },
    {
        "en": {
            "name": "Engraved Wooden Keychain",
            "slug": "engraved-wooden-keychain",
            "regular_price": "12.90",
            "description": "<p>A round wooden keychain with custom laser engraving. Available with names, symbols, or profession-themed motifs. Made from high-quality birch wood.</p>",
            "short_description": "Wooden keychain with personalized laser engraving.",
        },
        "de": {
            "name": "Holz-Schlüsselanhänger mit Gravur",
            "slug": "holz-schluesselanhaenger-mit-gravur",
            "regular_price": "12.90",
            "description": "<p>Ein runder Holz-Schlüsselanhänger mit individueller Lasergravur. Erhältlich mit Namen, Symbolen oder Berufsmotiven. Aus hochwertigem Birkenholz gefertigt.</p>",
            "short_description": "Holzanhänger mit personalisierter Lasergravur.",
        },
        "categories": ["keychains", "wood-products"],
    },
    {
        "en": {
            "name": "Personalized Wooden Name Sign",
            "slug": "personalized-wooden-name-sign",
            "regular_price": "24.90",
            "description": "<p>A decorative wooden name sign laser-cut from premium birch wood. Perfect for children's rooms, doors, or as a personalized gift. Available in various fonts.</p>",
            "short_description": "Laser-cut wooden name sign for decoration.",
        },
        "de": {
            "name": "Personalisierter Namensschriftzug aus Holz",
            "slug": "personalisierter-namensschriftzug-holz",
            "regular_price": "24.90",
            "description": "<p>Ein dekorativer Namensschriftzug, lasergeschnitten aus hochwertigem Birkenholz. Perfekt fürs Kinderzimmer, Türen oder als personalisiertes Geschenk. In verschiedenen Schriftarten erhältlich.</p>",
            "short_description": "Lasergeschnittener Namensschriftzug aus Holz für Deko.",
        },
        "categories": ["wood-products", "personalized-gifts"],
    },
    {
        "en": {
            "name": "Acrylic NFC Social Media Stand",
            "slug": "acrylic-nfc-social-media-stand",
            "regular_price": "29.90",
            "description": "<p>A premium acrylic stand with embedded NFC chip and QR code. Customers simply tap or scan to leave a Google review or follow your Instagram. Ideal for restaurants, salons, and shops.</p>",
            "short_description": "NFC and QR code stand for reviews and social media.",
        },
        "de": {
            "name": "Acryl NFC Social Media Ständer",
            "slug": "acryl-nfc-social-media-staender",
            "regular_price": "29.90",
            "description": "<p>Ein hochwertiger Acrylständer mit integriertem NFC-Chip und QR-Code. Kunden tippen oder scannen einfach, um eine Google-Bewertung abzugeben oder deinem Instagram zu folgen. Ideal für Restaurants, Salons und Geschäfte.</p>",
            "short_description": "NFC- und QR-Code-Ständer für Bewertungen und Social Media.",
        },
        "categories": ["acrylic-products", "nfc-social-stands"],
    },
    {
        "en": {
            "name": "3D Printed Desktop Organizer",
            "slug": "3d-printed-desktop-organizer",
            "regular_price": "19.90",
            "description": "<p>A sleek desktop organizer 3D-printed from eco-friendly PLA. Features compartments for pens, phone, and business cards. Available in multiple colors.</p>",
            "short_description": "Functional desk organizer made with 3D printing.",
        },
        "de": {
            "name": "3D-Druck Desktop-Organizer",
            "slug": "3d-druck-desktop-organizer",
            "regular_price": "19.90",
            "description": "<p>Ein schlanker Desktop-Organizer, 3D-gedruckt aus umweltfreundlichem PLA. Mit Fächern für Stifte, Handy und Visitenkarten. In verschiedenen Farben erhältlich.</p>",
            "short_description": "Funktionaler Schreibtisch-Organizer aus dem 3D-Drucker.",
        },
        "categories": ["3d-printing"],
    },
    {
        "en": {
            "name": "Laser-Engraved Bamboo Pen",
            "slug": "laser-engraved-bamboo-pen",
            "regular_price": "9.90",
            "description": "<p>An eco-friendly bamboo ballpoint pen with custom laser engraving. Great as a corporate gift, event giveaway, or personalized writing instrument.</p>",
            "short_description": "Bamboo pen with custom laser-engraved text.",
        },
        "de": {
            "name": "Lasergravierter Bambus-Kugelschreiber",
            "slug": "lasergravierter-bambus-kugelschreiber",
            "regular_price": "9.90",
            "description": "<p>Ein umweltfreundlicher Bambus-Kugelschreiber mit individueller Lasergravur. Ideal als Firmengeschenk, Eventgiveaway oder personalisiertes Schreibgerät.</p>",
            "short_description": "Bambus-Kugelschreiber mit individueller Lasergravur.",
        },
        "categories": ["personalized-gifts", "wood-products"],
    },
    {
        "en": {
            "name": "Engraved Slate Door Sign",
            "slug": "engraved-slate-door-sign",
            "regular_price": "34.90",
            "description": "<p>A natural slate sign with precision laser engraving. Perfect for front doors, offices, or as a housewarming gift. Weather-resistant and durable.</p>",
            "short_description": "Natural slate sign with personalized engraving.",
        },
        "de": {
            "name": "Gravierte Schieferplatte (Türschild)",
            "slug": "gravierte-schieferplatte-tuerschild",
            "regular_price": "34.90",
            "description": "<p>Ein natürliches Schieferschild mit präziser Lasergravur. Perfekt für Haustüren, Büros oder als Einzugsgeschenk. Wetterfest und langlebig.</p>",
            "short_description": "Natürliches Schieferschild mit personalisierter Gravur.",
        },
        "categories": ["personalized-gifts"],
    },
    {
        "en": {
            "name": "3D Printed Phone Stand",
            "slug": "3d-printed-phone-stand",
            "regular_price": "12.90",
            "description": "<p>A minimalist smartphone stand 3D-printed in your choice of color. Compatible with all phone sizes. Features cable management groove and non-slip base.</p>",
            "short_description": "Minimalist 3D-printed stand for smartphones.",
        },
        "de": {
            "name": "3D-Druck Smartphone-Halter",
            "slug": "3d-druck-smartphone-halter",
            "regular_price": "12.90",
            "description": "<p>Ein minimalistischer Smartphone-Halter, 3D-gedruckt in deiner Wunschfarbe. Kompatibel mit allen Handygrößen. Mit Kabelführung und rutschfester Unterseite.</p>",
            "short_description": "Minimalistischer 3D-gedruckter Halter für Smartphones.",
        },
        "categories": ["3d-printing"],
    },
    {
        "en": {
            "name": "LED Name Light (Acrylic)",
            "slug": "led-name-light-acrylic",
            "regular_price": "39.90",
            "description": "<p>A stunning LED edge-lit acrylic name sign. The laser-engraved text glows beautifully with the integrated LED base. USB powered, perfect as a night light or decorative piece.</p>",
            "short_description": "LED-lit acrylic sign with custom name engraving.",
        },
        "de": {
            "name": "LED-Namensleuchte (Acryl)",
            "slug": "led-namensleuchte-acryl",
            "regular_price": "39.90",
            "description": "<p>Ein beeindruckendes LED-beleuchtetes Acryl-Namensschild. Der lasergravierte Text leuchtet wunderschön mit der integrierten LED-Basis. USB-betrieben, perfekt als Nachtlicht oder Dekoelement.</p>",
            "short_description": "LED-beleuchtetes Acrylschild mit individueller Namensgravur.",
        },
        "categories": ["acrylic-products", "personalized-gifts"],
    },
    {
        "en": {
            "name": "Engraved Wooden Cutting Board",
            "slug": "engraved-wooden-cutting-board",
            "regular_price": "44.90",
            "description": "<p>A premium oak cutting board with custom laser engraving. Add names, dates, or a short message. An ideal gift for weddings, housewarmings, or kitchen enthusiasts.</p>",
            "short_description": "Oak cutting board with personalized laser engraving.",
        },
        "de": {
            "name": "Graviertes Holz-Schneidebrett",
            "slug": "graviertes-holz-schneidebrett",
            "regular_price": "44.90",
            "description": "<p>Ein hochwertiges Eichen-Schneidebrett mit individueller Lasergravur. Personalisierbar mit Namen, Daten oder einer kurzen Botschaft. Ein ideales Geschenk für Hochzeiten, Einzug oder Küchenfans.</p>",
            "short_description": "Eichen-Schneidebrett mit personalisierter Lasergravur.",
        },
        "categories": ["wood-products", "personalized-gifts"],
    },
]

print("\n═══ STEP 2: Creating products ═══\n")

for prod in products_data:
    # Resolve category IDs for EN
    en_cat_ids = [{"id": cat_by_slug[slug]["en"]} for slug in prod["categories"]]
    de_cat_ids = [{"id": cat_by_slug[slug]["de"]} for slug in prod["categories"]]

    # Create English product
    en_payload = {
        **prod["en"],
        "type": "simple",
        "categories": en_cat_ids,
        "lang": "en",
        "manage_stock": False,
        "stock_status": "instock",
    }
    en_resp = api_post("products", en_payload)
    en_id = en_resp["id"]
    print(f"  EN product {en_id}: {prod['en']['name']} (€{prod['en']['regular_price']})")

    # Create German product linked to English
    de_payload = {
        **prod["de"],
        "type": "simple",
        "categories": de_cat_ids,
        "lang": "de",
        "translations": {"en": en_id},
        "manage_stock": False,
        "stock_status": "instock",
    }
    de_resp = api_post("products", de_payload)
    de_id = de_resp["id"]
    print(f"  DE product {de_id}: {prod['de']['name']} (€{prod['de']['regular_price']}) ← linked to EN {en_id}")
    print()

print("═══ DONE ═══")
print("Products and categories created in both languages with proper Polylang linking.")
print("In WP Admin, you'll see flag icons showing the translation links.")
print("API: ?lang=en returns English, ?lang=de returns German.")
