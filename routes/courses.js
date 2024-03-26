const router = require("express").Router();
const Course = require("../Models/courseModel");
const Category = require("../Models/categoriesModel");
const User = require("../Models/user");
const { authenticateToken } = require("./userAuth");
const multer = require("multer");
const cloudinary = require("../helper/cloudinary");

// Add New Course
const storage = multer.diskStorage({});
const upload = multer({ storage: storage });
router.post(
  "/create-course",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.headers;
      let { Data } = req.body;
      const JsonData = JSON.parse(Data);
      if (!req.file) {
        return res.status(400).json({
          status: "Error",
          message: "No image provided",
        });
      }

      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      //Find Category id
      const categoryData = await Category.findOne({ title: JsonData.category });
      if (!categoryData) {
        return res.status(400).json({
          status: "Error",
          message: "Category Not Available",
        });
      }

      // save changes to db
      const newCourse = new Course({
        thumbnail: result.secure_url,
        title: JsonData.title,
        desc: JsonData.desc,
        price: JsonData.price,
        category: categoryData._id,
        difficulity: JsonData.difficulity,
        benefits: JsonData.benefits,
        prerequistes: JsonData.prerequistes,
        courseContent: JsonData.courseContent,
      });
      const newCourseData = await newCourse.save();
      //updating Category Array
      await Category.findByIdAndUpdate(categoryData._id, {
        $push: { courses: newCourseData._id },
      });
      //Updating UserModel who haev created the course
      await User.findByIdAndUpdate(id, {
        $push: { coursesCreated: newCourse._id },
      });
      return res.status(200).json({ message: "Course Created Succesfully" });
    } catch (error) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
);

//Get Courses Created By Particular User

router.get("/get-tutors-courses", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const userData = await User.findById(id).populate({
      path: "coursesCreated",
      options: { sort: { createdAt: -1 } },
    });
    return res.status(200).json({ createdCourses: userData.coursesCreated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
