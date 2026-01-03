import { Request, Response } from "express";
import { signAccessToken, signRefreshToken } from "../utils/tokens";
import { User, IUSER } from "../models/User";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middleware/auth";
import { Car, ICAR } from "../models/Car"; // assuming ICAR interface exists
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { sendEmail } from "../config/emailConfig";
import crypto from 'crypto';
import connectDB from "../config/mongoDbConfig";
dotenv.config()

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

// Register User
export const registerUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };

    if (!name || !email || !password || password.length < 8) {
      return res.json({ success: false, message: "fill all the fields" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const refreshToken = signRefreshToken(user)
    const accessToken = signAccessToken(user);

    return res.status(201).json({
      success: true,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Login User
export const loginUser = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    connectDB();
    const user = (await User.findOne({ email })) as IUSER | null;
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const refreshToken = signRefreshToken(user)
    const accessToken = signAccessToken(user);

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get User Data
export const getUserData = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { user } = req;

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

// Get All Cars for the Frontend
// export const getCars = async (req: Request, res: Response): Promise<Response> => {
//   try {
//     const cars: ICAR[] = await Car.find({ isAvailable: true });
//     return res.json({ success: true, cars });
//   } catch (error: any) {
//     console.error(error);
//     return res.json({ success: false, message: error.message });
//   }
// };

// Get All Cars for the Frontend (Paginated)
export const getCars = async (req: Request, res: Response): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 6

    const skip = (page - 1) * limit

    const totalCars = await Car.countDocuments({ isAvailable: true })

    const cars: ICAR[] = await Car.find({ isAvailable: true })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    return res.json({
      success: true,
      cars,
      pagination: {
        totalCars,
        page,
        limit,
        totalPages: Math.ceil(totalCars / limit),
        hasNextPage: page * limit < totalCars,
        hasPrevPage: page > 1
      }
    })
  } catch (error: any) {
    console.error(error)
    return res.status(500).json({ success: false, message: error.message })
  }
}


export const refreshToken = async (req:Request, res:Response) => {
  try{
    const {token } =req.body

    if(!token){
      return res.status(400).json({ success: false, message: "Token required"})
    }

    // import jwt from "jsonwebtoken"
    const payload: any = jwt.verify(token, JWT_REFRESH_SECRET)
    const user = await User.findById(payload.sub)

    if(!user){
      return res.status(403).json({ success: false, message: "Invalid or expire token"})
    }
    const accessToken = signAccessToken(user)

    res.status(200).json({
      success: true,
      accessToken
    })

  }catch(err){
    res.status(403).json({ success: false, message: "Invalid or expire token"})
  }
}

export const forgetPassword = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email is required.' 
        });
    }

    try {
        const result = await User.findOne({email})

        if (!result) {
            return res.status(200).json({ 
                success: true, 
                message: 'If an account with that email exists, a password reset link has been sent.' 
            });
        }

        // Generate simple random token - NO HASHING
        const resetToken = crypto.randomBytes(32).toString('hex');
        
        // Store plain token directly
        result.passwordResetToken = resetToken;
        result.passwordResetExpires = Date.now() + 3600000; // 1 hour

        await result.save({ validateBeforeSave: false });

        console.log('✅ Token saved:', resetToken);

        const resetURL = `http://localhost:5173/reset-password/${resetToken}`;

        const resetEmailHtml = `
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
                        <div style="font-size: 48px; margin-bottom: 10px;">🔐</div>
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                          Password Reset Request
                        </h1>
                        <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                          We received a request to reset your password
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Greeting -->
                    <tr>
                      <td style="padding: 30px 40px 20px 40px;">
                        <p style="margin: 0; color: #2d3748; font-size: 18px; line-height: 1.6;">
                          Hello <strong>${result.name || 'User'}</strong>,
                        </p>
                        <p style="margin: 15px 0 0 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                          We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Info Box -->
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                          <tr>
                            <td style="padding: 20px;">
                              <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                <strong>⚡ Quick reminder:</strong> This password reset link will expire in <strong>1 hour</strong> for security reasons.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                      <td style="padding: 0 40px 30px 40px; text-align: center;">
                        <a href="${resetURL}" style="display: inline-block; padding: 16px 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                          Reset My Password
                        </a>
                        <p style="margin: 20px 0 0 0; color: #718096; font-size: 14px; line-height: 1.6;">
                          This button will redirect you to our secure password reset page
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Alternative Link -->
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-radius: 8px;">
                          <tr>
                            <td style="padding: 20px;">
                              <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; font-weight: 600;">
                                Button not working? Copy and paste this link:
                              </p>
                              <p style="margin: 0; color: #667eea; font-size: 13px; word-break: break-all; line-height: 1.5;">
                                ${resetURL}
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Security Notice -->
                    <tr>
                      <td style="padding: 0 40px 30px 40px;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
                          <tr>
                            <td style="padding: 20px;">
                              <p style="margin: 0 0 10px 0; color: #991b1b; font-size: 14px; font-weight: 600;">
                                🛡️ Security Tips
                              </p>
                              <ul style="margin: 0; padding-left: 20px; color: #7f1d1d; font-size: 13px; line-height: 1.6;">
                                <li style="margin-bottom: 5px;">Never share your password with anyone</li>
                                <li style="margin-bottom: 5px;">If you didn't request this reset, please contact support immediately</li>
                                <li>We will never ask for your password via email</li>
                              </ul>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0; color: #718096; font-size: 14px; line-height: 1.6; text-align: center;">
                          Need help? Contact our support team<br>
                          <strong style="color: #4a5568;">Car Rental Team</strong>
                        </p>
                        <p style="margin: 15px 0 0 0; color: #a0aec0; font-size: 12px; text-align: center;">
                          This is an automated email. Please do not reply to this message.<br>
                          © ${new Date().getFullYear()} Car Rental. All rights reserved.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                  
                  <!-- Email Footer Note -->
                  <table width="600" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                    <tr>
                      <td style="padding: 0 20px; text-align: center;">
                        <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
                          You received this email because a password reset was requested for your account.<br>
                          If you didn't make this request, please ignore this email.
                        </p>
                      </td>
                    </tr>
                  </table>
                  
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

        try {
            await sendEmail({
                to: result.email,
                subject: '🔐 Password Reset Request - Car Rental',
                html: resetEmailHtml,
            });

            res.status(200).json({
                success: true,
                message: 'Password reset link sent successfully.',
            });
        } catch (err) {
            result.passwordResetToken = undefined;
            result.passwordResetExpires = undefined;
            await result.save({ validateBeforeSave: false });

            console.error('Email sending failed:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error sending email. Please try again later.' 
            });
        }

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error.' 
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const token = req.headers["x-reset-token"] as string;
    const { newPassword } = req.body;

    console.log('🔄 Reset password request');
    console.log('   Token:', token ? `${token.substring(0, 20)}...` : 'None');
    console.log('   New password length:', newPassword?.length);

    if (!token) {
        console.log('❌ No token provided');
        return res.status(400).json({
            success: false,
            message: 'Reset token missing.'
        });
    }

    if (!newPassword || newPassword.length < 6) {
        console.log('❌ Invalid password length');
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long.'
        });
    }

    try {
        // Find account
        console.log('🔍 Searching for account with token...');
        let account = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        let accountType = 'User';
        
        if (!account) {
            console.log('🔍 Not found in User, searching Doctor...');
            account = await User.findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: Date.now() }
            });
            accountType = 'Doctor';
        }

        if (!account) {
            console.log('❌ Token not found or expired');
            return res.status(400).json({
                success: false,
                message: "Token is invalid or expired."
            });
        }

        console.log(`✅ ${accountType} account found:`, account.email);

        // Method 1: Using pre-save middleware
        console.log('🔧 Setting new password...');
        account.password = newPassword;
        account.passwordResetToken = undefined;
        account.passwordResetExpires = undefined;
        
        console.log('💾 Saving account...');
        const savedAccount = await account.save();
        
        // Verify password was hashed
        const savedPassword = (savedAccount as any).password;
        console.log('🔍 Saved password starts with:', savedPassword.substring(0, 10));
        console.log('🔍 Is password hashed?', savedPassword.startsWith('$2b$'));
        
        if (!savedPassword.startsWith('$2b$')) {
            console.warn('⚠️ Password was NOT hashed!');
            // Fallback: Hash manually and save again
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            savedAccount.password = hashedPassword;
            await savedAccount.save({ validateBeforeSave: false });
            console.log('✅ Password manually hashed and saved');
        }

        console.log('✅ Password reset successful');

        return res.status(200).json({
            success: true,
            message: "Password updated successfully."
        });

    } catch (err: any) {
        console.error('❌ Reset password error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || "Server error."
        });
    }
};