const router = require("express").Router();
const Course = require("../Models/courseModel");
const User = require("../Models/user");

router.get("/search/:keyword", async (req, res) => {
  try {
    const { keyword } = req.params;
    const tutors = await User.find({
      role: "tutor",
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    }).select("username email desc avatar");

    // Search for courses with title/description matching the keyword
    const courses = await Course.find({
      $or: [
        { title: { $regex: keyword, $options: "i" } }, // Case-insensitive regex search on title
        { desc: { $regex: keyword, $options: "i" } }, // Case-insensitive regex search on description
      ],
    })
      .populate("reviews")
      .populate("courseCreatedBy", "username"); // Populate the courseCreatedBy field with the tutor's username
    return res.status(200).json({ courses: courses, tutor: tutors });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
