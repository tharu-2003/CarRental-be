import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import mongoose from "mongoose"

import userRouter from "./routes/userRoutes"
import ownerRouter from "./routes/ownerRoutes"
import connectCloudinary from "./config/cloudinary"
import bookingRouter from "./routes/bookingRoutes"

dotenv.config()

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI as string

// Initialize Express App
const app = express()

// Connect Database
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("DB connected")
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

  connectCloudinary()

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res)=> res.send('Server is running'))
app.use("/api/v1/user", userRouter)
app.use('/api/v1/owner', ownerRouter)
app.use('/api/v1/bookings', bookingRouter)


app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))