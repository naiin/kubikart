import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { MailtrapClient } from "mailtrap";

const envPath = path.join(process.cwd(), ".env.local");

function parseEnv(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    result[key] = value;
  }
  return result;
}

function setEnvValue(content, key, value) {
  const escaped = String(value);
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${escaped}`);
  }
  return `${content.trimEnd()}\n${key}=${escaped}\n`;
}

function templateShell(titleDe, titleEn, bodyDe, bodyEn) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#faf7f2;font-family:Arial,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background:#0a1d37;color:#ffffff;padding:20px 24px;font-size:22px;font-weight:700;">Kubikart</td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 12px 0;color:#0a1d37;">${titleDe}</h2>
                ${bodyDe}
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
                <h2 style="margin:0 0 12px 0;color:#0a1d37;">${titleEn}</h2>
                ${bodyEn}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function fetchAccounts(token) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      "https://mailtrap.io/api/accounts",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(body);
              resolve(parsed);
            } catch (err) {
              reject(new Error(`Failed to parse accounts response: ${err.message}`));
            }
            return;
          }

          reject(new Error(`Mailtrap accounts lookup failed: ${res.statusCode} ${body}`));
        });
      },
    );

    req.on("error", (err) => reject(err));
    req.end();
  });
}

function buildTemplates() {
  return [
    {
      envKey: "MAILTRAP_TEMPLATE_NEWSLETTER",
      name: "Kubikart - Newsletter Confirmation",
      subject: "Bitte Newsletter-Anmeldung bestätigen | Please confirm newsletter signup",
      category: "newsletter_confirmation",
      body_html: templateShell(
        "Newsletter-Anmeldung bestätigen",
        "Confirm newsletter signup",
        `<p>Bitte bestätige deine Anmeldung:</p><p><a href="{{confirmation_url}}">{{confirmation_url}}</a></p>`,
        `<p>Please confirm your subscription:</p><p><a href="{{confirmation_url}}">{{confirmation_url}}</a></p>`,
      ),
      body_text: "Please confirm: {{confirmation_url}}",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_NEWSLETTER_WELCOME",
      name: "Kubikart - Newsletter Welcome",
      subject: "Willkommen bei Kubikart | Welcome to Kubikart",
      category: "newsletter_welcome",
      body_html: templateShell("Willkommen bei Kubikart", "Welcome to Kubikart", "<p>Danke fuer deine Anmeldung.</p>", "<p>Thanks for subscribing.</p>"),
      body_text: "Welcome to Kubikart",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_ORDER",
      name: "Kubikart - Order Confirmation",
      subject: "Deine Bestellung {{order_number}} | Your order {{order_number}}",
      category: "order_confirmation",
      body_html: templateShell(
        "Bestellung bestaetigt",
        "Order confirmed",
        "<p>Bestellung {{order_number}} wurde empfangen.</p><p>Gesamt: EUR {{total}}</p>",
        "<p>Order {{order_number}} has been received.</p><p>Total: EUR {{total}}</p>",
      ),
      body_text: "Order {{order_number}} total {{total}}",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_PASSWORD_RESET",
      name: "Kubikart - Password Reset",
      subject: "Passwort zuruecksetzen | Reset your password",
      category: "password_reset",
      body_html: templateShell(
        "Passwort zuruecksetzen",
        "Reset your password",
        `<p>Hier klicken: <a href="{{reset_url}}">{{reset_url}}</a></p>`,
        `<p>Click here: <a href="{{reset_url}}">{{reset_url}}</a></p>`,
      ),
      body_text: "Reset URL: {{reset_url}}",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_CONTACT",
      name: "Kubikart - Contact Confirmation",
      subject: "Deine Anfrage bei Kubikart | Your inquiry at Kubikart",
      category: "contact_confirmation",
      body_html: templateShell(
        "Anfrage erhalten",
        "Inquiry received",
        "<p>Danke {{customer_name}}, wir melden uns bald.</p>",
        "<p>Thanks {{customer_name}}, we will reply soon.</p>",
      ),
      body_text: "Inquiry received",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_ACCOUNT_CREATED",
      name: "Kubikart - Account Created",
      subject: "Konto erstellt | Account created",
      category: "account_created",
      body_html: templateShell(
        "Konto erstellt",
        "Account created",
        "<p>Hallo {{customer_name}}, dein Konto ist aktiv.</p>",
        "<p>Hello {{customer_name}}, your account is active.</p>",
      ),
      body_text: "Account created",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_LOGIN_ALERT",
      name: "Kubikart - Login Alert",
      subject: "Neuer Login erkannt | New login detected",
      category: "login_alert",
      body_html: templateShell(
        "Sicherheitsmeldung: Neuer Login",
        "Security notice: New login",
        "<p>IP: {{login_ip}}</p><p>Zeit: {{login_time_iso}}</p>",
        "<p>IP: {{login_ip}}</p><p>Time: {{login_time_iso}}</p>",
      ),
      body_text: "New login from {{login_ip}} at {{login_time_iso}}",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_ORDER_STATUS",
      name: "Kubikart - Order Status Update",
      subject: "Statusupdate {{order_number}} | Status update {{order_number}}",
      category: "order_status",
      body_html: templateShell(
        "Bestellstatus aktualisiert",
        "Order status updated",
        "<p>Bestellung {{order_number}}: {{order_status_label}}</p>",
        "<p>Order {{order_number}}: {{order_status_label}}</p>",
      ),
      body_text: "Order {{order_number}} status {{order_status_label}}",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_ORDER_STATUS_PENDING",
      name: "Kubikart - Order Status Pending",
      subject: "Zahlung ausstehend {{order_number}} | Payment pending {{order_number}}",
      category: "order_status_pending",
      body_html: templateShell("Zahlung ausstehend", "Payment pending", "<p>Bitte Zahlung abschliessen.</p>", "<p>Please complete payment.</p>"),
      body_text: "Order pending",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_ORDER_STATUS_PROCESSING",
      name: "Kubikart - Order Status Processing",
      subject: "In Bearbeitung {{order_number}} | Processing {{order_number}}",
      category: "order_status_processing",
      body_html: templateShell("In Bearbeitung", "Processing", "<p>Wir produzieren deine Bestellung.</p>", "<p>We are processing your order.</p>"),
      body_text: "Order processing",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_ORDER_STATUS_SHIPPED",
      name: "Kubikart - Order Status Shipped",
      subject: "Versandt {{order_number}} | Shipped {{order_number}}",
      category: "order_status_shipped",
      body_html: templateShell(
        "Bestellung versandt",
        "Order shipped",
        '<p>Tracking: <a href="{{tracking_url}}">{{tracking_url}}</a></p>',
        '<p>Tracking: <a href="{{tracking_url}}">{{tracking_url}}</a></p>',
      ),
      body_text: "Order shipped tracking {{tracking_url}}",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_ORDER_STATUS_DELIVERED",
      name: "Kubikart - Order Status Delivered",
      subject: "Zugestellt {{order_number}} | Delivered {{order_number}}",
      category: "order_status_delivered",
      body_html: templateShell("Bestellung zugestellt", "Order delivered", "<p>Viel Freude mit deinem Produkt.</p>", "<p>Enjoy your product.</p>"),
      body_text: "Order delivered",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_ORDER_STATUS_FAILED",
      name: "Kubikart - Order Status Failed",
      subject: "Zahlung fehlgeschlagen {{order_number}} | Payment failed {{order_number}}",
      category: "order_status_failed",
      body_html: templateShell("Zahlung fehlgeschlagen", "Payment failed", "<p>Bitte versuche die Zahlung erneut.</p>", "<p>Please retry payment.</p>"),
      body_text: "Payment failed",
    },
    {
      envKey: "MAILTRAP_TEMPLATE_ORDER_STATUS_REFUNDED",
      name: "Kubikart - Order Status Refunded",
      subject: "Erstattung {{order_number}} | Refund {{order_number}}",
      category: "order_status_refunded",
      body_html: templateShell(
        "Erstattung bestaetigt",
        "Refund confirmed",
        "<p>Die Erstattung wurde verarbeitet.</p>",
        "<p>Your refund has been processed.</p>",
      ),
      body_text: "Refund processed",
    },
  ];
}

async function main() {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath}`);
  }

  let envContent = fs.readFileSync(envPath, "utf8");
  const env = parseEnv(envContent);
  const token = env.MAILTRAP_TOKEN || env.MAILTRAP_API_KEY;

  if (!token) {
    throw new Error("MAILTRAP_TOKEN or MAILTRAP_API_KEY is required in .env.local");
  }

  let accountId = Number.parseInt(env.MAILTRAP_ACCOUNT_ID || "", 10);

  if (!Number.isFinite(accountId)) {
    const accounts = await fetchAccounts(token);
    if (!accounts.length) {
      throw new Error("No Mailtrap accounts available for this token");
    }
    accountId = accounts[0].id;
    envContent = setEnvValue(envContent, "MAILTRAP_ACCOUNT_ID", accountId);
  }

  const client = new MailtrapClient({ token, accountId });
  const existing = await client.templates.getList();
  const byName = new Map(existing.map((t) => [t.name, t]));

  const templates = buildTemplates();

  for (const tpl of templates) {
    const match = byName.get(tpl.name);
    let created;
    if (match) {
      created = await client.templates.update(match.id, {
        name: tpl.name,
        subject: tpl.subject,
        category: tpl.category,
        body_html: tpl.body_html,
        body_text: tpl.body_text,
      });
      console.log(`Updated: ${tpl.name} -> ${created.uuid}`);
    } else {
      created = await client.templates.create({
        name: tpl.name,
        subject: tpl.subject,
        category: tpl.category,
        body_html: tpl.body_html,
        body_text: tpl.body_text,
      });
      console.log(`Created: ${tpl.name} -> ${created.uuid}`);
    }

    envContent = setEnvValue(envContent, tpl.envKey, created.uuid);
  }

  fs.writeFileSync(envPath, envContent, "utf8");
  console.log("Template UUIDs synced to .env.local");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
