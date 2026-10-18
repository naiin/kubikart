/** Turnstile disclosure draft: account configuration and legal assessment must be reviewed before publication. */
export const turnstilePrivacy = {
  de: {
    heading: "Cloudflare Turnstile (Schutz vor Bots und Spam)",
    translation: "",
    sections: [
      {
        title: "Anbieter und Zweck",
        body: "Wir nutzen Cloudflare Turnstile von Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, USA, um automatisierte und missbräuchliche Anfragen abzuwehren. Geschützt werden insbesondere Kontakt- und Angebotsanfragen, Newsletter-Anmeldungen, Kontofunktionen, Bestellungen, Widerrufsübermittlungen und Datei-Uploads.",
      },
      {
        title: "Zeitpunkt und Daten",
        body: "Unsere Website lädt die Turnstile-Prüfung erst, wenn Sie eine geschützte Aktion auslösen, nicht beim bloßen Aufruf einer Seite. Dabei wird eine Verbindung zu Cloudflare hergestellt. Nach Cloudflares Angaben werden unter anderem IP-Adresse, TLS-Verbindungsmerkmale, Browserkennung (User-Agent) sowie Website-Schlüssel und zugehörige Herkunftsseite verarbeitet. Unsere Einbindung übergibt außerdem die Art der Aktion, etwa Kontakt oder Anmeldung. Unsere serverseitige Turnstile-Validierung übermittelt keine Nachrichteninhalte, Bestelldaten oder hochgeladenen Dateien an Cloudflare.",
      },
      {
        title: "Prüftoken",
        body: "Nach der Browserprüfung erhalten wir ein einmal verwendbares Token und lassen es serverseitig bei Cloudflare prüfen. Das Token ist höchstens fünf Minuten gültig. Diese Gültigkeit ist keine Aussage über die Speicherdauer der von Cloudflare verarbeiteten technischen Signale; hierfür gelten die in Cloudflares Datenschutzhinweisen beschriebenen Zwecke und Aufbewahrungskriterien.",
      },
      {
        title: "Rechtsgrundlage nach der DSGVO",
        body: "Für den Schutz unserer Dienste stützen wir die Verarbeitung auf Art. 6 Abs. 1 Buchst. f DSGVO. Unser berechtigtes Interesse besteht darin, Spam, automatisierten Missbrauch und Angriffe zu verhindern und die Verfügbarkeit unserer Dienste zu sichern. Wir verwenden Turnstile nicht für Werbung oder zur Erstellung von Werbeprofilen. Sie können der auf berechtigte Interessen gestützten Verarbeitung aus Gründen Ihrer besonderen Situation widersprechen (Art. 21 Abs. 1 DSGVO); wenden Sie sich dazu an info@kubikart.de.",
      },
      {
        title: "Zugriff auf Endgeräte (§ 25 TDDDG)",
        body: "Die Speicherung von oder der Zugriff auf Informationen auf Ihrem Endgerät ist getrennt von der DSGVO-Rechtsgrundlage zu beurteilen. Wir berufen uns auf § 25 Abs. 2 Nr. 2 TDDDG ausschließlich, soweit der jeweilige technische Zugriff unbedingt erforderlich ist, um die von Ihnen ausdrücklich gewünschte geschützte Funktion bereitzustellen. Weitergehende, nicht unbedingt erforderliche Zugriffe sind von dieser Ausnahme nicht umfasst und bedürfen einer vorherigen Einwilligung. Eine Auswahl im Cookie-Hinweis steuert die Turnstile-Prüfung in unserer derzeitigen Einbindung nicht.",
      },
      {
        title: "Rollen von Cloudflare",
        body: "Cloudflare beschreibt sich für die Absicherung unserer Website als Auftragsverarbeiter und uns als Verantwortlichen. Für die zusätzliche Verarbeitung technischer Signale zur Verbesserung der Bot-Erkennung handelt Cloudflare nach seinem Turnstile-Datenschutznachtrag als eigenständig Verantwortlicher. Für diesen eigenen Zweck nennt Cloudflare berechtigte Interessen als Rechtsgrundlage. Für diese Verarbeitung können Sie Ihre Rechte auch unmittelbar gegenüber Cloudflare geltend machen.",
      },
      {
        title: "Verarbeitung außerhalb der EU/des EWR",
        body: "Daten können auch in den USA und anderen Drittländern verarbeitet werden. Cloudflare nennt für erfasste Übermittlungen in die USA seine Zertifizierung unter dem EU–US Data Privacy Framework; für andere beziehungsweise nicht hiervon erfasste Übermittlungen sieht Cloudflare Standardvertragsklauseln und erforderlichenfalls ergänzende Schutzmaßnahmen vor. Die jeweiligen Voraussetzungen und vertraglichen Regelungen ergeben sich aus Cloudflares Datenschutzhinweisen und Data Processing Addendum (DPA/AVV), die unten verlinkt sind.",
      },
      {
        title: "Cookies und optionale Pre-Clearance",
        body: "Die Standardprüfung verwendet ein Prüftoken. Die optionale Pre-Clearance-Funktion von Cloudflare, mit der ein cf_clearance-Cookie ausgestellt werden könnte, ist in unserer Widget-Konfiguration deaktiviert. Die Anwendung setzt kein eigenes Turnstile-Cookie. Daraus folgt nicht, dass keinerlei Zugriff auf Endgeräteinformationen stattfindet; hierzu gilt der Abschnitt zum Zugriff auf Endgeräte (§ 25 TDDDG).",
      },
      {
        title: "Wenn Sie die Prüfung nicht nutzen möchten",
        body: "Ohne erfolgreiche Prüfung kann eine geschützte Onlineaktion nicht abgeschlossen werden. Für Anfragen und die Ausübung Ihrer Datenschutzrechte können Sie uns auch unter info@kubikart.de erreichen. Die gesetzlichen Möglichkeiten, einen Widerruf beispielsweise per E-Mail zu erklären, bleiben unberührt.",
      },
    ],
    linksTitle: "Weitere Informationen von Cloudflare",
    links: ["Turnstile-Datenschutznachtrag", "Cloudflare-Datenschutzerklärung", "Data Processing Addendum (DPA/AVV)", "Dokumentation zur optionalen Pre-Clearance"],
  },
  en: {
    heading: "Cloudflare Turnstile — English courtesy translation",
    translation: "This translates the Turnstile section above. The German text is authoritative.",
    sections: [
      {
        title: "Provider and purpose",
        body: "We use Cloudflare Turnstile, provided by Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, USA, to prevent automated abuse. Protected actions include contact and quotation requests, newsletter subscriptions, account functions, orders, withdrawal submissions and file uploads.",
      },
      {
        title: "When it loads and which data is processed",
        body: "Our website loads the Turnstile check when you initiate a protected action, not merely when you visit a page. This connects your browser to Cloudflare. Cloudflare identifies technical signals including your IP address, TLS connection characteristics, browser User-Agent, site key and associated origin. Our integration also supplies the action type, such as contact or login. Our server-side Turnstile validation does not send message contents, order details or uploaded files to Cloudflare.",
      },
      {
        title: "Verification token",
        body: "Following the browser check, we receive a single-use token and validate it with Cloudflare on our server. The token is valid for up to five minutes. This validity period is not the retention period for Cloudflare’s technical signals; the purposes and retention criteria described in Cloudflare’s privacy information apply to those signals.",
      },
      {
        title: "GDPR legal basis",
        body: "We rely on Article 6(1)(f) GDPR for protecting our services. Our legitimate interest is preventing spam, automated abuse and attacks, and maintaining service availability. We do not use Turnstile for advertising or advertising profiles. You may object on grounds relating to your particular situation under Article 21(1) GDPR by contacting info@kubikart.de.",
      },
      {
        title: "Access to your device (§25 TDDDG)",
        body: "Storing or accessing information on your device requires a separate assessment from the GDPR legal basis. We invoke §25(2) no. 2 TDDDG only insofar as the particular technical access is strictly necessary to provide the protected function you expressly request. Non-essential access is not covered by that exception and requires prior consent. In our current integration, the cookie-banner selection does not control Turnstile verification.",
      },
      {
        title: "Cloudflare’s roles",
        body: "Cloudflare describes its role in securing our website as a processor, with us as controller. Under its Turnstile Privacy Addendum, Cloudflare additionally processes technical signals as an independent controller to improve bot detection, relying on its own legitimate interests for that purpose. You may also exercise your rights directly with Cloudflare regarding that processing.",
      },
      {
        title: "Processing outside the EU/EEA",
        body: "Processing may occur in the USA and other third countries. Cloudflare identifies its EU–US Data Privacy Framework certification for covered US transfers, and Standard Contractual Clauses with supplementary measures where needed for other or non-covered transfers. The applicable conditions and contractual provisions are described in Cloudflare’s privacy information and Data Processing Addendum (DPA), linked below.",
      },
      {
        title: "Cookies and optional pre-clearance",
        body: "The standard check uses a verification token. Cloudflare's optional pre-clearance feature, which could issue a cf_clearance cookie, is disabled in our widget configuration. Our application does not set a Turnstile cookie of its own. This does not mean that no device information is accessed; the section on access to terminal equipment (§ 25 TDDDG) applies to that.",
      },
      {
        title: "If you do not want to use the check",
        body: "A protected online action cannot be completed without successful verification. You can also contact info@kubikart.de for enquiries and privacy rights requests. Statutory ways of declaring withdrawal, including by email, remain available.",
      },
    ],
    linksTitle: "Further information from Cloudflare",
    links: ["Turnstile Privacy Addendum", "Cloudflare Privacy Policy", "Data Processing Addendum (DPA)", "Optional pre-clearance documentation"],
  },
} as const;

export const turnstilePrivacyLinks = [
  "https://www.cloudflare.com/turnstile-privacy-policy/",
  "https://www.cloudflare.com/privacypolicy/",
  "https://www.cloudflare.com/cloudflare-customer-dpa/",
  "https://developers.cloudflare.com/cloudflare-challenges/concepts/clearance/",
] as const;
