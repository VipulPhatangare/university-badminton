const express = require('express');
const router = express.Router();
const { collegeInfo, refreeInfo } = require('../database/schema');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
};

// Player/College login
router.post('/player/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find college by email
        const college = await collegeInfo.findOne({ email: email });

        if (!college) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Simple password check (you might want to use bcrypt for hashing in production)
        if (college.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Store user information in session
        req.session.user = {
            id: college._id,
            email: college.email,
            collegeName: college.collegeName,
            managerName: college.managerName,
            type: 'player'
        };

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: college._id,
                email: college.email,
                collegeName: college.collegeName,
                managerName: college.managerName,
                type: 'player'
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Referee login
router.post('/referee/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find referee by email
        const referee = await refreeInfo.findOne({ refEmail: email });

        if (!referee) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Simple password check
        if (referee.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Store referee information in session
        req.session.user = {
            id: referee._id,
            email: referee.refEmail,
            name: referee.name,
            type: 'referee'
        };

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: referee._id,
                email: referee.refEmail,
                name: referee.name,
                type: 'referee'
            }
        });

    } catch (error) {
        console.error('Referee login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get current user session
router.get('/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            success: true,
            user: req.session.user
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Not authenticated'
        });
    }
});

// Logout
router.post('/logout', (req, res) => {
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Could not log out' 
                });
            }
            res.json({ 
                success: true, 
                message: 'Logout successful' 
            });
        });
    } else {
        res.json({ 
            success: true, 
            message: 'No active session' 
        });
    }
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokens = new Map();

// Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find college by email
        const college = await collegeInfo.findOne({ email: email });

        if (!college) {
            // Don't reveal if email exists or not for security
            return res.json({
                success: true,
                message: 'If this email is registered, you will receive a password reset link.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpiry = Date.now() + 3600000; // 1 hour

        // Store token temporarily (in production, store in database)
        resetTokens.set(resetToken, {
            email: email,
            expiry: resetExpiry
        });

        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request - University Badminton',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🏸 University Badminton</h1>
                        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                        <h2 style="color: #333; margin-top: 0;">Hello ${college.managerName},</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            We received a request to reset your password for your <strong>${college.collegeName}</strong> team management account.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">
                                Reset Your Password
                            </a>
                        </div>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                            <p style="color: #856404; margin: 0; font-size: 14px;">
                                <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                            </p>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 20px;">
                            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                        
                        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                            This is an automated message from University Badminton Team Management System
                        </p>
                    </div>
                </div>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Password reset link has been sent to your email address.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reset email. Please try again later.'
        });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        // Validate password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if token exists and is valid
        const tokenData = resetTokens.get(token);
        if (!tokenData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Check if token has expired
        if (Date.now() > tokenData.expiry) {
            resetTokens.delete(token);
            return res.status(400).json({
                success: false,
                message: 'Reset token has expired'
            });
        }

        // Update password in database
        const college = await collegeInfo.findOneAndUpdate(
            { email: tokenData.email },
            { password: newPassword },
            { new: true }
        );

        if (!college) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }

        // Remove used token
        resetTokens.delete(token);

        res.json({
            success: true,
            message: 'Password has been successfully updated'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password. Please try again.'
        });
    }
});

// Middleware export for use in other routes
router.requireAuth = requireAuth;

module.exports = router;