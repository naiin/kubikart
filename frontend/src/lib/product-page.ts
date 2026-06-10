import { getTranslations } from "next-intl/server";
import { getProduct, getProductVariations, type WCProduct, type WCVariation } from "@/lib/woocommerce";

export type ProductAvailability = "in_stock" | "made_to_order" | "out_of_stock";

export interface ProductPrice {
  amount: number;
  currency: "EUR";
  prefix?: "ab";
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface ProductPersonalizationOption {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "color" | "file";
  required: boolean;
  placeholder?: string;
  helperText?: string;
  maxLength?: number;
  accept?: string;
  options?: {
    label: string;
    value: string;
  }[];
}

export interface ProductVariation {
  id: number;
  attributes: Record<string, string>;
  price: ProductPrice;
  availability: ProductAvailability;
  image?: ProductImage;
}

export interface ProductDetailSection {
  id: string;
  title: string;
  content: string[];
}

export interface ProductBenefit {
  title: string;
  text: string;
}

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface ProductQuickFact {
  label: string;
  value: string;
}

export interface ProductSeoContent {
  title: string;
  paragraphs: string[];
}

export interface ProductPageProduct {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  category: {
    name: string;
    slug: string;
  };
  categories: {
    name: string;
    slug: string;
  }[];
  images: ProductImage[];
  price: ProductPrice;
  priceNote: string;
  availability: ProductAvailability;
  productionTime: string;
  shippingNote: string;
  badges: string[];
  trustItems: string[];
  paymentHints: string[];
  quickFacts: ProductQuickFact[];
  personalizationOptions: ProductPersonalizationOption[];
  defaultOptionValues?: Record<string, string>;
  variations?: ProductVariation[];
  detailSections: ProductDetailSection[];
  benefits: ProductBenefit[];
  faqs: ProductFaq[];
  seoContent: ProductSeoContent;
  relatedProductSlugs: string[];
  customRequestHref: string;
  supportHref: string;
  sku?: string;
  averageRating?: number;
  reviewCount?: number;
  weight?: number; // kg
  dimensions?: { length: number; width: number; height: number }; // cm
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://kubikart.de").replace(/\/$/, "");
const DEFAULT_TRUST_ITEMS = ["Sichere Zahlung", "Schnelle Fertigung", "Persönlicher Support", "Sorgfältig verpackt"];
const DEFAULT_PAYMENT_HINTS = ["Sichere Zahlung", "Persönlicher Support", "Made in Germany"];

function buildMailtoHref(subject: string, body: string) {
  return `mailto:info@kubikart.de?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildCustomRequestHref(productName: string, productSlug: string) {
  return buildMailtoHref(
    `Sonderwunsch zu ${productName}`,
    `Hallo Kubikart,\n\nich interessiere mich fuer ${productName}.\nProdukt: ${SITE_URL}/de/shop/${productSlug}\n\nMein Wunsch:`,
  );
}

function buildSupportHref(productName: string, productSlug: string) {
  return buildMailtoHref(
    `Frage zu ${productName}`,
    `Hallo Kubikart,\n\nich habe eine Frage zu ${productName}.\nProdukt: ${SITE_URL}/de/shop/${productSlug}\n\nMeine Frage:`,
  );
}

function createPlaceholderProduct(product: Omit<ProductPageProduct, "customRequestHref" | "supportHref">): ProductPageProduct {
  return {
    ...product,
    customRequestHref: buildCustomRequestHref(product.name, product.slug),
    supportHref: buildSupportHref(product.name, product.slug),
  };
}

const PLACEHOLDER_PRODUCTS: ProductPageProduct[] = [
  createPlaceholderProduct({
    id: 9001,
    slug: "personalisierter-paracord-schluesselanhaenger-mit-namen",
    name: "Personalisierter Paracord Schlüsselanhänger mit Namen",
    subtitle: "Handgemachter Schlüsselanhänger mit Wunschname, Farben und Anhängern, individuell gefertigt in Deutschland.",
    shortDescription:
      "Gestalte deinen eigenen Schlüsselanhänger mit Namen, Farben und passenden Anhängern. Jedes Stück wird individuell montiert und eignet sich perfekt als persönliches Geschenk.",
    description:
      "Dieser personalisierte Paracord Schlüsselanhänger verbindet handwerkliche Montage mit präzisen Details. Du wählst Namen, Farben und Anhänger passend zum Anlass, wir fertigen dein Einzelstück mit viel Liebe zum Detail in Deutschland.",
    seoTitle: "Personalisierter Paracord Schlüsselanhänger | Kubikart",
    seoDescription:
      "Personalisierter Paracord Schlüsselanhänger mit Namen. Farben und Details individuell wählen, in Deutschland gefertigt und direkt bei Kubikart bestellen.",
    category: {
      name: "Schlüsselanhänger",
      slug: "schluesselanhaenger",
    },
    categories: [{ name: "Schlüsselanhänger", slug: "schluesselanhaenger" }],
    images: [
      {
        src: "/placeholders/product-paracord-hero.svg",
        alt: "Personalisierter Paracord Schlüsselanhänger mit Namen in warmen Navy- und Orangetönen",
      },
      {
        src: "/placeholders/product-detail-cream.svg",
        alt: "Detailansicht des personalisierten Paracord Schlüsselanhängers mit Buchstaben und Anhänger",
      },
      {
        src: "/placeholders/product-colorways.svg",
        alt: "Farbvarianten für einen personalisierten Paracord Schlüsselanhänger von Kubikart",
      },
      {
        src: "/placeholders/product-packaging.svg",
        alt: "Geschenkfertig verpackter personalisierter Schlüsselanhänger von Kubikart",
      },
    ],
    price: {
      amount: 14.9,
      currency: "EUR",
      prefix: "ab",
    },
    priceNote: "zzgl. Versand. Individuelle Fertigung nach Bestellung.",
    availability: "made_to_order",
    productionTime: "2 bis 4 Werktage Fertigungszeit",
    shippingNote: "Sorgfältig verpackt und innerhalb Deutschlands zuverlässig versendet.",
    badges: ["Personalisiert", "Handgemacht", "Made in Germany"],
    trustItems: DEFAULT_TRUST_ITEMS,
    paymentHints: DEFAULT_PAYMENT_HINTS,
    quickFacts: [
      { label: "Material", value: "Paracord, 3D-gedruckte Buchstaben und Metallring" },
      { label: "Fertigung", value: "Handmontiert in Deutschland" },
      { label: "Versand", value: "Sicher verpackt mit Sendungsverfolgung" },
    ],
    personalizationOptions: [
      {
        id: "wunschtext",
        label: "Name oder Wunschtext",
        type: "text",
        required: true,
        placeholder: "Zum Beispiel Emma",
        helperText: "Maximal 12 Zeichen. Bei längeren Namen prüfen wir die Umsetzbarkeit individuell.",
        maxLength: 12,
      },
      {
        id: "paracord_farbe",
        label: "Paracord Farbe",
        type: "color",
        required: true,
        options: [
          { label: "Navy", value: "navy" },
          { label: "Sand", value: "sand" },
          { label: "Terrakotta", value: "terrakotta" },
          { label: "Salbei", value: "salbei" },
        ],
      },
      {
        id: "buchstabenfarbe",
        label: "Buchstabenfarbe",
        type: "color",
        required: true,
        options: [
          { label: "Weiß", value: "weiss" },
          { label: "Orange", value: "orange" },
          { label: "Anthrazit", value: "anthrazit" },
        ],
      },
      {
        id: "anhaenger",
        label: "Anhänger auswählen",
        type: "select",
        required: true,
        helperText: "Wähle die Variante, die am besten zum Anlass passt.",
        options: [
          { label: "Ohne Anhänger", value: "ohne" },
          { label: "Herz", value: "herz" },
          { label: "Stern", value: "stern" },
          { label: "Pfote", value: "pfote" },
        ],
      },
      {
        id: "besondere_wuensche",
        label: "Besondere Wünsche",
        type: "textarea",
        required: false,
        placeholder: "Zum Beispiel Geschenkverpackung oder bestimmte Farbkombination",
        helperText: "Optional. Hier kannst du Sonderwünsche oder Hinweise für die Fertigung ergänzen.",
        maxLength: 280,
      },
    ],
    detailSections: [
      {
        id: "beschreibung",
        title: "Beschreibung",
        content: [
          "Dieser personalisierte Schlüsselanhänger wird individuell nach deinen Wünschen gefertigt und kombiniert robuste Materialien mit einer warmen, handgemachten Optik.",
          "Er eignet sich als persönliches Geschenk für Familie, Freunde, Einschulung, Geburtstag oder als kleine Aufmerksamkeit zwischendurch.",
        ],
      },
      {
        id: "personalisierung",
        title: "Personalisierung",
        content: [
          "Du kannst Namen, Paracord-Farbe, Buchstabenfarbe und einen passenden Anhänger auswählen.",
          "Wenn du eine besondere Idee hast, kannst du sie im Feld „Besondere Wünsche“ ergänzen oder direkt einen Sonderwunsch anfragen.",
        ],
      },
      {
        id: "material-und-masse",
        title: "Material & Maße",
        content: [
          "Material: Paracord, 3D-gedruckte Buchstaben, Metall-Schlüsselring.",
          "Länge: etwa 12 bis 15 cm, abhängig vom Namen und der gewählten Konfiguration.",
          "Fertigung: 3D-Druck, Handmontage und sorgfältige Endkontrolle in Deutschland.",
        ],
      },
      {
        id: "versand-und-fertigung",
        title: "Versand & Fertigung",
        content: [
          "Die Fertigung erfolgt in der Regel innerhalb von 2 bis 4 Werktagen.",
          "Danach wird dein Produkt sorgfältig verpackt und zuverlässig versendet.",
        ],
      },
      {
        id: "pflegehinweise",
        title: "Pflegehinweise",
        content: [
          "Bitte vor starker Hitze schützen und nicht dauerhaft Feuchtigkeit aussetzen.",
          "Zur Reinigung reicht in der Regel ein leicht feuchtes Tuch.",
        ],
      },
    ],
    benefits: [
      {
        title: "Individuell gefertigt",
        text: "Jeder Schlüsselanhänger wird erst nach deiner Bestellung zusammengestellt und auf deine Angaben abgestimmt.",
      },
      {
        title: "Persönliches Geschenk",
        text: "Ideal für Geburtstag, Einschulung, Weihnachten oder als kleine Aufmerksamkeit mit echter Bedeutung.",
      },
      {
        title: "Hochwertige Details",
        text: "Robuste Materialien, saubere Verarbeitung und eine harmonische Farbabstimmung sorgen für einen wertigen Eindruck.",
      },
      {
        title: "Direkter Kontakt",
        text: "Bei Sonderwünschen oder Fragen kannst du Kubikart direkt erreichen und dein Produkt gemeinsam abstimmen.",
      },
    ],
    faqs: [
      {
        question: "Kann ich den Namen frei wählen?",
        answer: "Ja. Du kannst deinen Wunschtext angeben. Bei sehr langen Namen prüfen wir die Machbarkeit individuell.",
      },
      {
        question: "Wie lange dauert die Fertigung?",
        answer: "In der Regel 2 bis 4 Werktage. Danach wird der Schlüsselanhänger sorgfältig verpackt und versendet.",
      },
      {
        question: "Kann ich eine andere Farbe oder Größe anfragen?",
        answer: "Ja. Nutze dafür das Feld „Besondere Wünsche“ oder den Link zur Sonderanfertigung direkt auf der Produktseite.",
      },
      {
        question: "Ist jedes Produkt ein Einzelstück?",
        answer: "Ja. Da jedes Stück individuell nach Bestellung gefertigt wird, ist jede Kombination ein persönliches Einzelstück.",
      },
      {
        question: "Kann ich das Produkt als Geschenk verschicken lassen?",
        answer: "Ja. Wenn du einen Hinweis zur Verpackung oder zum Anlass hast, kannst du ihn bei den Wünschen ergänzen.",
      },
    ],
    seoContent: {
      title: "Personalisierter Schlüsselanhänger als Geschenk",
      paragraphs: [
        "Ein personalisierter Paracord Schlüsselanhänger ist ein kleines, persönliches Geschenk für viele Anlässe, ob Geburtstag, Einschulung, Weihnachten oder als liebevolle Aufmerksamkeit zwischendurch. Bei Kubikart kannst du Namen, Farben und Anhänger passend zum Anlass kombinieren und so ein individuelles Einzelstück gestalten.",
        "Jeder Schlüsselanhänger wird mit Sorgfalt montiert und in Deutschland gefertigt. Dadurch entsteht ein Produkt, das nicht nur praktisch ist, sondern auch emotionalen Wert hat und sich deutlich persönlicher anfühlt als ein Standardgeschenk.",
      ],
    },
    relatedProductSlugs: [
      "holz-schluesselanhaenger-mit-gravur",
      "personalisierter-namensschriftzug-aus-holz",
      "acryl-nfc-social-media-stand-mit-qr-code",
      "acryl-schild-mit-logo-und-gravur",
    ],
  }),
  createPlaceholderProduct({
    id: 9002,
    slug: "holz-schluesselanhaenger-mit-gravur",
    name: "Holz Schlüsselanhänger mit Gravur",
    subtitle: "Schlichter Schlüsselanhänger aus Holz mit Wunschgravur, sauber verarbeitet und persönlich gestaltet.",
    shortDescription: "Ein Holz Schlüsselanhänger mit Gravur ist eine zeitlose, persönliche Geschenkidee für Alltag, Familie oder kleine Aufmerksamkeiten.",
    description:
      "Der gravierte Holz Schlüsselanhänger wird aus einem warmen Holzton gefertigt und mit deinem Wunschtext oder Motiv veredelt. Die Kombination aus natürlichem Material und präziser Gravur sorgt für eine hochwertige, persönliche Optik.",
    seoTitle: "Holz Schlüsselanhänger mit Gravur | Kubikart",
    seoDescription: "Holz Schlüsselanhänger mit Wunschgravur bei Kubikart. Natürliches Material, persönliche Gravur und sorgfältige Fertigung in Deutschland.",
    category: {
      name: "Schlüsselanhänger",
      slug: "schluesselanhaenger",
    },
    categories: [{ name: "Schlüsselanhänger", slug: "schluesselanhaenger" }],
    images: [
      {
        src: "/placeholders/product-wood-hero.svg",
        alt: "Holz Schlüsselanhänger mit individueller Gravur von Kubikart",
      },
      {
        src: "/placeholders/product-detail-cream.svg",
        alt: "Detailansicht einer Gravur auf einem Holz Schlüsselanhänger",
      },
      {
        src: "/placeholders/product-packaging.svg",
        alt: "Verpackter Holz Schlüsselanhänger als Geschenkidee",
      },
    ],
    price: {
      amount: 12.9,
      currency: "EUR",
      prefix: "ab",
    },
    priceNote: "zzgl. Versand. Gravur wird individuell umgesetzt.",
    availability: "made_to_order",
    productionTime: "2 bis 4 Werktage Fertigungszeit",
    shippingNote: "Sorgfältig verpackt und bereit zum Verschenken.",
    badges: ["Personalisiert", "Naturmaterial", "Made in Germany"],
    trustItems: DEFAULT_TRUST_ITEMS,
    paymentHints: DEFAULT_PAYMENT_HINTS,
    quickFacts: [
      { label: "Material", value: "Holz mit Metallring" },
      { label: "Gravur", value: "Lasergravur nach Wunsch" },
      { label: "Verwendung", value: "Persönliches Geschenk oder kleine Aufmerksamkeit" },
    ],
    personalizationOptions: [
      {
        id: "gravurtext",
        label: "Gravurtext",
        type: "text",
        required: true,
        placeholder: "Zum Beispiel Mama",
        maxLength: 18,
        helperText: "Kurze Texte wirken auf kleinen Formaten besonders sauber und gut lesbar.",
      },
      {
        id: "schriftart",
        label: "Schriftart",
        type: "select",
        required: true,
        options: [
          { label: "Klassisch", value: "klassisch" },
          { label: "Modern", value: "modern" },
          { label: "Handschrift", value: "handschrift" },
        ],
      },
      {
        id: "motiv",
        label: "Motiv oder Symbol",
        type: "select",
        required: false,
        options: [
          { label: "Kein Motiv", value: "kein-motiv" },
          { label: "Herz", value: "herz" },
          { label: "Stern", value: "stern" },
          { label: "Pfote", value: "pfote" },
        ],
      },
      {
        id: "wuensche",
        label: "Besondere Wünsche",
        type: "textarea",
        required: false,
        placeholder: "Zum Beispiel Text auf der Rückseite",
        maxLength: 280,
      },
    ],
    detailSections: [
      {
        id: "beschreibung",
        title: "Beschreibung",
        content: [
          "Der Holz Schlüsselanhänger verbindet natürliche Haptik mit präziser Gravur und eignet sich für viele persönliche Anlässe.",
          "Er wirkt schlicht, hochwertig und ist dadurch ein Geschenk, das lange genutzt wird.",
        ],
      },
      {
        id: "personalisierung",
        title: "Personalisierung",
        content: [
          "Wähle deinen Gravurtext, eine Schriftart und auf Wunsch ein kleines Symbol.",
          "Für zusätzliche Wünsche kannst du das Wunschfeld nutzen oder Kubikart direkt kontaktieren.",
        ],
      },
      {
        id: "material-und-masse",
        title: "Material & Maße",
        content: ["Material: Holz und Metall-Schlüsselring.", "Größe: kompaktes Alltagsformat, angenehm leicht und gut transportierbar."],
      },
      {
        id: "versand-und-fertigung",
        title: "Versand & Fertigung",
        content: ["Die Gravur wird nach Bestelleingang gefertigt und sorgfältig geprüft.", "Versendet wird sicher verpackt innerhalb Deutschlands."],
      },
      {
        id: "pflegehinweise",
        title: "Pflegehinweise",
        content: ["Bitte trocken lagern und bei Bedarf mit einem trockenen Tuch reinigen."],
      },
    ],
    benefits: [
      { title: "Natürliche Optik", text: "Warmer Holzton und feine Gravur sorgen für einen zeitlosen, hochwertigen Eindruck." },
      { title: "Persönliche Botschaft", text: "Mit Namen, Datum oder kurzem Wunschtext wird der Anhänger zu einem echten Erinnerungsstück." },
      { title: "Leicht und praktisch", text: "Das Format passt in den Alltag und eignet sich für Schlüsselbund, Tasche oder Geschenkset." },
    ],
    faqs: [
      {
        question: "Kann ich Vorder- und Rückseite gravieren lassen?",
        answer: "Ja, zusätzliche Wünsche kannst du bei der Personalisierung oder per Sonderwunsch angeben.",
      },
      { question: "Ist jedes Holzstück gleich?", answer: "Nein. Holz ist ein Naturmaterial, daher können Maserung und Ton leicht variieren." },
      { question: "Wie schnell wird versendet?", answer: "Die Fertigung erfolgt in der Regel innerhalb weniger Werktage, danach wird sicher versendet." },
    ],
    seoContent: {
      title: "Holz Schlüsselanhänger mit persönlicher Gravur",
      paragraphs: [
        "Ein Holz Schlüsselanhänger mit Gravur ist eine schlichte und zugleich persönliche Geschenkidee. Durch die individuelle Gravur entsteht aus einem praktischen Alltagsgegenstand ein kleines Erinnerungsstück mit Bedeutung.",
        "Kubikart fertigt jede Gravur mit viel Sorgfalt in Deutschland. So entsteht ein Produkt, das natürlich wirkt, gut in der Hand liegt und sich für viele Anlässe eignet.",
      ],
    },
    relatedProductSlugs: [
      "personalisierter-paracord-schluesselanhaenger-mit-namen",
      "personalisierter-namensschriftzug-aus-holz",
      "acryl-schild-mit-logo-und-gravur",
      "acryl-nfc-social-media-stand-mit-qr-code",
    ],
  }),
  createPlaceholderProduct({
    id: 9003,
    slug: "acryl-nfc-social-media-stand-mit-qr-code",
    name: "Acryl NFC Social Media Stand mit QR-Code",
    subtitle: "Moderner Tischaufsteller aus Acryl mit QR-Code und optionalem NFC, ideal für Social Media, Events und Theken.",
    shortDescription:
      "Ein hochwertiger Acryl Stand für Instagram, TikTok, Google Bewertungen oder eigene Links, klar gestaltet und individuell auf dein Branding abgestimmt.",
    description:
      "Der Acryl NFC Stand bringt deine Social-Media-Profile, Bewertungen oder Kontaktlinks elegant auf Tresen, Schreibtisch oder Messefläche. Mit QR-Code, Logo und optionalem NFC entsteht eine saubere, markengerechte Präsentation.",
    seoTitle: "Acryl NFC Social Media Stand mit QR-Code | Kubikart",
    seoDescription: "Acryl Social Media Stand mit QR-Code und optionalem NFC. Individuell mit Logo, Plattform und Branding gestalten bei Kubikart.",
    category: {
      name: "Acrylprodukte",
      slug: "acrylprodukte",
    },
    categories: [{ name: "Acrylprodukte", slug: "acrylprodukte" }],
    images: [
      {
        src: "/placeholders/product-acrylic-hero.svg",
        alt: "Acryl NFC Social Media Stand mit QR-Code auf einer Theke",
      },
      {
        src: "/placeholders/product-detail-cream.svg",
        alt: "Detailansicht eines QR-Codes auf einem Acryl Social Media Stand",
      },
      {
        src: "/placeholders/product-acrylic-alt.svg",
        alt: "Acryl Stand mit Branding und Social-Media-Elementen von Kubikart",
      },
    ],
    price: {
      amount: 29.9,
      currency: "EUR",
      prefix: "ab",
    },
    priceNote: "zzgl. Versand. Preis abhängig von Format und Ausstattung.",
    availability: "made_to_order",
    productionTime: "3 bis 6 Werktage Fertigungszeit",
    shippingNote: "Sicher verpackt für den Versand von Acrylprodukten.",
    badges: ["Personalisiert", "Business", "QR-Code & NFC"],
    trustItems: DEFAULT_TRUST_ITEMS,
    paymentHints: DEFAULT_PAYMENT_HINTS,
    quickFacts: [
      { label: "Material", value: "Acryl mit optionalem NFC-Tag" },
      { label: "Einsatz", value: "Theke, Studio, Laden oder Messe" },
      { label: "Branding", value: "Logo, QR-Code und Plattform frei anpassbar" },
    ],
    personalizationOptions: [
      {
        id: "plattform",
        label: "Plattform",
        type: "select",
        required: true,
        options: [
          { label: "Instagram", value: "instagram" },
          { label: "TikTok", value: "tiktok" },
          { label: "Google Bewertung", value: "google-review" },
          { label: "Eigener Link", value: "custom-link" },
        ],
      },
      {
        id: "profilname",
        label: "Benutzername oder Link",
        type: "text",
        required: true,
        placeholder: "@deinprofil oder https://...",
        helperText: "Wir nutzen diese Angabe für QR-Code und Layout.",
      },
      {
        id: "nfc_option",
        label: "NFC Option",
        type: "select",
        required: true,
        options: [
          { label: "Mit NFC", value: "mit-nfc" },
          { label: "Nur QR-Code", value: "nur-qr" },
        ],
      },
      {
        id: "logo_datei",
        label: "Logo oder Datei",
        type: "file",
        required: false,
        accept: ".pdf,.png,.jpg,.svg",
        helperText: "Optional. Wir speichern im Warenkorb nur den Dateinamen. Die finale Datei wird bei der Auftragsabstimmung verwendet.",
      },
      {
        id: "besondere_wuensche",
        label: "Besondere Wünsche",
        type: "textarea",
        required: false,
        placeholder: "Zum Beispiel Format, Farbe oder zusätzliche Beschriftung",
        maxLength: 320,
      },
    ],
    detailSections: [
      {
        id: "beschreibung",
        title: "Beschreibung",
        content: [
          "Der Acryl Social Media Stand ist eine elegante Lösung, um Profile, Bewertungen oder Links sichtbar und leicht scanbar zu präsentieren.",
          "Er passt zu modernen Studios, Cafés, Theken, Salons oder Events und kann sauber an dein Branding angepasst werden.",
        ],
      },
      {
        id: "personalisierung",
        title: "Personalisierung",
        content: [
          "Du wählst Plattform, Link, NFC-Option und auf Wunsch dein Logo oder weitere Gestaltungshinweise.",
          "Für Sonderformate, mehrsprachige Inhalte oder besondere Einsätze kannst du direkt einen Projektwunsch senden.",
        ],
      },
      {
        id: "material-und-masse",
        title: "Material & Maße",
        content: ["Material: Acryl mit optionalem NFC-Tag.", "Formate und Stärken werden passend zum Einsatzzweck abgestimmt."],
      },
      {
        id: "versand-und-fertigung",
        title: "Versand & Fertigung",
        content: [
          "Die Produktion erfolgt nach Freigabe deiner Angaben. Je nach Konfiguration liegt die Fertigungszeit meist bei 3 bis 6 Werktagen.",
          "Für den Versand wird das Produkt bruchsicher verpackt.",
        ],
      },
      {
        id: "pflegehinweise",
        title: "Pflegehinweise",
        content: ["Mit einem weichen Tuch reinigen und vor scheuernden Reinigern schützen."],
      },
    ],
    benefits: [
      { title: "Mehr Sichtbarkeit", text: "Deine Profile und Links werden am Point of Sale oder auf dem Event sofort erfassbar." },
      { title: "Klares Branding", text: "Acryl, Logo und Layout wirken modern, ordentlich und hochwertig." },
      { title: "Flexibel einsetzbar", text: "Für Social Media, Bewertungen, Menüs, Kontaktdaten oder Aktionslinks geeignet." },
      { title: "Persönliche Abstimmung", text: "Bei Firmenlogo, Sonderformat oder größerer Menge begleitet Kubikart die Umsetzung direkt." },
    ],
    faqs: [
      {
        question: "Kann ich mein eigenes Logo hochladen?",
        answer: "Ja, ein Logo oder eine Datei kann direkt ergänzt werden. Im Warenkorb wird zunächst nur der Dateiname gespeichert.",
      },
      {
        question: "Brauche ich NFC oder reicht QR-Code?",
        answer: "Beides ist möglich. Für viele Einsätze reicht QR-Code, NFC ist eine praktische Ergänzung für schnellere Interaktionen.",
      },
      { question: "Sind auch Firmenbestellungen möglich?", answer: "Ja, kleine Serien und angepasste Varianten sind auf Anfrage möglich." },
    ],
    seoContent: {
      title: "Social Media Stand aus Acryl für Theke und Event",
      paragraphs: [
        "Ein Acryl Social Media Stand mit QR-Code oder NFC ist ideal, wenn du Profile, Bewertungen oder Kontaktmöglichkeiten sichtbar präsentieren möchtest. Gerade in Studios, Cafés, Geschäften oder auf Events schafft ein klar gestalteter Aufsteller einen professionellen Eindruck.",
        "Kubikart fertigt den Stand individuell nach deinen Angaben und unterstützt auch bei angepassten Formaten, Logo-Integration oder kleinen Serien für Unternehmen.",
      ],
    },
    relatedProductSlugs: [
      "acryl-schild-mit-logo-und-gravur",
      "personalisierter-namensschriftzug-aus-holz",
      "holz-schluesselanhaenger-mit-gravur",
      "personalisierter-paracord-schluesselanhaenger-mit-namen",
    ],
  }),
  createPlaceholderProduct({
    id: 9004,
    slug: "personalisierter-namensschriftzug-aus-holz",
    name: "Personalisierter Namensschriftzug aus Holz",
    subtitle: "Dekorativer Holzschriftzug mit Wunschname, ideal für Kinderzimmer, Geschenke und besondere Anlässe.",
    shortDescription: "Ein individueller Namensschriftzug aus Holz bringt Wärme, Persönlichkeit und eine hochwertige handgemachte Note in jedes Zuhause.",
    description:
      "Der Holzschriftzug wird passend zu deinem Namen und Stil gefertigt und eignet sich als Deko für Kinderzimmer, Feiern, Geschenkboxen oder besondere Fotomomente.",
    seoTitle: "Personalisierter Namensschriftzug aus Holz | Kubikart",
    seoDescription: "Personalisierter Namensschriftzug aus Holz bei Kubikart. Wunschname, Stil und Farbe individuell wählen und hochwertig fertigen lassen.",
    category: {
      name: "Wohnaccessoires",
      slug: "wohnaccessoires",
    },
    categories: [{ name: "Wohnaccessoires", slug: "wohnaccessoires" }],
    images: [
      {
        src: "/placeholders/product-wood-script.svg",
        alt: "Personalisierter Namensschriftzug aus Holz als Deko",
      },
      {
        src: "/placeholders/product-detail-cream.svg",
        alt: "Detailansicht eines Holzschriftzugs mit sauberer Kante",
      },
      {
        src: "/placeholders/product-packaging.svg",
        alt: "Verpackter Namensschriftzug aus Holz als Geschenk",
      },
    ],
    price: {
      amount: 19.9,
      currency: "EUR",
      prefix: "ab",
    },
    priceNote: "zzgl. Versand. Preis abhängig von Name und Format.",
    availability: "made_to_order",
    productionTime: "3 bis 5 Werktage Fertigungszeit",
    shippingNote: "Sicher geschützt verpackt für den Versand.",
    badges: ["Personalisiert", "Dekoration", "Made in Germany"],
    trustItems: DEFAULT_TRUST_ITEMS,
    paymentHints: DEFAULT_PAYMENT_HINTS,
    quickFacts: [
      { label: "Material", value: "Holz" },
      { label: "Einsatz", value: "Kinderzimmer, Geschenk oder Eventdekoration" },
      { label: "Gestaltung", value: "Name, Schriftstil und Farbe anpassbar" },
    ],
    personalizationOptions: [
      {
        id: "name",
        label: "Wunschname",
        type: "text",
        required: true,
        placeholder: "Zum Beispiel Mila",
        maxLength: 16,
      },
      {
        id: "schriftstil",
        label: "Schriftstil",
        type: "select",
        required: true,
        options: [
          { label: "Sanft geschwungen", value: "geschwungen" },
          { label: "Klar modern", value: "modern" },
          { label: "Verspielt", value: "verspielt" },
        ],
      },
      {
        id: "oberflaeche",
        label: "Oberfläche",
        type: "select",
        required: true,
        options: [
          { label: "Natur", value: "natur" },
          { label: "Weiß lasiert", value: "weiss-lasur" },
          { label: "Warm beige", value: "warm-beige" },
        ],
      },
      {
        id: "wuensche",
        label: "Besondere Wünsche",
        type: "textarea",
        required: false,
        placeholder: "Zum Beispiel Lochung zum Aufhängen oder Sondermaß",
        maxLength: 280,
      },
    ],
    detailSections: [
      {
        id: "beschreibung",
        title: "Beschreibung",
        content: [
          "Der Holzschriftzug setzt Namen stilvoll in Szene und passt zu modernen, warmen und persönlichen Räumen.",
          "Er eignet sich für Kinderzimmer, Geburtstagsdekoration, Einschulung oder als individuelles Geschenk.",
        ],
      },
      {
        id: "personalisierung",
        title: "Personalisierung",
        content: [
          "Du bestimmst Name, Schriftstil und Oberfläche passend zum Einsatzort.",
          "Bei Sondergrößen oder besonderen Befestigungen kannst du Kubikart direkt kontaktieren.",
        ],
      },
      {
        id: "material-und-masse",
        title: "Material & Maße",
        content: ["Material: Holz.", "Maße: werden passend zur Namenslänge und gewählten Ausführung abgestimmt."],
      },
      {
        id: "versand-und-fertigung",
        title: "Versand & Fertigung",
        content: [
          "Jeder Schriftzug wird individuell zugeschnitten und sorgfältig verpackt.",
          "Die Fertigung dauert je nach Länge und Ausführung meist 3 bis 5 Werktage.",
        ],
      },
      {
        id: "pflegehinweise",
        title: "Pflegehinweise",
        content: ["Trocken lagern und bei Bedarf vorsichtig abstauben."],
      },
    ],
    benefits: [
      { title: "Persönliche Deko", text: "Ein Name macht Räume persönlicher und schafft einen liebevollen Fokus." },
      { title: "Warmes Material", text: "Holz bringt eine natürliche, hochwertige Wirkung in moderne und gemütliche Umgebungen." },
      { title: "Ideal für Geschenke", text: "Besonders beliebt für Geburt, Taufe, Einschulung oder Kinderzimmer." },
    ],
    faqs: [
      { question: "Kann ich ein Sondermaß anfragen?", answer: "Ja, individuelle Maße sind auf Anfrage möglich." },
      {
        question: "Wie wird der Schriftzug befestigt?",
        answer: "Je nach Ausführung kann er gestellt, angelehnt oder mit passender Lösung montiert werden. Sonderwünsche bitte direkt angeben.",
      },
      { question: "Ist die Holzfarbe immer identisch?", answer: "Holz kann in Ton und Maserung leicht variieren. Das macht jedes Stück besonders." },
    ],
    seoContent: {
      title: "Namensschriftzug aus Holz als persönliche Dekoration",
      paragraphs: [
        "Ein personalisierter Namensschriftzug aus Holz ist eine schöne Möglichkeit, Räume persönlich und warm zu gestalten. Besonders in Kinderzimmern, bei Feiern oder als Geschenk sorgt er für eine individuelle Note.",
        "Kubikart fertigt jeden Schriftzug passend zum Namen und gewünschten Stil. So entsteht eine hochwertige Dekoration, die modern wirkt und gleichzeitig handgemachten Charakter zeigt.",
      ],
    },
    relatedProductSlugs: [
      "personalisierter-paracord-schluesselanhaenger-mit-namen",
      "holz-schluesselanhaenger-mit-gravur",
      "acryl-schild-mit-logo-und-gravur",
      "acryl-nfc-social-media-stand-mit-qr-code",
    ],
  }),
  createPlaceholderProduct({
    id: 9005,
    slug: "acryl-schild-mit-logo-und-gravur",
    name: "Acryl Schild mit Logo und Gravur",
    subtitle: "Modernes Acrylschild für Empfang, Praxis, Studio oder Laden, individuell mit Logo, Text und Format gefertigt.",
    shortDescription: "Ein Acrylschild mit Logo und Gravur bringt Information und Branding klar, hochwertig und professionell zusammen.",
    description:
      "Das Acrylschild eignet sich für Tür, Empfang, Praxis, Büro oder Studio. Logos, Namen und Hinweise werden sauber gestaltet und passend zum Einsatzzweck abgestimmt.",
    seoTitle: "Acryl Schild mit Logo und Gravur | Kubikart",
    seoDescription:
      "Acryl Schild mit Logo und Gravur bei Kubikart. Individuelle Größen, klare Gestaltung und hochwertige Fertigung für Studio, Praxis oder Laden.",
    category: {
      name: "Beschilderung",
      slug: "beschilderung",
    },
    categories: [{ name: "Beschilderung", slug: "beschilderung" }],
    images: [
      {
        src: "/placeholders/product-acrylic-sign.svg",
        alt: "Acryl Schild mit Logo und Gravur von Kubikart",
      },
      {
        src: "/placeholders/product-acrylic-alt.svg",
        alt: "Detailansicht eines gravierten Acrylschilds mit Logo",
      },
      {
        src: "/placeholders/product-packaging.svg",
        alt: "Sicher verpacktes Acrylschild bereit für den Versand",
      },
    ],
    price: {
      amount: 39.9,
      currency: "EUR",
      prefix: "ab",
    },
    priceNote: "zzgl. Versand. Preis abhängig von Format und Ausführung.",
    availability: "made_to_order",
    productionTime: "4 bis 7 Werktage Fertigungszeit",
    shippingNote: "Geschützt verpackt für empfindliche Oberflächen.",
    badges: ["Business", "Individuell", "Made in Germany"],
    trustItems: DEFAULT_TRUST_ITEMS,
    paymentHints: DEFAULT_PAYMENT_HINTS,
    quickFacts: [
      { label: "Material", value: "Acryl" },
      { label: "Einsatz", value: "Empfang, Studio, Praxis oder Laden" },
      { label: "Anpassung", value: "Logo, Text, Format und Bohrungen möglich" },
    ],
    personalizationOptions: [
      {
        id: "schildtext",
        label: "Text oder Beschriftung",
        type: "text",
        required: true,
        placeholder: "Zum Beispiel Studio Kubikart",
      },
      {
        id: "format",
        label: "Format",
        type: "select",
        required: true,
        options: [
          { label: "Klein", value: "klein" },
          { label: "Mittel", value: "mittel" },
          { label: "Groß", value: "gross" },
          { label: "Sondermaß", value: "sondermass" },
        ],
      },
      {
        id: "logo_upload",
        label: "Logo-Datei",
        type: "file",
        required: false,
        accept: ".pdf,.png,.jpg,.svg",
        helperText: "Optional. Für Logos oder Vorlagen. Im Warenkorb wird nur der Dateiname gespeichert.",
      },
      {
        id: "montage",
        label: "Montagewunsch",
        type: "select",
        required: false,
        options: [
          { label: "Keine Angabe", value: "keine-angabe" },
          { label: "Mit Bohrungen", value: "mit-bohrungen" },
          { label: "Zum Stellen", value: "zum-stellen" },
        ],
      },
      {
        id: "wuensche",
        label: "Besondere Wünsche",
        type: "textarea",
        required: false,
        placeholder: "Zum Beispiel Farbwunsch oder mehrere Schilder",
        maxLength: 320,
      },
    ],
    detailSections: [
      {
        id: "beschreibung",
        title: "Beschreibung",
        content: [
          "Das Acrylschild verbindet eine klare, moderne Optik mit präziser Fertigung und eignet sich für professionelle Beschilderung in kleinen Unternehmen und Studios.",
          "Logo, Text und Aufbau werden passend zum Einsatzort abgestimmt.",
        ],
      },
      {
        id: "personalisierung",
        title: "Personalisierung",
        content: [
          "Du kannst Beschriftung, Format, Logo-Datei und Montagewunsch angeben.",
          "Für mehrere Schilder oder besondere Anforderungen ist eine Projektanfrage direkt auf der Seite möglich.",
        ],
      },
      {
        id: "material-und-masse",
        title: "Material & Maße",
        content: ["Material: Acryl.", "Maße: abhängig von Einsatz, Layout und gewünschter Sichtbarkeit."],
      },
      {
        id: "versand-und-fertigung",
        title: "Versand & Fertigung",
        content: [
          "Die Fertigung startet nach Abstimmung deiner Angaben und dauert je nach Aufwand meist 4 bis 7 Werktage.",
          "Acrylschilder werden für den Versand besonders geschützt verpackt.",
        ],
      },
      {
        id: "pflegehinweise",
        title: "Pflegehinweise",
        content: ["Mit einem weichen Tuch reinigen und vor Kratzern schützen."],
      },
    ],
    benefits: [
      { title: "Professioneller Auftritt", text: "Ein klares Schild mit Logo stärkt den ersten Eindruck am Empfang oder im Studio." },
      { title: "Passend zum Einsatz", text: "Format, Text und Montage können auf deine Räume und Anforderungen abgestimmt werden." },
      { title: "Ideal für kleine Serien", text: "Auch mehrere Schilder für Türen, Räume oder Markenauftritte sind möglich." },
    ],
    faqs: [
      { question: "Kann ich ein eigenes Logo verwenden?", answer: "Ja, du kannst eine Datei hochladen oder den Wunsch im Textfeld ergänzen." },
      { question: "Sind Sondergrößen möglich?", answer: "Ja, Format und Ausführung können individuell abgestimmt werden." },
      { question: "Eignet sich das Produkt für Unternehmen?", answer: "Ja, das Schild ist besonders für Studios, Praxen, Läden und kleine Serien gedacht." },
    ],
    seoContent: {
      title: "Acrylschild mit Logo für Empfang und Studio",
      paragraphs: [
        "Ein Acrylschild mit Logo und Gravur eignet sich ideal für Empfang, Praxis, Studio oder Laden. Es verbindet klare Information mit einem hochwertigen, modernen Markenauftritt und wirkt dabei deutlich ruhiger als standardisierte Beschilderung.",
        "Kubikart fertigt Acrylschilder individuell nach Einsatzort und Gestaltungswunsch. Dadurch lassen sich einzelne Schilder genauso umsetzen wie kleine Serien für Räume, Türen oder ein konsistentes Branding.",
      ],
    },
    relatedProductSlugs: [
      "acryl-nfc-social-media-stand-mit-qr-code",
      "holz-schluesselanhaenger-mit-gravur",
      "personalisierter-namensschriftzug-aus-holz",
      "personalisierter-paracord-schluesselanhaenger-mit-namen",
    ],
  }),
];

const PLACEHOLDER_PRODUCTS_BY_SLUG = new Map(PLACEHOLDER_PRODUCTS.map((product) => [product.slug, product]));

function hasWooCommerceConfig() {
  return Boolean(process.env.WC_API_URL && process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET);
}

function parseMetaCustomFields(metaData: { key: string; value: unknown }[]): ProductPersonalizationOption[] | null {
  const entry = metaData?.find((m) => m.key === "_kubikart_custom_fields");
  if (!entry) return null;

  let fields: unknown[];
  if (typeof entry.value === "string") {
    try {
      fields = JSON.parse(entry.value);
    } catch {
      return null;
    }
  } else if (Array.isArray(entry.value)) {
    fields = entry.value;
  } else {
    return null;
  }

  if (!Array.isArray(fields) || fields.length === 0) return null;

  return fields
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null && "id" in f && "label" in f)
    .map((f) => ({
      id: String(f.id),
      label: String(f.label),
      type: (f.type === "textarea" ? "textarea" : f.type === "select" ? "select" : "text") as ProductPersonalizationOption["type"],
      required: f.required === true || f.required === "true",
      placeholder: f.placeholder ? String(f.placeholder) : undefined,
      maxLength: f.maxLength ? Number(f.maxLength) : undefined,
      helperText: f.helperText ? String(f.helperText) : undefined,
      options: Array.isArray(f.options)
        ? (f.options as { label: string; value: string }[]).map((o) => ({ label: String(o.label), value: String(o.value) }))
        : undefined,
    }));
}

function stripHtml(input: string) {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function createParagraphs(text: string, limit = 2) {
  if (!text) {
    return [];
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .reduce<string[]>((paragraphs, sentence) => {
      if (!sentence) {
        return paragraphs;
      }

      if (paragraphs.length === 0) {
        return [sentence];
      }

      const lastIndex = paragraphs.length - 1;
      const candidate = `${paragraphs[lastIndex]} ${sentence}`.trim();
      if (candidate.length <= 210) {
        paragraphs[lastIndex] = candidate;
      } else if (paragraphs.length < limit) {
        paragraphs.push(sentence);
      }

      return paragraphs;
    }, [])
    .slice(0, limit);
}

function parsePriceAmount(rawValue: string | undefined, fallbackAmount: number) {
  const parsed = Number.parseFloat(rawValue || "");
  return Number.isFinite(parsed) ? parsed : fallbackAmount;
}

function toOptionId(rawValue: string | undefined) {
  return (rawValue || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function toOptionValue(rawValue: string | undefined) {
  return (rawValue || "").trim().toLowerCase().replace(/\s+/g, "-");
}

function mapAvailability(stockStatus: string | undefined, fallbackAvailability: ProductAvailability): ProductAvailability {
  if (stockStatus === "outofstock") {
    return "out_of_stock";
  }

  if (stockStatus === "instock") {
    return fallbackAvailability === "made_to_order" ? "made_to_order" : "in_stock";
  }

  return fallbackAvailability;
}

interface MappingLabels {
  fallbackCategory: string;
  factCategory: string;
  factProduction: string;
  factShipping: string;
  detailDescription: string;
  detailPersonalization: string;
  detailMaterial: string;
  detailShipping: string;
  detailCare: string;
  personalizationFallback1: string;
  personalizationFallback2: string;
  genericSubtitle: (productName: string, categoryName: string) => string;
  genericSeoDescription: (productName: string) => string;
  badges: string[];
  trustItems: string[];
  paymentHints: string[];
  priceNote: string;
  productionTime: string;
  shippingNote: string;
  benefits: ProductBenefit[];
  faqs: ProductFaq[];
}

function mapAttributePersonalizationOptions(product: WCProduct): ProductPersonalizationOption[] {
  return product.attributes
    .filter((attr) => attr.variation === true && attr.options.length > 0)
    .map((attr) => ({
      id: toOptionId(attr.slug || attr.name),
      label: attr.name,
      type: "select" as const,
      required: true,
      options: attr.options.map((opt) => ({ label: opt, value: toOptionValue(opt) })),
    }));
}

function mergePersonalizationOptions(primaryOptions: ProductPersonalizationOption[], secondaryOptions: ProductPersonalizationOption[]) {
  const mergedOptions = new Map<string, ProductPersonalizationOption>();

  for (const option of [...primaryOptions, ...secondaryOptions]) {
    if (!mergedOptions.has(option.id)) {
      mergedOptions.set(option.id, option);
    }
  }

  return Array.from(mergedOptions.values());
}

function mapWooVariations(variations: WCVariation[] | undefined, fallbackAvailability: ProductAvailability): ProductVariation[] | undefined {
  if (!variations?.length) {
    return undefined;
  }

  return variations.map((variation) => ({
    id: variation.id,
    attributes: variation.attributes.reduce<Record<string, string>>((mappedAttributes, attribute) => {
      mappedAttributes[toOptionId(attribute.slug || attribute.name)] = toOptionValue(attribute.option);
      return mappedAttributes;
    }, {}),
    price: {
      amount: parsePriceAmount(variation.price || variation.regular_price || variation.sale_price, 0),
      currency: "EUR",
    },
    availability: mapAvailability(variation.stock_status, fallbackAvailability),
    image: variation.image?.src
      ? {
          src: variation.image.src,
          alt: variation.image.alt || "",
        }
      : undefined,
  }));
}

function mapWooDefaultOptionValues(product: WCProduct) {
  const defaultOptionValues = product.default_attributes?.reduce<Record<string, string>>((mappedDefaults, attribute) => {
    mappedDefaults[toOptionId(attribute.name)] = toOptionValue(attribute.option);
    return mappedDefaults;
  }, {});

  return defaultOptionValues && Object.keys(defaultOptionValues).length > 0 ? defaultOptionValues : undefined;
}

function mapWooProductToProductPageProduct(
  product: WCProduct,
  preset: ProductPageProduct | undefined,
  labels: MappingLabels,
  variations?: WCVariation[],
): ProductPageProduct {
  const primaryCategory = product.categories[0]
    ? {
        name: product.categories[0].name,
        slug: product.categories[0].slug,
      }
    : preset?.category || { name: labels.fallbackCategory, slug: "produkte" };
  const plainShortDescription = stripHtml(product.short_description || product.description);
  const plainDescription = stripHtml(product.description || product.short_description);
  const descriptionParagraphs = createParagraphs(plainDescription, 2);
  const personalizationParagraphs = preset?.detailSections.find((section) => section.id === "personalisierung")?.content || [
    labels.personalizationFallback1,
    labels.personalizationFallback2,
  ];
  const materialParagraphs =
    preset?.detailSections.find((section) => section.id === "material-und-masse")?.content ||
    product.attributes.map((attribute) => `${attribute.name}: ${attribute.options.join(", ")}`).slice(0, 3);

  const priceAmount = parsePriceAmount(product.price || product.regular_price || product.sale_price, preset?.price.amount || 0);
  const fallbackProduct = preset || PLACEHOLDER_PRODUCTS[0];
  const mappedVariations = mapWooVariations(variations, fallbackProduct.availability);
  const defaultOptionValues = mapWooDefaultOptionValues(product);
  const attributePersonalizationOptions = mapAttributePersonalizationOptions(product);
  const metaCustomFields = parseMetaCustomFields(product.meta_data);
  const mergedPersonalizationOptions = mergePersonalizationOptions(attributePersonalizationOptions, metaCustomFields || []);

  return {
    ...fallbackProduct,
    id: product.id,
    slug: product.slug,
    name: product.name,
    subtitle: preset?.subtitle || labels.genericSubtitle(product.name, primaryCategory.name),
    shortDescription: plainShortDescription || preset?.shortDescription || fallbackProduct.shortDescription,
    description: plainDescription || preset?.description || fallbackProduct.description,
    seoTitle: preset?.seoTitle || `${product.name} | Kubikart`,
    seoDescription: preset?.seoDescription || labels.genericSeoDescription(product.name),
    category: primaryCategory,
    categories: product.categories.length
      ? product.categories.map((category) => ({
          name: category.name,
          slug: category.slug,
        }))
      : [primaryCategory],
    images: product.images.length
      ? product.images.map((image) => ({
          src: image.src,
          alt: image.alt || `${product.name} – Kubikart`,
        }))
      : fallbackProduct.images,
    price: {
      amount: priceAmount,
      currency: "EUR",
      prefix: preset?.price.prefix,
    },
    priceNote: preset?.priceNote || labels.priceNote,
    availability: mapAvailability(product.stock_status, fallbackProduct.availability),
    productionTime: preset?.productionTime || labels.productionTime,
    shippingNote: preset?.shippingNote || labels.shippingNote,
    badges: preset?.badges || labels.badges,
    trustItems: preset?.trustItems || labels.trustItems,
    paymentHints: preset?.paymentHints || labels.paymentHints,
    quickFacts: preset?.quickFacts || [
      { label: labels.factCategory, value: primaryCategory.name },
      { label: labels.factProduction, value: labels.productionTime },
      { label: labels.factShipping, value: labels.shippingNote },
    ],
    personalizationOptions: preset?.personalizationOptions || mergedPersonalizationOptions,
    defaultOptionValues,
    variations: mappedVariations,
    detailSections: [
      {
        id: "beschreibung",
        title: labels.detailDescription,
        content: descriptionParagraphs.length ? descriptionParagraphs : fallbackProduct.detailSections[0]?.content || [],
      },
      {
        id: "personalisierung",
        title: labels.detailPersonalization,
        content: personalizationParagraphs,
      },
      {
        id: "material-und-masse",
        title: labels.detailMaterial,
        content: materialParagraphs.length ? materialParagraphs : fallbackProduct.detailSections[2]?.content || [],
      },
      {
        id: "versand-und-fertigung",
        title: labels.detailShipping,
        content: preset?.detailSections.find((section) => section.id === "versand-und-fertigung")?.content || [],
      },
      {
        id: "pflegehinweise",
        title: labels.detailCare,
        content: preset?.detailSections.find((section) => section.id === "pflegehinweise")?.content || [],
      },
    ],
    benefits: preset?.benefits || labels.benefits,
    faqs: preset?.faqs || labels.faqs,
    seoContent: preset?.seoContent || { title: product.name, paragraphs: descriptionParagraphs },
    relatedProductSlugs: preset?.relatedProductSlugs || [],
    customRequestHref: buildCustomRequestHref(product.name, product.slug),
    supportHref: buildSupportHref(product.name, product.slug),
    sku: product.id ? `KB-${product.id}` : preset?.sku,
    averageRating: Number.parseFloat(product.average_rating || "0") || 0,
    reviewCount: product.rating_count || 0,
    weight: parseFloat(product.weight) || undefined,
    dimensions:
      product.dimensions?.length || product.dimensions?.width || product.dimensions?.height
        ? {
            length: parseFloat(product.dimensions.length) || 0,
            width: parseFloat(product.dimensions.width) || 0,
            height: parseFloat(product.dimensions.height) || 0,
          }
        : undefined,
  };
}

export async function getProductPageProduct(slug: string, lang?: string) {
  const preset = PLACEHOLDER_PRODUCTS_BY_SLUG.get(slug);

  if (hasWooCommerceConfig()) {
    try {
      const t = await getTranslations("productPage");
      const labels: MappingLabels = {
        fallbackCategory: t("fallbackCategory"),
        factCategory: t("factCategory"),
        factProduction: t("factProduction"),
        factShipping: t("factShipping"),
        detailDescription: t("detailDescription"),
        detailPersonalization: t("detailPersonalization"),
        detailMaterial: t("detailMaterial"),
        detailShipping: t("detailShipping"),
        detailCare: t("detailCare"),
        personalizationFallback1: t("personalizationFallback1"),
        personalizationFallback2: t("personalizationFallback2"),
        genericSubtitle: (productName, categoryName) => t("genericSubtitle", { productName, categoryName }),
        genericSeoDescription: (productName) => t("genericSeoDescription", { productName }),
        badges: [t("badgePersonalized"), t("badgeHandmade"), t("badgeMadeInGermany")],
        trustItems: [t("trustSecurePayment"), t("trustFastProduction"), t("trustPersonalSupport"), t("trustCarefullyPackaged")],
        paymentHints: [t("paymentHint1"), t("paymentHint2"), t("paymentHint3")],
        priceNote: t("priceNote"),
        productionTime: t("productionTime"),
        shippingNote: t("shippingNote"),
        benefits: [
          { title: t("benefit1_title"), text: t("benefit1_text") },
          { title: t("benefit2_title"), text: t("benefit2_text") },
          { title: t("benefit3_title"), text: t("benefit3_text") },
          { title: t("benefit4_title"), text: t("benefit4_text") },
        ],
        faqs: [
          { question: t("faq1_question"), answer: t("faq1_answer") },
          { question: t("faq2_question"), answer: t("faq2_answer") },
          { question: t("faq3_question"), answer: t("faq3_answer") },
          { question: t("faq4_question"), answer: t("faq4_answer") },
          { question: t("faq5_question"), answer: t("faq5_answer") },
        ],
      };
      const product = await getProduct(slug, lang);
      const variations = product.type === "variable" ? await getProductVariations(product.id, lang, product.slug) : undefined;
      return mapWooProductToProductPageProduct(product, preset, labels, variations);
    } catch {
      return preset || null;
    }
  }

  return preset || null;
}

export function getRelatedProducts(product: ProductPageProduct, limit = 4) {
  const relatedBySlug = product.relatedProductSlugs
    .map((slug) => PLACEHOLDER_PRODUCTS_BY_SLUG.get(slug))
    .filter((relatedProduct): relatedProduct is ProductPageProduct => Boolean(relatedProduct));

  const relatedByCategory = PLACEHOLDER_PRODUCTS.filter((candidate) => candidate.slug !== product.slug && candidate.category.slug === product.category.slug);
  const fallbackProducts = PLACEHOLDER_PRODUCTS.filter((candidate) => candidate.slug !== product.slug);
  const deduped = new Map<string, ProductPageProduct>();

  for (const candidate of [...relatedBySlug, ...relatedByCategory, ...fallbackProducts]) {
    if (!deduped.has(candidate.slug)) {
      deduped.set(candidate.slug, candidate);
    }
  }

  return Array.from(deduped.values()).slice(0, limit);
}

export function formatProductPrice(price: ProductPrice) {
  const formattedAmount = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);

  return price.prefix ? `${price.prefix} ${formattedAmount}` : formattedAmount;
}

export function getAvailabilityLabel(availability: ProductAvailability) {
  switch (availability) {
    case "in_stock":
      return "Auf Lager";
    case "out_of_stock":
      return "Aktuell nicht verfügbar";
    default:
      return "Individuell gefertigt nach Bestellung";
  }
}

export function getAvailabilitySchema(availability: ProductAvailability) {
  switch (availability) {
    case "in_stock":
      return "https://schema.org/InStock";
    case "out_of_stock":
      return "https://schema.org/OutOfStock";
    default:
      return "https://schema.org/PreOrder";
  }
}

export function getSiteUrl() {
  return SITE_URL;
}

export function getProductAbsoluteUrl(locale: string, slug: string) {
  return `${SITE_URL}/${locale}/shop/${slug}`;
}

export function getProductImageAbsoluteUrl(src: string) {
  if (src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }

  return `${SITE_URL}${src.startsWith("/") ? src : `/${src}`}`;
}

export function getPlaceholderProducts() {
  return PLACEHOLDER_PRODUCTS;
}
