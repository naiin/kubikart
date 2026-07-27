const fs = require("fs");
const https = require("https");

const envPath = require("path").join(__dirname, "..", ".env.local");

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const token = env.MAILTRAP_TOKEN || env.MAILTRAP_API_KEY;
if (!token) {
  console.error("NO_TOKEN");
  process.exit(1);
}

const req = https.request("https://mailtrap.io/api/accounts", { headers: { Authorization: `Bearer ${token}` } }, (res) => {
  let body = "";
  res.on("data", (chunk) => {
    body += chunk;
  });
  res.on("end", () => {
    console.log("STATUS", res.statusCode);
    console.log(body);
  });
});

req.on("error", (err) => {
  console.error("ERR", err.message);
  process.exit(1);
});

req.end();
