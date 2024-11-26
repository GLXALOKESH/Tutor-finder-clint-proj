import { prisma } from "../models/prismaClient.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const generateToken = async (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload for token generation");
  }
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "10d" });
  // console.log(token);
  return token;
};

export const userSignup = async (req, res) => {
  try {
    // console.log(req.body);

    const {
      name,
      email,
      password,
      user_name,
      gender,
      age,
      village,
      district,
      state,
      pin,
      phone_no,
      account_type,
    } = req.body;

    if (
      !name ||
      !email ||
      !password ||
      !user_name ||
      !gender ||
      !age ||
      !village ||
      !district ||
      !state ||
      !pin ||
      !phone_no ||
      !account_type
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const isExist = await prisma.signup.findUnique({
      where: {
        email,
      },
    });

    if (isExist) {
      return res.status(400).json({ message: "Email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    if (account_type === "student") {
      try {
        // Create the Signup entry
        const snup = await prisma.signup.create({
          data: {
            user_name,
            email,
            password: hashedPassword,
            account_type,
          },
        });

        // Create the Student entry
        const newUser = await prisma.student.create({
          data: {
            user_id: snup.user_id, // Linking to Signup model
            name,
            gender,
            age: parseInt(age),
            village,
            district,
            state,
            pin,
            phone_no,
          },
        });

        res
          .status(201)
          .json({ message: "Student registered successfully!", newUser });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Error creating student.", error: error.message });
      }
    } else if (account_type === "teacher") {
      const { experience, qualification, subjects } = req.body;
      if (!experience || !qualification || !subjects) {
        return res.status(400).json({
          message: "Experience, qualification and subjects are required",
        });
      }
      if (subjects.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one subject is required" });
      }
      try {
        // Create the Signup entry
        const snup = await prisma.signup.create({
          data: {
            user_name,
            email,
            password: hashedPassword,
            account_type,
          },
        });

        // Create the Teacher entry
        const newUser = await prisma.teacher.create({
          data: {
            user_id: snup.user_id, // Linking to Signup model
            name,
            gender,
            age: parseInt(age),
            village,
            district,
            state,
            pin,
            phone_no,
            subjects,
            experience: parseFloat(experience),
            qualification, // Include additional field for Teacher
            isVerified: false, // Default value
          },
        });

        res
          .status(201)
          .json({ message: "Teacher registered successfully!", newUser });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ message: "Error creating teacher.", error: error.message });
      }
    } else {
      res.status(400).json({ message: "Invalid account type." });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error in Backend.", error: error.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await prisma.signup.findUnique({
      where: {
        email,
      },
      include: {
        teacher: true,
        student: true,
      },
    });

    // console.log(user);

    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials." });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Password." });
    }

    if (user.account_type === "teacher" && !user.teacher?.isVerified) {
      return res
        .status(403)
        .json({ message: "Admin hasn't verified your account." });
    }

    const payload = {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      account_type: user.account_type,
    };

    const token = await generateToken(payload);
    res.json({ message: "Login successful!", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error in backend.", error: err.message });
  }
};

export const DeleteAccount = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validate input
    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Token and password are required." });
    }

    // Verify JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Find the user by ID
    const user = await prisma.signup.findUnique({
      where: {
        user_id: payload.user_id,
      },
      include: {
        student: true,
        teacher: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    // Check account type and handle specific deletions
    if (user.account_type === "student" && user.student) {
      // Delete reviews made by the student
      await prisma.teacherReview.deleteMany({
        where: {
          student_id: user.student.student_id,
        },
      });
    }
    // Delete the user and cascade deletions for related records
    await prisma.signup.delete({
      where: {
        user_id: payload.user_id,
      },
    });

    return res
      .status(200)
      .json({ message: "Account and all related data deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while deleting the account.",
      error: error.message,
    });
  }
};

export const verifyPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload) {
      return res.status(401).json({ message: "Invalid token." });
    }

    const user = await prisma.signup.findUnique({
      where: {
        user_id: payload.user_id,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }
    return res.json({ message: "Password is valid." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error in backend.", error: error.message });
  }
};
