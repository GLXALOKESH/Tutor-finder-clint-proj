import { Router } from "express";
import userAuthRouter from "./userAuth.js";
import userGeneralRouter from "./userGeneral.js";
import adminRouter from "./adminAll.js";
import searchRouter from "./searchTeacher.js";
const router = Router();

router.get("/", (req, res) => {
  res.send("Hello, this is the Tutor Finder API!");
});

router.get("/health", (req, res) => { 
  res.send("API is healthy");
});

router.use("/api", userAuthRouter);
router.use("/api", userGeneralRouter);
router.use("/api", adminRouter);
router.use("/api", searchRouter);

export default router;
