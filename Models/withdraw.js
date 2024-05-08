const mongoose = require("mongoose");
const withdraw = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "User" },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      default: "Processing",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("withdraw", withdraw);
