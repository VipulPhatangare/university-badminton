const express = require('express');
const router = express.Router();
const { collegeInfo, playerInfoId, matchesBoys, singlesMatch, doublesMatch } = require('../database/schema');


router.get('/', (req, res)=>{
  res.render('team');
});

// Get college by email
router.get('/college/:email', async (req, res) => {
    try {
        const college = await collegeInfo.findOne({ email: req.params.email });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        res.json(college);
    } catch (error) {
        console.error('Error fetching college:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get college matches (boys and girls)
router.get('/matches/:email', async (req, res) => {
    try {
        const email = req.params.email;
        
        // Find all matches where this college is participating
        const matches = await matchesBoys.find({
            $or: [
                { email1: email },
                { email2: email }
            ]
        }).sort({ date: -1, time: -1 });
        
        res.json(matches);
    } catch (error) {
        console.error('Error fetching college matches:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get college matches by status
router.get('/matches/:email/:status', async (req, res) => {
    try {
        const { email, status } = req.params;
        
        const matches = await matchesBoys.find({
            $or: [
                { email1: email },
                { email2: email }
            ],
            matchStatus: status
        }).sort({ date: -1, time: -1 });
        
        res.json(matches);
    } catch (error) {
        console.error('Error fetching matches by status:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get college players
router.get('/players/:email', async (req, res) => {
    try {
        const college = await collegeInfo.findOne({ email: req.params.email });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        
        // Get boys players
        let boysPlayers = [];
        if (college.playerInfoIdBoys && college.playerInfoIdBoys.length > 0) {
            const boysPromises = college.playerInfoIdBoys.map(id => 
                playerInfoId.findById(id).catch(() => null)
            );
            boysPlayers = (await Promise.all(boysPromises)).filter(p => p !== null);
        }
        
        // Get girls players
        let girlsPlayers = [];
        if (college.playerInfoIdGirls && college.playerInfoIdGirls.length > 0) {
            const girlsPromises = college.playerInfoIdGirls.map(id => 
                playerInfoId.findById(id).catch(() => null)
            );
            girlsPlayers = (await Promise.all(girlsPromises)).filter(p => p !== null);
        }
        
        res.json({
            boys: boysPlayers,
            girls: girlsPlayers
        });
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ message: error.message });
    }
});

// Add new player
router.post('/players/:email', async (req, res) => {
    try {
        const { playerName, gender } = req.body;
        const collegeEmail = req.params.email;
        
        // Validate required fields
        if (!playerName || !gender) {
            return res.status(400).json({ message: 'Player name and gender are required' });
        }
        
        // Get college info to get college name for unique identifier
        const college = await collegeInfo.findOne({ email: collegeEmail });
        if (!college) {
            return res.status(404).json({ message: 'College not found' });
        }
        
        // Generate unique player identifier
        const playerIdentifier = `${playerName.replace(/\s+/g, '_').toLowerCase()}_${gender}_${college.collegeName.replace(/\s+/g, '_').toLowerCase()}`;
        
        // Check if player already exists
        const existingPlayer = await playerInfoId.findOne({ playerIdentifier: playerIdentifier });
        if (existingPlayer) {
            return res.status(400).json({ message: 'A player with this name and gender already exists in your college' });
        }
        
        // Create new player
        const newPlayer = new playerInfoId({
            playerName,
            gender,
            collegeEmail: college.email,
            collegeName: college.collegeName,
            playerIdentifier
        });
        
        await newPlayer.save();
        
        // Check player limits before adding
        if (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'boys') {
            if (!college.playerInfoIdBoys) college.playerInfoIdBoys = [];
            
            // Check if boys team is already full (max 7 players)
            if (college.playerInfoIdBoys.length >= 7) {
                // Delete the created player since we can't add them
                await playerInfoId.findByIdAndDelete(newPlayer._id);
                return res.status(400).json({ 
                    message: 'Boys team is full! Maximum 7 boys players allowed.' 
                });
            }
            
            college.playerInfoIdBoys.push(newPlayer._id);
        } else {
            if (!college.playerInfoIdGirls) college.playerInfoIdGirls = [];
            
            // Check if girls team is already full (max 5 players)
            if (college.playerInfoIdGirls.length >= 5) {
                // Delete the created player since we can't add them
                await playerInfoId.findByIdAndDelete(newPlayer._id);
                return res.status(400).json({ 
                    message: 'Girls team is full! Maximum 5 girls players allowed.' 
                });
            }
            
            college.playerInfoIdGirls.push(newPlayer._id);
        }
        
        await college.save();
        
        res.status(201).json(newPlayer);
    } catch (error) {
        console.error('Error adding player:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete player
router.delete('/players/:email/:playerId', async (req, res) => {
    try {
        const { email, playerId } = req.params;
        
        // Remove player from college's list
        const college = await collegeInfo.findOne({ email });
        if (college) {
            college.playerInfoIdBoys = college.playerInfoIdBoys?.filter(id => id.toString() !== playerId) || [];
            college.playerInfoIdGirls = college.playerInfoIdGirls?.filter(id => id.toString() !== playerId) || [];
            await college.save();
        }
        
        // Delete player
        await playerInfoId.findByIdAndDelete(playerId);
        
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
