// import { Request, Response } from "express"
// import { signAccessToken, signRefreshToken } from "../utils/tokens"
// import { User, IUSER } from "../models/User"
// import bcrypt from "bcryptjs"
// import { AuthRequest } from "../middleware/auth"
// import { Car } from "../models/Car"

// const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

// export const registerUser = async (req:Request, res:Response )=>{
//     try {
//         const {name, email, password} = req.body

//         if( !name || !email || !password || password.length <8 ){
//             return res.json({success: false, message: 'fill all the fields'})
//         }

//         const userExists = await User.findOne({email})
//         if(userExists){
//             return res.json({ success: false, message: "User already exists" })
//         }

//         const hashedPassword = await bcrypt.hash(password, 10)
//         const user = await User.create({name, email, password: hashedPassword})

//         // const refreshToken = signRefreshToken(user) 
//         const accessToken = signAccessToken(user)
//         // const accessToken = generateAccessToken(user._id.toString())

//         res.status(201).json({
//             success: true,
//             accessToken
//         })

//     } catch (error) {
//         console.error(error)
//         res.json({
//           success: false,
//           message: error.message
//         })
//     }
// }

// export const loginUser = async (req: Request, res: Response) => {
//   try {
//     const { email, password } = req.body

//     const user = (await User.findOne({ email })) as IUSER | null
//     if (!user) {
//       return res.json({ success: false, message: "Invalid credentials" })
//     }

//     const valid = await bcrypt.compare(password, user.password)
//     if (!valid) {
//       return res.json({ success: false, message: "Invalid credentials" })
//     }

//     // const refreshToken = signRefreshToken(user)
//     const accessToken = signAccessToken(user)
//     // const accessToken = generateAccessToken(user._id.toString())


//     res.status(200).json({
//       success: true,
//       accessToken
//     })
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({
//       success: false,
//       message: err.message
//     })
//   }
// }

// export const getUserData = async (req: AuthRequest, res: Response) => {
//   try {
//     const {user} = req
    
//     res.status(200).json({ success: true, user })
//   } catch (error) {
//       console.error(error)
//       res.json({ success: false, message: error.message })
//   }
// }

// // Get All Cars for the Frontend
// export const getCars = async (req: Request, res: Response) => {
//   try {
//       const cars = await Car.find({isAvailable: true})
//       res.json({ success: true, cars })

//   } catch (error) {
//       console.error(error)
//       res.json({ success: false, message: error.message })
//   }
// }

// // export const refreshToken = async (req:Request, res:Response) => {
// //   try{
// //     const {token } =req.body

// //     if(!token){
// //       return res.status(400).json({ success: false, message: "Token required"})
// //     }

// //     // import jwt from "jsonwebtoken"
// //     const payload: any = jwt.verify(token, JWT_REFRESH_SECRET)
// //     const user = await User.findById(payload.sub)

// //     if(!user){
// //       return res.status(403).json({ success: false, message: "Invalid or expire token"})
// //     }
// //     const accessToken = signAccessToken(user)

// //     res.status(200).json({
// //       success: true,
// //       accessToken
// //     })

// //   }catch(err){
// //     res.status(403).json({ success: false, message: "Invalid or expire token"})
// //   }
// // }

import { Request, Response } from "express";
import { signAccessToken, signRefreshToken } from "../utils/tokens";
import { User, IUSER } from "../models/User";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middleware/auth";
import { Car, ICAR } from "../models/Car"; // assuming ICAR interface exists
import jwt from "jsonwebtoken"
import dotenv from "dotenv";

dotenv.config()

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

// Register User
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    if (!name || !email || !password || password.length < 8) {
      return res.json({ success: false, message: "fill all the fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const refreshToken = signRefreshToken(user)
    const accessToken = signAccessToken(user);

    return res.status(201).json({
      success: true,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Login User
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = (await User.findOne({ email })) as IUSER | null;
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const refreshToken = signRefreshToken(user)
    const accessToken = signAccessToken(user);

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get User Data
export const getUserData = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { user } = req;

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

// Get All Cars for the Frontend
export const getCars = async (req: Request, res: Response): Promise<Response> => {
  try {
    const cars: ICAR[] = await Car.find({ isAvailable: true });
    return res.json({ success: true, cars });
  } catch (error: any) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req:Request, res:Response) => {
  try{
    const {token } =req.body

    if(!token){
      return res.status(400).json({ success: false, message: "Token required"})
    }

    // import jwt from "jsonwebtoken"
    const payload: any = jwt.verify(token, JWT_REFRESH_SECRET)
    const user = await User.findById(payload.sub)

    if(!user){
      return res.status(403).json({ success: false, message: "Invalid or expire token"})
    }
    const accessToken = signAccessToken(user)

    res.status(200).json({
      success: true,
      accessToken
    })

  }catch(err){
    res.status(403).json({ success: false, message: "Invalid or expire token"})
  }
}
