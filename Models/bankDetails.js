const mongoose = require("mongoose");

const bankDetails = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  fullName: {
    type: String,
  },
  accountNumber: {
    type: String,
  },
  nameOfBank: {
    type: String,
  },
  ifsc: {
    type: String,
  },
});
module.exports = mongoose.model("bankdetails", bankDetails);
