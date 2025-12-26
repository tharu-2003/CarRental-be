import { Request, Response } from "express";
import { Booking } from "../models/Booking"
import { Car } from "../models/Car";

// Function to Check Availability of Car for a given Data
const checkAvailability = async (car, pickupDate, returnDate) =>{
    const bookings = await Booking.find({
        car,
        pickupDate: {$lte: returnDate},
        returnDate: {$gte: pickupDate},
    })
    return bookings.length === 0;
}

// Api to Check Availability of Cars for the given Date and location
export const checkAvailabilityofCar = async (req:Request, res:Response) => {
    try {
        const {location, pickupDate, returnDate } = req.body
        
        // fetch all available cars for the given location
        const cars = await Car.find({location, isAvailable: true})

        // check car availability for the given date range using promise
        const availableCarsPromises = cars.map(async (car) =>{
            const isAvailable = await checkAvailability(car._id, pickupDate, returnDate)
            // return {...cars._doc, isAvailable: isAvailable}
            return { ...car.toObject(), isAvailable };
        })
        
        let availableCars = await Promise.all(availableCarsPromises);
        availableCars = availableCars.filter(car => car.isAvailable === true)

        res.status(200).json({
            success: true,
            message: "Available Cars",
            availableCars,
        })

    } catch (error) {
        console.error(error)
        res.json({
            success: false,
            message: error.message,
        });
    }
}

// Api to Create Booking
export const createBooking = async (req:Request, res:Response) => {
    try {
        const {_id} = req.user;
        const {car, pickupDate, returnDate } = req.body;

        const isAvailable = await checkAvailability(car, pickupDate, returnDate)
        if(!isAvailable){
            res.json({success: false, message: "Car is not available"})
        }

        const carData = await Car.findById(car)

        // Calculate price based on pickupDate and returnDate
        const picked = new Date(pickupDate)
        const returned = new Date(returnDate)
        const noOfDays = Math.ceil((returned - picked) / (1000 * 60 * 60 * 24))
        const price = carData?.pricePerDay * noOfDays

        await Booking.create({car, owner: carData?.owner, user:_id, pickupDate, returnDate, price})

        res.status(201).json({
            success: true,
            message: "Booking created successfully!",
            
        });

    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}


// Api to List User Bookings
export const getUserBookings = async (req:Request, res:Response) => {
    try {
        const {_id} = req.user;
        const bookings = await Booking.find({ user: _id}).populate("car").sort({createdAt: -1})

        res.status(200).json({
            success: true,
            message: "User Bookings",
            bookings
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Api to List Owner Bookings
export const getOwnerBookings = async (req:Request, res:Response) => {
    try {
        if(req.user.role[0] !== 'OWNER'){
            return res.json({ success: false, message: 'Unauthorized'})
        }
        const bookings = await Booking.find({owner: req.user._id}).populate('car user').select('-user.password').sort({createdAt: -1})
        res.status(200).json({
            success: true,
            message: "Owner Bookings",
            bookings
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Api to change booking status
export const changeBookingStatus = async (req:Request, res:Response) => {
    try {
        const {_id} = req.user;
        const {bookingId, status} = req.body

        const booking = await Booking.findById(bookingId)

        if(booking.owner.toString() !== _id){
            return res.json({ success: false, message: 'Unauthorized'})
        }

        booking.status = status;
        await booking?.save()

        res.status(200).json({
            success: true,
            message: "Status Updated",
        });
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
} 
