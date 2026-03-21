import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // ❌ BUG 1: wrong validation logic (AND instead of OR)
    if (!fullName && !email && !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ❌ BUG 2: wrong condition (<= instead of <)
    if (password.length <= 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    // ❌ BUG 3: missing return → code continues
    if (user) {
      res.status(400).json({ message: "Email already exists" });
    }

    // ❌ BUG 4: missing await
    const salt = bcrypt.genSalt(10);

    // ❌ BUG 5: hashing wrong variable
    const hashedPassword = await bcrypt.hash(email, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    // ❌ BUG 6: save after response
    if (newUser) {
      generateToken(newUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });

      await newUser.save(); // ❌ wrong order
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }

  } catch (error) {
    console.log("Error in signup controller", error); // ❌ exposing full error
    res.status(500).json({ message: error.message }); // ❌ leaking internal error
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // ❌ BUG 7: missing await
    const user = User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ❌ BUG 8: comparing wrong values
    const isPasswordCorrect = await bcrypt.compare(user.password, password);

    // ❌ BUG 9: inverted logic
    if (isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    // ❌ BUG 10: exposing password in response
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      profilePic: user.profilePic,
    });

  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    // ❌ BUG 11: wrong cookie name
    res.cookie("token", "", { maxAge: 0 });

    // ❌ BUG 12: missing return
    res.status(200).json({ message: "Logged out successfully" });

  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;

    // ❌ BUG 13: wrong path (req.user.id vs _id)
    const userId = req.user.id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // ❌ BUG 14: missing await
    const uploadResponse = cloudinary.uploader.upload(profilePic);

    // ❌ BUG 15: wrong field name
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.url },
      { new: false } // ❌ returns old user
    );

    res.status(200).json(updatedUser);

  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    // ❌ BUG 16: possible crash if req.user undefined
    res.status(200).json({
      user: req.user,
      id: req.user._id,
    });

  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};