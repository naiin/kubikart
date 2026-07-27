import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.withdrawal,
    title: "Widerruf | Kubikart",
    description: "Informationen zum gesetzlichen Widerrufsrecht und zu Rücksendungen bei Kubikart.",
    index: locale === "de",
  });
}

export default function WiderrufPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Rueckgaberecht / Widerrufsbelehrung</h1>

      <p className="mb-6 text-sm text-gray-600">
        Massgebliche Fassung als PDF:{" "}
        <a href="/legal/widerruf.pdf" className="font-semibold text-orange-600 hover:text-orange-500">
          Widerrufsbelehrung herunterladen
        </a>
      </p>

      <div className="prose prose-gray max-w-none">
        <h2>Widerrufsrecht</h2>
        <p>Verbraucher haben ein vierzehntaegiges Widerrufsrecht.</p>
        <p>
          Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gruenden diesen Vertrag zu widerrufen. Die Widerrufsfrist betraegt vierzehn Tage ab dem
          Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Befoerderer ist, die Waren in Besitz genommen haben bzw. hat.
        </p>
        <p>Um Ihr Widerrufsrecht auszuueben, muessen Sie uns mittels einer eindeutigen Erklaerung ueber Ihren Entschluss informieren:</p>
        <p>
          Kubikart
          <br />
          Hussnain Raza
          <br />
          Franz-Lehar-Str. 08
          <br />
          89134 Blaustein
          <br />
          Deutschland
          <br />
          E-Mail: info@kubikart.de
        </p>
        <p>
          Sie koennen dafuer das beigefuegte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es
          aus, dass Sie die Mitteilung ueber die Ausuebung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
        </p>

        <h2>Folgen des Widerrufs</h2>
        <p>
          Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschliesslich der Lieferkosten (mit Ausnahme
          der zusaetzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, guenstigste Standardlieferung
          gewaehlt haben), unverzueglich und spaetestens binnen vierzehn Tagen ab dem Tag zurueckzuzahlen, an dem die Mitteilung ueber Ihren Widerruf dieses
          Vertrags bei uns eingegangen ist.
        </p>
        <p>
          Fuer diese Rueckzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der urspruenglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen
          wurde ausdruecklich etwas anderes vereinbart. In keinem Fall werden Ihnen wegen dieser Rueckzahlung Entgelte berechnet.
        </p>
        <p>
          Wir koennen die Rueckzahlung verweigern, bis wir die Waren wieder zurueckerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren
          zurueckgesandt haben, je nachdem, welches der fruehere Zeitpunkt ist.
        </p>
        <p>
          Sie haben die Waren unverzueglich und in jedem Fall spaetestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns ueber den Widerruf dieses Vertrags
          unterrichten, an uns zurueckzusenden oder zu uebergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.
        </p>
        <p>Sie tragen die unmittelbaren Kosten der Ruecksendung der Waren.</p>
        <p>
          Sie muessen fuer einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Pruefung der Beschaffenheit, Eigenschaften
          und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurueckzufuehren ist.
        </p>

        <h2>Muster-Widerrufsformular</h2>
        <p>(Wenn Sie den Vertrag widerrufen wollen, dann fuellen Sie bitte dieses Formular aus und senden Sie es zurueck.)</p>
        <p>
          An Kubikart, Hussnain Raza, Franz-Lehar-Str. 08, 89134 Blaustein, Deutschland, info@kubikart.de
          <br />
          Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag ueber den Kauf der folgenden Waren (*)/die Erbringung der folgenden
          Dienstleistung (*)
          <br />
          Bestellt am (*)/erhalten am (*)
          <br />
          Name des/der Verbraucher(s)
          <br />
          Anschrift des/der Verbraucher(s)
          <br />
          Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)
          <br />
          Datum
          <br />
          <br />
          (*) Unzutreffendes streichen.
        </p>

        <h2>Ausschluss des Widerrufsrechts</h2>
        <p>
          Das Widerrufsrecht besteht nicht bei Vertraegen zur Lieferung von Waren, die nicht vorgefertigt sind und fuer deren Herstellung eine individuelle
          Auswahl oder Bestimmung durch den Verbraucher massgeblich ist oder die eindeutig auf die persoenlichen Beduerfnisse des Verbrauchers zugeschnitten
          sind (z. B. individuell angefertigte 3D-Drucke, Lasergravuren oder personalisierte Produkte).
        </p>
      </div>
    </div>
  );
}
