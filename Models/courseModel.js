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
    courseCreatedBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    studentsEnrolled: [
      {
        type: mongoose.Types.ObjectId,
        ref: "User",
      },
    ],
    reviews: [
      {
        type: mongoose.Types.ObjectId,
        ref: "review",
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("courses", courses);
