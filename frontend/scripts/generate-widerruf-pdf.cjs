const fs = require("fs");
const path = require("path");

function escapePdfText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function buildSimplePdf(lines) {
  const chunks = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const pageLines = lines.slice(lineIndex, lineIndex + 36);
    lineIndex += 36;

    const parts = ["BT", "/F1 11 Tf", "50 790 Td"];
    pageLines.forEach((line, idx) => {
      if (idx > 0) parts.push("0 -18 Td");
      parts.push(`(${escapePdfText(line)}) Tj`);
    });
    parts.push("ET");
    chunks.push(parts.join("\n"));
  }

  const objects = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  const kids = [];
  for (let i = 0; i < chunks.length; i += 1) {
    const pageObj = 3 + i * 2;
    kids.push(`${pageObj} 0 R`);
  }
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${chunks.length} >>\nendobj\n`);

  for (let i = 0; i < chunks.length; i += 1) {
    const pageObj = 3 + i * 2;
    const contentObj = 4 + i * 2;
    const fontObj = 3 + chunks.length * 2;
    objects.push(
      `${pageObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObj} 0 R >>\nendobj\n`,
    );
    objects.push(`${contentObj} 0 obj\n<< /Length ${Buffer.byteLength(chunks[i], "utf8")} >>\nstream\n${chunks[i]}\nendstream\nendobj\n`);
  }

  const fontObj = 3 + chunks.length * 2;
  objects.push(`${fontObj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "utf8");
}

const lines = [
  "RUECKGABERECHT - WIDERRUFSBELEHRUNG (KUBIKART)",
  "",
  "Verbraucher haben ein vierzehntaegiges Widerrufsrecht.",
  "",
  "Widerrufsrecht",
  "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gruenden diesen Vertrag zu widerrufen.",
  "Die Widerrufsfrist betraegt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter",
  "Dritter, der nicht der Befoerderer ist, die Waren in Besitz genommen haben bzw. hat.",
  "",
  "Zur Ausuebung des Widerrufsrechts kontaktieren Sie bitte:",
  "Kubikart, Hussnain Raza",
  "Franz-Lehar-Str. 08, 89134 Blaustein, Deutschland",
  "E-Mail: info@kubikart.de",
  "",
  "Zur Wahrung der Frist reicht es aus, dass Sie die Mitteilung ueber die Ausuebung des",
  "Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
  "",
  "Folgen des Widerrufs",
  "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten",
  "haben, einschliesslich der Lieferkosten (ausser zusaetzliche Kosten durch abweichende Versandart),",
  "unverzueglich und spaetestens binnen vierzehn Tagen zurueckzuzahlen.",
  "Fuer die Rueckzahlung verwenden wir dasselbe Zahlungsmittel wie bei der urspruenglichen Transaktion,",
  "es sei denn, mit Ihnen wurde ausdruecklich etwas anderes vereinbart.",
  "Wir koennen die Rueckzahlung verweigern, bis wir die Waren wieder zurueckerhalten haben oder",
  "bis Sie den Nachweis erbracht haben, dass Sie die Waren zurueckgesandt haben.",
  "Sie haben die Waren spaetestens binnen vierzehn Tagen ab Unterrichtung ueber den Widerruf",
  "an uns zurueckzusenden oder zu uebergeben. Sie tragen die unmittelbaren Kosten der Ruecksendung.",
  "Sie muessen fuer einen etwaigen Wertverlust nur aufkommen, wenn dieser auf einen nicht zur",
  "Pruefung erforderlichen Umgang mit den Waren zurueckzufuehren ist.",
  "",
  "Muster-Widerrufsformular",
  "An Kubikart, Hussnain Raza, Franz-Lehar-Str. 08, 89134 Blaustein, Deutschland, info@kubikart.de",
  "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag ueber den Kauf",
  "der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)",
  "Bestellt am (*)/erhalten am (*)",
  "Name des/der Verbraucher(s), Anschrift des/der Verbraucher(s)",
  "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier), Datum",
  "(*) Unzutreffendes streichen.",
  "",
  "Ausschluss des Widerrufsrechts",
  "Kein Widerrufsrecht bei nicht vorgefertigten, personalisierten Waren, die eindeutig auf",
  "persoenliche Beduerfnisse zugeschnitten sind (z. B. individuelle 3D-Drucke, Lasergravuren).",
];

const outPath = path.join(__dirname, "..", "public", "legal", "widerruf.pdf");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, buildSimplePdf(lines));
console.log(outPath);
