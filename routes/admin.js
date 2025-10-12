const express = require('express');
const router = express.Router();
const {
    collegeInfo,
    playerInfoId,
    matchesBoys,
    singlesMatch,
    doublesMatch,
    set,
    refreeInfo
} = require('../database/schema');

// Get admin dashboard
router.get('/dashboard', async (req, res) => {
    try {
        res.render('admin-dashboard');
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all matches for admin dashboard
router.get('/get-all-matches', async (req, res) => {
    try {
        // Get only unassigned matches (matches where players haven't been assigned)
        const matches = await matchesBoys.find({
            $or: [
                { 'match1Singles.player1Name': { $exists: false } },
                { 'match1Singles.player1Name': null },
                { 'match1Singles.player1Name': '' }
            ]
        }).sort({ date: 1, time: 1 });

        // Format matches for display
        const formattedMatches = await Promise.all(matches.map(async (match) => {
            // Get college info
            const college1 = await collegeInfo.findOne({ email: match.email1 });
            const college2 = await collegeInfo.findOne({ email: match.email2 });

            // Get main referee info
            const mainReferee = match.refreeEmail ? await refreeInfo.findOne({ refEmail: match.refreeEmail }) : null;

            return {
                _id: match._id,
                matchNo: `M${match._id.toString().slice(-4)}`,
                college1Name: match.college1Name,
                college2Name: match.college2Name,
                email1: match.email1,
                email2: match.email2,
                date: match.date,
                time: match.time,
                court: match.court || 'TBD',
                matchStatus: match.matchStatus,
                winnerEmail: match.winnerEmail,
                score: match.score,
                refreeEmail: match.refreeEmail,
                refreeName: mainReferee ? mainReferee.name : 'Not assigned',
                setupCompleted: match.setupCompleted || false,
                assignedRefereeNames: match.assignedRefereeNames || [],
                matchSetup: match.matchSetup || null
            };
        }));

        res.json({
            success: true,
            matches: formattedMatches
        });

    } catch (error) {
        console.error('Error getting all matches:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all colleges for admin dashboard
router.get('/get-colleges', async (req, res) => {
    try {
        const colleges = await collegeInfo.find({}).select('email collegeName address phoneNumber');
        res.json({
            success: true,
            colleges: colleges
        });
    } catch (error) {
        console.error('Error getting colleges:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all referees for admin dashboard
router.get('/get-referees', async (req, res) => {
    try {
        const referees = await refreeInfo.find({}).select('name refEmail phoneNumber');
        res.json({
            success: true,
            referees: referees
        });
    } catch (error) {
        console.error('Error getting referees:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all players for admin dashboard
router.get('/get-players', async (req, res) => {
    try {
        const players = await playerInfoId.find({});
        res.json({
            success: true,
            players: players
        });
    } catch (error) {
        console.error('Error getting all players:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get colleges with player counts
router.get('/colleges', async (req, res) => {
    try {
        const search = req.query.search;
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { collegeName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const colleges = await collegeInfo.find(query);
        
        // Get player counts for each college
        const collegesWithCounts = await Promise.all(colleges.map(async (college) => {
            const boysCount = await playerInfoId.countDocuments({ 
                $and: [
                    {
                        $or: [
                            { email: college.email },
                            { collegeEmail: college.email }
                        ]
                    },
                    { gender: 'male' }
                ]
            });
            
            const girlsCount = await playerInfoId.countDocuments({ 
                $and: [
                    {
                        $or: [
                            { email: college.email },
                            { collegeEmail: college.email }
                        ]
                    },
                    { gender: 'female' }
                ]
            });

            return {
                _id: college._id,
                collegeName: college.collegeName,
                email: college.email,
                phone: college.phoneNumber,
                address: college.address,
                actualBoysCount: boysCount,
                actualGirlsCount: girlsCount,
                totalPlayers: boysCount + girlsCount
            };
        }));

        res.json(collegesWithCounts);
    } catch (error) {
        console.error('Error getting colleges:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get specific college with players
router.get('/colleges/:collegeId', async (req, res) => {
    try {
        const collegeId = req.params.collegeId;
        const college = await collegeInfo.findById(collegeId);
        
        if (!college) {
            return res.status(404).json({ success: false, message: 'College not found' });
        }

        // Get players for this college
        const boysPlayers = await playerInfoId.find({ 
            $and: [
                {
                    $or: [
                        { email: college.email },
                        { collegeEmail: college.email }
                    ]
                },
                { gender: 'male' }
            ]
        });
        
        const girlsPlayers = await playerInfoId.find({ 
            $and: [
                {
                    $or: [
                        { email: college.email },
                        { collegeEmail: college.email }
                    ]
                },
                { gender: 'female' }
            ]
        });

        res.json({
            success: true,
            college: college,
            players: {
                boys: boysPlayers,
                girls: girlsPlayers
            }
        });
    } catch (error) {
        console.error('Error getting college details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get players with filters
router.get('/players', async (req, res) => {
    try {
        const { college, gender, search } = req.query;
        let query = {};

        if (college) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { email: college },
                    { collegeEmail: college }
                ]
            });
        }

        if (gender) {
            query.gender = gender;
        }

        if (search) {
            query.$or = [
                { playerName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const players = await playerInfoId.find(query);
        res.json(players);
    } catch (error) {
        console.error('Error getting players:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add new player
router.post('/players', async (req, res) => {
    try {
        const { playerName, email, phone, gender, collegeId } = req.body;

        // Validate required fields
        if (!playerName || !email || !gender || !collegeId) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Check if player already exists
        const existingPlayer = await playerInfoId.findOne({ email: email });
        if (existingPlayer) {
            return res.status(400).json({ success: false, error: 'Player with this email already exists' });
        }

        // Get college info
        const college = await collegeInfo.findById(collegeId);
        if (!college) {
            return res.status(400).json({ success: false, error: 'College not found' });
        }

        // Create new player
        const newPlayer = new playerInfoId({
            playerName,
            email,
            phone,
            gender,
            collegeEmail: college.email,
            collegeName: college.collegeName
        });

        await newPlayer.save();
        res.json({ success: true, player: newPlayer });
    } catch (error) {
        console.error('Error adding player:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Update player
router.put('/players/:playerId', async (req, res) => {
    try {
        const playerId = req.params.playerId;
        const { playerName, email, phone, gender, collegeId } = req.body;

        // Get college info if collegeId is provided
        let updateData = { playerName, email, phone, gender };
        
        if (collegeId) {
            const college = await collegeInfo.findById(collegeId);
            if (!college) {
                return res.status(400).json({ success: false, error: 'College not found' });
            }
            updateData.collegeEmail = college.email;
            updateData.collegeName = college.collegeName;
        }

        const updatedPlayer = await playerInfoId.findByIdAndUpdate(playerId, updateData, { new: true });
        
        if (!updatedPlayer) {
            return res.status(404).json({ success: false, error: 'Player not found' });
        }

        res.json({ success: true, player: updatedPlayer });
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Delete player
router.delete('/players/:playerId', async (req, res) => {
    try {
        const playerId = req.params.playerId;
        
        const deletedPlayer = await playerInfoId.findByIdAndDelete(playerId);
        
        if (!deletedPlayer) {
            return res.status(404).json({ success: false, error: 'Player not found' });
        }

        res.json({ success: true, message: 'Player deleted successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get referees with search
router.get('/referees', async (req, res) => {
    try {
        const search = req.query.search;
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { refEmail: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const referees = await refreeInfo.find(query);
        res.json(referees);
    } catch (error) {
        console.error('Error getting referees:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add new referee
router.post('/referees', async (req, res) => {
    try {
        const { refereeName, email, phone, password } = req.body;

        // Validate required fields
        if (!refereeName || !email || !password) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Check if referee already exists
        const existingReferee = await refreeInfo.findOne({ refEmail: email });
        if (existingReferee) {
            return res.status(400).json({ success: false, error: 'Referee with this email already exists' });
        }

        // Create new referee
        const newReferee = new refreeInfo({
            name: refereeName,
            refEmail: email,
            phoneNumber: phone,
            password: password,
            createdAt: new Date()
        });

        await newReferee.save();
        res.json({ success: true, referee: newReferee });
    } catch (error) {
        console.error('Error adding referee:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Update referee
router.put('/referees/:refereeId', async (req, res) => {
    try {
        const refereeId = req.params.refereeId;
        const { refereeName, email, phone, password } = req.body;

        const updateData = {
            name: refereeName,
            refEmail: email,
            phoneNumber: phone,
            password: password
        };

        const updatedReferee = await refreeInfo.findByIdAndUpdate(refereeId, updateData, { new: true });
        
        if (!updatedReferee) {
            return res.status(404).json({ success: false, error: 'Referee not found' });
        }

        res.json({ success: true, referee: updatedReferee });
    } catch (error) {
        console.error('Error updating referee:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Delete referee
router.delete('/referees/:refereeId', async (req, res) => {
    try {
        const refereeId = req.params.refereeId;
        
        const deletedReferee = await refreeInfo.findByIdAndDelete(refereeId);
        
        if (!deletedReferee) {
            return res.status(404).json({ success: false, error: 'Referee not found' });
        }

        res.json({ success: true, message: 'Referee deleted successfully' });
    } catch (error) {
        console.error('Error deleting referee:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get matches with filters
router.get('/matches', async (req, res) => {
    try {
        const { gender, status } = req.query;
        let query = {};

        // Filter by status if provided
        if (status) {
            const statusArray = status.split(',');
            if (statusArray.includes('upcoming')) {
                query.matchStatus = { $in: ['upcoming', 'setup_completed', 'players_allocated'] };
            }
        }

        const matches = await matchesBoys.find(query).sort({ date: 1, time: 1 });

        // Format matches for display
        const formattedMatches = await Promise.all(matches.map(async (match) => {
            // Get college info
            const college1 = await collegeInfo.findOne({ email: match.email1 });
            const college2 = await collegeInfo.findOne({ email: match.email2 });

            return {
                _id: match._id,
                college1Name: match.college1Name,
                college2Name: match.college2Name,
                email1: match.email1,
                email2: match.email2,
                date: match.date,
                time: match.time,
                court: match.court || 'TBD',
                matchStatus: match.matchStatus,
                refreeId: match.refreeId || [],
                round: 'Round 1' // You might want to add this field to your schema
            };
        }));

        res.json(formattedMatches);
    } catch (error) {
        console.error('Error getting matches:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get specific match details
router.get('/matches/:matchId', async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const match = await matchesBoys.findById(matchId);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // Get college info
        const college1 = await collegeInfo.findOne({ email: match.email1 });
        const college2 = await collegeInfo.findOne({ email: match.email2 });

        const matchDetails = {
            _id: match._id,
            college1Name: match.college1Name,
            college2Name: match.college2Name,
            email1: match.email1,
            email2: match.email2,
            date: match.date,
            time: match.time,
            court: match.court || 'TBD',
            matchStatus: match.matchStatus,
            refreeId: match.refreeId || [],
            round: 'Round 1' // You might want to add this field to your schema
        };

        res.json(matchDetails);
    } catch (error) {
        console.error('Error getting match details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Assign match with players and referees
router.post('/matches/assign', async (req, res) => {
    try {
        const { matchId, gender, subMatches } = req.body;

        // Validate input
        if (!matchId || !gender || !subMatches || !Array.isArray(subMatches)) {
            return res.status(400).json({ success: false, error: 'Invalid request data' });
        }

        // Find the match
        const match = await matchesBoys.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, error: 'Match not found' });
        }

        // Validate all referees exist
        const refereeIds = subMatches.map(sm => sm.refereeId);
        const referees = await refreeInfo.find({ _id: { $in: refereeIds } });
        
        if (referees.length !== refereeIds.length) {
            return res.status(400).json({ success: false, error: 'One or more referees not found' });
        }

        // Validate all players exist
        const playerIds = [];
        subMatches.forEach(sm => {
            if (sm.type === 'singles') {
                if (sm.team1Player) playerIds.push(sm.team1Player);
                if (sm.team2Player) playerIds.push(sm.team2Player);
            } else {
                if (sm.team1Player1) playerIds.push(sm.team1Player1);
                if (sm.team1Player2) playerIds.push(sm.team1Player2);
                if (sm.team2Player1) playerIds.push(sm.team2Player1);
                if (sm.team2Player2) playerIds.push(sm.team2Player2);
            }
        });

        const players = await playerInfoId.find({ _id: { $in: playerIds } });
        if (players.length !== playerIds.length) {
            return res.status(400).json({ success: false, error: 'One or more players not found' });
        }

        // Update match with referee assignments
        match.refreeId = refereeIds;
        match.assignedRefereeNames = referees.map(r => r.name);
        match.matchStatus = 'players_allocated';

        // Save sub-match assignments (you might need to adjust this based on your schema)
        match.subMatchAssignments = subMatches;

        await match.save();

        res.json({ 
            success: true, 
            message: 'Match assigned successfully',
            match: match
        });
    } catch (error) {
        console.error('Error assigning match:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Save match setup configuration
router.post('/match/:id/setup-configuration', async (req, res) => {
    try {
        const matchId = req.params.id;
        const { matchConfigs } = req.body;

        // Validate match configurations
        if (!matchConfigs || !Array.isArray(matchConfigs) || matchConfigs.length !== 5) {
            return res.json({ success: false, message: 'Invalid match configuration data' });
        }

        // Validate all referees exist
        for (let config of matchConfigs) {
            const referee = await refreeInfo.findOne({ refEmail: config.refereeEmail });
            if (!referee) {
                return res.json({ 
                    success: false, 
                    message: `Referee not found: ${config.refereeEmail}` 
                });
            }
        }

        // Find and update the match
        const match = await matchesBoys.findById(matchId);
        if (!match) {
            return res.json({ success: false, message: 'Match not found' });
        }

        // Create match configuration object
        const matchSetup = {
            match1: {
                type: 'singles',
                refereeEmail: matchConfigs[0].refereeEmail,
                maxPoints: matchConfigs[0].maxPoints,
                numberOfSets: matchConfigs[0].numberOfSets,
                courtNumber: matchConfigs[0].courtNumber
            },
            match2: {
                type: 'singles',
                refereeEmail: matchConfigs[1].refereeEmail,
                maxPoints: matchConfigs[1].maxPoints,
                numberOfSets: matchConfigs[1].numberOfSets,
                courtNumber: matchConfigs[1].courtNumber
            },
            match3: {
                type: 'doubles',
                refereeEmail: matchConfigs[2].refereeEmail,
                maxPoints: matchConfigs[2].maxPoints,
                numberOfSets: matchConfigs[2].numberOfSets,
                courtNumber: matchConfigs[2].courtNumber
            },
            match4: {
                type: 'singles',
                refereeEmail: matchConfigs[3].refereeEmail,
                maxPoints: matchConfigs[3].maxPoints,
                numberOfSets: matchConfigs[3].numberOfSets,
                courtNumber: matchConfigs[3].courtNumber
            },
            match5: {
                type: 'doubles',
                refereeEmail: matchConfigs[4].refereeEmail,
                maxPoints: matchConfigs[4].maxPoints,
                numberOfSets: matchConfigs[4].numberOfSets,
                courtNumber: matchConfigs[4].courtNumber
            }
        };

        // Get referee IDs and names
        const refereeIds = [];
        const refereeNames = [];
        
        for (let config of matchConfigs) {
            const referee = await refreeInfo.findOne({ refEmail: config.refereeEmail });
            if (referee && !refereeIds.includes(referee._id)) {
                refereeIds.push(referee._id);
                refereeNames.push(referee.name);
            }
        }

        // Update the match with setup configuration
        match.matchSetup = matchSetup;
        match.refreeId = refereeIds;
        match.assignedRefereeNames = refereeNames;
        match.setupCompleted = true;
        match.matchStatus = 'setup_completed';

        await match.save();

        res.json({ 
            success: true, 
            message: 'Match configuration saved successfully',
            matchSetup: matchSetup
        });

    } catch (error) {
        console.error('Error saving match configuration:', error);
        res.json({ success: false, message: 'Error saving match configuration' });
    }
});

// Get match details for setup
router.get('/match/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const match = await matchesBoys.findById(id);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // Get college info
        const college1 = await collegeInfo.findOne({ email: match.email1 });
        const college2 = await collegeInfo.findOne({ email: match.email2 });

        const matchDetails = {
            _id: match._id,
            matchNo: `M${match._id.toString().slice(-4)}`,
            college1Name: match.college1Name,
            college2Name: match.college2Name,
            email1: match.email1,
            email2: match.email2,
            date: match.date,
            time: match.time,
            court: match.court || 'TBD',
            matchStatus: match.matchStatus,
            refreeEmail: match.refreeEmail,
            refreeName: match.refreeName,
            setupCompleted: match.setupCompleted || false,
            matchSetup: match.matchSetup || null,
            assignedRefereeNames: match.assignedRefereeNames || []
        };

        res.json({ success: true, match: matchDetails });
    } catch (error) {
        console.error('Error getting match details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Reset match configuration
router.post('/match/:id/reset-setup', async (req, res) => {
    try {
        const matchId = req.params.id;
        
        const match = await matchesBoys.findById(matchId);
        if (!match) {
            return res.json({ success: false, message: 'Match not found' });
        }

        // Reset match setup
        match.matchSetup = null;
        match.refreeId = [];
        match.assignedRefereeNames = [];
        match.setupCompleted = false;
        match.matchStatus = 'upcoming';

        await match.save();

        res.json({ success: true, message: 'Match setup reset successfully' });
    } catch (error) {
        console.error('Error resetting match setup:', error);
        res.json({ success: false, message: 'Error resetting match setup' });
    }
});

// Get boys players for a college
router.get('/college/:email/players', async (req, res) => {
    try {
        const collegeEmail = decodeURIComponent(req.params.email);
        console.log('Getting boys players for college:', collegeEmail);
        
        const players = await playerInfoId.find({ 
            $and: [
                {
                    $or: [
                        { email: collegeEmail },
                        { collegeEmail: collegeEmail }
                    ]
                },
                { gender: 'male' } // Only get male/boys players
            ]
        });
        
        console.log('Found boys players:', players.length);
        console.log('Boys players data:', players);
        res.json(players);
    } catch (error) {
        console.error('Error getting boys players:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Save complete match setup with player allocations
router.post('/match/:id/complete-setup', async (req, res) => {
    try {
        const matchId = req.params.id;
        const { matchConfigs, playerAllocations } = req.body;

        console.log('Saving complete match setup for:', matchId);
        console.log('Match configs:', matchConfigs);
        console.log('Player allocations:', playerAllocations);

        // Find the match
        const match = await matchesBoys.findById(matchId);
        if (!match) {
            return res.json({ success: false, message: 'Match not found' });
        }

        // Update match with all data
        match.matchSetup = matchConfigs;
        
        // Save player allocations
        if (playerAllocations.match1Singles) {
            match.match1Singles = playerAllocations.match1Singles;
        }
        if (playerAllocations.match2Singles) {
            match.match2Singles = playerAllocations.match2Singles;
        }
        if (playerAllocations.match3Doubles) {
            match.match3Doubles = playerAllocations.match3Doubles;
        }
        if (playerAllocations.match4Singles) {
            match.match4Singles = playerAllocations.match4Singles;
        }
        if (playerAllocations.match5Doubles) {
            match.match5Doubles = playerAllocations.match5Doubles;
        }

        // Update status
        match.matchStatus = 'players_allocated';
        match.setupCompleted = true;

        await match.save();

        res.json({ 
            success: true, 
            message: 'Complete match setup saved successfully'
        });

    } catch (error) {
        console.error('Error saving complete match setup:', error);
        res.json({ success: false, message: 'Error saving complete match setup' });
    }
});

// Assign players and referee to match
router.post('/assign-match/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const { refereeId, ...playerAssignments } = req.body;

        console.log('Assigning match:', matchId, 'with data:', req.body);

        // Validate ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(matchId)) {
            return res.status(400).json({ success: false, message: 'Invalid match ID format' });
        }

        // Find the match
        const match = await matchesBoys.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // Find the referee
        const referee = await refreeInfo.findById(refereeId);
        if (!referee) {
            return res.status(404).json({ success: false, message: 'Referee not found' });
        }

        // Update match with referee and player assignments
        const updateData = {
            refreeEmail: referee.refEmail,
            refreeName: referee.name,
            ...playerAssignments,
            matchStatus: 'players_allocated'
        };

        const updatedMatch = await matchesBoys.findByIdAndUpdate(matchId, updateData, { new: true });

        res.json({ 
            success: true, 
            message: 'Players and referee assigned successfully',
            match: updatedMatch
        });
    } catch (error) {
        console.error('Error assigning match:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to assign players and referee',
            error: error.message 
        });
    }
});

module.exports = router;