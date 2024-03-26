const mongoose = require("mongoose");

const courses = new mongoose.Schema(
  {
    thumbnail: {
      type: String,
    },
    title: {
      type: String,
    },
    desc: {
      type: String,
    },
    price: {
      type: Number,
      validate: {
        validator: (value) => value > 0,
        message: "Price must be greater than zero",
      },
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: "categories",
    },
    difficulity: {
      type: String,
    },
    benefits: {
      type: String,
    },
    prerequistes: {
      type: String,
    },
    courseContent: [
      [
        {
          sectionTitle: {
            type: String,
          },
          videoTitle: {
            type: String,
          },
          videoDesc: {
            type: String,
          },
          videoLink: {
            type: String,
          },
        },
      ],
    ],
    user: {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("courses", courses);
