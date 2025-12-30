// import { Request, Response } from "express"
// import { User } from "../models/User";
// import { v2 as cloudinary } from "cloudinary";
// import { Car } from "../models/Car";
// import { AuthRequest } from "../middleware/auth";
// import { Booking } from "../models/Booking";



// // Api to Change Role of User
// export const changeRoleToOwner = async (req:AuthRequest, res:Response)=>{
//     try {
//         const {_id} = req.user;
//         await User.findByIdAndUpdate(_id, {role: "OWNER"})
//         res.json({success: true, message: 'Now you can list cars'})
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// }

// // Api to List Car
// export const addCar = async (req:AuthRequest, res:Response)=>{
//     try {
//         const {_id} = req.user;
//         let car = JSON.parse(req.body.carData);
//         const imageFile = req.file;

//         let image = "";


//         // Upload Image to cloudinary
//         if (imageFile) {

//             const result:any = await new Promise((resole, reject) => {
//                 const upload_stream = cloudinary.uploader.upload_stream(
//                     {folder: "cars"},
//                     (error, result) => {
//                         if(error) {
//                             return reject(error)
//                         }
//                         resole(result) // success return
//                     }
//                 )
//                 upload_stream.end(imageFile?.buffer)
//             })
//             image = result.secure_url
//         }

//         await Car.create({...car, owner: _id, image})

//         res.status(201).json({
//             success: true,
//             message: "Car Added successfully!",
//             data: image,
//         });


//     } catch (error) {
//         console.error(error);
//         res.json({
//             success: false,
//             message: error.message,
//         });
//     }
// }

// // Api to List Owner Cars
// export const getOwnerCars = async (req:AuthRequest, res:Response)=>{
//     try {
//         const {_id} = req.user;
//         const cars = await Car.find({owner: _id})
        
//         res.status(200).json({
//             success: true,
//             message: "Cars data",
//             cars
//         })
        
//     } catch (error) {
//         console.error(error);
//         res.json({
//             success: false,
//             message: error.message,
//         });
//     }
// }

// // Api to Toggle Car Availability
// export const toggleCarAvailability = async (req:AuthRequest, res:Response)=>{
//     try {
//         const {_id} = req.user;
//         const {carId} = req.body;
//         const car = await Car.findById(carId)

//         // Checking is car belongs to the user
//         if(car.owner.toString() !== _id.toString()){
//             return res.json({ success: false, message: "Unauthorized"})
//         }

//         car.isAvailable = !car.isAvailable;
//         await car.save()
        
//         res.status(200).json({
//             success: true,
//             message: "Availability Toggled",
//         })
        
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// }

// // Api to Delete a Car
// export const deleteCar = async (req:AuthRequest, res:Response)=>{
//     try {
//         const {_id} = req.user;
//         const {carId} = req.body;
//         const car = await Car.findById(carId)

//         // Checking is car belongs to the user
//         if(car.owner.toString() !== _id.toString()){
//             return res.json({ success: false, message: "Unauthorized"})
//         }

//         car.owner = null;
//         car.isAvailable = false

//         await car.save()
        
//         res.status(200).json({
//             success: true,
//             message: "Car Removed",
//         })
        
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// }

// // Api to get Dashboard Data
// export const getDashboardData = async (req:AuthRequest, res:Response)=>{
//     try {
//         const {_id, role } = req.user;
        
//         if(role[0] !== 'OWNER' ){
//             return res.json({ success: false, message: "Unauthorized"})
//         }

//         const cars = await Car.find({owner: _id})
//         const bookings = await Booking.find({owner: _id}).populate('car').sort({ createdAt: -1 })
        
//         // const pendingBookings = await Booking.find({owner: _id, status: 'PENDING'})
//         // const completedBookings = await Booking.find({owner: _id, status: 'CONFIRMED'})
        
//         const pendingBookings = await Booking.find({ owner: _id, status: { $in: ['PENDING'] } });
//         const completedBookings = await Booking.find({ owner: _id, status: { $in: ['CONFIRMED'] } });

//         // Calculate monthlyRevenue from bookings where status is confirmed
//         const monthlyRevenue = bookings.filter(booking => booking.status.includes('CONFIRMED')).reduce((acc, booking) => acc + booking.price, 0);


//         const dashboardData = {
//             totalCars: cars.length,
//             totalBookings: bookings.length,
//             pendingBookings: pendingBookings.length,
//             completedBookings: completedBookings.length,
//             recentBookings: bookings.slice(0,3),
//             monthlyRevenue
//         }

//         res.json({ success: true, dashboardData })
        
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// }


// // Api to update user image

// export const updateUserImage = async (req:AuthRequest, res:Response) => {
//     try {
//         const {_id } = req.user;
//         const imageFile = req.file;

//         let image = "";


//         // Upload Image to cloudinary
//         if (imageFile) {

//             const result:any = await new Promise((resole, reject) => {
//                 const upload_stream = cloudinary.uploader.upload_stream(
//                     {folder: "users"},
//                     (error, result) => {
//                         if(error) {
//                             return reject(error)
//                         }
//                         resole(result) // success return
//                     }
//                 )
//                 upload_stream.end(imageFile?.buffer)
//             })
//             image = result.secure_url
//         }

//         await User.findByIdAndUpdate(_id, {image})

//         res.status(201).json({
//             success: true,
//             message: "Image Updated successfully!",
//             data: image,
//         });
        
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// }

import { Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Car } from "../models/Car";
import { AuthRequest } from "../middleware/auth";
import { Booking, Status } from "../models/Booking";

// ---------------- Change Role ----------------
export const changeRoleToOwner = async (req: AuthRequest, res: Response) => {
  try {
    const _id = req.user?._id;
    await User.findByIdAndUpdate(_id, { role: "OWNER" });

    res.json({ success: true, message: "Now you can list cars" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Add Car ----------------
export const addCar = async (req: AuthRequest, res: Response) => {
  try {
    const _id = req.user?._id;
    const imageFile = req.file;

    let car = JSON.parse(req.body.carData) as any;
    let image = "";

    if (imageFile) {
      const result: any = await new Promise((resolve, reject) => {
        const upload_stream = cloudinary.uploader.upload_stream(
          { folder: "cars" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        upload_stream.end(imageFile.buffer);
      });

      image = result.secure_url;
    }

    await Car.create({ ...car, owner: _id, image });

    res.status(201).json({
      success: true,
      message: "Car Added successfully!",
      data: image,
    });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- Owner Cars ----------------
export const getOwnerCars = async (req: AuthRequest, res: Response) => {
  try {
    const _id = req.user?._id;

    const cars = await Car.find({ owner: _id });

    res.status(200).json({
      success: true,
      message: "Cars data",
      cars,
    });
  } catch (error: any) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ---------------- Toggle Availability ----------------
export const toggleCarAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const _id = req.user?._id;
    const { carId }: { carId: string } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.json({ success: false, message: "Car not found" });

    if (car.owner?.toString() !== _id?.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    car.isAvailable = !car.isAvailable;
    await car.save();

    res.status(200).json({ success: true, message: "Availability Toggled" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Delete Car ----------------
export const deleteCar = async (req: AuthRequest, res: Response) => {
  try {
    const _id = req.user?._id;
    const { carId }: { carId: string } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.json({ success: false, message: "Car not found" });

    if (car.owner?.toString() !== _id?.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    car.owner = null as unknown as mongoose.Types.ObjectId;
    car.isAvailable = false;

    await car.save();

    res.status(200).json({ success: true, message: "Car Removed" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Dashboard Data ----------------
export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    const { _id, role } = req.user!;

    if (role[0] !== "OWNER") {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const cars = await Car.find({ owner: _id });
    const bookings = await Booking.find({ owner: _id })
      .populate("car")
      .sort({ createdAt: -1 });

    const pendingBookings = await Booking.find({
      owner: _id,
      status: { $in: ["PENDING"] },
    });

    const completedBookings = await Booking.find({
      owner: _id,
      status: { $in: ["CONFIRMED"] },
    });

    const monthlyRevenue = bookings
        .filter(b => b.status.includes(Status.CONFIRMED))
        .reduce((acc, b) => acc + b.price.valueOf(), 0);


    res.json({
      success: true,
      dashboardData: {
        totalCars: cars.length,
        totalBookings: bookings.length,
        pendingBookings: pendingBookings.length,
        completedBookings: completedBookings.length,
        recentBookings: bookings.slice(0, 3),
        monthlyRevenue,
      },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Update User Image ----------------
export const updateUserImage = async (req: AuthRequest, res: Response) => {
  try {
    const _id = req.user?._id;
    const imageFile = req.file;
    let image = "";

    if (imageFile) {
      const result: any = await new Promise((resolve, reject) => {
        const upload_stream = cloudinary.uploader.upload_stream(
          { folder: "users" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        upload_stream.end(imageFile.buffer);
      });

      image = result.secure_url;
    }

    await User.findByIdAndUpdate(_id, { image });

    res.status(201).json({
      success: true,
      message: "Image Updated successfully!",
      data: image,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
