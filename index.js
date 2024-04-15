const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const { NewDATA, Cats } = require("./model");
const stripe = require("stripe")(
  "sk_test_51P3c0JSAfVC4YVUYV1FtgetBWLpXkNkoqDnfT62VXwsQYSZDn0BsFfGwiuqCd15MZXVcXpOgWeLollKp6e4f8Hum00g5Y5f39i"
);
const mongoose = require("mongoose");
app.use(express.json());
//mongodb connections
const connectDb = async () => {
  await mongoose.connect(
    "mongodb+srv://farracer71:bXQvazWRGSTUUmoj@nilesh.vslrsaa.mongodb.net/mydb"
  );
  console.log(mongoose.connection.host, "connected");
};
connectDb();
app.use(express.json());
app.use(cors({ origin: "*" }));

app.post("/checkout", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: req.body.totalAmount * 100, // Total amount in unit
      currency: "usd",
      payment_method_types: ["card"],
      description: "Payment for items",
    });
    console.log(paymentIntent, "step1");

    const session = await stripe.checkout.sessions.create({
      billing_address_collection: "required",
      payment_method_types: ["card"],
      mode: "payment",
      line_items: req.body.items.map((item) => {
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.name,
            },
            unit_amount: item.price * 100, // Item price in unit
          },
          quantity: item.quantity,
        };
      }),
      success_url: "http://localhost:3001/success",
      cancel_url: "http://localhost:3001/failed",
    
    });
    console.log(session, "step2", paymentIntent);
    const catsdata = new Cats({ session: session });
    const data = await catsdata.save();
    res.json({ session: session, paymentIntent: paymentIntent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const bodyParser = require("body-parser");

app.post("/webhook", bodyParser.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers["stripe-signature"];
  let event;
  try {
    // Parse the request body as a string
    const rawBody = request.body;
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.SECRET_STRIPE_KEY
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return response.sendStatus(400);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      // Payment success event
      const session = event.data.object;
      // Extract relevant information from the session object
      const paymentIntentId = session.payment_intent;
      const customerId = session.customer;
      const newdata = new NewDATA(session);
      const data = await newdata.save();
      console.log(data, "Got payload: ");
      break;
    default:
      // Unexpected event type
      console.log(`Unhandled event type: ${event.type}`);
  }

  response.sendStatus(200);
});

app.listen(8000, () => console.log("Running on port 8000"));
