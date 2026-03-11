const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_USER_PASSWORD } = require("../config");
const UserRouter = express.Router();
const { UserModel, PurchaseModel, CourseModel } = require("../db");
const { userMiddleware } = require("../middlewares/user");

UserRouter.post("/signup", async function (req, res) {
  const { email, firstName, lastName, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  await UserModel.create({
    email: email,
    firstName: firstName,
    lastName: lastName,
    password: hashedPassword,
  });

  res.json({
    message: "signed up successfully",
  });
});

UserRouter.post("/signin", async function (req, res) {
  const { email, password } = req.body;
  const user = await UserModel.findOne({
    email: email,
  });

  if (!user) {
    return res.status(403).json({
      message: "invalid email or password",
    });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(403).json({
      message: "invalid email or password",
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
    },
    JWT_USER_PASSWORD,
  );

  // COOKIES OR SESSION LOGIC RESIDES HERE TOO

  res.json({
    token: token,
  });
});

UserRouter.get("/purchases", userMiddleware, async function (req, res) {
  const userId = req.body.userId;

  const purchases = await PurchaseModel.find({
    userId,
  });

  const courseData = await CourseModel.find({
    _id: { $in: purchases.map((x) => x.courseId) },
  });

  res.json({
    purchases,
    courseData,
  });
});

module.exports = {
  UserRouter,
};
