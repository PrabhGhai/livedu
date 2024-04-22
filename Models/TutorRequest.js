const mongoose = require("mongoose");

const tutorRequests = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    resume: {
      type: String,
    },
    ytLink: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("tutorRequests", tutorRequests);
