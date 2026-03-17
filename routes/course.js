const express = require("express");
const { userMiddleware } = require("../middlewares/user");
const { PurchaseModel, CourseModel } = require("../db");

const CourseRouter = express.Router();

// ✅ Purchase Course
CourseRouter.post("/purchase", userMiddleware, async function (req, res) {
  try {
    const userId = req.userId; // ✅ from middleware
    const { courseId } = req.body;

    // Validation
    if (!courseId) {
      return res.status(400).json({
        message: "Course ID is required",
      });
    }

    // Check if course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Prevent duplicate purchase
    const existingPurchase = await PurchaseModel.findOne({
      userId,
      courseId,
    });

    if (existingPurchase) {
      return res.status(400).json({
        message: "Course already purchased",
      });
    }

    // Create purchase
    await PurchaseModel.create({
      userId,
      courseId,
    });

    res.json({
      message: "You have successfully bought the course",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

// ✅ Preview Courses
CourseRouter.get("/preview", async function (req, res) {
  try {
    const courses = await CourseModel.find({})
      .sort({ createdAt: -1 })
      .select("title description price imageURL");

    res.json({
      courses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching courses",
    });
  }
});

module.exports = {
  CourseRouter,
};
