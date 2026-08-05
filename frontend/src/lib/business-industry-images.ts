const BUSINESS_INDUSTRY_IMAGES: Readonly<Record<string, string>> = {
  "restaurants-lieferdienste": "/images/business/restaurant.png",
  "restaurants-takeaways": "/images/business/restaurant.png",
  "cafes-baeckereien": "/images/business/cafe.png",
  "cafes-bakeries": "/images/business/cafe.png",
  "barbershops-salons": "/images/business/barber.png",
  "barbers-salons": "/images/business/barber.png",
  "beauty-nagelstudios": "/images/business/nail-salon.png",
  "beauty-nail-studios": "/images/business/nail-salon.png",
  "praxen-gesundheitsbetriebe": "/images/business/praxen.png",
  "clinics-practices": "/images/business/praxen.png",
  fahrschulen: "/images/business/führerschein.png",
  "driving-schools": "/images/business/führerschein.png",
  "lokale-geschaefte": "/images/business/lokale.png",
  "local-shops": "/images/business/lokale.png",
  "reparatur-servicebetriebe": "/images/business/service.png",
  "repair-service-businesses": "/images/business/service.png",
};

export function getBusinessIndustryImage(slug: string): string | undefined {
  return BUSINESS_INDUSTRY_IMAGES[slug];
}
