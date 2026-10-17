import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
const configure = process.argv.includes("--configure");
if (!configure && !process.argv.includes("--check")) {
  throw new Error("Use --check to inspect transport, or --configure to apply the server-side Mailtrap configuration.");
}
const required = ["NEXT_PUBLIC_WORDPRESS_URL", "WP_APP_USER", "WP_APP_PASSWORD", ...(configure ? ["MAILTRAP_TOKEN"] : [])];
for (const key of required) if (!process.env[key]) throw new Error(`Missing ${key}`);
const response = await fetch(`${process.env.NEXT_PUBLIC_WORDPRESS_URL.replace(/\/+$/, "")}/wp-json/kubikart/v1/mail-transport`, {
  method: configure ? "POST" : "GET",
  headers: {
    Authorization: `Basic ${Buffer.from(`${process.env.WP_APP_USER}:${process.env.WP_APP_PASSWORD}`).toString("base64")}`,
    "Content-Type": "application/json",
  },
  ...(configure ? { body: JSON.stringify({ token: process.env.MAILTRAP_TOKEN, from: process.env.MAIL_FROM_EMAIL || "noreply@kubikart.de", owner: process.env.ENQUIRY_OWNER_EMAIL || "info@kubikart.de", name: process.env.MAIL_FROM_NAME || "Kubikart Team" }) } : {}),
  signal: AbortSignal.timeout(15_000),
});
if (!response.ok) throw new Error(`WordPress transport request failed (${response.status}). Check the mu-plugin and integration permissions.`);
const state = await response.json();
console.log(JSON.stringify({ configured: state.configured, from: state.from, owner: state.owner, last_accepted: state.last_accepted }, null, 2));
