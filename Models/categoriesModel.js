const mongoose = require("mongoose");

const categories = new mongoose.Schema({
  title: {
    type: String,
  },
  img: {
    type: String,
  },
  courses: [
    {
      type: mongoose.Types.ObjectId,
      ref: "courses",
    },
  ],
});
module.exports = mongoose.model("categories", categories);
