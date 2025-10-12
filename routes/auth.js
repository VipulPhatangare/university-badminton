const express = require('express');
const router = express.Router();
const { collegeInfo, refreeInfo } = require('../database/schema');

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

// Middleware export for use in other routes
router.requireAuth = requireAuth;

module.exports = router;