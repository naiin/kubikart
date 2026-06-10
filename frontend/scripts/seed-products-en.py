#!/usr/bin/env python3
"""Create English categories and products in WooCommerce."""
import json
import subprocess

BASE = "https://kubikart-backend.lndo.site/wp-json/wc/v3"
AUTH = "consumer_key=ck_f545e33b18fe34ffa271bd73d525b9f305f2ceab&consumer_secret=cs_e2396ccd68bb0c1fbc4380c53d01cfd023e00892"

def api_post(endpoint, data):
    url = f"{BASE}/{endpoint}?{AUTH}"
    result = subprocess.run(
        ["curl", "-sk", "-X", "POST", url, "-H", "Content-Type: application/json", "-d", json.dumps(data)],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)

# Create categories
categories = [
    {"name": "Keychains", "slug": "keychains", "description": "Personalized keychains with engraving, paracord, and custom designs."},
    {"name": "Personalized Gifts", "slug": "personalized-gifts", "description": "Unique gift ideas for special occasions."},
    {"name": "Wood Products", "slug": "wood-products", "description": "Laser-engraved and laser-cut products made from wood."},
    {"name": "Acrylic Products", "slug": "acrylic-products", "description": "Modern signs, stands, and decor made from acrylic."},
    {"name": "3D Printing", "slug": "3d-printing", "description": "Decorative objects, prototypes, and custom 3D-printed products."},
    {"name": "NFC & Social Stands", "slug": "nfc-social-stands", "description": "QR code and NFC stands for social media and reviews."},
]

cat_ids = {}
for cat in categories:
    resp = api_post("products/categories", cat)
    cat_ids[cat["slug"]] = resp["id"]
    print(f"Created category: {resp['id']} - {resp['name']}")

# Create 10 products
products = [
    {
        "name": "Personalized Paracord Keychain",
        "slug": "personalized-paracord-keychain",
        "type": "simple",
        "regular_price": "14.90",
        "description": "<p>A handcrafted paracord keychain personalized with your name. Choose from a variety of colors and add custom charms. Perfect as a gift or everyday accessory.</p>",
        "short_description": "Custom paracord keychain with name and color choice.",
        "categories": [{"id": cat_ids["keychains"]}, {"id": cat_ids["personalized-gifts"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
    {
        "name": "Engraved Wooden Keychain",
        "slug": "engraved-wooden-keychain",
        "type": "simple",
        "regular_price": "12.90",
        "description": "<p>A round wooden keychain with custom laser engraving. Available with names, symbols, or profession-themed motifs. Made from high-quality birch wood.</p>",
        "short_description": "Wooden keychain with personalized laser engraving.",
        "categories": [{"id": cat_ids["keychains"]}, {"id": cat_ids["wood-products"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
    {
        "name": "Personalized Wooden Name Sign",
        "slug": "personalized-wooden-name-sign",
        "type": "simple",
        "regular_price": "24.90",
        "description": "<p>A decorative wooden name sign laser-cut from premium birch wood. Perfect for children's rooms, doors, or as a personalized gift. Available in various fonts.</p>",
        "short_description": "Laser-cut wooden name sign for decoration.",
        "categories": [{"id": cat_ids["wood-products"]}, {"id": cat_ids["personalized-gifts"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
    {
        "name": "Acrylic NFC Social Media Stand",
        "slug": "acrylic-nfc-social-media-stand",
        "type": "simple",
        "regular_price": "29.90",
        "description": "<p>A premium acrylic stand with embedded NFC chip and QR code. Customers simply tap or scan to leave a Google review or follow your Instagram. Ideal for restaurants, salons, and shops.</p>",
        "short_description": "NFC and QR code stand for reviews and social media.",
        "categories": [{"id": cat_ids["acrylic-products"]}, {"id": cat_ids["nfc-social-stands"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
    {
        "name": "3D Printed Desktop Organizer",
        "slug": "3d-printed-desktop-organizer",
        "type": "simple",
        "regular_price": "19.90",
        "description": "<p>A sleek desktop organizer 3D-printed from eco-friendly PLA. Features compartments for pens, phone, and business cards. Available in multiple colors.</p>",
        "short_description": "Functional desk organizer made with 3D printing.",
        "categories": [{"id": cat_ids["3d-printing"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
    {
        "name": "Laser-Engraved Bamboo Pen",
        "slug": "laser-engraved-bamboo-pen",
        "type": "simple",
        "regular_price": "9.90",
        "description": "<p>An eco-friendly bamboo ballpoint pen with custom laser engraving. Great as a corporate gift, event giveaway, or personalized writing instrument.</p>",
        "short_description": "Bamboo pen with custom laser-engraved text.",
        "categories": [{"id": cat_ids["personalized-gifts"]}, {"id": cat_ids["wood-products"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
    {
        "name": "Engraved Slate Door Sign",
        "slug": "engraved-slate-door-sign",
        "type": "simple",
        "regular_price": "34.90",
        "description": "<p>A natural slate sign with precision laser engraving. Perfect for front doors, offices, or as a housewarming gift. Weather-resistant and durable.</p>",
        "short_description": "Natural slate sign with personalized engraving.",
        "categories": [{"id": cat_ids["personalized-gifts"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
    {
        "name": "3D Printed Phone Stand",
        "slug": "3d-printed-phone-stand",
        "type": "simple",
        "regular_price": "12.90",
        "description": "<p>A minimalist smartphone stand 3D-printed in your choice of color. Compatible with all phone sizes. Features cable management groove and non-slip base.</p>",
        "short_description": "Minimalist 3D-printed stand for smartphones.",
        "categories": [{"id": cat_ids["3d-printing"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
    {
        "name": "LED Name Light (Acrylic)",
        "slug": "led-name-light-acrylic",
        "type": "simple",
        "regular_price": "39.90",
        "description": "<p>A stunning LED edge-lit acrylic name sign. The laser-engraved text glows beautifully with the integrated LED base. USB powered, perfect as a night light or decorative piece.</p>",
        "short_description": "LED-lit acrylic sign with custom name engraving.",
        "categories": [{"id": cat_ids["acrylic-products"]}, {"id": cat_ids["personalized-gifts"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
    {
        "name": "Engraved Wooden Cutting Board",
        "slug": "engraved-wooden-cutting-board",
        "type": "simple",
        "regular_price": "44.90",
        "description": "<p>A premium oak cutting board with custom laser engraving. Add names, dates, or a short message. An ideal gift for weddings, housewarmings, or kitchen enthusiasts.</p>",
        "short_description": "Oak cutting board with personalized laser engraving.",
        "categories": [{"id": cat_ids["wood-products"]}, {"id": cat_ids["personalized-gifts"]}],
        "manage_stock": False,
        "stock_status": "instock",
    },
]

for prod in products:
    resp = api_post("products", prod)
    print(f"Created product: {resp.get('id')} - {resp.get('name')} (€{resp.get('regular_price')})")

print("\nDone! All 10 products created.")
