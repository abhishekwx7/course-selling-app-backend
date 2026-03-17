require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const { UserRouter } = require("./routes/user");
const { CourseRouter } = require("./routes/course");
const { AdminRouter } = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(express.json());

// ✅ Routes
app.use("/user", UserRouter);
app.use("/course", CourseRouter);
app.use("/admin", AdminRouter);

// ✅ 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: "Internal Server Error",
  });
});

// ✅ Start server only after DB connects
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Handle server errors
    server.on("error", (err) => {
      console.error("Server error:", err.message);
    });

    // ✅ Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down server...");
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (err) {
    console.error("❌ Failed to connect to DB:", err.message);
    process.exit(1); // stop app if DB fails
  }
}

startServer();
