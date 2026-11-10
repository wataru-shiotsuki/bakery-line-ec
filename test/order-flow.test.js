const test = require('node:test');
const assert = require('node:assert/strict');
const { supportedPaymentPurpose } = require('../lib/order-flow');

test('payment notification accepts both pickup purposes and legacy metadata', () => {
  assert.equal(supportedPaymentPurpose({ orderPurpose: 'self' }), true);
  assert.equal(supportedPaymentPurpose({ orderPurpose: 'gift' }), true);
  assert.equal(supportedPaymentPurpose({ giftType: 'gift' }), true);
  assert.equal(supportedPaymentPurpose({ orderPurpose: 'other' }), false);
  assert.equal(supportedPaymentPurpose({ orderPurpose: 'other', giftType: 'gift' }), false);
  assert.equal(supportedPaymentPurpose({}), false);
});
