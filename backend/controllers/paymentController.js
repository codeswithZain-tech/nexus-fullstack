import Transaction from "../models/Transaction.js";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// @route POST /api/payments/deposit   { amount }  -> creates Stripe PaymentIntent (sandbox)
export const deposit = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount required" });
    }

    let paymentIntentId = null;
    let status = "completed"; // default mock status if Stripe not configured

    if (stripe) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // cents
        currency: "usd",
        payment_method_types: ["card"],
        metadata: { userId: req.user._id.toString(), type: "deposit" },
      });
      paymentIntentId = intent.id;
      status = "pending"; // becomes completed via webhook after client confirms
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type: "deposit",
      amount,
      status,
      stripePaymentIntentId: paymentIntentId,
      description: "Wallet deposit",
    });

    res.status(201).json({
      transaction,
      clientSecret: stripe ? undefined : null, // set if using real Stripe intent.client_secret
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/payments/withdraw   { amount }
export const withdraw = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount required" });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type: "withdraw",
      amount,
      status: "completed", // sandbox: instantly mark completed
      description: "Wallet withdrawal",
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/payments/transfer   { toUser, amount }
export const transfer = async (req, res, next) => {
  try {
    const { toUser, amount } = req.body;
    if (!toUser || !amount || amount <= 0) {
      return res.status(400).json({ message: "toUser and valid amount required" });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type: "transfer",
      amount,
      toUser,
      status: "completed",
      description: "Fund transfer",
    });

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/payments/history
export const getTransactionHistory = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ user: req.user._id }, { toUser: req.user._id }],
    })
      .populate("user", "name email")
      .populate("toUser", "name email")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/payments/webhook  (Stripe webhook - mark deposits completed)
export const stripeWebhook = async (req, res) => {
  if (!stripe) return res.status(200).send("Stripe not configured, skipping");

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    await Transaction.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: "completed" }
    );
  }

  res.json({ received: true });
};
