const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const { NewDATA } = require("./model");
const stripe = require("stripe")(
  "sk_test_51P3c0JSAfVC4YVUYV1FtgetBWLpXkNkoqDnfT62VXwsQYSZDn0BsFfGwiuqCd15MZXVcXpOgWeLollKp6e4f8Hum00g5Y5f39i"
);
const mongoose = require("mongoose");

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
    // Create a checkout session using the payment intent
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
      // payment_intent_data: {
      //   application_fee_amount: req.body.applicationFee * 100, // Application fee in cents
      //   transfer_data: {
      //     destination: req.body.transferDestination, // Destination for the transfer
      //   },
      // },
    });
    console.log(session, "step2", paymentIntent);
    res.json({ session: session, paymentIntent: paymentIntent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const bodyParser = require("body-parser");

app.post("/webhook", bodyParser.json(), async (request, response) => {
  const payload = request.body;
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
    const newdata = new NewDATA(event);
    const data = await newdata.save();
    console.log(data, "Got payload: ");
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log("Got payload: ", payload, event);

  response.status(200).end();
});

app.listen(8000, () => console.log("Running on port 8000"));
