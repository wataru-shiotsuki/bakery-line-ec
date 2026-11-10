const express = require('express');
const path = require('path');
const crypto = require('crypto');
const Stripe = require('stripe');
const QRCode = require('qrcode');
const supabase = require('../lib/supabase');

const app = express();
app.use(express.json({ limit: '16kb' }));
const publicDir = path.join(__dirname, '..', 'public');
const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY);

function todayInTokyo() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value &&
    value >= todayInTokyo();
}

function errorResponse(res, error) {
  console.error(error);
  return res.status(500).json({ error: 'Please try again.' });
}

app.get('/api/config', (req, res) => {
  res.json({ stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

app.get('/api/products', async (req, res) => {
  const { data, error } = await supabase.from('products')
    .select('id,name,description,amount').eq('is_active', true).order('id');
  if (error) return errorResponse(res, error);
  res.json(data || []);
});

app.post('/api/orders', async (req, res) => {
  const { productId, pickupDate, orderPurpose: requestedPurpose } = req.body || {};
  const orderPurpose = requestedPurpose === undefined ? 'self' : requestedPurpose;
  if (typeof productId !== 'string' || !validDate(pickupDate) ||
      !['self', 'gift'].includes(orderPurpose)) {
    return res.status(400).json({ error: 'Select a product, pickup date and purpose.' });
  }
  const { data: product, error: productError } = await supabase.from('products')
    .select('id,name,amount').eq('id', productId).eq('is_active', true).maybeSingle();
  if (productError) return errorResponse(res, productError);
  if (!product || !Number.isSafeInteger(product.amount) || product.amount < 50) {
    return res.status(400).json({ error: 'Product unavailable.' });
  }
  const id = crypto.randomUUID();
  const accessToken = crypto.randomUUID();
  const qrToken = crypto.randomUUID();
  let payment;
  try {
    payment = await stripe().paymentIntents.create({
      amount: product.amount,
      currency: 'jpy',
      automatic_payment_methods: { enabled: true },
      metadata: { orderPurpose, orderId: id }
    });
    const { error } = await supabase.from('orders').insert({
      id,
      product_id: product.id,
      product_name: product.name,
      amount: product.amount,
      pickup_date: pickupDate,
      order_purpose: orderPurpose,
      access_token: accessToken,
      qr_token: qrToken,
      stripe_payment_intent_id: payment.id
    });
    if (error) throw error;
    res.status(201).json({ orderToken: accessToken, clientSecret: payment.client_secret });
  } catch (error) {
    if (payment) {
      try { await stripe().paymentIntents.cancel(payment.id); } catch (cancelError) { console.error(cancelError); }
    }
    return errorResponse(res, error);
  }
});

app.get('/api/orders/:token', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!/^[0-9a-f-]{36}$/i.test(req.params.token)) return res.sendStatus(404);
  const { data: order, error } = await supabase.from('orders')
    .select('product_name,amount,pickup_date,status,qr_token')
    .eq('access_token', req.params.token).maybeSingle();
  if (error) return errorResponse(res, error);
  if (!order) return res.sendStatus(404);
  const result = {
    productName: order.product_name,
    amount: order.amount,
    pickupDate: order.pickup_date,
    status: order.status
  };
  if (order.status === 'paid' || order.status === 'picked_up') {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) return res.status(500).json({ error: 'BASE_URL is missing.' });
    result.qr = await QRCode.toDataURL(
      new URL('/verify?token=' + encodeURIComponent(order.qr_token), baseUrl).toString()
    );
  }
  res.json(result);
});

app.get('/api/pickups/:token', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!/^[0-9a-f-]{36}$/i.test(req.params.token)) return res.sendStatus(404);
  const { data, error } = await supabase.from('orders')
    .select('product_name,pickup_date,status').eq('qr_token', req.params.token).maybeSingle();
  if (error) return errorResponse(res, error);
  if (!data) return res.sendStatus(404);
  res.json({ productName: data.product_name, pickupDate: data.pickup_date, status: data.status });
});

app.post('/api/pickups/:token/confirm', async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.token)) return res.sendStatus(404);
  const pin = String((req.body || {}).pin || '');
  const expected = process.env.STAFF_PIN || '';
  if (!expected || pin.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(pin), Buffer.from(expected))) {
    return res.status(403).json({ error: 'Invalid staff PIN.' });
  }
  const { data, error } = await supabase.from('orders')
    .update({ status: 'picked_up', picked_up_at: new Date().toISOString() })
    .eq('qr_token', req.params.token).eq('status', 'paid')
    .eq('pickup_date', todayInTokyo()).select('id').maybeSingle();
  if (error) return errorResponse(res, error);
  if (!data) return res.status(409).json({ error: 'Order is not ready for pickup on this date.' });
  res.json({ status: 'picked_up' });
});

app.use(express.static(publicDir));
app.get('/verify', (req, res) => res.sendFile(path.join(publicDir, 'verify.html')));
app.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));

module.exports = app;
