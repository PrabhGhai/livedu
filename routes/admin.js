const router = require("express").Router();
const User = require("../Models/user");
const Courses = require("../Models/courseModel");
const { authenticateToken } = require("./userAuth");
const Requests = require("../Models/TutorRequest");
const nodemailer = require("nodemailer");
// API endpoint to fetch the number of users
router.get("/count-users", authenticateToken, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API endpoint to fetch the number of courses
router.get("/count-courses", authenticateToken, async (req, res) => {
  try {
    const count = await Courses.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// API endpoint to fetch the number of users with role "student"
router.get("/count-students", authenticateToken, async (req, res) => {
  try {
    const count = await User.countDocuments({ role: "student" });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// API endpoint to fetch the number of users with role "tutor"
router.get("/count-tutors", authenticateToken, async (req, res) => {
  try {
    const count = await User.countDocuments({ role: "tutor" });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//new users
router.get("/new-users", authenticateToken, async (req, res) => {
  try {
    // Fetch users sorted by timestamp (assuming timestamp field is named "createdAt")
    const recentUsers = await User.find({}, { password: 0 }) // Excluding the password field
      .sort({ createdAt: -1 }) // Sorting in descending order of creation timestamp
      .limit(5); // Limiting to the 10 most recent users
    res.json(recentUsers);
  } catch (error) {
    console.error("Error fetching recent users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//fetch all users
const PAGE_SIZE = 7; // Number of users per page
router.get("/all-users", authenticateToken, async (req, res) => {
  try {
    const count = await User.countDocuments();
    const page = parseInt(req.query.page) || 1; // Default page is 1
    const skip = (page - 1) * PAGE_SIZE;
    // Fetch users sorted by timestamp (assuming timestamp field is named "createdAt")
    const allUsers = await User.find({}, { password: 0 }) // Excluding the password field
      .sort({ createdAt: -1 }) // Sorting in descending order of creation timestamp
      .skip(skip) // Skip records based on pagination
      .limit(PAGE_SIZE); // Limit number of records per page
    res.json({ count: count, allUsers: allUsers });
  } catch (error) {
    console.error("Error fetching recent users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//delete user by admin
router.delete("/delete-user/:id", authenticateToken, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//userCount by month
router.get("/userCountByMonth", authenticateToken, async (req, res) => {
  try {
    const userCountByMonth = await User.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(userCountByMonth);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//get-tutor-requests
router.get("/getTutorRequests", authenticateToken, async (req, res) => {
  try {
    const allreq = await Requests.find()
      .populate("user", "-password")
      .sort({ createdAt: -1 });
    res.status(200).json({ data: allreq });
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

router.put("/acceptTutorRequest", authenticateToken, async (req, res) => {
  try {
    const { option, id } = req.body;
    const user = await User.findByIdAndUpdate(id, {
      stausOfPage: option === "reject" ? "none" : option,
    });
    if (option === "accept") {
      await User.findByIdAndUpdate(id, { role: "tutor" });
    }
    if (option === "accept") {
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "ghaiprabhghai@gmail.com",
          pass: "cqqw nnyh xxof nxqw",
        },
      });

      var mailOptions = {
        from: "ghaiprabhghai@gmail.com",
        to: user.email,
        subject: "Status of LivEdu page",
        html: `<b>Dear User,</b>
             <p>Congratualtions, you are now a tutor on LivEdu, please vist our website to see your dashboard to create the courses. </p>
             <b>We are happy to see you to sell courses with LivEdu. </b>
             <p>Best regards,<br/>LivEdu Team</p>`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return res.status(400).json({ message: "Error while sending email" });
        } else {
          return res.status(200).json({ message: "Email sent" });
        }
      });
    } else if (option === "reject") {
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "ghaiprabhghai@gmail.com",
          pass: "cqqw nnyh xxof nxqw",
        },
      });

      var mailOptions = {
        from: "ghaiprabhghai@gmail.com",
        to: user.email,
        subject: "Status of LivEdu page",
        html: `<b>Dear User,</b>
             <p>Sorry, we can't accept your request to become a tutor this time on LivEdu </p>
             <b>Please try again after 30 days.</b>
             <p>Best regards,<br/>LivEdu Team</p>`,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          return res.status(400).json({ message: "Error while sending email" });
        } else {
          return res.status(200).json({ message: "Email sent" });
        }
      });
    }
    res.status(200).json({ message: "Status updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
