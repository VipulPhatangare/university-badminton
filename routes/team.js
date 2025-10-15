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
        const collegeEmail = req.params.email;
        
        // Get boys players using collegeEmail field
        const boysPlayers = await playerInfoId.find({ 
            $and: [
                {
                    $or: [
                        { email: collegeEmail },
                        { collegeEmail: collegeEmail }
                    ]
                },
                { gender: 'male' }
            ]
        });
        
        // Get girls players using collegeEmail field
        const girlsPlayers = await playerInfoId.find({ 
            $and: [
                {
                    $or: [
                        { email: collegeEmail },
                        { collegeEmail: collegeEmail }
                    ]
                },
                { gender: 'female' }
            ]
        });
        
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
        
        // Check player limits first by counting existing players
        const genderToCheck = (gender.toLowerCase() === 'male' || gender.toLowerCase() === 'boys') ? 'male' : 'female';
        const maxPlayers = genderToCheck === 'male' ? 7 : 5;
        
        const existingPlayersCount = await playerInfoId.countDocuments({ 
            $and: [
                {
                    $or: [
                        { email: collegeEmail },
                        { collegeEmail: collegeEmail }
                    ]
                },
                { gender: genderToCheck }
            ]
        });
        
        if (existingPlayersCount >= maxPlayers) {
            const teamType = genderToCheck === 'male' ? 'Boys' : 'Girls';
            return res.status(400).json({ 
                message: `${teamType} team is full! Maximum ${maxPlayers} players allowed.` 
            });
        }
        
        // Generate unique player identifier
        const playerIdentifier = `${playerName.replace(/\s+/g, '_').toLowerCase()}_${gender}_${college.collegeName.replace(/\s+/g, '_').toLowerCase()}`;
        
        // Check if player already exists
        const existingPlayer = await playerInfoId.findOne({ playerIdentifier: playerIdentifier });
        if (existingPlayer) {
            return res.status(400).json({ message: 'A player with this name and gender already exists in your college' });
        }
        
        // Generate unique email: collegename.playername@gmail.com
        const collegeNameClean = college.collegeName
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-zA-Z0-9]/g, '');
        
        const playerNameClean = playerName
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-zA-Z0-9]/g, '');
        
        let generatedEmail = `${collegeNameClean}.${playerNameClean}@gmail.com`;
        let emailCounter = 1;
        while (await playerInfoId.findOne({ email: generatedEmail })) {
            generatedEmail = `${collegeNameClean}.${playerNameClean}${emailCounter}@gmail.com`;
            emailCounter++;
        }
        
        // Create new player
        const newPlayer = new playerInfoId({
            playerName,
            gender: genderToCheck,
            email: generatedEmail,
            collegeEmail: college.email,
            collegeName: college.collegeName,
            playerIdentifier
        });
        
        await newPlayer.save();
        
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
        
        // Delete player directly
        const deletedPlayer = await playerInfoId.findByIdAndDelete(playerId);
        
        if (!deletedPlayer) {
            return res.status(404).json({ message: 'Player not found' });
        }
        
        res.json({ message: 'Player deleted successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
