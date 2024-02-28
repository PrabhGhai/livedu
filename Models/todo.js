const mongoose = require("mongoose");

const todo = new mongoose.Schema(
  {
    desc: {
      type: String,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("todo", todo);
