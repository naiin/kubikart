/**
 * Owner-approved planning estimates, NOT measured product specifications.
 * node backend/scripts/estimate-shipping-dimensions.cjs [--apply]
 * Reads frontend/.env.local. Dry run by default; snapshots before any write.
 * Does not change weights, pricing, stock, attributes or personalization.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
process.loadEnvFile(path.join(root, 'frontend/.env.local'));
const base = process.env.WC_API_URL;
const authorization = 'Basic ' + Buffer.from(process.env.WC_CONSUMER_KEY + ':' + process.env.WC_CONSUMER_SECRET).toString('base64');
const marker = '_kubikart_shipping_dimensions_estimate';
const families = [
  ['milchglasfolie-mit-logo', 'film', [44, 10, 10]],
  ['firmenlogo-fensterbeschriftung', 'vinyl', [44, 10, 10]],
  ['personalisierte-aufkleber-logo-wunschtext', 'stickers', [45, 33, 4]],
  ['laminierte-speisekarten-preislisten', 'menus', [45, 33, 5]],
  ['oeffnungszeiten-aufkleber', 'vinyl', [44, 10, 10]],
  ['personalisierte-visitenkarten', 'cards', [12, 9, 7]],
  ['personalisierter-acryl-aufsteller-qr-code-nfc', 'stand', [30, 24, 6]],
  ['personalisierter-qr-code-aufsteller-nfc', 'stand', [30, 24, 6]],
];
const notes = {
  stand: 'Flat-packed stand, maximum face 24 x 18 cm; separate protected base, rigid padded box. Assumed outer size, unmeasured.',
  vinyl: 'Roll around a core, axis along selected width; 4 cm end allowance, assumed 10 x 10 cm rectangular outer cross-section. Unmeasured.',
  film: 'Roll along shorter film dimension; 4 cm end allowance, assumed 10 x 10 cm rectangular outer cross-section. Unmeasured.',
  menus: 'Flat rigid mailer; allowance for laminate border and packing. Assumed height 3/4/5 cm for 1/5/10 cards. Unmeasured.',
  cards: 'Rigid small box; assumed outer size 12 x 9 x 4 cm (50) or 12 x 9 x 7 cm (100). Unmeasured; all papers share estimate.',
  stickers: 'Conservative A3 flat-sheet mailer assumption for all sticker packs, 45 x 33 x 4 cm. Delivery format and weight unverified.',
};
async function request(endpoint, method = 'GET', body) {
  const response = await fetch(base + '/' + endpoint, {
    method, headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error(`${method} ${endpoint}: HTTP ${response.status}`);
  return response.json();
}
async function list(endpoint, params = {}) {
  const rows = [];
  for (let page = 1; ; page++) {
    const batch = await request(endpoint + '?' + new URLSearchParams({ ...params, per_page: '100', page: String(page) }));
    rows.push(...batch);
    if (batch.length < 100) return rows;
  }
}
function dimensions(values) {
  assert(values.every(value => Number.isFinite(value) && value > 0));
  return Object.fromEntries(['length', 'width', 'height'].map((key, index) => [key, String(values[index])]));
}
function estimateVariation(family, variation) {
  if (!variation.price || Number(variation.price) <= 0) return null; // Custom size/quantity/layout quotes have no fixed parcel.
  const attributes = variation.attributes;
  const option = pattern => attributes.find(attribute => pattern.test(attribute.slug || attribute.name))?.option || '';
  if (family === 'vinyl') {
    const width = Number.parseFloat(option(/gesamtbreite/));
    assert([20, 30, 40].includes(width), 'Unrecognised vinyl width');
    return [width + 4, 10, 10];
  }
  if (family === 'film') {
    const match = option(/folienformat/).match(/(\d+)\s*[×x]\s*(\d+)/);
    assert(match, 'Unrecognised film size');
    return [Math.min(Number(match[1]), Number(match[2])) + 4, 10, 10];
  }
  if (family === 'menus') {
    const format = option(/druckformat/).match(/A[345]/)?.[0];
    const quantity = Number.parseInt(option(/kartenanzahl/), 10);
    assert(format && [1, 5, 10].includes(quantity), 'Unrecognised menu pack');
    return [...{ A5: [24, 18], A4: [33, 24], A3: [45, 33] }[format], { 1: 3, 5: 4, 10: 5 }[quantity]];
  }
  if (family === 'cards') {
    const quantity = Number(option(/quantity|st.ckzahl/));
    assert([50, 100].includes(quantity), 'Unrecognised business-card pack');
    return [12, 9, quantity === 50 ? 4 : 7];
  }
  assert.equal(family, 'stickers');
  return [45, 33, 4];
}
function protectedState(record) {
  return JSON.stringify({
    name: record.name, slug: record.slug, status: record.status, sku: record.sku,
    weight: record.weight, attributes: record.attributes, default_attributes: record.default_attributes,
    price: record.price, regular_price: record.regular_price, sale_price: record.sale_price,
    stock_status: record.stock_status, stock_quantity: record.stock_quantity, manage_stock: record.manage_stock,
    description: record.description, short_description: record.short_description,
    image: record.image, images: record.images, categories: record.categories,
    meta_data: record.meta_data.filter(meta => meta.key !== marker),
  });
}
async function main() {
  assert.equal((await request('settings/products/woocommerce_dimension_unit')).value, 'cm');
  const all = await list('products', { lang: 'all', status: 'any' });
  const plan = [];
  const snapshots = [];
  for (const [slug, family, maximum] of families) {
    const german = all.find(product => product.slug === slug);
    assert(german, `Missing German product ${slug}`);
    const english = all.find(product => product.id === Number(german.translations?.en));
    assert(english && english.id !== german.id, `Missing English translation ${slug}`);
    for (const product of [german, english]) {
      assert(!/bundle/i.test(product.name), 'Refusing to update bundle');
      assert(!product.categories.some(category => /business-kits/.test(category.slug)), 'Refusing to update kit');
      const variations = product.type === 'variable' ? await list(`products/${product.id}/variations`) : [];
      snapshots.push({ product, variations });
      const provenance = { version: 1, unit: 'cm', basis: 'owner-approved-estimate', family, note: notes[family] };
      plan.push({ endpoint: `products/${product.id}`, before: product, patch: {
        dimensions: dimensions(maximum), meta_data: [{ key: marker, value: { ...provenance, scope: 'maximum-standard-pack' } }],
      } });
      for (const variation of variations) {
        const estimate = estimateVariation(family, variation);
        plan.push({ endpoint: `products/${product.id}/variations/${variation.id}`, before: variation, patch: {
          // Empty variation fields inherit the parent in WooCommerce. These quote options cannot be purchased.
          dimensions: estimate ? dimensions(estimate) : { length: '', width: '', height: '' },
          meta_data: [{ key: marker, value: { ...provenance, scope: estimate ? 'standard-pack' : 'quote-required-no-fixed-package' } }],
        } });
      }
    }
  }
  const summary = plan.map(row => ({ endpoint: row.endpoint, dimensions: row.patch.dimensions, scope: row.patch.meta_data[0].value.scope }));
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({ mode: 'dry-run', products: snapshots.length, records: plan.length, plan: summary }, null, 2));
    return;
  }
  const backupDir = path.join(root, 'backend/backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backup = path.join(backupDir, `shipping-dimensions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(backup, JSON.stringify({ capturedAt: new Date().toISOString(), snapshots, plan: summary }, null, 2), { mode: 0o600, flag: 'wx' });
  console.log('Backup: ' + backup);
  let updated = 0;
  for (const snapshot of snapshots) {
    const endpoint = `products/${snapshot.product.id}`;
    const parent = plan.find(row => row.endpoint === endpoint);
    await request(endpoint, 'PUT', parent.patch);
    updated++;
    const children = plan.filter(row => row.endpoint.startsWith(endpoint + '/variations/'));
    for (let offset = 0; offset < children.length; offset += 100) {
      const batch = children.slice(offset, offset + 100);
      const result = await request(endpoint + '/variations/batch', 'POST', {
        update: batch.map(row => ({ id: row.before.id, ...row.patch })),
      });
      assert(result.update?.length === batch.length && result.update.every(row => !row.error), 'Variation batch failed; inspect backup before retrying');
      updated += batch.length;
    }
    console.log(`Updated product ${snapshot.product.id}, ${children.length} variations`);
  }
  // Re-read after both translations are saved, so translation synchronization cannot hide a mismatch.
  const catalogAfter = await list('products', { lang: 'all', status: 'any' });
  const afterByEndpoint = new Map(catalogAfter.map(product => [`products/${product.id}`, product]));
  for (const snapshot of snapshots) {
    if (snapshot.product.type !== 'variable') continue;
    for (const variation of await list(`products/${snapshot.product.id}/variations`)) {
      afterByEndpoint.set(`products/${snapshot.product.id}/variations/${variation.id}`, variation);
    }
  }
  for (const row of plan) {
    const after = afterByEndpoint.get(row.endpoint);
    assert(after, `Record missing after update: ${row.endpoint}`);
    if (row.patch.meta_data[0].value.scope !== 'quote-required-no-fixed-package') assert.deepEqual(after.dimensions, row.patch.dimensions);
    assert.deepEqual(after.meta_data.find(meta => meta.key === marker)?.value, row.patch.meta_data[0].value);
    assert.equal(protectedState(after), protectedState(row.before), `Unrelated data changed at ${row.endpoint}`);
  }
  // Bundles and any catalog records outside the allowlist must retain dimensions and weights.
  const touched = new Set(snapshots.map(snapshot => snapshot.product.id));
  for (const product of catalogAfter) {
    if (touched.has(product.id)) continue;
    const before = all.find(item => item.id === product.id);
    if (before) {
      assert.deepEqual(product.dimensions, before.dimensions);
      assert.equal(product.weight, before.weight);
    }
  }
  console.log(JSON.stringify({ mode: 'apply', updated, products: snapshots.length, verified: plan.length, bundlesUnchanged: true }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
