const router = require("express").Router();
const User = require("../Models/user");
const Courses = require("../Models/courseModel");
const { authenticateToken } = require("./userAuth");
const Requests = require("../Models/TutorRequest");
const nodemailer = require("nodemailer");
const moment = require("moment");
const Payment = require("../Models/payment");
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

router.get("/user-signups", async (req, res) => {
  try {
    const currentDate = moment().startOf("day");
    const dates = [];
    const userCounts = [];

    for (let i = 0; i < 28; i++) {
      const startDate = currentDate.clone().subtract(i, "days").startOf("day");
      const endDate = currentDate.clone().subtract(i, "days").endOf("day");
      const count = await User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });
      dates.unshift(startDate.format("DD MMM")); // Add dates in reverse order
      userCounts.unshift(count); // Add user counts in reverse order
    }

    res.json({ dates, userCounts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/course-created-data", async (req, res) => {
  try {
    const currentDate = moment().startOf("day");
    const dates = [];
    const courseCounts = [];

    for (let i = 0; i < 28; i++) {
      const startDate = currentDate.clone().subtract(i, "days").startOf("day");
      const endDate = currentDate.clone().subtract(i, "days").endOf("day");
      const count = await Courses.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });
      dates.unshift(startDate.format("DD MMM")); // Add dates in reverse order
      courseCounts.unshift(count); // Add course counts in reverse order
    }

    res.json({ dates, courseCounts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/new-users-per-month", async (req, res) => {
  try {
    const currentDate = moment().startOf("month");
    const months = [];
    const userCounts = [];

    for (let i = 0; i < 12; i++) {
      const startDate = currentDate
        .clone()
        .subtract(i, "months")
        .startOf("month");
      const endDate = currentDate.clone().subtract(i, "months").endOf("month");
      const count = await User.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });
      const monthName = startDate.format("MMM");
      months.unshift(monthName);
      userCounts.unshift(count);
    }

    res.json({ months, userCounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/new-courses-per-month", async (req, res) => {
  try {
    const currentDate = moment().startOf("month");
    const months = [];
    const courseCounts = [];

    for (let i = 0; i < 12; i++) {
      const startDate = currentDate
        .clone()
        .subtract(i, "months")
        .startOf("month");
      const endDate = currentDate.clone().subtract(i, "months").endOf("month");
      const count = await Courses.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });
      const monthName = startDate.format("MMM");
      months.unshift(monthName);
      courseCounts.unshift(count);
    }

    res.json({ months, courseCounts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//all  payment history
router.get("/all-payment-history", async (req, res) => {
  try {
    const data = await Payment.find()
      .populate("courseEnrolled")
      .sort({ createdAt: -1 });
    const formattedData = data.map((payment) => {
      const formattedCreatedAt = new Date(payment.createdAt).toLocaleString();
      return { ...payment.toObject(), createdAt: formattedCreatedAt };
    });
    res.status(200).json({ data: formattedData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;
