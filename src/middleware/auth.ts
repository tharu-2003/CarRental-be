import { NextFunction, Request, Response } from "express"
import jwt from "jsonwebtoken"
import { User } from "../models/User"
import dotenv from "dotenv"
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string

export interface AuthRequest extends Request {
  user?: any
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: "No token provided" 
    })
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
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    })
  }
}

