const router = require("express").Router();
const Course = require("../Models/courseModel");
const Category = require("../Models/categoriesModel");
const User = require("../Models/user");
const { authenticateToken } = require("./userAuth");
const multer = require("multer");
const cloudinary = require("../helper/cloudinary");
const Review = require("../Models/review");
const nodemailer = require("nodemailer");

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

//Update a course
router.put(
  "/update-course/:courseid",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { courseid } = req.params;
      const { id } = req.headers;
      const course = await Course.findById(courseid);
      if (course && id !== course.courseCreatedBy.toString()) {
        return res.status(400).json({
          message: "You are not having the access to update the course.",
        });
      }
      let { Data } = req.body;
      const JsonData = JSON.parse(Data);
      // Upload image to Cloudinary
      if (req.file) {
        var result = await cloudinary.uploader.upload(req.file.path);
      }

      // save changes to db
      result &&
        (await Course.findByIdAndUpdate(courseid, {
          thumbnail: result.secure_url,
        }));
      await Course.findByIdAndUpdate(courseid, {
        title: JsonData.title,
        desc: JsonData.desc,
        price: JsonData.price,
        benefits: JsonData.benefits,
        prerequistes: JsonData.prerequistes,
        courseContent: JsonData.courseContent,
        courseCreatedBy: id,
      });
      return res.status(200).json({ message: "Course Updated Succesfully" });
    } catch (error) {
      console.log(error);
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
    const modifiedCourseContent = [];
    data.courseContent.forEach((section) => {
      if (section.length > 0) {
        const content = {
          sectionTitle: section[0].sectionTitle,
          videoTitle: section[0].videoTitle,
        };
        modifiedCourseContent.push(content);
      }
    });

    data.courseContent = modifiedCourseContent;
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//get-course-details by tutor to update the course
router.get("/get-course-details-to-updateByTutor/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Course.findById(id).populate("courseCreatedBy");
    return res.status(200).json(data);
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
    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .populate("reviews");
    res.status(200).json({ courses });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//get courses recently added
router.get("/recently-added-courses", async (req, res) => {
  try {
    const courses = await Course.find()
      .sort({ createdAt: -1 })
      .limit(4)
      .populate("reviews");
    res.status(200).json({ courses });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/courses-loved-by-students", async (req, res) => {
  try {
    const courses = await Course.find().populate("reviews");
    /// Sort courses by number of reviews in descending order
    courses.sort((a, b) => b.reviews.length - a.reviews.length);

    // Get the top 4 courses
    const top4Courses = courses.slice(0, 4);

    res.status(200).json({ courses: top4Courses });
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

//get enrolled courses details
router.get("/enrolled-courses", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const data = await User.findById(id).populate("coursesEnrolled");
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
//get course details to learn the course
router.get("/learn-course/:courseid/user/:userid", async (req, res) => {
  try {
    const { courseid, userid } = req.params;
    const user = await User.findById(userid);
    if (user && user.coursesEnrolled.includes(courseid)) {
      const data = await Course.findById(courseid);
      return res.status(200).json(data);
    } else {
      res.status(400).json({ message: "Not an authenticated user" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//add review of a course
router.post("/create-review/:courseid", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const { courseid } = req.params;
    const { rating, review } = req.body;
    const newReview = new Review({ rating: rating, comment: review, user: id });
    const reviewData = await newReview.save();
    const courseContent = await Course.findById(courseid).populate(
      "courseCreatedBy"
    );
    if (courseContent) {
      await Course.findByIdAndUpdate(courseid, {
        $push: { reviews: reviewData._id },
      });
    }
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ghaiprabhghai@gmail.com",
        pass: "cqqw nnyh xxof nxqw",
      },
    });

    var mailOptions = {
      from: "ghaiprabhghai@gmail.com",
      to: courseContent.courseCreatedBy.email,
      subject: "New comment on your course",
      html: `<b>Dear Tutor,</b>
           <p>A new review has submitted by the user to your course <b>${courseContent.title}</b></p>
           <p>Please check review section of this course.</p>
           <p>Best regards,<br/>LivEdu Team</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.status(400).json({ message: "Error while sending email" });
      } else {
        return res.status(200).json({ message: "Email sent" });
      }
    });
    return res.status(200).json({ message: "Review added" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/get-top4-reviews", async (req, res) => {
  try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate({ path: "user", select: "username avatar" });
    return res.status(200).json({ reviews });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
