import { Router } from "express"
import {  getUserData, loginUser, registerUser } from "../controller/userController"
import { authenticate } from "../middleware/auth"


const router = Router()

// register (only USER) - public
router.post("/register", registerUser)

// login - public
router.post("/login", loginUser)

router.get("/data", authenticate, getUserData )

// router.post("/refresh" , refreshToken)

export default router
