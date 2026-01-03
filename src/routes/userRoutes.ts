import { Router } from "express"
import {  forgetPassword, getCars, getUserData, loginUser, refreshToken, registerUser, resetPassword } from "../controller/userController"
import { authenticate } from "../middleware/auth"


const router = Router()

router.post("/register", registerUser)
router.post("/login", loginUser)
router.get("/data", authenticate, getUserData )
router.get("/cars", getCars )

router.post("/refresh" , refreshToken)

router.post('/forget-password', forgetPassword);
router.put('/reset-password', resetPassword);

export default router
