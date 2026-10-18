const { test } = require('node:test');
const assert = require('node:assert/strict');
const { suffix, protectedState } = require('../scripts/configure-catalog-skus.cjs');
const variation = options => ({ attributes: Object.entries(options).map(([slug, option]) => ({ slug, option })) });

test('sticker quantity handles German and English thousands separators', () => {
  for (const [shape, size, qty] of [['Quadratisch', '25 × 25 mm', '1.080 Stück'], ['Square', '25 × 25 mm', '1,080 pcs']]) {
    assert.equal(suffix('stickers', variation({ pa_form: shape, pa_groesse: size, pa_stueckzahl: qty })), 'SQR-025X025-Q1080');
  }
});
test('sticker shape and diameter distinguish otherwise identical packs', () => {
  assert.equal(suffix('stickers', variation({ pa_form: 'Round', pa_groesse: 'Ø 25 mm', pa_stueckzahl: '48 pcs' })), 'CIR-D025-Q048');
  assert.equal(suffix('stickers', variation({ pa_form: 'Custom contour', pa_groesse: 'within 80 × 50 mm', pa_stueckzahl: '180 pcs' })), 'CUT-080X050-Q180');
});
test('business cards encode paper and pack count', () => {
  assert.equal(suffix('cards', variation({ 'paper-papier': 'Cotton Coffee', 'quantity-stuckzahl': '100' })), 'COT-COF-Q100');
  assert.equal(suffix('cards', variation({ 'paper-papier': 'Brown Kraft', 'quantity-stuckzahl': '50' })), 'KRAFT-Q050');
});
test('jar option codes match across translated sizes and distinguish lid-only orders', () => {
  for (const label of ['Klein – 530 ml', 'Small – 530 ml']) assert.equal(suffix('jar',variation({pa_glasvariante:label})),'S');
  for (const label of ['Groß – 880 ml', 'Large – 880 ml']) assert.equal(suffix('jar',variation({pa_glasvariante:label})),'L');
  for (const label of ['Nur Ersatzdeckel', 'Replacement lid only']) assert.equal(suffix('jar',variation({pa_glasvariante:label})),'LID');
});
test('vinyl uses millimetres, with translated enquiry options matching', () => {
  assert.equal(suffix('vinyl', variation({ pa_gesamtbreite: '30 cm' })), 'W300');
  for (const label of ['Wunschmaß anfragen', 'Request custom size']) assert.equal(suffix('vinyl', variation({ pa_gesamtbreite: label })), 'CUSTOM');
});
test('frosted-film code uses strip dimensions rather than logo bounding box', () => {
  assert.equal(suffix('film', variation({ pa_folienformat: '120 × 40 cm · Logo bis 40 × 30 cm' })), '1200X400');
});
test('menu code distinguishes size, quantity, printed sides and design service', () => {
  assert.equal(suffix('menus', variation({ pa_druckformat: 'A3 – 29.7 × 42 cm', pa_kartenanzahl: '10 pieces', pa_druckseiten: 'Double-sided', pa_gestaltung: 'Own artwork' })), 'A3-Q010-2S-ART');
  assert.equal(suffix('menus', variation({ pa_druckformat: 'A3 – 29,7 × 42 cm', pa_kartenanzahl: 'Größere Menge anfragen', pa_druckseiten: 'Einseitig bedruckt', pa_gestaltung: 'Layoutservice anfragen' })), 'A3-QREQ-1S-LAYOUT');
});
test('unknown specifications stop the migration instead of producing a misleading SKU', () => {
  assert.throws(() => suffix('cards', variation({ 'paper-papier': 'Unknown paper', 'quantity-stuckzahl': '50' })));
  assert.throws(() => suffix('vinyl', variation({ pa_gesamtbreite: 'unknown' })));
});
test('verification ignores sampled recommendations but protects merchant relationships and commercial data', () => {
  const before = { sku: '', related_ids: [1, 2], upsell_ids: [3], price: '5', dimensions: { length: '20' } };
  assert.equal(protectedState(before), protectedState({ ...before, sku: 'KA-TEST', related_ids: [4, 5] }));
  assert.notEqual(protectedState(before), protectedState({ ...before, upsell_ids: [9] }));
  assert.notEqual(protectedState(before), protectedState({ ...before, price: '6' }));
});
