import mongoose, { Document, Schema } from "mongoose";

export enum Role {
  OWNER = "OWNER",
  USER = "USER"
}

export interface IUSER extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  password: string
  role: Role[]
  image: string
}

const userSchema = new Schema<IUSER>({
    name: { type: String, required:true },
    email: { type: String, required:true, unique:true },
    password: { type: String, required:true },
    role: { type: [String], enum: Object.values(Role), default: [Role.USER] },
    image: { type: String, default: '' },

},{ timestamps: true })

export const User = mongoose.model<IUSER>("User", userSchema)
