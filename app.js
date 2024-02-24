const express = require("express");
const app = express();
const cors = require("cors");
const authentication = require("./routes/authentication");
require("dotenv").config();
const PORT = process.env.PORT || 1000;
app.use(cors());
app.use(express.json());

//Connection
require("./conn/conn");

//Calling Routes
app.use("/api/v1", authentication);

//SERVER
app.listen(PORT, () => {
  console.log(`Server Started at PORT : ${PORT} `);
});
