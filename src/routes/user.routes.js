import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser)
// by default export we can change its name when we importing it on 
// other file
export default router