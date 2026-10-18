/** node backend/scripts/configure-catalog-skus.cjs [--apply]
 * Dry run by default. SKU-only updates; existing parent and explicit variant SKUs preserved.
 * Translations share a physical-item SKU through Polylang for WooCommerce.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const families = [
  ['milchglasfolie-mit-logo', 'film', 'KA-FILM'],
  ['firmenlogo-fensterbeschriftung', 'vinyl', 'KA-LOGO'],
  ['personalisierte-aufkleber-logo-wunschtext', 'stickers', 'KA-STK'],
  ['laminierte-speisekarten-preislisten', 'menus', 'KA-MENU'],
  ['oeffnungszeiten-aufkleber', 'vinyl', 'KA-HOURS'],
  ['personalisierte-visitenkarten', 'cards', 'KA-BC'],
  ['personalisierter-acryl-aufsteller-qr-code-nfc', 'stand', 'KA-QR-ACR'],
  ['personalisierter-qr-code-aufsteller-nfc', 'stand', 'KA-QR-3D'],
  ['local-shop-window-kit-de', 'bundle', 'KA-BND-WINDOW'],
  ['reception-kit-de', 'bundle', 'KA-BND-RECEPTION'],
  ['barber-salon-kit-de', 'bundle', 'KA-BND-SALON'],
  ['gastro-visibility-kit-de', 'bundle', 'KA-BND-GASTRO'],
  ['starter-visibility-kit-de', 'bundle', 'KA-BND-STARTER'],
  ['bambusbrett-danke-mama', 'gift', 'KA-BAM-MUM'],
  ['bambusbrett-einschulung-name-jahr', 'gift', 'KA-BAM-SCHOOL'],
  ['geschenkglas-nervennahrung-schlaf-geduld', 'jar', 'KA-JAR-PARENTS'],
  ['hochzeitsglas-alles-liebe-namen-datum', 'jar', 'KA-JAR-WED-HEARTS'],
  ['hochzeitsglas-ringe-namen-datum', 'jar', 'KA-JAR-WED-RINGS'],
  ['hochzeitsglas-unser-glueck-beginnt-mit-wir', 'jar', 'KA-JAR-WED-WIR'],
  ['namens-schluesselanhaenger-3d-buchstaben-charms', 'gift', 'KK-PARA-NAME'],
  ['holz-schluesselanhaenger-name-herz', 'gift', 'KK-WOOD-NAME-FB'],
  ['holz-schluesselanhaenger-beruf-mit-herz', 'gift', 'KK-HOLZ-BERUF-40'],
];
function suffix(family, variation) {
  const option = pattern => variation.attributes.find(attribute => pattern.test(attribute.slug || attribute.name))?.option || '';
  const quantity = value => {
    const number = Number.parseInt(value.replace(/[.,]/g, ''), 10);
    assert(Number.isInteger(number) && number > 0, `Unrecognised quantity: ${value}`);
    return 'Q' + String(number).padStart(3, '0');
  };
  const custom = value => /anfragen|request/i.test(value);
  if (family === 'jar') {
    const size = option(/glasvariante/);
    if (/ersatz|replacement/i.test(size)) return 'LID';
    if (/klein|small/i.test(size)) return 'S';
    if (/groß|large/i.test(size)) return 'L';
    assert.fail('Unrecognised jar option');
  }
  if (family === 'vinyl') {
    const size = option(/gesamtbreite/);
    if (custom(size)) return 'CUSTOM';
    const width = Number.parseFloat(size);
    assert([20, 30, 40].includes(width), 'Unrecognised vinyl width');
    return 'W' + width * 10;
  }
  if (family === 'film') {
    const size = option(/folienformat/);
    if (custom(size)) return 'CUSTOM';
    const values = size.match(/(\d+)\s*[×x]\s*(\d+)/);
    assert(values, 'Unrecognised film size');
    return `${Number(values[1]) * 10}X${Number(values[2]) * 10}`;
  }
  if (family === 'cards') {
    const paper = option(/paper/);
    const code = { 'Brown Kraft': 'KRAFT', 'Grass Paper': 'GRASS', 'Cotton White': 'COT-WHT', 'Cotton Jute': 'COT-JUT', 'Cotton Coffee': 'COT-COF' }[paper];
    assert(code, `Unrecognised paper: ${paper}`);
    return `${code}-${quantity(option(/quantity/))}`;
  }
  if (family === 'stickers') {
    const shape = option(/pa_form/);
    const shapeCode = { Rund: 'CIR', Round: 'CIR', Quadratisch: 'SQR', Square: 'SQR', Rechteckig: 'RECT', Rectangle: 'RECT', 'Abgerundetes Rechteck': 'RRECT', 'Rounded rectangle': 'RRECT', Oval: 'OVAL', Freiform: 'CUT', 'Custom contour': 'CUT' }[shape];
    assert(shapeCode, `Unrecognised sticker shape: ${shape}`);
    const numbers = option(/groesse/).match(/\d+/g);
    assert(numbers?.length && numbers.length <= 2, 'Unrecognised sticker size');
    const sizeCode = numbers.length === 1 ? `D${numbers[0].padStart(3, '0')}` : numbers.map(number => number.padStart(3, '0')).join('X');
    return `${shapeCode}-${sizeCode}-${quantity(option(/stueckzahl/))}`;
  }
  assert.equal(family, 'menus');
  const format = option(/druckformat/);
  const formatCode = custom(format) ? 'CUSTOM' : format.match(/A[345]/)?.[0];
  const qty = option(/kartenanzahl/);
  const sides = option(/druckseiten/);
  const sideCode = /einseitig|single/i.test(sides) ? '1S' : /beidseitig|double/i.test(sides) ? '2S' : null;
  const design = option(/gestaltung/);
  const designCode = /eigene|own artwork/i.test(design) ? 'ART' : /layout/i.test(design) ? 'LAYOUT' : null;
  assert(formatCode && sideCode && designCode, 'Unrecognised menu options');
  return `${formatCode}-${custom(qty) ? 'QREQ' : quantity(qty)}-${sideCode}-${designCode}`;
}
function protectedState(record) {
  // WooCommerce returns a random, read-only recommendation sample in related_ids.
  // Explicit merchant-controlled upsell_ids/cross_sell_ids remain protected.
  const excluded = new Set(['sku', 'date_modified', 'date_modified_gmt', '_links', 'related_ids']);
  return JSON.stringify(Object.fromEntries(Object.entries(record).filter(([key]) => !excluded.has(key))));
}
async function main() {
  process.loadEnvFile(path.join(root, 'frontend/.env.local'));
  const auth = 'Basic ' + Buffer.from(process.env.WC_CONSUMER_KEY + ':' + process.env.WC_CONSUMER_SECRET).toString('base64');
  async function request(endpoint, method = 'GET', body) {
    const response = await fetch(process.env.WC_API_URL + '/' + endpoint, {
      method, headers: { Authorization: auth, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error(`${method} ${endpoint}: HTTP ${response.status}`);
    return response.json();
  }
  async function list(endpoint, params = {}) {
    const records = [];
    for (let page = 1; ; page++) {
      const batch = await request(endpoint + '?' + new URLSearchParams({ ...params, per_page: '100', page: String(page) }));
      records.push(...batch);
      if (batch.length < 100) return records;
    }
  }
  const products = await list('products', { lang: 'all', status: 'any' });
  const snapshots = [];
  for (const product of products) snapshots.push({ product, variations: product.type === 'variable' ? await list(`products/${product.id}/variations`) : [] });
  const byId = new Map(snapshots.map(snapshot => [snapshot.product.id, snapshot]));
  const plan = [];
  for (const [slug, family, fallback] of families) {
    const de = snapshots.find(snapshot => snapshot.product.slug === slug);
    // The Etsy draft families may not exist yet when preparing a fresh environment.
    if (!de && ['gift', 'jar'].includes(family)) continue;
    assert(de, `Missing product ${slug}`);
    const en = byId.get(Number(de.product.translations?.en));
    assert(en && en !== de, `Missing English translation ${slug}`);
    const existing = [de.product.sku, en.product.sku].filter(Boolean);
    assert(new Set(existing).size <= 1, `Conflicting existing translated parent SKUs: ${slug}`);
    const parentSku = existing[0] || fallback;
    for (const snapshot of [de, en]) plan.push({ endpoint: `products/${snapshot.product.id}`, before: snapshot.product, sku: parentSku, group: `product:${de.product.id}` });
    assert.equal(de.variations.length, en.variations.length, `Variation counts differ: ${slug}`);
    const matchedEnglish = new Set();
    for (const variant of de.variations) {
      const translated = en.variations.find(item => item.id === Number(variant.translations?.en));
      assert(translated && !matchedEnglish.has(translated.id), `Missing/duplicate variation translation ${variant.id}`);
      matchedEnglish.add(translated.id);
      const code = suffix(family, variant);
      assert.equal(suffix(family, translated), code, `Translated options differ: ${variant.id}`);
      // The REST API returns the parent's SKU for a variation with no explicit SKU.
      const own = [[variant, de.product], [translated, en.product]].map(([v, p]) => v.sku && v.sku !== p.sku ? v.sku : '').filter(Boolean);
      assert(new Set(own).size <= 1, `Conflicting existing variation SKUs: ${variant.id}`);
      const sku = own[0] || `${parentSku}-${code}`;
      for (const [v, parent] of [[variant, de.product], [translated, en.product]]) {
        plan.push({ endpoint: `products/${parent.id}/variations/${v.id}`, before: v, sku, group: `variation:${variant.id}` });
      }
    }
  }
  assert.equal(plan.length, snapshots.reduce((n, snapshot) => n + 1 + snapshot.variations.length, 0), 'Catalog contains unmapped products; refusing partial update');
  const groups = new Map();
  for (const row of plan) {
    const key = row.sku.toLowerCase();
    assert(!groups.has(key) || groups.get(key) === row.group, `SKU collision: ${row.sku}`);
    groups.set(key, row.group);
  }
  const changed = plan.filter(row => row.before.sku !== row.sku);
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', products: snapshots.length, records: plan.length, changed: changed.length, physicalSkus: groups.size, examples: plan.filter(row => row.endpoint.split('/').length === 2).map(row => ({ id: row.before.id, sku: row.sku })) }, null, 2));
  if (!process.argv.includes('--apply') || !changed.length) return;
  const backupDir = path.join(root, 'backend/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `catalog-skus-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backup, JSON.stringify({ snapshots, plan: plan.map(({ endpoint, sku, group, before }) => ({ endpoint, sku, group, previousSku: before.sku })) }, null, 2), { mode: 0o600, flag: 'wx' });
  console.log('Backup: ' + backup);
  for (const snapshot of snapshots) {
    const endpoint = `products/${snapshot.product.id}`;
    const parent = changed.find(row => row.endpoint === endpoint);
    if (parent) await request(endpoint, 'PUT', { sku: parent.sku });
    const children = changed.filter(row => row.endpoint.startsWith(endpoint + '/variations/'));
    for (let offset = 0; offset < children.length; offset += 100) {
      const batch = children.slice(offset, offset + 100);
      const result = await request(endpoint + '/variations/batch', 'POST', { update: batch.map(row => ({ id: row.before.id, sku: row.sku })) });
      assert(result.update?.length === batch.length && result.update.every(row => !row.error), 'Variation batch failed; inspect backup before retrying');
    }
    console.log(`Saved SKUs: product ${snapshot.product.id}`);
  }
  const after = new Map();
  for (const product of await list('products', { lang: 'all', status: 'any' })) {
    after.set(`products/${product.id}`, product);
    if (product.type === 'variable') for (const v of await list(`products/${product.id}/variations`)) after.set(`products/${product.id}/variations/${v.id}`, v);
  }
  for (const row of plan) {
    const record = after.get(row.endpoint);
    assert.equal(record?.sku, row.sku, `SKU mismatch: ${row.endpoint}`);
    assert.equal(protectedState(record), protectedState(row.before), `Non-SKU data changed: ${row.endpoint}`);
  }
  console.log(JSON.stringify({ verified: plan.length, physicalSkus: groups.size, nonSkuDataUnchanged: true }));
}
module.exports = { suffix, protectedState };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
