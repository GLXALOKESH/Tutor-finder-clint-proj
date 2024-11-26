import { prisma } from "../models/prismaClient.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const userInfo = async (req, res) => {
  try {
    // console.log(req.body);

    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid token." });
    }
    const user = await prisma.student.findUnique({
      where: {
        user_id: decodedToken.user_id,
      },
      include: {
        reviews: {
          include: {
            teacher: {
              select: {
                name: true, // Fetch only the teacher's name
              },
            },
          },
        },
        signup: {
          select: {
            user_name: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    console.log(user);

    return res.status(200).json({ message: "User Info.", user });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server Error.", error: error.message });
  }
};

export const teacherInfo = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid token." });
    }
    const teacher = await prisma.teacher.findUnique({
      where: {
        user_id: decodedToken.user_id,
      },
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }
    if (!teacher.isVerified) {
      return res.status(403).json({ message: "Teacher not verified." });
    }
    // Calculate the average rating
    const totalRatings = teacherProfile.reviews.length;
    const avgRating =
      totalRatings > 0
        ? teacherProfile.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          ) / totalRatings
        : 0; // Return null if no ratings
    teacher.avgRating = avgRating;

    delete teacher.reviews;

    console.log(teacher, "\n\n", avgRating);

    return res.status(200).json({ message: "Teacher Info.", teacher });
  } catch (err) {}
};

export const userEditInfo = async (req, res) => {
  try {
    const { token, data } = req.body;

    console.log(req.body);

    // Validate inputs
    if (!token || !data) {
      return res.status(400).json({ message: "Token and data are required." });
    }

    // Verify token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Determine account type and update user info
    if (decodedToken.account_type === "student") {
      const updatedStudent = await prisma.student.update({
        where: { user_id: decodedToken.user_id },
        data: { ...data },
      });

      return res
        .status(200)
        .json({
          message: "Student info updated successfully.",
          updatedStudent,
        });
    } else if (decodedToken.account_type === "teacher") {
      const updatedTeacher = await prisma.teacher.update({
        where: { user_id: decodedToken.user_id },
        data: { ...data },
      });

      return res
        .status(200)
        .json({
          message: "Teacher info updated successfully.",
          updatedTeacher,
        });
    } else {
      return res.status(401).json({
        message: "Invalid account type. Must be a student or a teacher.",
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server Error",
      error: err.message,
    });
  }
};

export const requestTeacher = async (req, res) => {
  try {
    const { token, teacher_id, message } = req.body;

    // Validate inputs
    if (!token || !teacher_id || !message) {
      return res
        .status(400)
        .json({ message: "Token, Teacher ID, and message are required" });
    }

    // Verify the token is valid and belongs to a student
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || decodedToken.account_type !== "student") {
      return res
        .status(401)
        .json({ message: "Invalid token or not a student" });
    }

    // Fetch the student
    const student = await prisma.student.findUnique({
      where: {
        user_id: decodedToken.user_id,
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Verify the teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: {
        teacher_id,
      },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if there's an existing request
    const existingRequest = await prisma.teacherRequest.findUnique({
      where: {
        student_id: student.student_id,
        teacher_id,
        isAccepted: false, // Only allow resending if the request is rejected
      },
    });

    // Allow resending request if the previous one was rejected
    if (existingRequest) {
      let message = existingRequest.isAccepted
        ? "Teacher has already accepted your request"
        : "You have already requested.";
      return res.status(400).json({ message });
    }

    // Create a new request if none exists
    await prisma.teacherRequest.create({
      data: {
        student_id: student.student_id,
        teacher_id,
        message,
      },
    });

    return res.status(200).json({ message: "Teacher requested successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const handleTeacherRequest = async (req, res) => {
  try {
    const { token, request_id, isRejected } = req.body;

    if (!token || !request_id) {
      return res.status(400).json({
        message: "Token and request ID are required",
      });
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || decodedToken.account_type !== "teacher") {
      return res
        .status(401)
        .json({ message: "Invalid token or not a teacher" });
    }

    const teacherRequest = await prisma.teacherRequest.findUnique({
      where: {
        request_id,
      },
    });

    if (!teacherRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (teacherRequest.teacher_id !== decodedToken.user_id) {
      return res.status(403).json({
        message: "You are not authorized to handle this request.",
      });
    }

    // Handle rejection
    if (isRejected) {
      await prisma.teacherRequest.delete({
        where: {
          request_id,
        },
      });
      return res
        .status(200)
        .json({ message: "Request rejected successfully." });
    }

    // Prevent duplicate acceptance
    if (teacherRequest.isAccepted) {
      return res.status(400).json({
        message: "This request has already been accepted.",
      });
    }

    // Accept the request
    await prisma.teacherRequest.update({
      where: {
        request_id,
      },
      data: {
        isAccepted: true,
      },
    });

    return res.status(200).json({
      message: "Request accepted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const pendingTeacherRequest = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || decodedToken.account_type !== "teacher") {
      return res
        .status(401)
        .json({ message: "Invalid token or not a Teacher." });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { user_id: decodedToken.user_id },
      select: { teacher_id: true },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }

    // Fetch pending requests for the logged in teacher
    const pendingRequests = await prisma.teacherRequest.findMany({
      where: {
        teacher_id: teacher.teacher_id,
        isAccepted: false, // Only return requests that are not accepted yet
      },
    });
    return res
      .status(200)
      .json({ message: "Pending requests.", list: pendingRequests });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const teacherList = async (req, res) => {
  try {
    const list = await prisma.teacher.findMany({
      where: {
        isVerified: true,
      },
    });
    console.log(list);

    if (!list || list.length === 0) {
      return res.status(404).json({ message: "No verified teachers found." });
    }
    return res.status(200).json({ message: "Teacher List.", list });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
