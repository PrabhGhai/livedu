const mongoose = require("mongoose");

const todo = new mongoose.Schema(
  {
    desc: {
      type: String,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("todo", todo);
