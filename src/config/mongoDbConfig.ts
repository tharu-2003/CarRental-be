import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected' , ()=> console.log("Database connected ..!"))
        await mongoose.connect(`${process.env.MONGODB_URI}/car_rental`)
    } catch (error) {
        console.log((error as Error).message)   
    }
}

export default connectDB
