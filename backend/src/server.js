const express = require("express");
const cors = require("cors");
const index = require("./routes/index");
const app = express();

app.use(cors());
app.use(express.json({
    limit: "10gb"
}));

app.use("/api", index);

app.listen(3000,()=>{
    console.log("Server running port 3000");
});