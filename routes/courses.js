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
        courseCreatedBy: id,
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

//get-course-details
router.get("/get-course-details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Course.findById(id).populate("courseCreatedBy");
    const courseDetails = { ...data._doc };
    // Hide courseContent field
    if (courseDetails.courseContent) {
      delete courseDetails.courseContent;
    }
    return res.status(200).json(courseDetails);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//delete course
router.delete("/delete-course/:id", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.headers.id;
    const { catId } = req.headers;
    await Course.findByIdAndDelete(courseId);
    await User.findByIdAndUpdate(userId, {
      $pull: { coursesCreated: courseId },
    });
    await Category.findByIdAndUpdate(catId, { $pull: { courses: courseId } });
    res.status(200).json({ message: "Course deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//get courses of particular category
router.get("/courses/:cat", async (req, res) => {
  try {
    const category = req.params.cat;
    const courses = await Category.findOne({ title: category }).populate({
      path: "courses",
      options: { sort: { createdAt: -1 } },
    });
    res.status(200).json({ courses });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//get courses
router.get("/courses", async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.status(200).json({ courses });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//add to favourite
router.put(
  "/add-to-favourite/:courseId",
  authenticateToken,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { id } = req.headers;
      // Check if the course already exists in the user's favorites
      const user = await User.findById(id);
      if (user.favouriteCourses.includes(courseId)) {
        return res.status(200).json({ message: "Course already in favorites" });
      }

      // If the course is not already in favorites, add it
      await User.findByIdAndUpdate(id, {
        $push: { favouriteCourses: courseId },
      });
      res.status(200).json({ message: "Course added to favourites" });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

//remove from favourites
router.put(
  "/remove-from-favourite/:courseId",
  authenticateToken,
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { id } = req.headers;
      // Check if the course already exists in the user's favorites
      const user = await User.findById(id);
      if (user.favouriteCourses.includes(courseId)) {
        await User.findByIdAndUpdate(id, {
          $pull: { favouriteCourses: courseId },
        });
      }
      res.status(200).json({ message: "Course removed from favourites" });
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

//get-favouriute-books
router.get("/getFavouriteBooks", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const favourites = await User.findById(id).populate({
      path: "favouriteCourses",
      options: { sort: { createdAt: -1 } },
    });
    return res.status(200).json({ favourites: favourites.favouriteCourses });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
module.exports = router;
