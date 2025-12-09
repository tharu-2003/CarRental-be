import { Router } from "express"
import {  loginUser, refreshToken, registerUser } from "../controller/userController"


const router = Router()

// register (only USER) - public
router.post("/register", registerUser)

// login - public
router.post("/login", loginUser)

router.post("/refresh" , refreshToken)

export default router
