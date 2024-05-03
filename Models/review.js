const mongoose = require("mongoose");

const review = new mongoose.Schema(
  {
    rating: {
      type: Number,
    },
    comment: {
      type: String,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("review", review);
