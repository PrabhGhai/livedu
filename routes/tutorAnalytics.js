const router = require("express").Router();
const Payment = require("../Models/payment");
const User = require("../Models/user");
const Course = require("../Models/courseModel");
const { authenticateToken } = require("./userAuth");
const moment = require("moment");
//get total income of a tutor

router.get("/total-income-tutor", authenticateToken, async (req, res) => {
  try {
    const { id } = req.headers;
    const data = await User.findById(id);
    res.status(200).json({ earning: data.earning });
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
    const startDate = moment().subtract(28, "days").startOf("day").toDate();
    const endDate = moment().endOf("day").toDate();

    // Loop through the last 28 days in reverse order
    for (let i = 28; i > 0; i--) {
      const currentDate = moment().subtract(i, "days").startOf("day").toDate();
      const dateLabel = moment(currentDate).format("DD MMM");
      // Initialize income for the day to 0
      incomeData[dateLabel] = 0;
      const data = await Payment.find({
        createdAt: { $gte: currentDate, $lte: endDate },
        paymentToTutor: req.headers.id,
        success: true,
      });
      // Calculate total income for the day
      const income = data.reduce((total, payment) => total + payment.amount, 0);
      // Update income for the day if there are payments
      if (income > 0) {
        incomeData[dateLabel] = income;
      }
    }

    // Prepare data for the line chart
    const labels = Object.keys(incomeData);
    const income = Object.values(incomeData);

    res.status(200).json({ labels, income });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
