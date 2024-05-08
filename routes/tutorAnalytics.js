const router = require("express").Router();
const Payment = require("../Models/payment");
const User = require("../Models/user");
const Course = require("../Models/courseModel");
const { authenticateToken } = require("./userAuth");
const moment = require("moment");
const Withdraw = require("../Models/withdraw");
const BankDetails = require("../Models/bankDetails");
//get total income of a tutor

router.get("/total-income-tutor", authenticateToken, async (req, res) => {
  try {
    const userId = req.headers.id; // User ID obtained from request headers
    const data = await Payment.find({
      paymentToTutor: userId, // Filter payments for the specific user
      success: true,
    });
    let earning = 0;
    for (const item of data) {
      earning += item.amount;
    }
    res.status(200).json({ earning: earning });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/last28Days", authenticateToken, async (req, res) => {
  try {
    const startDate = moment().startOf("month").toDate(); // Start of the current month
    const endDate = moment().endOf("month").toDate(); // End of the current month
    const data = await Payment.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      paymentToTutor: req.headers.id,
      success: true,
    });
    let earning = 0;
    for (const item of data) {
      earning += item.amount;
    }
    res.status(200).json({ earning: earning });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/last7Days", authenticateToken, async (req, res) => {
  try {
    const startDate = moment().startOf("week").toDate(); // Start of the current week
    const endDate = moment().endOf("week").toDate(); // End of the current week
    const data = await Payment.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
      paymentToTutor: req.headers.id,
      success: true,
    });
    let earning = 0;
    for (const item of data) {
      earning += item.amount;
    }
    res.status(200).json({ earning: earning });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/last7DaysIncomeAnalytics", authenticateToken, async (req, res) => {
  try {
    const startDate = moment().subtract(7, "days").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    // Retrieve successful payments for the last 7 days
    const data = await Payment.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentToTutor: req.headers.id,
      success: true,
    });

    // Initialize an object to store income data for each day
    const incomeData = {};

    // Loop through the last 7 days and initialize income data with 0
    for (let i = 0; i < 7; i++) {
      const date = moment().subtract(i, "days").format("DD MMM");
      incomeData[date] = 0;
    }

    // Loop through the data to calculate income for each day
    data.forEach((payment) => {
      const date = moment(payment.createdAt).format("DD MMM");
      incomeData[date] += payment.amount;
    });

    // Prepare data for the line chart, sorted by date
    const sortedIncomeData = Object.entries(incomeData).sort(
      ([date1], [date2]) =>
        moment(date1, "DD MMM").valueOf() - moment(date2, "DD MMM").valueOf()
    );
    const labels = sortedIncomeData.map(([date]) => date);
    const income = sortedIncomeData.map(([_, amount]) => amount);

    res.status(200).json({ labels, income });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/last28DaysIncome", authenticateToken, async (req, res) => {
  try {
    // Initialize an object to store income data for each day
    const incomeData = {};
    // Calculate start and end dates for the last 28 days
    const endDate = moment().endOf("day").toDate();
    for (let i = 28; i > 0; i--) {
      const currentDate = moment().subtract(i, "days").startOf("day").toDate();
      const dateLabel = moment(currentDate).format("DD MMM");
      // Initialize income for the day to 0
      incomeData[dateLabel] = 0;
    }

    // Retrieve payment data for the last 28 days
    const startDate = moment().subtract(28, "days").startOf("day").toDate();
    const paymentData = await Payment.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentToTutor: req.headers.id,
      success: true,
    });

    // Process payment data and update income for each day
    paymentData.forEach((payment) => {
      const dateLabel = moment(payment.createdAt).format("DD MMM");
      incomeData[dateLabel] += payment.amount;
    });

    // Prepare data for the line chart
    const labels = Object.keys(incomeData);
    const income = Object.values(incomeData);

    res.status(200).json({ labels, income });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/last365DaysIncome", authenticateToken, async (req, res) => {
  try {
    // Initialize an object to store income data for each month
    const incomeData = {};

    // Calculate start and end dates for the last 365 days
    const endDate = moment().endOf("day").toDate();
    const startDate = moment().subtract(365, "days").startOf("day").toDate();

    // Loop through the last 365 days
    for (let i = 365; i > 0; i--) {
      const currentDate = moment().subtract(i, "days").startOf("day").toDate();
      const monthYearLabel = moment(currentDate).format("MMM YYYY");
      // Initialize income for the month to 0
      if (!incomeData[monthYearLabel]) {
        incomeData[monthYearLabel] = 0;
      }
    }

    // Retrieve payment data for the last 365 days
    const paymentData = await Payment.find({
      createdAt: { $gte: startDate, $lte: endDate },
      paymentToTutor: req.headers.id,
      success: true,
    });

    // Process payment data and update income for each month
    paymentData.forEach((payment) => {
      const monthYearLabel = moment(payment.createdAt).format("MMM YYYY");
      incomeData[monthYearLabel] += payment.amount;
    });

    // Prepare data for the line chart
    const labels = Object.keys(incomeData);
    const income = Object.values(incomeData);

    res.status(200).json({ labels, income });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//submit-bank-details
router.post("/submit-account-details", authenticateToken, async (req, res) => {
  const { id } = req.headers;
  const { fullName, accountNumber, nameOfBank, ifsc } = req.body;
  const user = await User.findById(id);
  if (user.role !== "tutor") {
    return res
      .status(400)
      .json({ message: "You are not having access to submit details" });
  }
  const newdetails = new BankDetails({
    user: id,
    fullName: fullName,
    accountNumber: accountNumber,
    nameOfBank: nameOfBank,
    ifsc: ifsc,
  });
  await newdetails.save();
  await User.findByIdAndUpdate(id, { bankDetails: newdetails._id });
  res.status(200).json({ message: "Account details saved" });
});

//check bank details are filled or not
router.get("/isBankDetail", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const user = await User.findById(id);
    if (user.bankDetails) {
      return res.status(200).json({ message: true });
    } else {
      return res.status(200).json({ message: false });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
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

//get available balance
router.get("/get-available-balance", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const user = await User.findById(id);

    // Calculate 80% of user's earnings
    const eightyPercentEarnings = user.earning * 0.8;
    res.status(200).json({ earnings: eightyPercentEarnings });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//withdraw-request
router.post("/withdraw-request", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const { amount } = req.body;
    const newWithdrawlRequest = new Withdraw({ user: id, amount: amount });
    await newWithdrawlRequest.save();
    await User.findByIdAndUpdate(id, {
      $push: { withdrawlRequests: newWithdrawlRequest._id },
      $set: { earning: 0 },
    });
    res.status(200).json({ message: "Withdrawl success" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//user withdrawls requests
router.get("/user-withdrawals", authenticateToken, async (req, res) => {
  try {
    const userId = req.headers.id;
    const withdrawals = await Withdraw.find({ user: userId }).sort({
      createdAt: -1,
    });

    const formattedWithdrawals = withdrawals.map((withdrawal) => ({
      _id: withdrawal._id,
      amount: withdrawal.amount,
      status: withdrawal.status,
      date: moment(withdrawal.createdAt).format("DD/MM/YY"),
    }));

    res.status(200).json({ withdrawals: formattedWithdrawals });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;
