require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/database");
const index = require("./routes/index");

const app = express();

connectDB();

app.use(cors());

app.use(express.json({
    limit: "10gb"
}));

app.use("/api", index);

app.listen(3000,()=>{
    console.log("Server running port 3000");
});