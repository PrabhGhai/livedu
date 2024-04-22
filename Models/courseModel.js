const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Types.ObjectId,
      ref: "User", // Assuming reviews are written by users
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

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
    reviews: [reviewSchema],
  },
  { timestamps: true }
);
module.exports = mongoose.model("courses", courses);
