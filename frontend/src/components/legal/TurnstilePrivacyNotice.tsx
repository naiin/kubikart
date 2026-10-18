import { turnstilePrivacy, turnstilePrivacyLinks } from "@/content/turnstile-privacy";

export function TurnstilePrivacyNotice({ locale }: { locale: "de" | "en" }) {
  return (
    <section id="cloudflare-turnstile" aria-labelledby="turnstile-privacy-heading" className="scroll-mt-28">
      <NoticeLanguage locale="de" />
      {locale === "en" ? <NoticeLanguage locale="en" /> : null}
    </section>
  );
}

function NoticeLanguage({ locale }: { locale: "de" | "en" }) {
  const content = turnstilePrivacy[locale];
  return (
    <div lang={locale}>
      <h3 id={locale === "de" ? "turnstile-privacy-heading" : "turnstile-privacy-heading-en"}>{content.heading}</h3>
      {content.translation ? <p><em>{content.translation}</em></p> : null}
      {content.sections.map((section) => (
        <p key={section.title}><strong>{section.title}: </strong>{section.body}</p>
      ))}
      <p><strong>{content.linksTitle}:</strong></p>
      <ul>
        {turnstilePrivacyLinks.map((href, index) => (
          <li key={href}><a href={href} rel="noreferrer" className="underline underline-offset-4">{content.links[index]}</a></li>
        ))}
      </ul>
    </div>
  );
}
