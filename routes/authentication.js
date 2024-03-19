const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/user");
const { authenticateToken } = require("./userAuth");
const multer = require("multer");
const cloudinary = require("../helper/cloudinary");
const user = require("../Models/user");

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
    const data = await User.findById(id);
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
module.exports = router;
