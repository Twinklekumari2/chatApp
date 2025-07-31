import express from "express"
import { chechAuth, login, signup, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
const userRouter = express.Router();

userRouter.get("/check",protectRoute,chechAuth);
userRouter.post("/signup", signup);
userRouter.post("/login",login);
userRouter.put("/update-profile",protectRoute,updateProfile);

export default userRouter;