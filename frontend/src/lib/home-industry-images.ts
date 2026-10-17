/** Curated homepage compositions based on existing WooCommerce product galleries. */
const images = {
  restaurant: "/images/home/industries/restaurant-acrylic-qr-nfc-stand.webp",
  cafe: "/images/home/industries/cafe-round-qr-code-stand.webp",
  barber: "/images/home/industries/barber-acrylic-qr-nfc-stand.webp",
  beauty: "/images/home/industries/beauty-studio-acrylic-qr-nfc-stand.webp",
  clinic: "/images/home/industries/clinic-acrylic-qr-nfc-stand.webp",
  driving: "/images/home/industries/driving-school-acrylic-qr-nfc-stand.webp",
  retail: "/images/home/industries/shop-business-cards-packaging-stickers.webp",
  service: "/images/home/industries/repair-service-qr-nfc-stand-business-cards.webp",
} as const;

type HomeIndustryImageKey = keyof typeof images;

const industryImageKeys: Readonly<Record<string, HomeIndustryImageKey>> = {
  "restaurants-lieferdienste": "restaurant",
  "restaurants-takeaways": "restaurant",
  "cafes-baeckereien": "cafe",
  "cafes-bakeries": "cafe",
  "barbershops-salons": "barber",
  "barbers-salons": "barber",
  "beauty-nagelstudios": "beauty",
  "beauty-nail-studios": "beauty",
  "praxen-gesundheitsbetriebe": "clinic",
  "clinics-practices": "clinic",
  fahrschulen: "driving",
  "driving-schools": "driving",
  "lokale-geschaefte": "retail",
  "local-shops": "retail",
  "reparatur-servicebetriebe": "service",
  "repair-service-businesses": "service",
};

export function getHomeIndustryImage(slug: string) {
  const key = industryImageKeys[slug];
  return key ? { src: images[key], altKey: key } : undefined;
}
