import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { generateTokens, verifyRefreshToken } from "../utils/auth.js";

// POST /api/auth/register (Public)
export const register = async (req, res) => {
  try {
    const { name, mobile, email, password, role } = req.body;

    // 1. Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    // 2. Reject duplicate emails (and mobile if provided) with 409 status
    const existingUser = await User.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        ...(mobile ? [{ mobile: mobile.trim() }] : []),
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email or mobile already registered",
      });
    }

    // 3. Hash password using bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      mobile: mobile ? mobile.trim() : undefined,
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: role || "customer",
    });

    // 4. Return user object without password or tokens
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// POST /api/auth/login (Public)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Short-lived Access Token (15m) in response body, Refresh Token (7d) in httpOnly cookie & DB
    const { accessToken, refreshToken } = generateTokens({
      userId: user._id,
      role: user.role,
    });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// POST /api/auth/refresh-token (Public/Cookie-based)
export const refreshTokenHandler = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "No refresh token provided",
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(403).json({
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({
        message: "Invalid or revoked refresh token",
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user._id,
      role: user.role,
    });

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken,
    });
  } catch (error) {
    res.status(403).json({
      message: "Invalid or expired refresh token",
      error: error.message,
    });
  }
};

// GET /api/auth/me (Protected)
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// POST /api/auth/logout (Protected)
export const logout = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshToken: null });
    }

    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, { refreshToken: null });
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
