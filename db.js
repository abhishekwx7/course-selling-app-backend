const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const User = new Schema({
  email: { type: String, unique: true },
  firstName: String,
  lastName: String,
  password: String,
});

const Admin = new Schema({
  email: { type: String, unique: true },
  firstName: String,
  lastName: String,
  password: String,
});

const Course = new Schema({
  title: String,
  description: String,
  price: Number,
  imageURL: String,
  creatorId: ObjectId,
});

const Purchase = new Schema({
  userId: ObjectId,
  courseId: ObjectId,
});

const UserModel = mongoose.model("users", User);
const AdminModel = mongoose.model("admin", Admin);
const CourseModel = mongoose.model("course", Course);
const PurchaseModel = mongoose.model("purchase", Purchase);

module.exports = {
  UserModel,
  AdminModel,
  CourseModel,
  PurchaseModel,
};
