require("dotenv").config();

const express = require("express");
const app = express();
const PORT = 3000;
const mongoose = require("mongoose");

const { UserRouter } = require("./routes/user");
const { CourseRouter } = require("./routes/course");
const { AdminRouter } = require("./routes/admin");

app.use(express.json());

app.use("/user", UserRouter);
app.use("/course", CourseRouter);
app.use("/admin", AdminRouter);

async function main() {
  await mongoose.connect(process.env.MONGO_URL);

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (err) => {
    console.log("error while running : ", err.message);
  });
}

main();
