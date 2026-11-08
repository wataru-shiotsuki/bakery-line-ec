const express = require('express');
const Stripe = require('stripe');
const supabase = require('../lib/supabase');

const app = express();
app.post('*', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send('Invalid signature.');
  }
  if (event.type !== 'payment_intent.succeeded') return res.sendStatus(200);
  const payment = event.data.object;
  if (payment.metadata?.giftType !== 'gift' || !payment.metadata?.orderId) {
    return res.sendStatus(200);
  }
  const { error } = await supabase.from('orders').update({ status: 'paid' })
    .eq('id', payment.metadata.orderId)
    .eq('stripe_payment_intent_id', payment.id)
    .eq('amount', payment.amount)
    .eq('status', 'pending');
  if (error) {
    console.error(error);
    return res.sendStatus(500);
  }
  res.sendStatus(200);
});

module.exports = app;
module.exports.config = { api: { bodyParser: false } };
