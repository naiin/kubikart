#!/usr/bin/env python3
"""Create German translations for all English WooCommerce categories and products using Polylang."""
import json
import subprocess

BASE = "https://kubikart-backend.lndo.site/wp-json/wc/v3"
AUTH = "consumer_key=ck_f545e33b18fe34ffa271bd73d525b9f305f2ceab&consumer_secret=cs_e2396ccd68bb0c1fbc4380c53d01cfd023e00892"


def api_post(endpoint, data):
    url = f"{BASE}/{endpoint}?{AUTH}"
    result = subprocess.run(
        ["curl", "-sk", "-X", "POST", url, "-H", "Content-Type: application/json", "-d", json.dumps(data)],
        capture_output=True, text=True,
    )
    return json.loads(result.stdout)


def api_put(endpoint, data):
    url = f"{BASE}/{endpoint}?{AUTH}"
    result = subprocess.run(
        ["curl", "-sk", "-X", "PUT", url, "-H", "Content-Type: application/json", "-d", json.dumps(data)],
        capture_output=True, text=True,
    )
    return json.loads(result.stdout)


# ─── German translations for categories ───
# English ID -> German data
category_translations = {
    24: {"name": "Schlüsselanhänger", "slug": "schluesselanhaenger", "description": "Personalisierte Anhänger mit Gravur, Paracord und individuellen Designs."},
    25: {"name": "Personalisierte Geschenke", "slug": "personalisierte-geschenke", "description": "Einzigartige Geschenkideen für besondere Anlässe."},
    26: {"name": "Holzprodukte", "slug": "holzprodukte", "description": "Lasergravierte und lasergeschnittene Produkte aus Holz."},
    27: {"name": "Acrylprodukte", "slug": "acrylprodukte", "description": "Moderne Schilder, Ständer und Deko aus Acryl."},
    28: {"name": "3D-Druck", "slug": "3d-druck", "description": "Dekorative Objekte, Prototypen und individuelle 3D-Druck-Produkte."},
    29: {"name": "NFC & Social Stands", "slug": "nfc-social-stands", "description": "QR-Code- und NFC-Ständer für Social Media und Bewertungen."},
}

print("=== Creating German category translations ===")
de_cat_ids = {}  # en_id -> de_id

for en_id, de_data in category_translations.items():
    payload = {
        **de_data,
        "lang": "de",
        "translations": {"en": en_id},
    }
    resp = api_post("products/categories", payload)
    de_id = resp.get("id")
    de_cat_ids[en_id] = de_id
    print(f"  Created DE category {de_id}: {resp.get('name')} (linked to EN {en_id})")

# ─── German translations for products ───
# English ID -> German data
product_translations = {
    24: {
        "name": "Personalisierter Paracord Schlüsselanhänger",
        "slug": "personalisierter-paracord-schluesselanhaenger",
        "description": "<p>Ein handgefertigter Paracord-Schlüsselanhänger, personalisiert mit deinem Namen. Wähle aus verschiedenen Farben und füge individuelle Anhänger hinzu. Perfekt als Geschenk oder Alltagsaccessoire.</p>",
        "short_description": "Paracord-Schlüsselanhänger mit Wunschname und Farbauswahl.",
        "categories_en": [24, 25],  # Keychains, Personalized Gifts
    },
    25: {
        "name": "Holz-Schlüsselanhänger mit Gravur",
        "slug": "holz-schluesselanhaenger-mit-gravur",
        "description": "<p>Ein runder Holz-Schlüsselanhänger mit individueller Lasergravur. Erhältlich mit Namen, Symbolen oder Berufsmotiven. Aus hochwertigem Birkenholz gefertigt.</p>",
        "short_description": "Holzanhänger mit personalisierter Lasergravur.",
        "categories_en": [24, 26],  # Keychains, Wood Products
    },
    26: {
        "name": "Personalisierter Namensschriftzug aus Holz",
        "slug": "personalisierter-namensschriftzug-holz",
        "description": "<p>Ein dekorativer Namensschriftzug, lasergeschnitten aus hochwertigem Birkenholz. Perfekt fürs Kinderzimmer, Türen oder als personalisiertes Geschenk. In verschiedenen Schriftarten erhältlich.</p>",
        "short_description": "Lasergeschnittener Namensschriftzug aus Holz für Deko.",
        "categories_en": [26, 25],  # Wood Products, Personalized Gifts
    },
    27: {
        "name": "Acryl NFC Social Media Ständer",
        "slug": "acryl-nfc-social-media-staender",
        "description": "<p>Ein hochwertiger Acrylständer mit integriertem NFC-Chip und QR-Code. Kunden tippen oder scannen einfach, um eine Google-Bewertung abzugeben oder deinem Instagram zu folgen. Ideal für Restaurants, Salons und Geschäfte.</p>",
        "short_description": "NFC- und QR-Code-Ständer für Bewertungen und Social Media.",
        "categories_en": [27, 29],  # Acrylic Products, NFC & Social Stands
    },
    28: {
        "name": "3D-Druck Desktop-Organizer",
        "slug": "3d-druck-desktop-organizer",
        "description": "<p>Ein schlanker Desktop-Organizer, 3D-gedruckt aus umweltfreundlichem PLA. Mit Fächern für Stifte, Handy und Visitenkarten. In verschiedenen Farben erhältlich.</p>",
        "short_description": "Funktionaler Schreibtisch-Organizer aus dem 3D-Drucker.",
        "categories_en": [28],  # 3D Printing
    },
    29: {
        "name": "Lasergravierter Bambus-Kugelschreiber",
        "slug": "lasergravierter-bambus-kugelschreiber",
        "description": "<p>Ein umweltfreundlicher Bambus-Kugelschreiber mit individueller Lasergravur. Ideal als Firmengeschenk, Eventgiveaway oder personalisiertes Schreibgerät.</p>",
        "short_description": "Bambus-Kugelschreiber mit individueller Lasergravur.",
        "categories_en": [25, 26],  # Personalized Gifts, Wood Products
    },
    30: {
        "name": "Gravierte Schieferplatte (Türschild)",
        "slug": "gravierte-schieferplatte-tuerschild",
        "description": "<p>Ein natürliches Schieferschild mit präziser Lasergravur. Perfekt für Haustüren, Büros oder als Einzugsgeschenk. Wetterfest und langlebig.</p>",
        "short_description": "Natürliches Schieferschild mit personalisierter Gravur.",
        "categories_en": [25],  # Personalized Gifts
    },
    31: {
        "name": "3D-Druck Smartphone-Halter",
        "slug": "3d-druck-smartphone-halter",
        "description": "<p>Ein minimalistischer Smartphone-Halter, 3D-gedruckt in deiner Wunschfarbe. Kompatibel mit allen Handygrößen. Mit Kabelführung und rutschfester Unterseite.</p>",
        "short_description": "Minimalistischer 3D-gedruckter Halter für Smartphones.",
        "categories_en": [28],  # 3D Printing
    },
    32: {
        "name": "LED-Namensleuchte (Acryl)",
        "slug": "led-namensleuchte-acryl",
        "description": "<p>Ein beeindruckendes LED-beleuchtetes Acryl-Namensschild. Der lasergravierte Text leuchtet wunderschön mit der integrierten LED-Basis. USB-betrieben, perfekt als Nachtlicht oder Dekoelement.</p>",
        "short_description": "LED-beleuchtetes Acrylschild mit individueller Namensgravur.",
        "categories_en": [27, 25],  # Acrylic Products, Personalized Gifts
    },
    33: {
        "name": "Graviertes Holz-Schneidebrett",
        "slug": "graviertes-holz-schneidebrett",
        "description": "<p>Ein hochwertiges Eichen-Schneidebrett mit individueller Lasergravur. Personalisierbar mit Namen, Daten oder einer kurzen Botschaft. Ein ideales Geschenk für Hochzeiten, Einzug oder Küchenfans.</p>",
        "short_description": "Eichen-Schneidebrett mit personalisierter Lasergravur.",
        "categories_en": [26, 25],  # Wood Products, Personalized Gifts
    },
}

print("\n=== Creating German product translations ===")
for en_id, de_data in product_translations.items():
    # Map English category IDs to German category IDs
    de_categories = []
    for en_cat_id in de_data.pop("categories_en"):
        de_cat_id = de_cat_ids.get(en_cat_id)
        if de_cat_id:
            de_categories.append({"id": de_cat_id})

    payload = {
        "name": de_data["name"],
        "slug": de_data["slug"],
        "type": "simple",
        "description": de_data["description"],
        "short_description": de_data["short_description"],
        "categories": de_categories,
        "lang": "de",
        "translations": {"en": en_id},
        "manage_stock": False,
        "stock_status": "instock",
    }
    resp = api_post("products", payload)
    de_prod_id = resp.get("id")
    # Price is synced automatically by Polylang for WooCommerce Pro
    print(f"  Created DE product {de_prod_id}: {resp.get('name')} (€{resp.get('price','synced')}) (linked to EN {en_id})")

print("\nDone! All German translations created.")
