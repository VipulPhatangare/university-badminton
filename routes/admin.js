const express = require('express');
const router = express.Router();
const {
    collegeInfo,
    playerInfoId,
    matchesBoys,
    matchesGirls,
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
        // Get matches that need assignment or have been assigned
        const matches = await matchesBoys.find({}).sort({ date: 1, time: 1 });

        // Format matches for display
        const formattedMatches = await Promise.all(matches.map(async (match) => {
            // Get college info
            const college1 = await collegeInfo.findOne({ email: match.email1 });
            const college2 = await collegeInfo.findOne({ email: match.email2 });

            // Get main referee info - try multiple ways to ensure we get the referee
            let mainReferee = null;
            if (match.refreeEmail) {
                mainReferee = await refreeInfo.findOne({ refEmail: match.refreeEmail });
            } else if (match.refreeId && match.refreeId.length > 0) {
                mainReferee = await refreeInfo.findById(match.refreeId[0]);
            }

            // Determine assignment status
            let assignmentStatus = 'not_assigned';
            let isPlayerAssigned = false;
            let isRefereeAssigned = false;

            // Check if referee is assigned
            if (match.refreeEmail || (match.refreeId && match.refreeId.length > 0)) {
                isRefereeAssigned = true;
            }

            // Check if players are assigned
            if (match.match1Singles && (match.match1Singles.player1Name || match.match1Singles.player2Name)) {
                isPlayerAssigned = true;
            }

            if (isRefereeAssigned && isPlayerAssigned) {
                assignmentStatus = 'fully_assigned';
            } else if (isRefereeAssigned || isPlayerAssigned) {
                assignmentStatus = 'partially_assigned';
            }

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
                refreeEmail: match.refreeEmail || '',
                refreeName: match.refreeName || (mainReferee ? mainReferee.name : 'Not assigned'),
                refreeId: match.refreeId || [],
                setupCompleted: match.setupCompleted || false,
                assignedRefereeNames: match.assignedRefereeNames || [],
                matchSetup: match.matchSetup || null,
                assignmentStatus: assignmentStatus,
                isRefereeAssigned: isRefereeAssigned,
                isPlayerAssigned: isPlayerAssigned,
                lastModified: match.lastModified
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
        const colleges = await collegeInfo.find({});
        
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
                phone: college.phone || college.phoneNumber,
                address: college.address,
                actualBoysCount: boysCount,
                actualGirlsCount: girlsCount,
                totalPlayers: boysCount + girlsCount,
                currentRoundBoys: college.currentRoundBoys,
                currentRoundGirls: college.currentRoundGirls,
                isMatchAllocateBoys: college.isMatchAllocateBoys,
                isMatchAllocateGirls: college.isMatchAllocateGirls
            };
        }));

        res.json({
            success: true,
            colleges: collegesWithCounts
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
        // Only return male players (boys only tournament)
        const players = await playerInfoId.find({ gender: "male" });
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
                totalPlayers: boysCount + girlsCount,
                // Add schedule generator fields
                currentRoundBoys: college.currentRoundBoys,
                currentRoundGirls: college.currentRoundGirls,
                isMatchAllocateBoys: college.isMatchAllocateBoys,
                isMatchAllocateGirls: college.isMatchAllocateGirls
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
        console.log('Players request - college:', college, 'gender:', gender, 'search:', search);
        
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

        console.log('Query:', JSON.stringify(query, null, 2));
        const players = await playerInfoId.find(query);
        console.log('Found players:', players.length);
        console.log('Players data:', players);
        
        res.json(players);
    } catch (error) {
        console.error('Error getting players:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Add new player
router.post('/players', async (req, res) => {
    try {
        console.log('Received player data:', req.body);
        const { playerName, email, phone, gender, collegeId } = req.body;

        // Validate required fields
        if (!playerName || !email || !gender || !collegeId) {
            console.log('Missing fields - playerName:', playerName, 'email:', email, 'gender:', gender, 'collegeId:', collegeId);
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields',
                details: {
                    playerName: !playerName ? 'missing' : 'ok',
                    email: !email ? 'missing' : 'ok',
                    gender: !gender ? 'missing' : 'ok',
                    collegeId: !collegeId ? 'missing' : 'ok'
                }
            });
        }

        // Check if player already exists
        console.log('Checking for existing player with email:', email);
        const existingPlayer = await playerInfoId.findOne({ email: email });
        if (existingPlayer) {
            console.log('Player already exists:', existingPlayer);
            return res.status(400).json({ success: false, error: 'Player with this email already exists' });
        }
        console.log('No existing player found');

        // Get college info
        console.log('Looking for college with ID:', collegeId);
        const college = await collegeInfo.findById(collegeId);
        if (!college) {
            console.log('College not found with ID:', collegeId);
            return res.status(400).json({ success: false, error: 'College not found' });
        }
        console.log('College found:', college.collegeName);

        // Create new player
        console.log('Creating new player with data:', {
            playerName,
            email,
            phone,
            gender,
            collegeEmail: college.email,
            collegeName: college.collegeName
        });
        
        const newPlayer = new playerInfoId({
            playerName,
            email,
            phone,
            gender,
            collegeEmail: college.email,
            collegeName: college.collegeName
        });

        console.log('Saving player...');
        await newPlayer.save();
        console.log('Player saved successfully:', newPlayer._id);
        res.json({ success: true, player: newPlayer });
    } catch (error) {
        console.error('Error adding player:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            // Duplicate key error (unique constraint violation)
            const field = Object.keys(error.keyValue)[0];
            const value = error.keyValue[field];
            return res.status(400).json({ 
                success: false, 
                error: `A player with this ${field} (${value}) already exists. Please use a different ${field}.`
            });
        } else if (error.name === 'ValidationError') {
            // Mongoose validation error
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                error: `Validation failed: ${messages.join(', ')}`
            });
        }
        
        res.status(500).json({ success: false, error: 'Server error occurred while saving player' });
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
        res.json({ success: true, referees });
    } catch (error) {
        console.error('Error getting referees:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single referee by ID
router.get('/referees/:refereeId', async (req, res) => {
    try {
        const refereeId = req.params.refereeId;
        const referee = await refreeInfo.findById(refereeId);
        
        if (!referee) {
            return res.status(404).json({ success: false, error: 'Referee not found' });
        }

        res.json({ success: true, referee });
    } catch (error) {
        console.error('Error getting referee:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Add new referee
router.post('/referees', async (req, res) => {
    try {
        const { name, refEmail, phone, password } = req.body;

        // Validate required fields
        if (!name || !refEmail || !password) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Check if referee already exists
        const existingReferee = await refreeInfo.findOne({ refEmail: refEmail });
        if (existingReferee) {
            return res.status(400).json({ success: false, error: 'Referee with this email already exists' });
        }

        // Create new referee
        const newReferee = new refreeInfo({
            name: name,
            refEmail: refEmail,
            phone: phone,
            password: password
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
        const { name, refEmail, phone, password } = req.body;

        const updateData = {
            name: name,
            refEmail: refEmail,
            phone: phone
        };
        
        // Only update password if provided
        if (password && password.trim() !== '') {
            updateData.password = password;
        }

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

// Get boys matches
router.get('/matches/boys', async (req, res) => {
    try {
        const matches = await matchesBoys.find({}).sort({ date: 1, time: 1 });
        res.json({ success: true, matches });
    } catch (error) {
        console.error('Error getting boys matches:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get girls matches
router.get('/matches/girls', async (req, res) => {
    try {
        const matches = await matchesGirls.find({}).sort({ date: 1, time: 1 });
        res.json({ success: true, matches });
    } catch (error) {
        console.error('Error getting girls matches:', error);
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

        console.log('Assigning match:', { matchId, gender, subMatches });

        // Validate input
        if (!matchId || !gender || !subMatches || !Array.isArray(subMatches)) {
            return res.status(400).json({ success: false, error: 'Invalid request data' });
        }

        // Validate matchId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(matchId)) {
            return res.status(400).json({ success: false, error: 'Invalid match ID format' });
        }

        // Determine which collection to use based on gender
        const matchModel = gender === 'girls' ? matchesGirls : matchesBoys;

        // Find the match
        const match = await matchModel.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, error: 'Match not found' });
        }

        // Validate all referees exist
        const refereeIds = subMatches.map(sm => sm.refereeId).filter(id => id);
        const uniqueRefereeIds = [...new Set(refereeIds)]; // Remove duplicates
        console.log('All referee IDs:', refereeIds);
        console.log('Unique referee IDs to validate:', uniqueRefereeIds);
        
        if (refereeIds.length === 0) {
            console.log('VALIDATION ERROR: No referees assigned');
            return res.status(400).json({ success: false, error: 'At least one referee must be assigned' });
        }

        const referees = await refreeInfo.find({ _id: { $in: uniqueRefereeIds } });
        console.log('Found referees:', referees.length, 'out of', uniqueRefereeIds.length, 'unique referees requested');
        
        if (referees.length !== uniqueRefereeIds.length) {
            console.log('VALIDATION ERROR: Missing referees');
            const foundRefereeIds = referees.map(r => r._id.toString());
            const missingRefereeIds = uniqueRefereeIds.filter(id => !foundRefereeIds.includes(id.toString()));
            console.log('Missing referee IDs:', missingRefereeIds);
            return res.status(400).json({ success: false, error: 'One or more referees not found', missingReferees: missingRefereeIds });
        }

        // Validate all players exist
        const playerIds = [];
        const invalidPlayerIds = [];
        
        subMatches.forEach((sm, index) => {
            console.log(`Processing submatch ${index + 1}:`, sm);
            
            if (sm.type === 'singles') {
                if (sm.team1Player) {
                    if (mongoose.Types.ObjectId.isValid(sm.team1Player)) {
                        playerIds.push(sm.team1Player);
                    } else {
                        console.log('Invalid team1Player ID:', sm.team1Player);
                        invalidPlayerIds.push(sm.team1Player);
                    }
                }
                if (sm.team2Player) {
                    if (mongoose.Types.ObjectId.isValid(sm.team2Player)) {
                        playerIds.push(sm.team2Player);
                    } else {
                        console.log('Invalid team2Player ID:', sm.team2Player);
                        invalidPlayerIds.push(sm.team2Player);
                    }
                }
            } else {
                if (sm.team1Player1) {
                    if (mongoose.Types.ObjectId.isValid(sm.team1Player1)) {
                        playerIds.push(sm.team1Player1);
                    } else {
                        console.log('Invalid team1Player1 ID:', sm.team1Player1);
                        invalidPlayerIds.push(sm.team1Player1);
                    }
                }
                if (sm.team1Player2) {
                    if (mongoose.Types.ObjectId.isValid(sm.team1Player2)) {
                        playerIds.push(sm.team1Player2);
                    } else {
                        console.log('Invalid team1Player2 ID:', sm.team1Player2);
                        invalidPlayerIds.push(sm.team1Player2);
                    }
                }
                if (sm.team2Player1) {
                    if (mongoose.Types.ObjectId.isValid(sm.team2Player1)) {
                        playerIds.push(sm.team2Player1);
                    } else {
                        console.log('Invalid team2Player1 ID:', sm.team2Player1);
                        invalidPlayerIds.push(sm.team2Player1);
                    }
                }
                if (sm.team2Player2) {
                    if (mongoose.Types.ObjectId.isValid(sm.team2Player2)) {
                        playerIds.push(sm.team2Player2);
                    } else {
                        console.log('Invalid team2Player2 ID:', sm.team2Player2);
                        invalidPlayerIds.push(sm.team2Player2);
                    }
                }
            }
        });

        console.log('Valid player IDs:', playerIds);
        console.log('Invalid player IDs:', invalidPlayerIds);

        if (invalidPlayerIds.length > 0) {
            console.log('VALIDATION ERROR: Invalid player IDs detected');
            return res.status(400).json({ 
                success: false, 
                error: `Invalid player IDs found: ${invalidPlayerIds.join(', ')}. Player IDs must be valid MongoDB ObjectIds.` 
            });
        }

        if (playerIds.length === 0) {
            return res.status(400).json({ success: false, error: 'At least some players must be assigned' });
        }

        console.log('Looking up players with IDs:', playerIds);
        const players = await playerInfoId.find({ _id: { $in: playerIds } });
        console.log('Found players:', players.length, 'out of', playerIds.length, 'requested');
        
        if (players.length !== playerIds.length) {
            const foundPlayerIds = players.map(p => p._id.toString());
            const missingPlayerIds = playerIds.filter(id => !foundPlayerIds.includes(id.toString()));
            console.log('VALIDATION ERROR: Missing player IDs:', missingPlayerIds);
            
            return res.status(400).json({ 
                success: false, 
                error: `Players not found with IDs: ${missingPlayerIds.join(', ')}` 
            });
        }

        // Create player lookup for easy access
        const playerLookup = {};
        players.forEach(player => {
            playerLookup[player._id.toString()] = player;
        });

        // Create referee lookup for easy access
        const refereeLookup = {};
        referees.forEach(referee => {
            refereeLookup[referee._id.toString()] = referee;
        });

        // Prepare update data
        const updateData = {
            refreeId: uniqueRefereeIds,
            assignedRefereeNames: referees.map(r => r.name),
            matchStatus: 'players_allocated',
            lastModified: new Date(),
            subMatchAssignments: subMatches
        };

        // Set primary referee (first one in the list)
        if (referees.length > 0) {
            updateData.refreeEmail = referees[0].refEmail;
            updateData.refreeName = referees[0].name;
        }

        // Assign players to specific match slots based on subMatches
        subMatches.forEach((sm, index) => {
            const matchNumber = sm.matchNumber || (index + 1);
            
            if (sm.type === 'singles') {
                const matchField = `match${matchNumber}Singles`;
                updateData[matchField] = {
                    player1Name: playerLookup[sm.team1Player]?.playerName || '',
                    player2Name: playerLookup[sm.team2Player]?.playerName || '',
                    player1Email: playerLookup[sm.team1Player]?.email || '',
                    player2Email: playerLookup[sm.team2Player]?.email || ''
                };
            } else if (sm.type === 'doubles') {
                const matchField = `match${matchNumber}Doubles`;
                updateData[matchField] = {
                    team1Player1Name: playerLookup[sm.team1Player1]?.playerName || '',
                    team1Player2Name: playerLookup[sm.team1Player2]?.playerName || '',
                    team2Player1Name: playerLookup[sm.team2Player1]?.playerName || '',
                    team2Player2Name: playerLookup[sm.team2Player2]?.playerName || '',
                    team1Player1Email: playerLookup[sm.team1Player1]?.email || '',
                    team1Player2Email: playerLookup[sm.team1Player2]?.email || '',
                    team2Player1Email: playerLookup[sm.team2Player1]?.email || '',
                    team2Player2Email: playerLookup[sm.team2Player2]?.email || ''
                };
            }
        });

        // Update match with all data using findByIdAndUpdate for better reliability
        console.log('Attempting to update match with data:', JSON.stringify(updateData, null, 2));
        
        const updatedMatch = await matchModel.findByIdAndUpdate(matchId, updateData, { 
            new: true,
            runValidators: true 
        });

        if (!updatedMatch) {
            console.log('VALIDATION ERROR: Match not found during update');
            return res.status(404).json({ success: false, error: 'Match not found during update' });
        }

        console.log('Match assignment saved successfully:', {
            matchId: updatedMatch._id,
            refreeEmail: updatedMatch.refreeEmail,
            refreeName: updatedMatch.refreeName,
            refreeId: updatedMatch.refreeId,
            matchStatus: updatedMatch.matchStatus,
            assignedPlayers: playerIds.length,
            assignedReferees: refereeIds.length
        });

        res.json({ 
            success: true, 
            message: 'Match assigned successfully',
            match: {
                _id: updatedMatch._id,
                refreeEmail: updatedMatch.refreeEmail,
                refreeName: updatedMatch.refreeName,
                refreeId: updatedMatch.refreeId,
                assignedRefereeNames: updatedMatch.assignedRefereeNames,
                matchStatus: updatedMatch.matchStatus,
                subMatchAssignments: updatedMatch.subMatchAssignments,
                lastModified: updatedMatch.lastModified
            }
        });
    } catch (error) {
        console.error('CRITICAL ERROR in match assignment:', error);
        console.error('Error stack:', error.stack);
        if (error.name === 'ValidationError') {
            console.error('Mongoose validation errors:', error.errors);
            res.status(400).json({ success: false, error: 'Validation error', details: error.message, validationErrors: error.errors });
        } else {
            res.status(500).json({ success: false, error: 'Server error', details: error.message });
        }
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

// Save match setup
router.post('/match/:id/save-setup', async (req, res) => {
    try {
        const matchId = req.params.id;
        const { refreeEmail, status } = req.body;
        
        const match = await matchesBoys.findById(matchId);
        if (!match) {
            return res.json({ success: false, message: 'Match not found' });
        }

        // Update match with referee and status
        if (refreeEmail) {
            // Get referee details
            const referee = await refreeInfo.findOne({ refEmail: refreeEmail });
            if (referee) {
                match.refreeEmail = refreeEmail;
                match.refreeName = referee.name;
                match.refreeId = [referee._id];
            }
        }
        
        // Update match status
        if (status) {
            match.matchStatus = status;
        }
        
        // Mark setup as saved but not completed
        match.setupSaved = true;
        match.lastModified = new Date();

        await match.save();

        res.json({ 
            success: true, 
            message: 'Match setup saved successfully',
            match: match
        });
    } catch (error) {
        console.error('Error saving match setup:', error);
        res.json({ success: false, message: 'Error saving match setup' });
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
        const { refereeId, refereeEmail, gender, ...playerAssignments } = req.body;

        console.log('Assigning match:', matchId, 'with data:', req.body);

        // Validate ObjectId
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(matchId)) {
            return res.status(400).json({ success: false, message: 'Invalid match ID format' });
        }

        // Determine which collection to use based on gender
        const matchModel = gender === 'girls' ? matchesGirls : matchesBoys;

        // Find the match
        const match = await matchModel.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        let referee = null;

        // Find the referee by ID or email
        if (refereeId) {
            referee = await refreeInfo.findById(refereeId);
        } else if (refereeEmail) {
            referee = await refreeInfo.findOne({ refEmail: refereeEmail });
        }

        if (!referee) {
            return res.status(404).json({ success: false, message: 'Referee not found' });
        }

        // Validate player assignments if provided
        const playerIds = [];
        Object.values(playerAssignments).forEach(value => {
            if (value && mongoose.Types.ObjectId.isValid(value)) {
                playerIds.push(value);
            }
        });

        if (playerIds.length > 0) {
            const players = await playerInfoId.find({ _id: { $in: playerIds } });
            if (players.length !== playerIds.length) {
                return res.status(400).json({ success: false, message: 'One or more players not found' });
            }
        }

        // Update match with referee and player assignments
        const updateData = {
            refreeEmail: referee.refEmail,
            refreeName: referee.name,
            refreeId: [referee._id],
            assignedRefereeNames: [referee.name],
            matchStatus: 'players_allocated',
            lastModified: new Date(),
            ...playerAssignments
        };

        const updatedMatch = await matchModel.findByIdAndUpdate(matchId, updateData, { 
            new: true,
            runValidators: true 
        });

        if (!updatedMatch) {
            return res.status(404).json({ success: false, message: 'Match not found during update' });
        }

        console.log('Match updated with referee and players:', {
            matchId: updatedMatch._id,
            refreeEmail: updatedMatch.refreeEmail,
            refreeName: updatedMatch.refreeName,
            refreeId: updatedMatch.refreeId,
            matchStatus: updatedMatch.matchStatus,
            playerAssignments: Object.keys(playerAssignments).length
        });

        res.json({ 
            success: true, 
            message: 'Players and referee assigned successfully',
            match: {
                _id: updatedMatch._id,
                refreeEmail: updatedMatch.refreeEmail,
                refreeName: updatedMatch.refreeName,
                refreeId: updatedMatch.refreeId,
                assignedRefereeNames: updatedMatch.assignedRefereeNames,
                matchStatus: updatedMatch.matchStatus,
                lastModified: updatedMatch.lastModified
            },
            gender: gender || 'boys'
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

// Simple referee assignment endpoint
router.post('/assign-referee-to-match', async (req, res) => {
    try {
        const { matchId, refereeEmail, gender = 'boys' } = req.body;

        console.log('Assigning referee to match:', { matchId, refereeEmail, gender });

        // Validate input
        if (!matchId || !refereeEmail) {
            return res.status(400).json({ success: false, message: 'matchId and refereeEmail are required' });
        }

        // Validate matchId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(matchId)) {
            return res.status(400).json({ success: false, message: 'Invalid match ID format' });
        }

        // Find the referee
        const referee = await refreeInfo.findOne({ refEmail: refereeEmail });
        if (!referee) {
            return res.status(404).json({ success: false, message: 'Referee not found with email: ' + refereeEmail });
        }

        // Determine which collection to use based on gender
        const matchModel = gender === 'girls' ? matchesGirls : matchesBoys;

        // Find and update the match
        const match = await matchModel.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // Update match with referee information - ensuring all fields are properly set
        const updateData = {
            refreeEmail: referee.refEmail,
            refreeName: referee.name,
            refreeId: [referee._id],
            matchStatus: 'setup_completed',
            assignedRefereeNames: [referee.name],
            lastModified: new Date()
        };

        // Use findByIdAndUpdate for better reliability
        const updatedMatch = await matchModel.findByIdAndUpdate(matchId, updateData, { 
            new: true,
            runValidators: true 
        });

        if (!updatedMatch) {
            return res.status(404).json({ success: false, message: 'Match not found during update' });
        }

        console.log('Successfully assigned referee to match:', {
            matchId: updatedMatch._id,
            refreeEmail: updatedMatch.refreeEmail,
            refreeName: updatedMatch.refreeName,
            refreeId: updatedMatch.refreeId,
            matchStatus: updatedMatch.matchStatus
        });

        res.json({
            success: true,
            message: 'Referee assigned successfully',
            match: {
                _id: updatedMatch._id,
                refreeEmail: updatedMatch.refreeEmail,
                refreeName: updatedMatch.refreeName,
                refreeId: updatedMatch.refreeId,
                assignedRefereeNames: updatedMatch.assignedRefereeNames,
                matchStatus: updatedMatch.matchStatus,
                lastModified: updatedMatch.lastModified
            }
        });

    } catch (error) {
        console.error('Error assigning referee to match:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign referee to match',
            error: error.message
        });
    }
});

// Create scheduled match endpoint
router.post('/schedule/create-match', async (req, res) => {
    try {
        const {
            round,
            gender,
            college1Email,
            college1Name,
            college2Email,
            college2Name,
            date,
            time,
            court,
            matchStatus
        } = req.body;

        console.log('Creating scheduled match:', req.body);

        // Validate required fields
        if (!round || !gender || !college1Email || !college1Name || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create new match based on gender
        let newMatch;
        if (gender === 'boys') {
            newMatch = new matchesBoys({
                college1Name,
                college2Name,
                email1: college1Email,
                email2: college2Email === 'BYE' ? null : college2Email,
                round,
                date,
                time,
                court,
                matchStatus: matchStatus || 'upcoming',
                refreeEmail: '', // Will be assigned later
                refreeName: '', // Will be assigned later
                refreeId: [],
                singlesMatchId: [],
                doublesMatchId: [],
                winnerEmail: '',
                score: [],
                match1Singles: null,
                match2Singles: null,
                match3Doubles: null,
                match4Singles: null,
                match5Doubles: null,
                matchResults: [],
                overallWinner: '',
                completedMatches: 0
            });
        } else {
            // For future girls matches
            return res.status(400).json({
                success: false,
                message: 'Girls tournament not yet implemented'
            });
        }

        // Save the match
        const savedMatch = await newMatch.save();

        // Update college match allocation status if not BYE match
        if (college2Email !== 'BYE') {
            // Update both colleges' isMatchAllocateBoys to true
            await collegeInfo.updateOne(
                { email: college1Email },
                { isMatchAllocateBoys: true }
            );
            
            if (college2Email) {
                await collegeInfo.updateOne(
                    { email: college2Email },
                    { isMatchAllocateBoys: true }
                );
            }
        } else {
            // For BYE matches, only update the college that got the bye
            await collegeInfo.updateOne(
                { email: college1Email },
                { isMatchAllocateBoys: true }
            );
        }

        console.log('Match created successfully:', savedMatch._id);

        res.json({
            success: true,
            message: 'Match created successfully',
            match: savedMatch
        });

    } catch (error) {
        console.error('Error creating scheduled match:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create match',
            error: error.message
        });
    }
});

module.exports = router;