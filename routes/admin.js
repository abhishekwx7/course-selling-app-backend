const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const { JWT_ADMIN_PASSWORD } = require("../config");
const AdminRouter = express.Router();
const { AdminModel, CourseModel } = require("../db");
const { adminMiddleware } = require("../middlewares/admin");
const { id } = require("zod/locales");

AdminRouter.post("/signup", async function (req, res) {
  const schema = z.object({
    email: z.string().email(),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    password: z.string().min(6),
  });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  const { email, firstName, lastName, password } = parsed.data;

  try {
    const existingAdmin = await AdminModel.findOne({ email });

    if (existingAdmin) {
      return res.status(409).json({
        message: "Admin already exists!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await AdminModel.create({
      email: email,
      firstName: firstName,
      lastName: lastName,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Admin signed up successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

AdminRouter.post("/signin", async function (req, res) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  try {
    const admin = await AdminModel.findOne({ email });

    if (!admin) {
      return res.status(403).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.status(403).json({
        message: "invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
      },
      JWT_ADMIN_PASSWORD,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Sign in successfull",
      token: token,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
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
