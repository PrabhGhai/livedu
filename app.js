const express = require("express");
const app = express();
const cors = require("cors");
const authentication = require("./routes/authentication");
const todo = require("./routes/todo");
const cat = require("./routes/category");
const course = require("./routes/courses");
const admin = require("./routes/admin");
const tutorequest = require("./routes/tutorReq");
const search = require("./routes/search");
const payment = require("./routes/payment");
const TutorAnalytics = require("./routes/tutorAnalytics");
require("dotenv").config();
const PORT = process.env.PORT || 1000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Connection
require("./conn/conn");

//Calling Routes
app.use("/api/v1", authentication);
app.use("/api/v1", cat);
app.use("/api/v1", course);
app.use("/api2/v1", todo);
app.use("/api/v1", tutorequest);
app.use("/api/v1", admin);
app.use("/api/v1", search);
app.use("/api/v1", payment);
app.use("/api/v1", TutorAnalytics);

//SERVER
app.listen(PORT, () => {
  console.log(`Server Started at PORT : ${PORT} `);
});
