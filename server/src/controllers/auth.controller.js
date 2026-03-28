import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/token.js";



// REGISTER USER

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;


    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }


    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }


    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);


    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });


    // Response
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// LOGIN USER

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;


    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }


    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }


    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }


    // Response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// GET CURRENT USER

export const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: req.user,
  });
};