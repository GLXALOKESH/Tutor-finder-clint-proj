import { Router } from "express";
import {
  adminLogin,
  adminSignup,
  adminTeacherList,
  adminStudentList,
  deleteReview,
  deleteTeacher,
  getTotaCountlList,
  reviewsList,
  verifyTeacher,
  deleteStudent,
  adminUnverifiedTeacherList,
} from "../controller/adminAll.js";

const adminRouter = Router();

adminRouter.post("/admin/signup", adminSignup);
adminRouter.post("/admin/login", adminLogin);

adminRouter.get("/admin/get-total-count-lists", getTotaCountlList);
adminRouter.post("/admin/reviews-list", reviewsList);
adminRouter.delete("/admin/delete-review", deleteReview);
adminRouter.post("/admin/verify-teacher", verifyTeacher);

adminRouter.post("/admin/teacher-list", adminTeacherList);
adminRouter.post("/admin/unverified-teacher-list", adminUnverifiedTeacherList);

adminRouter.post("/admin/student-list", adminStudentList);
adminRouter.delete("/admin/teacher", deleteTeacher);
adminRouter.delete("/admin/student", deleteStudent);

export default adminRouter;
