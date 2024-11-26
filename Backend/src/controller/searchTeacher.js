import dotenv from "dotenv";
import { prisma } from "../models/prismaClient.js";

dotenv.config();


export const searchTeacher = async (req, res) => {
  try {
    const { searchQuery } = req.query;

    if (!searchQuery) {
      return res.status(400).json({ message: "Search query is required." });
    }

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

    // Step 2: Fetch teachers matching the search criteria
    const teachers = await prisma.teacher.findMany({
      where: {
        isVerified: true,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { district: { contains: searchQuery, mode: "insensitive" } },
          { state: { contains: searchQuery, mode: "insensitive" } },
          { subjects: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      orderBy: {
        experience: "desc",
      },
    });

    // Step 3: Combine teacher data with average rating
    const results = teachers.map((teacher) => ({
      ...teacher,
      avgRating: parseInt(
        avgRatingMap.get(teacher.teacher_id)?.toFixed(2) || 0
      ),
    }));

    message =
      results.length === 0
        ? "No teachers found."
        : "Here are the teachers list";

    res.status(200).json({ message, list: results });
  } catch (error) {
    console.error("Error searching teachers:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
