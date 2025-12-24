import { Request, Response } from "express"
import { signAccessToken, signRefreshToken } from "../utils/tokens"
import { User, IUSER } from "../models/User"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { AUthRequest } from "../middleware/auth"
import { Car } from "../models/Car"

// const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

const generateToken = (userId: any)=>{
    const payload = userId
    return jwt.sign(payload, process.env.JWT_SECRET as string)
}

export const registerUser = async (req:Request, res:Response )=>{
    try {
        const {name, email, password} = req.body

        if( !name || !email || !password || password.length <8 ){
            return res.json({success: false, message: 'fill all the fields'})
        }

        const userExists = await User.findOne({email})
        if(userExists){
            return res.json({ success: false, message: "User already exists" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({name, email, password: hashedPassword})

        // const accessToken = signAccessToken(user)
        // const refreshToken = signRefreshToken(user) 
        const token = generateToken(user._id.toString())

        res.status(201).json({
            success: true,
            token
        })

    } catch (error) {
        console.error(error)
        res.json({
          success: false,
          message: error.message
        })
    }
}

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = (await User.findOne({ email })) as IUSER | null
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.json({ success: false, message: "Invalid credentials" })
    }

    // const accessToken = signAccessToken(user)
    // const refreshToken = signRefreshToken(user)
    const token = generateToken(user._id.toString())


    res.status(200).json({
      success: true,
      token
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      message: "Internal; server error"
    })
  }
}

// export const getUserData = async (req: AUthRequest, res: Response) => {
//   if (!req.user) {
//     return res.status(401).json({success: false, message: "Unauthorized" })
//   }
//   const user = await User.findById(req.user.sub).select("-password")

//   if (!user) {
//     return res.status(404).json({
//       success: false,
//       message: "User not found"
//     })
//   }

//   const { email, _id } = user as IUSER

//   res.status(200).json({success: true, message: "ok", data: user })
// }

export const getUserData = async (req: AUthRequest, res: Response) => {
  try {
    const {user} = req
    
    res.status(200).json({ success: true, user })
  } catch (error) {
      console.error(error)
      res.json({ success: false, message: error })
  }
}

// Get All Cars for the Frontend
export const getCars = async (req: AUthRequest, res: Response) => {
  try {
      const cars = await Car.find({isAvailable: true})
      res.json({ success: true, cars })

  } catch (error) {
      console.error(error)
      res.json({ success: false, message: error })
  }
}

// export const refreshToken = async (req:Request, res:Response) => {
//   try{
//     const {token } =req.body

//     if(!token){
//       return res.status(400).json({ success: false, message: "Token required"})
//     }

//     // import jwt from "jsonwebtoken"
//     const payload: any = jwt.verify(token, JWT_REFRESH_SECRET)
//     const user = await User.findById(payload.sub)

//     if(!user){
//       return res.status(403).json({ success: false, message: "Invalid or expire token"})
//     }
//     const accessToken = signAccessToken(user)

//     res.status(200).json({
//       success: true,
//       accessToken
//     })

//   }catch(err){
//     res.status(403).json({ success: false, message: "Invalid or expire token"})
//   }
// }