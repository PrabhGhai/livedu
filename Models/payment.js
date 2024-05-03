const mongoose = require("mongoose");

const payment = new mongoose.Schema(
  {
    razorpay_payment_id: {
      type: String,
    },
    razorpay_order_id: {
      type: String,
    },
    razorpay_signature: {
      type: String,
    },
    amount: {
      type: Number,
    },
    success: {
      type: Boolean,
      default: false,
    },
    paymentBy: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    paymentToTutor: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
    courseEnrolled: {
      type: mongoose.Types.ObjectId,
      ref: "courses",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("payment", payment);
