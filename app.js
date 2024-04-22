const express = require("express");
const app = express();
const cors = require("cors");
const authentication = require("./routes/authentication");
const todo = require("./routes/todo");
const cat = require("./routes/category");
const course = require("./routes/courses");
const admin = require("./routes/admin");
const tutorequest = require("./routes/tutorReq");
require("dotenv").config();
const PORT = process.env.PORT || 1000;
app.use(cors());
app.use(express.json());

//Connection
require("./conn/conn");

//Calling Routes
app.use("/api/v1", authentication);
app.use("/api/v1", cat);
app.use("/api/v1", course);
app.use("/api2/v1", todo);
app.use("/api/v1", tutorequest);
app.use("/api/v1", admin);

//SERVER
app.listen(PORT, () => {
  console.log(`Server Started at PORT : ${PORT} `);
});
