import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.terms,
    title: "AGB | Kubikart",
    description: "Allgemeine Geschäftsbedingungen von Kubikart für Bestellungen über den Online-Shop.",
    index: locale === "de",
  });
}

export default function AGBPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

      <p className="mb-6 text-sm text-gray-600">
        Maßgebliche Fassung als PDF:{" "}
        <a href="/legal/agb.pdf" className="font-semibold text-orange-600 hover:text-orange-500">
          AGB herunterladen
        </a>
      </p>

      <div className="prose prose-gray max-w-none">
        <h2>1. Geltungsbereich</h2>
        <p>
          Diese AGB gelten für alle Verträge, die über den Online-Shop von Kubikart (Hussnain Raza) geschlossen werden. Die Regelungen gelten für Verbraucher
          und Unternehmer.
        </p>
        <p>
          Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer
          selbständigen beruflichen Tätigkeit zugerechnet werden können. Unternehmer ist eine natürliche oder juristische Person oder rechtsfähige
          Personengesellschaft, die bei Abschluss des Vertrags in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handelt.
        </p>

        <h2>2. Vertragsschluss</h2>
        <p>Vertragspartner ist Kubikart, Hussnain Raza, Franz-Lehar-Str. 08, 89134 Blaustein.</p>
        <p>
          Die Darstellung der Produkte im Online-Shop ist kein rechtlich bindendes Angebot, sondern eine unverbindliche Aufforderung zur Bestellung. Mit
          Abschluss des Bestellvorgangs gibst du ein verbindliches Angebot ab. Der Vertrag kommt durch ausdrückliche Auftragsbestätigung, Lieferung der Ware
          oder Zahlungsaufforderung zustande.
        </p>

        <h2>3. Widerrufsrecht</h2>
        <p>Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Details ergeben sich aus der Widerrufsbelehrung auf dieser Website.</p>

        <h2>4. Preise und Zahlungsbedingungen</h2>
        <p>
          Alle Preise sind Gesamtpreise. Umsatzsteuer wird nicht ausgewiesen, da Kubikart als Kleinunternehmer im Sinne des UStG handelt. Versandkosten werden
          im Bestellprozess gesondert ausgewiesen.
        </p>

        <h2>5. Lieferung und Versand</h2>
        <p>
          Lieferfristen und Versandarten werden im Shop und im Bestellprozess angezeigt. Das Risiko des zufälligen Untergangs geht bei Verbrauchern erst mit
          Übergabe der Ware über.
        </p>

        <h2>6. Eigentumsvorbehalt</h2>
        <p>Die Ware bleibt bis zur vollständigen Zahlung unser Eigentum.</p>

        <h2>7. Mängelhaftung</h2>
        <p>Es gelten die gesetzlichen Gewährleistungsrechte.</p>

        <h2>8. Haftung</h2>
        <p>
          Wir haften uneingeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Bei leicht fahrlässiger
          Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
        </p>

        <h2>9. Personalisierte Produkte / Kundenvorgaben</h2>
        <p>
          Bei personalisierten Produkten bist du verantwortlich, dass übermittelte Inhalte (Texte, Bilder, Logos) keine Rechte Dritter verletzen. Bei
          Rechtsverletzungen stellst du Kubikart von Ansprüchen Dritter frei.
        </p>

        <h2>10. Gutscheine</h2>
        <p>Aktionsgutscheine gelten nur im angegebenen Zeitraum und nach den jeweiligen Gutscheinbedingungen.</p>

        <h2>11. Anwendbares Recht</h2>
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Für Verbraucher gilt dies nur, soweit dadurch keine zwingenden
          Verbraucherschutzvorschriften des Aufenthaltsstaates entfallen.
        </p>

        <h2>12. Alternative Streitbeilegung</h2>
        <p>Kubikart ist nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </div>
    </div>
  );
}
