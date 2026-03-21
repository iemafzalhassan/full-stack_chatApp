import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    generateToken(user._id, res);

    await user.save();

    res.status(201).json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      password: user.password,
    });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(200).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      password: user.password,
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("token", null, { maxAge: 0 });

    res.status(200).json({ message: "Logout success" });

  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;

    const userId = req.user._id;

    if (!profilePic) {
      res.status(400).json({ message: "Profile picture required" });
    }

    const uploadResult = await cloudinary.uploader.upload(profilePic);

    const user = await User.findById(userId);

    user.profilePic = uploadResult.secure_url;

    await user.save();

    res.status(200).json(user);

  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user._id);

    res.status(200).json({
      user,
      id: user._id,
    });

  } catch (error) {
    res.status(500).json({ message: "Auth check failed" });
  }
};