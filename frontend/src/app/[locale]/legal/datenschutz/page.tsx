import type { Metadata } from "next";
import { buildPageMetadata, normalizeLocale, SEO_ROUTE_SEGMENTS } from "@/lib/seo";
import { TurnstilePrivacyNotice } from "@/components/legal/TurnstilePrivacyNotice";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);

  return buildPageMetadata({
    locale,
    routeSegments: SEO_ROUTE_SEGMENTS.privacy,
    title: "Datenschutz | Kubikart",
    description: "Datenschutzerklärung von Kubikart mit Informationen zur Verarbeitung personenbezogener Daten auf dieser Website.",
    index: locale === "de",
  });
}

export default async function DatenschutzPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = normalizeLocale((await params).locale);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 break-words">Datenschutzerklärung</h1>

      <div className="prose prose-gray max-w-none">
        <h2>1. Datenschutz auf einen Blick</h2>
        <h3>Allgemeine Hinweise</h3>
        <p>
          Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen.
          Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
        </p>

        <h3>Datenerfassung auf dieser Website</h3>
        <p>
          <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong>
          <br />
          Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber:
          <br />
          KubikArt, Hussnain Raza, Franz-Lehar-Str. 08, 89134 Blaustein
        </p>

        <h2>2. Hosting</h2>
        <p>
          Wir hosten die Inhalte unserer Website bei folgendem Anbieter. Die Server-Logfiles werden gespeichert und enthalten Ihre IP-Adresse, Browsertyp,
          Betriebssystem, Referrer-URL, Zeitpunkt der Serveranfrage.
        </p>

        <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
        <h3>Datenschutz</h3>
        <p>
          Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und
          entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
        </p>

        <h3>Hinweis zur verantwortlichen Stelle</h3>
        <p>
          KubikArt
          <br />
          Hussnain Raza
          <br />
          Franz-Lehar-Str. 08
          <br />
          89134 Blaustein
          <br />
          E-Mail: info@kubikart.de
        </p>

        <h2>4. Datenerfassung auf dieser Website</h2>
        <h3>Cookies</h3>
        <p>
          Unsere Internetseiten verwenden so genannte „Cookies“. Cookies sind kleine Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden
          entweder vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem Endgerät gespeichert.
        </p>

        <h3>Server-Log-Dateien</h3>
        <p>
          Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns
          übermittelt.
        </p>

        <TurnstilePrivacyNotice locale={locale} />

        <h3>Anfrage per E-Mail oder Telefon</h3>
        <p>
          Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage inklusive aller daraus hervorgehenden personenbezogenen Daten zum Zwecke der
          Bearbeitung Ihres Anliegens bei uns gespeichert und verarbeitet.
        </p>

        <h2>5. eCommerce und Zahlungsanbieter</h2>
        <h3>Verarbeiten von Kunden- und Vertragsdaten</h3>
        <p>
          Wir erheben, verarbeiten und nutzen personenbezogene Kunden- und Vertragsdaten zur Begründung, inhaltlichen Ausgestaltung und Änderung unserer
          Vertragsbeziehungen. Rechtsgrundlage hierfür ist Art. 6 Abs. 1 lit. b DSGVO.
        </p>

        <h3 id="kundendateien">Hochgeladene Dateien (Logos, Speisekarten, Entwürfe)</h3>
        <p>
          Bei manchen Produkten, insbesondere bei den Business-Paketen, können Sie bei der Bestellung Dateien hochladen, zum Beispiel Ihr Logo oder eine
          druckfertige Speisekarte (zulässig sind PNG-, JPG-, WebP- und PDF-Dateien bis 4 MB). Wir verwenden diese Dateien ausschließlich, um Ihren Auftrag
          zu gestalten und zu fertigen sowie Ihnen einen digitalen Entwurf vorzulegen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Durchführung des
          Vertrags). Bitte laden Sie keine Dateien mit besonderen Kategorien personenbezogener Daten hoch und nur Inhalte, an denen Sie die erforderlichen
          Rechte besitzen.
        </p>
        <p>
          <strong>Speicherung und Zugriff:</strong> Die Datei wird über unsere Website an unser Shop-System übertragen und dort in einem nicht öffentlich
          erreichbaren Speicherbereich abgelegt, nicht in der öffentlichen Mediathek. Sie erhält eine zufällige Kennung. Zugriff haben nur angemeldete
          Shop-Verwalter, die die Datei in der jeweiligen Bestellung herunterladen können. In Bestätigungs-E-Mails erscheint nur der Dateiname.
        </p>
        <p>
          <strong>Löschung:</strong> Dateien, die nicht innerhalb von 7 Tagen einer Bestellung zugeordnet werden (zum Beispiel weil der Bestellvorgang
          abgebrochen wurde), werden automatisch gelöscht. Dateien, die einer Bestellung zugeordnet sind, bleiben zusammen mit der Bestellung gespeichert.
          Eine automatische Löschung dieser Dateien ist derzeit nicht eingerichtet; wir löschen sie auf Ihre Anfrage (Art. 17 DSGVO), soweit keine
          gesetzlichen Aufbewahrungspflichten entgegenstehen. Schreiben Sie uns dazu an info@kubikart.de.
        </p>
        {locale === "en" && (
          <p lang="en">
            <em>
              Courtesy translation (the German text above is authoritative): Where a product allows it, in particular the Business Kits, you can upload files
              with your order, for example your logo or a print-ready menu (PNG, JPG, WebP or PDF up to 4 MB). We use them only to design and produce your
              order and to send you a digital proof (Art. 6(1)(b) GDPR). Do not upload special categories of personal data and only content you have the
              rights to. The file is transferred through our website to our shop system and stored in a non-public storage area, not in the public media
              library, under a random identifier. Only logged-in shop managers can download it from the order; confirmation e-mails show the file name only.
              Files that are not attached to an order within 7 days (for example after an abandoned checkout) are deleted automatically. Files attached to an
              order stay with the order. Automatic deletion of those files is not currently set up; we delete them on request (Art. 17 GDPR) unless statutory
              retention duties apply. Write to info@kubikart.de.
            </em>
          </p>
        )}

        <h2>6. Ihre Rechte</h2>
        <p>Sie haben jederzeit das Recht:</p>
        <ul>
          <li>Auskunft über Ihre bei uns gespeicherten Daten zu erhalten (Art. 15 DSGVO)</li>
          <li>Berichtigung unrichtiger Daten zu verlangen (Art. 16 DSGVO)</li>
          <li>Löschung Ihrer Daten zu verlangen (Art. 17 DSGVO)</li>
          <li>Einschränkung der Verarbeitung zu verlangen (Art. 18 DSGVO)</li>
          <li>Datenübertragbarkeit zu verlangen (Art. 20 DSGVO)</li>
          <li>Eine erteilte Einwilligung mit Wirkung für die Zukunft zu widerrufen (Art. 7 Abs. 3 DSGVO)</li>
          <li>Der Verarbeitung aufgrund berechtigter Interessen aus Gründen Ihrer besonderen Situation zu widersprechen (Art. 21 Abs. 1 DSGVO)</li>
          <li>Sich bei einer Aufsichtsbehörde zu beschweren (Art. 77 DSGVO)</li>
        </ul>
      </div>
    </div>
  );
}
