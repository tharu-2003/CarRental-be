import { Response } from "express";
import mongoose from "mongoose";
import { Booking, Status } from "../models/Booking";
import { Car } from "../models/Car";
import { AuthRequest } from "../middleware/auth";
import { sendEmail } from "../config/emailConfig";
import { User } from "../models/User";

// ---------------- Helper Function ----------------
const checkAvailability = async (
  car: mongoose.Types.ObjectId | string,
  pickupDate: string | Date,
  returnDate: string | Date
): Promise<boolean> => {
  const bookings = await Booking.find({
    car,
    pickupDate: { $lte: returnDate },
    returnDate: { $gte: pickupDate },
  });

  return bookings.length === 0;
};

// ---------------- Check Available Cars ----------------
export const checkAvailabilityofCar = async (req: AuthRequest, res: Response) => {
  try {
    const { location, pickupDate, returnDate } = req.body as {
      location: string;
      pickupDate: string;
      returnDate: string;
    };

    const cars = await Car.find({ location, isAvailable: true });

    const availableCarsPromises = cars.map(async (car) => {
      const isAvailable = await checkAvailability(
        car._id,
        pickupDate,
        returnDate
      );

      return { ...car.toObject(), isAvailable };
    });

    let availableCars = await Promise.all(availableCarsPromises);
    availableCars = availableCars.filter((car) => car.isAvailable === true);

    res.status(200).json({
      success: true,
      message: "Available Cars",
      availableCars,
    });
  } catch (error: any) {
    console.error(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------- Create Booking ----------------
export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const _id = req.user?._id;
    const { car, pickupDate, returnDate } = req.body as {
      car: string;
      pickupDate: string;
      returnDate: string;
    };

    const isAvailable = await checkAvailability(car, pickupDate, returnDate);
    if (!isAvailable) {
      return res.json({ success: false, message: "Car is not available" });
    }

    // const carData = await Car.findById(car);
    const carData = await Car.findById(car).populate("owner");
    if (!carData)
      return res.json({ success: false, message: "Car not found" });

    const picked = new Date(pickupDate);
    const returned = new Date(returnDate);

    const noOfDays = Math.ceil(
      (returned.getTime() - picked.getTime()) / (1000 * 60 * 60 * 24)
    );

    const price = (carData.pricePerDay || 0) * noOfDays;

    await Booking.create({
      car,
      owner: carData.owner,
      user: _id,
      pickupDate,
      returnDate,
      price,
    });

    const ownerDetail = await User.findById(carData.owner)

     if (ownerDetail?.email) {
      await sendEmail({
        to: ownerDetail.email,
        subject: "New Booking Received!",
        html: `Hello ${ownerDetail.name},

              You have a new booking for your car ${carData.brand} ${carData.model}.
              Pickup Date: ${pickupDate}
              Return Date: ${returnDate}
              Price: $${price}

              Please check your dashboard for more details.

              Thank you,
              Car Rental Team`,
      });
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully!",
    });
  } catch (error: any) {
    console.error(error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------- User Bookings ----------------
export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const _id = req.user?._id;

    const bookings = await Booking.find({ user: _id })
      .populate("car")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "User Bookings",
      bookings,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------- Owner Bookings ----------------
export const getOwnerBookings = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role[0] !== "OWNER") {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const bookings = await Booking.find({ owner: req.user._id })
      .populate("car user")
      .select("-user.password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Owner Bookings",
      bookings,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ---------------- Change Booking Status ----------------
export const changeBookingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { bookingId, status } = req.body as {
      bookingId: string;
      status: Status | string;
    };

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.json({ success: false, message: "Booking not found" });

    if (booking.owner.toString() !== userId?.toString()) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    // Validate status
    if (!Object.values(Status).includes(status as Status)) {
      return res.json({ success: false, message: "Invalid status value" });
    }

    booking.status = [status as Status];
    await booking.save();

    const userDetail = await User.findById(booking.user)

    if (userDetail?.email) {
      await sendEmail({
        to: userDetail.email,
        subject: "New Booking Received!",
        html: `Hello ${userDetail.name},

              Your Booking ${booking.status}` 
      });
    }

    res.status(200).json({
      success: true,
      message: "Status Updated",
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};