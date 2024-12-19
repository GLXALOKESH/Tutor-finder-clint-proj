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
    // console.log(user);

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
    // console.log(decodedToken);

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
            review_text: true,
            review_id: true,
            rating: true,
            student: {
              select: {
                name: true,
              },
            },
          },
        },
        signup: {
          select: {
            email: true,
            user_name: true,
          },
        },
      },
    });
    // console.log(teacher);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }
    if (!teacher.isVerified) {
      return res.status(403).json({ message: "Teacher not verified." });
    }

    return res.status(200).json({ message: "Teacher Info.", teacher });
  } catch (err) {
    console.log(err);

    return res.status(400).json({ message: "Error", error: err.message });
  }
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
      const parsedData = {
        ...data,
        age: data.age !== undefined ? parseInt(data.age, 10) : undefined,
      };

      const updatedStudent = await prisma.student.update({
        where: { user_id: decodedToken.user_id },
        data: { ...parsedData },
      });

      return res.status(200).json({
        message: "Student info updated successfully.",
        updatedStudent,
      });
    } else if (decodedToken.account_type === "teacher") {
      const parsedData = {
        ...data,
        age: data.age !== undefined ? parseInt(data.age, 10) : undefined,
        experience:
          data.experience !== undefined
            ? parseFloat(data.experience)
            : undefined,
      };

      const updatedTeacher = await prisma.teacher.update({
        where: { user_id: decodedToken.user_id },
        data: { ...parsedData },
      });

      return res.status(200).json({
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

    console.log(req.body);

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

    const teacher = await prisma.teacher.findUnique({
      where: {
        user_id: decodedToken.user_id,
      },
      select: {
        teacher_id: true,
      },
    });

    if (teacherRequest.teacher_id !== teacher.teacher_id) {
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

    console.log("accepted");

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
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
    });
    return res
      .status(200)
      .json({ message: "Pending requests.", list: pendingRequests });
  } catch (error) {
    console.log(error);
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

export const getUserInfo = async (req, res) => {
  try {
    const { userType, userId } = req.params;
    // Validate inputs
    if (!userType || !userId) {
      return res.status(400).json({
        status: "error",
        message: "User ID and User Type are required.",
      });
    }

    if (!["student", "teacher"].includes(userType)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid User Type provided." });
    }

    // Fetch user based on type
    const userFetchers = {
      student: (id) =>
        prisma.student.findUnique({
          where: { student_id: id },
          select: {
            age: true,
            name: true,
            district: true,
            gender: true,
            phone_no: true,
            age: true,
            signup: {
              select: {
                email: true,
              },
            },
          },
        }),
      teacher: (id) =>
        prisma.teacher.findUnique({
          where: { teacher_id: id },
        }),
    };

    const fetchUser = userFetchers[userType];

    const user = await fetchUser(userId);

    if (userType === "teacher") {
      // Step 1: Aggregate average ratings for each teacher
      const ratingAggregates = await prisma.teacherReview.groupBy({
        by: ["teacher_id"],
        _avg: {
          rating: true, // Calculate average rating
        },
      });

      // Convert to a map for quick lookup
      const avgRatingMap = new Map(
        ratingAggregates.map((agg) => [agg.teacher_id, agg._avg.rating || 0])
      );

      // Step 3: Combine teacher data with average rating
      user.avgRating = parseInt(
        avgRatingMap.get(user.teacher_id)?.toFixed(2) || 0
      );
    }

    // Handle user not found
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found." });
    }

    // Success response
    return res.status(200).json({
      status: "success",
      message: "User Info retrieved successfully.",
      data: userType === "student" ? user : user, // Return the teacher data (with avgRating) directly
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getAcceptedStudentsList = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || decodedToken.account_type !== "teacher") {
      return res
        .status(401)
        .json({ message: "Invalid token or not a teacher." });
    }
    const teacher = await prisma.teacher.findUnique({
      where: { user_id: decodedToken.user_id },
      select: { teacher_id: true },
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found." });
    }
    const acceptedStudents = await prisma.teacherRequest.findMany({
      where: {
        teacher_id: teacher.teacher_id,
        isAccepted: true,
      },
      include: {
        student: {
          select: {
            name: true,
            phone_no: true,
            signup: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    // console.log(acceptedStudents);

    return res
      .status(200)
      .json({ message: "Accepted Students List.", list: acceptedStudents });
  } catch (error) {}
};

export const getStudentAcceptedTeacher = async (req, res) => {
  try {
    const { token } = req.body;
    // console.log(token);

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // console.log(decodedToken);

    if (!decodedToken || decodedToken.account_type !== "student") {
      return res
        .status(401)
        .json({ message: "Invalid token or not a student." });
    }

    const student = await prisma.student.findFirst({
      where: {
        user_id: decodedToken.user_id,
      },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const acceptedTeacher = await prisma.teacherRequest.findMany({
      where: {
        student_id: student.student_id,
        isAccepted: true,
      },
      include: {
        teacher: {
          select: {
            name: true,
            experience: true,
            qualification: true,
            subjects: true,
            district: true,
            state: true,
            village: true,
          },
        },
      },
    });

    // console.log(acceptedTeacher);

    if (!acceptedTeacher) {
      return res
        .status(404)
        .json({ message: "No accepted teacher found for the student." });
    }
    return res
      .status(200)
      .json({ message: "Accepted Teacher Info.", data: acceptedTeacher });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const getTeacherList = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || decodedToken.account_type !== "student") {
      return res
        .status(401)
        .json({ message: "Invalid token or not a student." });
    }

    const student = await prisma.student.findFirst({
      where: {
        user_id: decodedToken.user_id,
      },
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }
    const teacherList = await prisma.teacherRequest.findMany({
      where: {
        student_id: student.student_id,
        isAccepted: true,
      },
      select: {
        teacher_id: true,
      },
    });
    // Extracting teacher IDs from teacherList
    const excludedTeacherIds = teacherList.map((teacher) => teacher.teacher_id);

    const list = await prisma.teacher.findMany({
      where: {
        isVerified: true,
        teacher_id: { notIn: excludedTeacherIds },
      },
    });
    return res.status(200).json({ message: "Teacher List.", list });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

export const userTeacherReview = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken || decodedToken.account_type !== "student") {
      return res
        .status(401)
        .json({ message: "Invalid token or not a student." });
    }
    const { teacher_id, rating, review_text } = req.body;
    if (!teacher_id || !rating || !review_text) {
      return res
        .status(400)
        .json({ message: "Teacher ID, rating, and review text are required." });
    }
    const student = await prisma.student.findFirst({
      where: {
        user_id: decodedToken.user_id,
      },
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }
    await prisma.teacherReview.create({
      data: {
        student_id: student.student_id,
        teacher_id,
        rating: parseInt(rating, 10),
        review_text,
      },
    });
    return res.status(200).json({ message: "Review submitted successfully." });
  } catch (error) {}
};
