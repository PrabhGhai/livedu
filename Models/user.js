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
    resume: {
      type: String,
    },

    ytChannel: {
      type: String,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", user);
