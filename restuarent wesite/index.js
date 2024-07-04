const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
const stripe = Stripe('your-stripe-secret-key');

app.use(cors());
app.use(bodyParser.json());

app.post('/order-confirmation', async (req, res) => {
  const { paymentIntentId, action, totalAmount, serviceCharge } = req.body;

  if (!paymentIntentId || !action || !totalAmount || !serviceCharge) {
    return res.status(400).send('Missing required fields');
  }

  try {
    if (action === 'accept') {
      // Confirm the payment intent
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId);

      // Transfer the respective amounts to the owner's accounts
      const transfer1 = await stripe.transfers.create({
        amount: (totalAmount - serviceCharge) * 100,
        currency: 'usd',
        destination: 'owner_main_account_id',
      });

      const transfer2 = await stripe.transfers.create({
        amount: serviceCharge * 100,
        currency: 'usd',
        destination: 'owner_service_account_id',
      });

      return res.send('Order accepted and payments transferred');
    } else if (action === 'decline') {
      // Cancel the payment intent
      const cancellation = await stripe.paymentIntents.cancel(paymentIntentId);

      return res.send('Order declined and payment refunded');
    }
  } catch (error) {
    return res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
