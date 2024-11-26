import { Router } from "express";
import { searchTeacher } from "../controller/searchTeacher.js";

const searchRouter = Router();

searchRouter.post("/search/teacher", searchTeacher);

export default searchRouter;
