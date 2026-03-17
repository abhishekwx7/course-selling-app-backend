const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z, email } = require("zod");
const { JWT_USER_PASSWORD } = require("../config");
const UserRouter = express.Router();
const { UserModel, PurchaseModel, CourseModel } = require("../db");
const { userMiddleware } = require("../middlewares/user");

const signupSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  password: z.string().min(6),
});

UserRouter.post("/signup", async function (req, res) {
  try {
    const parsedData = signupSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsedData.error.errors,
      });
    }

    let { email, firstName, lastName, password } = parsedData.data;

    email = email.toLowerCase().trim();

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await UserModel.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Signed up succcessfully",
      userId: user._id,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

UserRouter.post("/signin", async function (req, res) {
  try {
    const parsedData = signinSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        message: "Invalid input",
        errors: parsedData.error.errors,
      });
    }

    let { email, password } = parsedData.data;

    email = email.toLowerCase().trim();

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(403).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(403).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      JWT_USER_PASSWORD,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Signin successful",
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

UserRouter.get("/purchases", userMiddleware, async function (req, res) {
  try {
    const userId = req.userId;

    const purchases = await PurchaseModel.find({ userId });

    if (purchases.length === 0) {
      return res.json({
        message: "No purchases found",
        courses: [],
      });
    }

    const courseIds = purchases.map((p) => p.courseId);

    const courses = await CourseModel.find({
      _id: { $in: courseIds },
    }).select("title description price imageURL");

    res.json({
      message: "Purchased courses fetched",
      count: courses.length,
      courses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

UserRouter.delete("/", userMiddleware, async function (req, res) {
  try {
    const userId = req.userId;

    const deletedUser = await UserModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      message: "User account deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.json({
      message: "Internal Server Error",
    });
  }
});

module.exports = {
  UserRouter,
};
