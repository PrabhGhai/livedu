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
      default: "user",
      enum: ["user", "tutor", "admin"],
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
    coursesEnrolled: [],
    coursesCreated: [],
    earning: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", user);
