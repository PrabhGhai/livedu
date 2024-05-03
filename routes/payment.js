const router = require("express").Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../Models/payment");
const User = require("../Models/user");
const Course = require("../Models/courseModel");
const nodemailer = require("nodemailer");
const { authenticateToken } = require("./userAuth");

router.get("/get-api-keys", authenticateToken, async (req, res) => {
  try {
    return res.status(200).json({ key: process.env.RAZOR_PAY_KEY });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/checkout", authenticateToken, async (req, res) => {
  try {
    const { amount, paymentTo, course, paymentBy } = req.body;
    const instance = new Razorpay({
      key_id: process.env.RAZOR_PAY_KEY,
      key_secret: process.env.RAZOR_PAY_SECRET,
    });
    const options = {
      amount: amount * 100,
      currency: "INR",
    };
    const newpay = new Payment({
      amount: amount,
      paymentBy: paymentBy,
      paymentToTutor: paymentTo,
      courseEnrolled: course,
    });
    await newpay.save();
    const order = await instance.orders.create(options);
    res.status(200).json({ data: order, orderId: newpay._id });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post(
  "/paymentVerification/:paymentorderid/:courseId/:paymentBy/:paymentTo/:amount",
  async (req, res) => {
    try {
      const { paymentorderid, courseId, paymentBy, paymentTo, amount } =
        req.params;
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
        req.body;
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZOR_PAY_SECRET)
        .update(body.toString())
        .digest("hex");
      if (expectedSignature === razorpay_signature) {
        await Payment.findByIdAndUpdate(paymentorderid, {
          razorpay_payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          razorpay_signature: razorpay_signature,
          success: true,
        });
        await User.findByIdAndUpdate(paymentBy, {
          $push: { coursesEnrolled: courseId },
        });
        const tutor = await User.findById(paymentTo);
        await User.findByIdAndUpdate(paymentTo, { $inc: { earning: amount } });
        await Course.findByIdAndUpdate(courseId, {
          $push: { studentsEnrolled: paymentBy },
        });
        var mailOptions = {
          from: "ghaiprabhghai@gmail.com",
          to: tutor.email,
          subject: "Your course purchased",
          html: `<b>Dear User,</b>
               <p>Your course has purchased by a user on LivEdu. Please check your earnings section and payment history.</p>
                <br/>
               <p>Best regards,<br/>LivEdu Team</p>`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            return res
              .status(400)
              .json({ message: "Error while sending email" });
          } else {
            return res.status(200).json({ message: "Email sent" });
          }
        });
        res.redirect(
          `http://localhost:3000/paymentsuccess?reference=${razorpay_payment_id}`
        );
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

module.exports = router;
