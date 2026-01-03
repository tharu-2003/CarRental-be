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

    const ownerDetail = await User.findById(carData.owner);

    if (ownerDetail?.email) {
      await sendEmail({
        to: ownerDetail.email,
        subject: "🎉 New Booking Received!",
        html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                          <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                              🚗 New Booking Alert!
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                              You've received a new rental request
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Greeting -->
                        <tr>
                          <td style="padding: 30px 40px 20px 40px;">
                            <p style="margin: 0; color: #2d3748; font-size: 18px; line-height: 1.6;">
                              Hello <strong>${ownerDetail.name}</strong>,
                            </p>
                            <p style="margin: 15px 0 0 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                              Great news! Your vehicle has been booked.
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Car Details Card -->
                        <tr>
                          <td style="padding: 0 40px 30px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-radius: 8px; border-left: 4px solid #667eea;">
                              <tr>
                                <td style="padding: 25px;">
                                  <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 20px; font-weight: 600;">
                                    ${carData.brand} ${carData.model}
                                  </h2>
                                  <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                      <td style="padding: 8px 0; color: #4a5568; font-size: 15px;">
                                        <strong style="color: #2d3748;">📅 Pickup Date:</strong>
                                      </td>
                                      <td style="padding: 8px 0; color: #667eea; font-size: 15px; text-align: right; font-weight: 600;">
                                        ${new Date(pickupDate).toLocaleDateString('en-US', { 
                                          weekday: 'short', 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style="padding: 8px 0; color: #4a5568; font-size: 15px;">
                                        <strong style="color: #2d3748;">📅 Return Date:</strong>
                                      </td>
                                      <td style="padding: 8px 0; color: #667eea; font-size: 15px; text-align: right; font-weight: 600;">
                                        ${new Date(returnDate).toLocaleDateString('en-US', { 
                                          weekday: 'short', 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td style="padding: 8px 0; color: #4a5568; font-size: 15px;">
                                        <strong style="color: #2d3748;">⏱️ Duration:</strong>
                                      </td>
                                      <td style="padding: 8px 0; color: #4a5568; font-size: 15px; text-align: right;">
                                        ${noOfDays} ${noOfDays === 1 ? 'day' : 'days'}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td colspan="2" style="padding: 15px 0 0 0; border-top: 1px solid #e2e8f0;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                          <tr>
                                            <td style="padding: 8px 0; color: #2d3748; font-size: 16px;">
                                              <strong>💰 Total Amount:</strong>
                                            </td>
                                            <td style="padding: 8px 0; color: #48bb78; font-size: 24px; text-align: right; font-weight: 700;">
                                              $${price.toFixed(2)}
                                            </td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        
                        <!-- CTA Button -->
                        <tr>
                          <td style="padding: 0 40px 40px 40px; text-align: center;">
                            <a href="#" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">
                              View Dashboard →
                            </a>
                            <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px;">
                              Check your dashboard for complete booking details and customer information
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="padding: 30px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
                              Thank you for using our platform!<br>
                              <strong style="color: #4a5568;">Car Rental Team</strong>
                            </p>
                            <p style="margin: 15px 0 0 0; color: #a0aec0; font-size: 12px; text-align: center;">
                              This is an automated notification. Please do not reply to this email.
                            </p>
                          </td>
                        </tr>
                        
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
              `,
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

    const booking = await Booking.findById(bookingId).populate('car');
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

    const userDetail = await User.findById(booking.user);

    if (userDetail?.email) {
      // Dynamic content based on status
      const statusConfig = {
        PENDING: {
          emoji: '⏳',
          color: '#f59e0b',
          gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          title: 'Booking Under Review',
          message: 'Your booking is currently being reviewed by the car owner.',
          icon: '🔍'
        },
        CONFIRMED: {
          emoji: '✅',
          color: '#10b981',
          gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
          title: 'Booking Confirmed!',
          message: 'Great news! Your booking has been confirmed by the car owner.',
          icon: '🎉'
        },
        CANCELLED: {
          emoji: '❌',
          color: '#ef4444',
          gradient: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
          title: 'Booking Cancelled',
          message: 'Unfortunately, your booking has been cancelled.',
          icon: '😔'
        }
      };

      const config = statusConfig[status as keyof typeof statusConfig];
      const carData = booking.car as any;

      await sendEmail({
        to: userDetail.email,
        subject: `${config.emoji} Booking Status Update - ${status}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: ${config.gradient}; padding: 40px 30px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">${config.icon}</div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                          ${config.title}
                        </h1>
                        <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                          Your booking status has been updated
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                      <td style="padding: 30px 40px 20px 40px;">
                        <p style="margin: 0; color: #2d3748; font-size: 18px; line-height: 1.6;">
                          Hello <strong>${userDetail.name}</strong>,
                        </p>
                        <p style="margin: 15px 0 0 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                          ${config.message}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Status Badge -->
                    <tr>
                      <td style="padding: 0 40px 20px 40px; text-align: center;">
                        <div style="display: inline-block; padding: 12px 30px; background-color: ${config.color}; color: #ffffff; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                          ${config.emoji} ${status}
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Booking Details Card -->
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-radius: 8px; border-left: 4px solid ${config.color};">
                          <tr>
                            <td style="padding: 25px;">
                              <h2 style="margin: 0 0 15px 0; color: #2d3748; font-size: 20px; font-weight: 600;">
                                Booking Details
                              </h2>
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="padding: 8px 0; color: #4a5568; font-size: 15px;">
                                    <strong style="color: #2d3748;">🚗 Vehicle:</strong>
                                  </td>
                                  <td style="padding: 8px 0; color: #667eea; font-size: 15px; text-align: right; font-weight: 600;">
                                    ${carData?.brand || 'N/A'} ${carData?.model || ''}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #4a5568; font-size: 15px;">
                                    <strong style="color: #2d3748;">📅 Pickup Date:</strong>
                                  </td>
                                  <td style="padding: 8px 0; color: #4a5568; font-size: 15px; text-align: right;">
                                    ${new Date(booking.pickupDate).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #4a5568; font-size: 15px;">
                                    <strong style="color: #2d3748;">📅 Return Date:</strong>
                                  </td>
                                  <td style="padding: 8px 0; color: #4a5568; font-size: 15px; text-align: right;">
                                    ${new Date(booking.returnDate).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px 0; color: #4a5568; font-size: 15px;">
                                    <strong style="color: #2d3748;">🔖 Booking ID:</strong>
                                  </td>
                                  <td style="padding: 8px 0; color: #718096; font-size: 14px; text-align: right; font-family: monospace;">
                                    #${booking._id.toString().slice(-8).toUpperCase()}
                                  </td>
                                </tr>
                                ${booking.price ? `
                                <tr>
                                  <td colspan="2" style="padding: 15px 0 0 0; border-top: 1px solid #e2e8f0;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td style="padding: 8px 0; color: #2d3748; font-size: 16px;">
                                          <strong>💰 Total Amount:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #48bb78; font-size: 24px; text-align: right; font-weight: 700;">
                                          $${booking.price.toFixed(2)}
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                ` : ''}
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Additional Info based on status -->
                    ${status === 'CONFIRMED' ? `
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0;">
                          <tr>
                            <td style="padding: 20px; text-align: center;">
                              <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.6;">
                                <strong>✨ What's Next?</strong><br>
                                Please arrive at the pickup location on time. Make sure to bring your driver's license and payment method.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ` : ''}
                    
                    ${status === 'CANCELLED' ? `
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
                          <tr>
                            <td style="padding: 20px; text-align: center;">
                              <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">
                                <strong>Need Help?</strong><br>
                                If you have any questions about this cancellation, please contact our support team or the car owner directly.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ` : ''}
                    
                    ${status === 'PENDING' ? `
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
                          <tr>
                            <td style="padding: 20px; text-align: center;">
                              <p style="margin: 0; color: #92400e; font-size: 15px; line-height: 1.6;">
                                <strong>⏰ Please Wait</strong><br>
                                The car owner will review your booking request shortly. You'll receive another email once they make a decision.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ` : ''}
                    
                    <!-- CTA Button -->
                    <tr>
                      <td style="padding: 0 40px 40px 40px; text-align: center;">
                        <a href="#" style="display: inline-block; padding: 14px 40px; background: ${config.gradient}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);">
                          View Booking Details →
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
                          Thank you for choosing our service!<br>
                          <strong style="color: #4a5568;">Car Rental Team</strong>
                        </p>
                        <p style="margin: 15px 0 0 0; color: #a0aec0; font-size: 12px; text-align: center;">
                          This is an automated notification. Please do not reply to this email.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
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