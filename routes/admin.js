const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_ADMIN_PASSWORD } = require("../config");
const AdminRouter = express.Router();
const { AdminModel, CourseModel } = require("../db");
const { adminMiddleware } = require("../middlewares/admin");

AdminRouter.post("/signup", async function (req, res) {
  const { email, firstName, lastName, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  await AdminModel.create({
    email: email,
    firstName: firstName,
    lastName: lastName,
    password: hashedPassword,
  });

  res.json({
    message: "Admin signed up successfully",
  });
});

AdminRouter.post("/signin", async function (req, res) {
  const { email, password } = req.body;
  const admin = await AdminModel.findOne({
    email: email,
  });

  if (!admin) {
    return res.status(403).json({
      message: "invalid email or password",
    });
  }

  const passwordMatch = await bcrypt.compare(password, admin.password);

  if (!passwordMatch) {
    return res.json({
      message: "invalid email or password",
    });
  }

  const token = jwt.sign(
    {
      id: admin._id,
    },
    JWT_ADMIN_PASSWORD,
  );

  res.json({
    token: token,
  });
});

AdminRouter.post("/course", adminMiddleware, async function (req, res) {
  const adminId = req.userId;

  const { title, description, imageURL, price } = req.body;

  const course = await CourseModel.create({
    title,
    description,
    imageURL,
    price,
    creatorId: adminId,
  });

  res.json({
    message: "Course Created",
    courseId: course._id,
  });
});

AdminRouter.put("/course", adminMiddleware, async function (req, res) {
  const adminId = req.userId;

  const { title, description, imageURL, price, courseId } = req.body;

  const course = await CourseModel.updateOne(
    { _id: courseId, creatorId: adminId },
    {
      title,
      description,
      imageURL,
      price,
    },
  );

  res.json({
    message: "Course Updated",
    courseId: course._id,
  });
});

AdminRouter.get("/course/bulk", adminMiddleware, async function (req, res) {
  const adminId = req.userId;

  const courses = await CourseModel.find({
    creatorId: adminId,
  });

  res.json({
    message: "Your Courses",
    courses,
  });
});

module.exports = {
  AdminRouter,
};
