import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { ContactForm } from "@/components/ContactForm";

const copy = {
  de: {
    eyebrow: "Kontakt",
    title: "Lass uns über dein Projekt sprechen",
    intro: "Ob personalisierte Geschenke, Acrylschilder, Lasergravur oder 3D-Druck: Kubikart unterstützt dich bei Einzelstücken und Sonderanfertigungen.",
    details: [
      {
        title: "E-Mail",
        text: "info@kubikart.de",
      },
      {
        title: "Anfragen",
        text: "Personalisierte Produkte, Geschenke, Schilder und individuelle Projekte.",
      },
      {
        title: "Antwort",
        text: "Wir melden uns so schnell wie möglich mit einer passenden Rückmeldung.",
      },
    ],
    primaryCta: "E-Mail schreiben",
    secondaryCta: "Zum Shop",
    note: "Beschreibe am besten Material, Stückzahl, Maße und Wunschmotiv direkt in deiner Nachricht.",
  },
  en: {
    eyebrow: "Contact",
    title: "Let’s talk about your project",
    intro: "Whether you need personalized gifts, acrylic signs, laser engraving, or 3D printing, Kubikart supports one-off pieces and custom requests.",
    details: [
      {
        title: "Email",
        text: "info@kubikart.de",
      },
      {
        title: "Requests",
        text: "Personalized products, gifts, signs, and individual projects.",
      },
      {
        title: "Response",
        text: "We reply as quickly as possible with the right next step for your request.",
      },
    ],
    primaryCta: "Send an Email",
    secondaryCta: "Go to Shop",
    note: "It helps if you include material, quantity, dimensions, and your desired motif in the first message.",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" ? "en" : "de";

  const metadata = {
    de: {
      title: "Kontakt | Kubikart Sonderanfertigungen, Lasergravur & 3D-Druck",
      description: "Kontaktiere Kubikart für personalisierte Produkte, Lasergravur, Acrylschilder, 3D-Druck und individuelle Sonderanfertigungen.",
    },
    en: {
      title: "Contact | Kubikart Custom Requests, Laser Engraving & 3D Printing",
      description: "Contact Kubikart for personalized products, laser engraving, acrylic signs, 3D printing, and individual custom requests.",
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

export default async function ContactPage({ params }: { params: Promise<{ locale: "de" | "en" }> }) {
  const { locale } = await params;
  const content = copy[locale] ?? copy.de;

  return (
    <section className="bg-cream-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-600">{content.eyebrow}</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-navy-900 sm:text-5xl">{content.title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">{content.intro}</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500">{content.note}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-sm font-bold text-navy-900 transition hover:bg-accent-100"
              >
                {content.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {content.details.map((detail) => (
              <article key={detail.title} className="rounded-[24px] border border-gray-200 bg-white p-6 shadow-[0_10px_24px_rgba(10,29,55,0.06)]">
                <h2 className="text-lg font-bold text-navy-900">{detail.title}</h2>
                <p className="mt-3 text-sm leading-7 text-gray-500">{detail.text}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mt-16 max-w-3xl">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
