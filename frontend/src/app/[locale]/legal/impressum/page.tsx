import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.impressum,
    title: "Impressum | Kubikart",
    description: "Rechtliche Anbieterkennzeichnung und Kontaktdaten von Kubikart gemäß § 5 DDG.",
    index: locale === "de",
  });
}

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Impressum</h1>

      <div className="prose prose-gray max-w-none">
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          KubikArt
          <br />
          Hussnain Raza
          <br />
          Franz-Lehar-Str. 08
          <br />
          89134 Blaustein
        </p>

        <h2>Kontakt</h2>
        <p>E-Mail: info@kubikart.de</p>

        <h2>Umsatzsteuer-Identifikationsnummer</h2>
        <p>
          Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
          <br />
          DE454943872
        </p>

        <h2>Verantwortlich für redaktionelle Inhalte nach § 18 Abs. 2 MStV</h2>
        <p>
          Hussnain Raza
          <br />
          Franz-Lehar-Str. 08
          <br />
          89134 Blaustein
        </p>

        <h2>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
        <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </div>
    </div>
  );
}
