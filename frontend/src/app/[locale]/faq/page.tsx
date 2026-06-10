import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

const copy = {
  de: {
    eyebrow: "FAQ",
    title: "Häufige Fragen",
    intro: "Die wichtigsten Antworten rund um Personalisierung, Sonderanfertigungen, Produktion und Versand.",
    questions: [
      {
        question: "Kann ich ein Produkt personalisieren?",
        answer: "Ja. Viele Produkte lassen sich mit Namen, Datum, Text oder individuellem Motiv anpassen.",
      },
      {
        question: "Sind Sonderanfertigungen möglich?",
        answer: "Ja. Für individuelle Projekte kannst du Kubikart direkt kontaktieren und dein Vorhaben beschreiben.",
      },
      {
        question: "Welche Materialien verarbeitet Kubikart?",
        answer: "Je nach Projekt arbeiten wir unter anderem mit Holz, Acryl und weiteren geeigneten Materialien für Gravur, Schnitt oder 3D-Druck.",
      },
      {
        question: "Wie läuft eine Anfrage ab?",
        answer: "Du schickst uns deine Idee per E-Mail. Danach stimmen wir Material, Format, Umsetzung und weitere Details gemeinsam ab.",
      },
      {
        question: "Wie lange dauert die Fertigung?",
        answer: "Das hängt vom Produkt und vom Umfang der Personalisierung ab. Bei Sonderprojekten teilen wir dir die voraussichtliche Dauer transparent mit.",
      },
      {
        question: "Versendet ihr innerhalb Deutschlands?",
        answer: "Ja. Kubikart versendet innerhalb Deutschlands und achtet auf eine saubere, sichere Verpackung.",
      },
    ],
    primaryCta: "Projekt anfragen",
    secondaryCta: "Zum Shop",
  },
  en: {
    eyebrow: "FAQ",
    title: "Frequently Asked Questions",
    intro: "The most important answers about personalization, custom requests, production, and shipping.",
    questions: [
      {
        question: "Can I personalize a product?",
        answer: "Yes. Many products can be customized with a name, date, text, or an individual motif.",
      },
      {
        question: "Do you offer custom requests?",
        answer: "Yes. For individual projects, you can contact Kubikart directly and describe what you need.",
      },
      {
        question: "Which materials does Kubikart work with?",
        answer: "Depending on the project, we work with wood, acrylic, and other suitable materials for engraving, cutting, or 3D printing.",
      },
      {
        question: "How does an inquiry work?",
        answer: "You send us your idea by email. Then we coordinate material, format, production, and the remaining details together.",
      },
      {
        question: "How long does production take?",
        answer: "That depends on the product and the level of personalization. For custom projects, we share the expected timeline clearly.",
      },
      {
        question: "Do you ship within Germany?",
        answer: "Yes. Kubikart ships within Germany and takes care to package every order securely and neatly.",
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
      title: "FAQ | Kubikart Personalisierung, Versand & Sonderanfertigungen",
      description:
        "Antworten zu Personalisierung, Materialien, Versand, Lasergravur, 3D-Druck und individuellen Sonderanfertigungen bei Kubikart.",
    },
    en: {
      title: "FAQ | Kubikart Personalization, Shipping & Custom Requests",
      description:
        "Answers about personalization, materials, shipping, laser engraving, 3D printing, and custom requests at Kubikart.",
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

export default async function FaqPage({ params }: { params: Promise<{ locale: "de" | "en" }> }) {
  const { locale } = await params;
  const content = copy[locale] ?? copy.de;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-600">{content.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-navy-900 sm:text-5xl">{content.title}</h1>
          <p className="mt-6 text-lg leading-8 text-gray-700">{content.intro}</p>
        </div>

        <div className="mt-10 space-y-4">
          {content.questions.map((item) => (
            <details
              key={item.question}
              className="group rounded-[22px] border border-gray-200 bg-cream-50 p-6 shadow-[0_8px_20px_rgba(10,29,55,0.04)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-navy-900">
                <span>{item.question}</span>
                <span className="text-accent-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500">{item.answer}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
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
    </section>
  );
}
