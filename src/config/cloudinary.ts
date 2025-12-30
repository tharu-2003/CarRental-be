import { v2 as cloudinary } from "cloudinary";

// sometimes .env import and config should needed 

const connectCloudinary = async () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY,
  });
  console.log("connected cloudinary ..!")
};

export default connectCloudinary