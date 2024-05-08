const mongoose = require("mongoose");

const user = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
    },
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/dmdv1pt2f/image/upload/v1710082142/person_tg31jl.png",
    },
    role: {
      type: String,
      default: "student",
      enum: ["student", "tutor", "admin"],
    },
    stausOfPage: {
      type: String,
      default: "none",
      enum: ["none", "in progress", "verified"],
    },
    followers: {
      type: Number,
      default: 0,
    },
    todo: [
      {
        type: mongoose.Types.ObjectId,
        ref: "todo",
      },
    ],
    coursesEnrolled: [
      {
        type: mongoose.Types.ObjectId,
        ref: "courses",
      },
    ],
    favouriteCourses: [
      {
        type: mongoose.Types.ObjectId,
        ref: "courses",
      },
    ],
    coursesCreated: [
      {
        type: mongoose.Types.ObjectId,
        ref: "courses",
      },
    ],
    earning: {
      type: Number,
      default: 0,
    },
    bankDetails: {
      type: mongoose.Types.ObjectId,
      ref: "bankdetails",
    },
    withdrawlRequests: [
      {
        type: mongoose.Types.ObjectId,
        ref: "withdraw",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", user);
