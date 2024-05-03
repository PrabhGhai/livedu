const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/user");
const { authenticateToken } = require("./userAuth");
const multer = require("multer");
const cloudinary = require("../helper/cloudinary");
const user = require("../Models/user");
const nodemailer = require("nodemailer");
const Payment = require("../Models/payment");

//creating User

router.post("/user-signUp", async (req, res) => {
  try {
    // Validate username format
    const usernameRegex = /^[a-z0-9_.]+$/;
    const usernameLength = req.body.username.length;
    if (!usernameRegex.test(req.body.username) || usernameLength < 4) {
      return res.status(400).json({
        status: "Error",
        message:
          usernameLength < 4
            ? "Username must have atleast 4 characters."
            : "Username should be lowercase, and may contain only letters, numbers, underscores, and dots. ",
      });
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({
        status: "Error",
        message: "Invalid email format. Please enter a valid email address.",
      });
    }

    //Check the length of password
    const password = req.body.password;
    const passLength = password.length;
    if (passLength < 6) {
      return res.status(400).json({
        status: "Error",
        message: "Password must be 6 characters long",
      });
    }
    // Check username or email already exists
    const usernameExists = await User.findOne({ username: req.body.username });
    const emailExists = await User.findOne({ email: req.body.email });
    if (usernameExists || emailExists) {
      return res.status(400).json({
        status: "Error",
        message: usernameExists
          ? "Username already exists"
          : "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email: req.body.email,
      username: req.body.username,
      password: hashedPassword,
    });

    await user.save();
    return res.json({
      status: "Success",
      message: "Signup successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      status: "Error",
      message: "Internal server error",
    });
  }
});

//Signing In User
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials" });
    }
    bcrypt.compare(password, user.password, (err, data) => {
      if (data) {
        const authClaims = [
          { name: user.username },
          { role: user.role },
          { jti: jwt.sign({}, "your-secret-key") },
        ];
        const token = jwt.sign({ authClaims }, "your-secret-key", {
          expiresIn: "30d",
        });

        res.json({
          _id: user._id,
          role: user.role,
          token,
        });
      } else {
        return res.status(400).json({ message: "Invalid credentials" });
      }
    });
  } catch (error) {
    return res.status(400).json({ message: "Internal Error" });
  }
});

//Get Users (individual) Profile Data
router.get("/getUserData", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const data = await User.findById(id).select("-password");
    return res.status(200).json(data);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

//update username
router.put("/change-username", authenticateToken, async (req, res) => {
  try {
    //Validating username
    const usernameRegex = /^[a-z0-9_.]+$/;
    const usernameLength = req.body.username.length;
    if (!usernameRegex.test(req.body.username) || usernameLength < 4) {
      return res.status(400).json({
        status: "Error",
        message:
          usernameLength < 4
            ? "Username must have atleast 4 characters."
            : "Username should be lowercase, and may contain only letters, numbers, underscores, and dots. ",
      });
    }

    // Check username  already exists
    const usernameExists = await User.findOne({ username: req.body.username });
    if (usernameExists) {
      return res.status(400).json({
        status: "Error",
        message: "Username already exists",
      });
    }
    const { id } = req.headers;
    const userIdData = await User.findByIdAndUpdate(id, {
      username: req.body.username,
    });

    // Check if user with the given ID exists
    if (!userIdData) {
      return res.status(404).json({
        status: "Error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Username updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

//update avatar
const storage = multer.diskStorage({});
const upload = multer({ storage: storage });
router.put(
  "/update-avatar",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      // Check if an image was provided
      if (!req.file) {
        return res.status(400).json({
          status: "Error",
          message: "No image provided",
        });
      }

      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);

      // save changes to db
      await user.findByIdAndUpdate(req.headers.id, {
        avatar: result.secure_url,
      });

      return res.status(200).json({
        status: "Success",
        message: "Image updated successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "An error occurred" });
    }
  }
);

//Update Desc
router.put("/update-user-desc", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const { desc } = req.body;
    const userIdData = await User.findByIdAndUpdate(id, { desc });

    // Check if user with the given ID exists
    if (!userIdData) {
      return res.status(404).json({
        status: "Error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Description updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

//change password
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currPass, newPass, confirmNewPass } = req.body;
    const { id } = req.headers;

    // Retrieve the user from the database
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(400).json({ message: "User not found" });
    }

    // Compare the current password with the one stored in the database
    const isPasswordCorrect = await bcrypt.compare(
      currPass,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check if new password matches the confirmation
    if (newPass !== confirmNewPass) {
      return res.status(400).json({ message: "Passwords did not match" });
    }

    // Hash the new password
    const hashPass = await bcrypt.hash(newPass, 10);

    // Update the user's password in the database
    await User.findByIdAndUpdate(id, { password: hashPass });

    return res.status(200).json({ message: "Password updated" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
});

//forgot-password
router.post("/forgot-password", authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;
    const { id } = req.headers;
    const checkSameUser = await User.findById(id);
    if (email !== checkSameUser.email) {
      return res.status(400).json({ message: "Email does not match." });
    }
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({ message: "Email is incorrect." });
    }
    const token = jwt.sign({ id: existingUser._id }, "your-secret-key", {
      expiresIn: "5m",
    });
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ghaiprabhghai@gmail.com",
        pass: "cqqw nnyh xxof nxqw",
      },
    });

    var mailOptions = {
      from: "ghaiprabhghai@gmail.com",
      to: email,
      subject: "Reset Password",
      html: `<b>Dear User,</b>
           <p>You have requested to reset your password. Please click on the following link to reset your password:</p>
           <p><a href="http://localhost:3000/reset-password/${token}">Reset Password</a></p>
           <b>The link will be active for 5 minutes. </b>
           <p>If you did not request this password reset, please ignore this email. If you have any questions or concerns, please contact our support team.</p>
           <p>Best regards,<br/>LivEdu Team</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return res.status(400).json({ message: "Error while sending email" });
      } else {
        return res.status(200).json({ message: "Email sent" });
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "External server error" });
  }
});

//reset-password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPass, confirmPass } = req.body;
    if (newPass !== confirmPass) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const decode = await jwt.verify(token, "your-secret-key");
    const id = decode.id;
    const hashPass = await bcrypt.hash(newPass, 10);
    await User.findByIdAndUpdate(id, { password: hashPass });
    return res.status(200).json({ message: "Password updated" });
  } catch (error) {
    return res.status(500).json({ message: "Invalid Token" });
  }
});

//get tutor profile to viewUser with username
router.get("/viewUser/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username })
      .select("-password")
      .populate("coursesCreated");
    if (!user) {
      return res.status(400).json({ message: "No user with this username" });
    }
    if (user.role === "tutor") {
      return res.status(200).json({ user });
    } else {
      return res.status(400).json({ message: "No user with this username" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//order history
router.get("/order-history", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const data = await Payment.find({ paymentBy: id })
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

//payment history
router.get("/payment-history", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const data = await Payment.find({ paymentToTutor: id })
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

router.get("/payment-history-time", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const { timePeriod } = req.query;
    let startDate;
    switch (timePeriod) {
      case "today":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "past7days":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6);
        break;
      case "past28days":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 27);
        break;
      default:
        startDate = null; // Fetch all time if no time period specified
        break;
    }

    const query = { paymentToTutor: id };
    if (startDate) {
      query.createdAt = { $gte: startDate };
    }

    const data = await Payment.find(query)
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
