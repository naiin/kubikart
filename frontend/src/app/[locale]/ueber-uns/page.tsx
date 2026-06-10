import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { AboutTrust } from "@/components/home/AboutTrust";

const copy = {
  de: {
    eyebrow: "Kubikart",
    title: "Über uns",
    intro: "Kubikart verbindet Lasergravur, Laserschnitt und 3D-Druck mit einem klaren Anspruch an Qualität, Design und persönliche Betreuung.",
    description:
      "Als kleine Werkstatt in Deutschland fertigen wir personalisierte Produkte, Schilder und Sonderanfertigungen mit viel Sorgfalt. Unser Fokus liegt auf sauberen Materialien, präziser Umsetzung und einer direkten Abstimmung mit unseren Kundinnen und Kunden.",
    values: [
      {
        title: "Präzise Fertigung",
        text: "Laser und 3D-Druck werden so eingesetzt, dass Ergebnisse sauber, haltbar und hochwertig wirken.",
      },
      {
        title: "Persönliche Zusammenarbeit",
        text: "Von Einzelstücken bis zu kleinen Serien begleiten wir Projekte direkt und ohne anonyme Plattformlogik.",
      },
      {
        title: "Made in Germany",
        text: "Entwicklung, Veredelung und Versand laufen mit hohem Qualitätsanspruch in Deutschland.",
      },
    ],
    primaryCta: "Projekt anfragen",
    secondaryCta: "Zum Shop",
  },
  en: {
    eyebrow: "Kubikart",
    title: "About Us",
    intro: "Kubikart combines laser engraving, laser cutting, and 3D printing with a strong focus on quality, design, and personal support.",
    description:
      "As a small workshop in Germany, we create personalized products, signs, and custom requests with care. Our focus is on clean materials, precise execution, and direct coordination with every customer.",
    values: [
      {
        title: "Precise Production",
        text: "Laser and 3D printing are used with care so the final result feels clean, durable, and premium.",
      },
      {
        title: "Personal Collaboration",
        text: "From one-off pieces to small series, we support projects directly without the feel of a generic marketplace.",
      },
      {
        title: "Made in Germany",
        text: "Development, finishing, and shipping are handled in Germany with a clear quality standard.",
      },
    ],
    primaryCta: "Request a Project",
    secondaryCta: "Go to Shop",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "de";

  const metadata = {
    de: {
      title: "Über Kubikart | Personalisierte Produkte, Lasergravur & 3D-Druck",
      description: "Lerne Kubikart kennen: eine kreative Werkstatt aus Deutschland für personalisierte Produkte, Lasergravur, Laserschnitt und 3D-Druck.",
    },
    en: {
      title: "About Kubikart | Personalized Products, Laser Engraving & 3D Printing",
      description: "Learn more about Kubikart, a creative workshop in Germany for personalized products, laser engraving, laser cutting, and 3D printing.",
    },
  } as const;

  const content = metadata[locale];

  return {
    title: content.title,
    description: content.description,
    openGraph: {
      title: content.title,
      description: content.description,
      type: "website",
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: "de" | "en" }> }) {
  const { locale } = await params;
  const content = copy[locale] ?? copy.de;

  return (
    <>
      <section className="bg-cream-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-600">{content.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-navy-900 sm:text-5xl">{content.title}</h1>
            <p className="mt-6 text-lg leading-8 text-gray-700">{content.intro}</p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-500">{content.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/kontakt"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-navy-900 px-6 text-sm font-bold text-white transition hover:bg-navy-800"
              >
                {content.primaryCta}
              </Link>
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-sm font-bold text-navy-900 transition hover:bg-accent-100"
              >
                {content.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {content.values.map((value) => (
              <article key={value.title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_10px_24px_rgba(10,29,55,0.06)]">
                <h2 className="text-lg font-bold text-navy-900">{value.title}</h2>
                <p className="mt-3 text-sm leading-7 text-gray-500">{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <AboutTrust />
    </>
  );
}
