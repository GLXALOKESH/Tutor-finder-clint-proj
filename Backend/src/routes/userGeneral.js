import { Router } from "express";
import {
  getAcceptedStudentsList,
  getStudentAcceptedTeacher,
  getTeacherList,
  getUserInfo,
  handleTeacherRequest,
  pendingTeacherRequest,
  requestTeacher,
  teacherInfo,
  teacherList,
  userEditInfo,
  userInfo,
  userTeacherReview,
} from "../controller/userGeneral.js";

const userGeneralRouter = Router();

userGeneralRouter.post("/user/info", userInfo);
userGeneralRouter.post("/teacher/info", teacherInfo);
userGeneralRouter.post("/user/edit-info", userEditInfo);
userGeneralRouter.post("/user/request-teacher", requestTeacher);
userGeneralRouter.post("/user/get-your-teacher", getStudentAcceptedTeacher);
userGeneralRouter.post("/user/get-teacher-lists", getTeacherList);
userGeneralRouter.post("/user/teacher-review", userTeacherReview);

userGeneralRouter.route("/user/:userType/:userId").get(getUserInfo).post(getUserInfo);

userGeneralRouter.post("/teacher/list", teacherList);
userGeneralRouter.post("/teacher/handel-request", handleTeacherRequest);
userGeneralRouter.post("/teacher/pending-requests", pendingTeacherRequest);
userGeneralRouter.post("/teacher/get-accetped-students", getAcceptedStudentsList)

export default userGeneralRouter;
