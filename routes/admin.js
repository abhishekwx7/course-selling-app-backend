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
  const schema = z.object({
    title: z.string().min(3),
    description: z.string().min(10),
    imageURL: z.string().url(),
    price: z.number().positive(),
  });

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  try {
    const adminId = req.userId;

    const course = await CourseModel.create({
      title,
      description,
      imageURL,
      price,
      creatorId: adminId,
    });

    res.status(201).json({
      message: "Course created successfully",
      courseId: course._id,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

AdminRouter.put("/course", adminMiddleware, async function (req, res) {
  try {
    const adminId = req.userId;
    const { title, description, imageURL, price, courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Build update object dynamically (avoid undefined overwrite)
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageURL !== undefined) updateData.imageURL = imageURL;
    if (price !== undefined) updateData.price = price;

    const updatedCourse = await CourseModel.findOneAndUpdate(
      {
        _id: courseId,
        creatorId: adminId,
      },
      { $set: updateData },
      { new: true },
    );

    if (!updatedCourse) {
      return res.status(404).json({
        message: "Course not found or unauthorized",
      });
    }

    res.json({
      message: "Course Updated",
      course: updatedCourse,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

AdminRouter.get("/course/bulk", adminMiddleware, async function (req, res) {
  try {
    const adminId = req.userId;

    const courses = await CourseModel.find({
      creatorId: adminId,
    })
      .sort({ createdAt: -1 }) // latest first
      .select("title description price imageURL createdAt"); // only needed fields

    if (courses.length === 0) {
      return res.json({
        message: "No courses found",
        courses: [],
      });
    }

    res.json({
      message: "Your Courses",
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

AdminRouter.delete(
  "/course/:courseId",
  adminMiddleware,
  async function (req, res) {
    try {
      const adminId = req.userId;
      const { courseId } = req.params;

      const deletedCourse = await CourseModel.findOneAndDelete({
        _id: courseId,
        creatorId: adminId,
      });

      if (!deletedCourse) {
        return res.status(404).json({
          message: "Course not found or unauthorised",
        });
      }

      res.json({
        message: "Course deleted successfully",
        course: deletedCourse,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

module.exports = {
  AdminRouter,
};
