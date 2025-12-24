import mongoose, { Document, Schema } from "mongoose";

const { ObjectId } = mongoose.Schema.Types

export interface ICAR extends Document {
  owner: mongoose.Types.ObjectId
  brand: string
  model: string
  image: string
  year: number
  category: string
  seating_capacity: number
  fuel_type: string
  transmission: string
  pricePerDay: number
  location: string
  description: string
  isAvailable: boolean
}
const carSchema = new Schema<ICAR>({
    owner: { type: ObjectId, ref: 'User'},
    brand: { type: String, required:true, unique:true },
    model: { type: String, required:true },
    image: { type: String, required:true },
    year: { type: Number, required:true },
    category: { type: String, required:true },
    seating_capacity: { type: Number, required:true },
    fuel_type: { type: String, required:true },
    transmission: { type: String, required:true },
    pricePerDay: { type: Number, required:true },
    location: { type: String, required:true },
    description: { type: String, required:true },
    isAvailable: { type: Boolean, default: true },

},{ timestamps: true })

export const Car = mongoose.model<ICAR>("Car", carSchema)
