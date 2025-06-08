import mongoose, { Schema, model, ObjectId } from "mongoose";

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const tagSchema = new Schema({
  title: { type: String, required: true, unique: true },
});

export const TagModel = model("tag", tagSchema);

const contentTypes = ["image", "video", "article", "audio"];

export const userModel = model("users", userSchema);

const contentSchema = new Schema({
  link: { type: String, required: true, unique: true },
  title: { type: String, required: true, unique: true },
  tags: [{ type: mongoose.Types.ObjectId, ref: "tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "users" },
});

export const contentModel = model("content", contentSchema);

const linkSchema = new mongoose.Schema({
  hash: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    unique: true,
    ref: "users",
    required: true,
  },
});

export const linkModel = model("link", linkSchema);
