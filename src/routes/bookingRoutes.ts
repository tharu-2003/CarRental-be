import express from 'express'
import { changeBookingStatus, checkAvailabilityofCar, getOwnerBookings, getUserBookings } from '../controller/bookingController';
import { authenticate } from '../middleware/auth';


const bookingRouter = express.Router();

bookingRouter.post('/check-availability', checkAvailabilityofCar)
bookingRouter.post('/create', authenticate, checkAvailabilityofCar)
bookingRouter.get('/user', authenticate, getUserBookings)
bookingRouter.get('/owner', authenticate, getOwnerBookings)
bookingRouter.post('/change-status', authenticate, changeBookingStatus)

export default bookingRouter
