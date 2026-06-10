/**
 * Script to create dummy categories and products in WooCommerce.
 * Uses query-string auth over HTTPS.
 *
 * Run: node scripts/seed-products.mjs
 */

const WC_URL = "https://kubikart-backend.lndo.site:444/wp-json/wc/v3";
const CONSUMER_KEY = "ck_f545e33b18fe34ffa271bd73d525b9f305f2ceab";
const CONSUMER_SECRET = "cs_e2396ccd68bb0c1fbc4380c53d01cfd023e00892";

async function wcRequest(endpoint, method = "GET", body = null) {
  const url = new URL(`${WC_URL}/${endpoint}`);
  url.searchParams.set("consumer_key", CONSUMER_KEY);
  url.searchParams.set("consumer_secret", CONSUMER_SECRET);

  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);
  const data = await response.json();

  if (!response.ok) {
    console.error(`Error ${response.status}:`, data);
    throw new Error(`API error: ${response.status}`);
  }

  return data;
}

// Categories
const categories = [
  { name: "3D-Druck Produkte", slug: "3d-druck", description: "Fertige 3D-gedruckte Produkte und Modelle" },
  { name: "Lasergravur", slug: "lasergravur", description: "Lasergravierte und lasergeschnittene Produkte" },
  { name: "Dekoration", slug: "dekoration", description: "Dekorative Artikel für Zuhause und Büro" },
  { name: "Geschenke", slug: "geschenke", description: "Personalisierte Geschenkideen" },
  { name: "Bürobedarf", slug: "buerobedarf", description: "Nützliche Artikel für den Arbeitsplatz" },
];

// Products
const products = [
  {
    name: "3D-Druck Schlüsselanhänger (Individuell)",
    slug: "3d-schluesselanhaenger",
    regular_price: "12.99",
    description: "Individuell gestalteter Schlüsselanhänger aus dem 3D-Drucker. Wählen Sie Ihre Form, Farbe und Gravur.",
    short_description: "Personalisierter 3D-gedruckter Schlüsselanhänger",
    categories: ["geschenke", "3d-druck"],
  },
  {
    name: "Smartphone-Halter (3D-Druck)",
    slug: "smartphone-halter-3d",
    regular_price: "19.99",
    sale_price: "14.99",
    description: "Eleganter Smartphone-Halter aus dem 3D-Drucker. Passt für alle gängigen Smartphones. Verfügbar in verschiedenen Farben.",
    short_description: "Stabiler 3D-gedruckter Handyhalter",
    categories: ["3d-druck", "buerobedarf"],
  },
  {
    name: "Graviertes Holz-Schneidebrett",
    slug: "graviertes-schneidebrett",
    regular_price: "34.99",
    description: "Hochwertiges Holzschneidebrett mit individueller Lasergravur. Perfektes Geschenk für Hobbyköche.",
    short_description: "Schneidebrett mit persönlicher Gravur",
    categories: ["lasergravur", "geschenke"],
  },
  {
    name: "LED Namensschildlampe",
    slug: "led-namensschild-lampe",
    regular_price: "29.99",
    description: "Personalisierte LED-Lampe mit Ihrem Namen oder Wunschtext. Lasergeschnittenes Acryl mit warmweißer LED-Beleuchtung.",
    short_description: "Personalisierte Acryl-LED-Lampe",
    categories: ["lasergravur", "dekoration", "geschenke"],
  },
  {
    name: "3D-Druck Vasen-Set (3 Stück)",
    slug: "3d-vasen-set",
    regular_price: "49.99",
    sale_price: "39.99",
    description: "Set aus drei modernen Vasen im geometrischen Design. Gedruckt aus umweltfreundlichem PLA-Material.",
    short_description: "Modernes 3-teiliges Vasen-Set aus dem 3D-Drucker",
    categories: ["3d-druck", "dekoration"],
  },
  {
    name: "Lasergravierter Kugelschreiber (Bambus)",
    slug: "lasergravierter-kugelschreiber",
    regular_price: "9.99",
    description: "Nachhaltiger Kugelschreiber aus Bambus mit persönlicher Lasergravur. Ideal als Werbegeschenk oder persönliches Accessoire.",
    short_description: "Bambus-Kugelschreiber mit Gravur",
    categories: ["lasergravur", "buerobedarf", "geschenke"],
  },
  {
    name: "3D-Druck Zahnbürstenhalter",
    slug: "3d-zahnbuerstenhalter",
    regular_price: "15.99",
    description: "Praktischer Zahnbürstenhalter im minimalistischen Design. Platz für bis zu 4 Zahnbürsten.",
    short_description: "Minimalistischer 3D-gedruckter Zahnbürstenhalter",
    categories: ["3d-druck"],
  },
  {
    name: "Gravierte Schieferplatte (Türschild)",
    slug: "gravierte-schieferplatte",
    regular_price: "24.99",
    description: "Natürliche Schieferplatte mit individueller Lasergravur. Perfekt als Türschild, Hausnummer oder Willkommensschild.",
    short_description: "Individuelles Schiefer-Türschild mit Gravur",
    categories: ["lasergravur", "dekoration"],
  },
  {
    name: "Desktop-Organizer (3D-Druck)",
    slug: "desktop-organizer-3d",
    regular_price: "22.99",
    description: "Modularer Desktop-Organizer mit Fächern für Stifte, Klammern und Visitenkarten. Anpassbare Farbe.",
    short_description: "Modularer Schreibtisch-Organizer",
    categories: ["3d-druck", "buerobedarf"],
  },
  {
    name: "Fotogravur auf Holz (A5)",
    slug: "fotogravur-holz-a5",
    regular_price: "39.99",
    description: "Ihr Lieblingsfoto lasergraviert auf hochwertigem Birkenholz im A5-Format. Ein einzigartiges und bleibendes Erinnerungsstück.",
    short_description: "Persönliche Fotogravur auf Holz",
    categories: ["lasergravur", "geschenke", "dekoration"],
  },
];

async function main() {
  console.log("🚀 Seeding WooCommerce with categories and products...\n");

  // Create categories
  console.log("📁 Creating categories...");
  const categoryMap = {};
  for (const cat of categories) {
    try {
      const result = await wcRequest("products/categories", "POST", cat);
      categoryMap[cat.slug] = result.id;
      console.log(`  ✓ ${cat.name} (ID: ${result.id})`);
    } catch {
      console.log(`  ⚠ ${cat.name} might already exist, trying to fetch...`);
      try {
        const existing = await wcRequest(`products/categories?slug=${cat.slug}`);
        if (existing.length > 0) {
          categoryMap[cat.slug] = existing[0].id;
          console.log(`  ✓ ${cat.name} (existing, ID: ${existing[0].id})`);
        }
      } catch {}
    }
  }

  console.log("\n📦 Creating products...");
  for (const product of products) {
    const catIds = product.categories
      .map((slug) => categoryMap[slug])
      .filter(Boolean)
      .map((id) => ({ id }));

    const productData = {
      name: product.name,
      slug: product.slug,
      type: "simple",
      regular_price: product.regular_price,
      sale_price: product.sale_price || "",
      description: product.description,
      short_description: product.short_description,
      categories: catIds,
      status: "publish",
      manage_stock: false,
      stock_status: "instock",
    };

    try {
      const result = await wcRequest("products", "POST", productData);
      console.log(`  ✓ ${product.name} (ID: ${result.id}, €${result.price})`);
    } catch {
      console.log(`  ✗ Failed to create: ${product.name}`);
    }
  }

  console.log("\n✅ Seeding complete!");
}

main().catch(console.error);
