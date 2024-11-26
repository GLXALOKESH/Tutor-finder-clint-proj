import { Router } from "express";
import {
  handleTeacherRequest,
  pendingTeacherRequest,
  requestTeacher,
  teacherInfo,
  teacherList,
  userEditInfo,
  userInfo,
} from "../controller/userGeneral.js";

const userGeneralRouter = Router();

userGeneralRouter.post("/user/info", userInfo);
userGeneralRouter.post("/teacher/info", teacherInfo);

userGeneralRouter.post("/user/edit-info", userEditInfo);

userGeneralRouter.post("/user/request-teacher", requestTeacher);

userGeneralRouter.post("/teacher/handel-request", handleTeacherRequest);

userGeneralRouter.post("/teacher/pending-requests", pendingTeacherRequest);

userGeneralRouter.post("/teacher/list", teacherList);

export default userGeneralRouter;
