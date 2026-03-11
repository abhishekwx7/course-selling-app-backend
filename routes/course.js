const express = require("express");
const { userMiddleware } = require("../middlewares/user");
const { PurchaseModel, CourseModel } = require("../db");
const CourseRouter = express.Router();

CourseRouter.post("/purchase", userMiddleware, async function (req, res) {
  const userId = req.body.userId;
  const courseId = req.body.courseId;

  await PurchaseModel.create({
    userId,
    courseId,
  });

  res.json({
    message: "You have successfully bought the course",
  });
});

CourseRouter.get("/preview", async function (req, res) {
  const courses = await CourseModel.find({});

  res.json({
    courses,
  });
});

module.exports = {
  CourseRouter,
};
