import { Router } from "express";
import {
  userLogin,
  userSignup,
  verifyPassword,
  DeleteAccount,
} from "../controller/userAuth.js";

const userAuthRouter = Router();

userAuthRouter.post("/auth/signup", userSignup);
userAuthRouter.post("/auth/login", userLogin);
userAuthRouter.post("/auth/delete-account", DeleteAccount);
userAuthRouter.post("/auth/verify-password", verifyPassword);

export default userAuthRouter;
