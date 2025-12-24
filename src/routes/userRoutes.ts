import { Router } from "express"
import {  getCars, getUserData, loginUser, registerUser } from "../controller/userController"
import { authenticate } from "../middleware/auth"


const router = Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/data", authenticate, getUserData )
router.get("/cars", getCars )

// router.post("/refresh" , refreshToken)

export default router
