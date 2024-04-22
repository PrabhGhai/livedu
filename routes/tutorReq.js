const router = require("express").Router();
const { authenticateToken } = require("./userAuth");
const multer = require("multer");
const cloudinary = require("../helper/cloudinary");
const Request = require("../Models/TutorRequest");
const User = require("../Models/user");

//request // if file is there
const storage = multer.diskStorage({});
const upload = multer({ storage: storage });
router.post(
  "/tutor-request",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const { id } = req.headers;

      if (!req.file) {
        return res.status(300).json({
          status: "Error",
          message: "No image provided",
        });
      }
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
      const newReq = new Request({ user: id, resume: result.secure_url });
      await newReq.save();
      await User.findByIdAndUpdate(id, { stausOfPage: "in progress" });
      res.status(200).json({ message: "Application submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// request if ytLink

router.post("/tutor-request-ytlink", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const { ytLink } = req.body;
    // Check if the provided YouTube link is a valid channel link
    const regex =
      /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:channel\/|c\/|user\/|@)?)([a-zA-Z0-9_-]{1,})$/;

    if (!regex.test(ytLink)) {
      return res.status(400).json({ message: "Invalid YouTube channel link" });
    }
    const newReq = new Request({ user: id, ytLink: ytLink });
    await newReq.save();
    await User.findByIdAndUpdate(id, { stausOfPage: "in progress" });
    res.status(200).json({ message: "Application submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;
