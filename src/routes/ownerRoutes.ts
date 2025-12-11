import express from 'express'
import { authenticate } from '../middleware/auth';
import { addCar, changeRoleToOwner, deleteCar, getOwnerCars, toggleCarAvailability } from '../controller/ownerController';
import upload from '../middleware/multer';

const ownerRouter = express.Router();

ownerRouter.post('/change-role', authenticate, changeRoleToOwner)
ownerRouter.post('/add-car', upload.single('image'), authenticate, addCar)
ownerRouter.get('/cars', authenticate, getOwnerCars)
ownerRouter.post('/toggle-car', authenticate, toggleCarAvailability)
ownerRouter.post('/delete-car', authenticate, deleteCar)

export default ownerRouter
