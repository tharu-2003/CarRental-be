import mongoose, { Document, Schema } from "mongoose";

const { ObjectId } = mongoose.Schema.Types

export enum Status {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED"
}

export interface IBOOKING extends Document {
    car: mongoose.Types.ObjectId
    user: mongoose.Types.ObjectId
    owner: mongoose.Types.ObjectId
    pickupDate: Date
    returnDate: Date
    status: Status[]
    price: Number
}
const bookingSchema = new Schema<IBOOKING>({
    car: { type: ObjectId, ref: 'Car', required:true},
    user: { type: ObjectId, ref: 'User', required:true},
    owner: { type: ObjectId, ref: 'User', required:true},
    pickupDate: { type: Date, required:true },
    returnDate: { type: Date, required:true },
    status: { type: [String], enum: Object.values(Status), default: [Status.PENDING] },
    price: {type: Number, required:true}
    

},{ timestamps: true })

export const Booking = mongoose.model<IBOOKING>("Booking", bookingSchema)
