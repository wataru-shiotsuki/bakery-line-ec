const express = require('express');
const { validateSignature } = require('@line/bot-sdk');
const lineClient = require('../lib/line');

const app = express();
app.post('*', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-line-signature'];
  const secret = process.env.LINE_CHANNEL_SECRET || '';
  if (!signature || !secret || !validateSignature(req.body, secret, signature)) {
    return res.status(401).send('Invalid signature.');
  }
  let body;
  try {
    body = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).send('Invalid JSON.');
  }
  const url = process.env.BASE_URL || 'https://example.com';
  try {
    for (const event of body.events || []) {
      if (event.type !== 'follow' &&
          !(event.type === 'message' && event.message?.type === 'text')) continue;
      await lineClient.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: 'Welcome to Example Bakery. Order here: ' + url }]
      });
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = app;
module.exports.config = { api: { bodyParser: false } };
