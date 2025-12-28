// import { NextFunction, Request, Response } from "express"
// import jwt from "jsonwebtoken"
// import dotenv from "dotenv"

// dotenv.config()

// const JWT_SECRET = process.env.JWT_SECRET as string

// export interface AUthRequest extends Request {
//   user?: any
// }

// export const authenticate = (
//   req: AUthRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const authHeader = req.headers.authorization
//   if (!authHeader) {
//     return res.status(401).json({ message: "No token provided" })
//   }
//   // Bearer dgcfhvgjygukhiluytkuy
//   const token = authHeader.split(" ")[1] // ["Bearer", "dgcfhvgjygukhiluytkuy"]

//   try {
//     const payload = jwt.verify(token, JWT_SECRET)
//     req.user = payload
//     next()
//   } catch (err) {
//     console.error(err)
//     res.status(401).json({
//       message: "Invalid or expire token"
//     })
//   }
// }
// // =================================================================================

import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User"



const JWT_SECRET = process.env.JWT_SECRET as any

export interface AUthRequest extends Request {
  user?: any
}

export const authenticate = async (
  req: AUthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.json({ success: false, message: "No token provided" })
  }

  const token = authHeader.split(" ")[1] // ["Bearer", "dgcfhvgjygukhiluytkuy"]
  
  try {
    // const userId = jwt.decode(token, JWT_SECRET)

    const decoded: any = jwt.verify(token, JWT_SECRET);  // verifies + checks expiry
    const userId = decoded.sub;   // because you used sub in token

    if(!userId){
      return res.json({ success: false, message: "No token provided" })
    }

    req.user = await User.findById(userId).select('-password')
    next();

  } catch (err) {
    console.error(err)
    res.json({
      success: false,
      message: "Invalid or expire token"
    })
  }
}

