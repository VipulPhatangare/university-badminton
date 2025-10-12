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

// Get referee dashboard
router.get('/dashboard', async (req, res) => {
    try {
        res.render('referee-dashboard');
    } catch (error) {
        console.error('Error loading referee dashboard:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get matches assigned to referee
router.get('/get-matches-info', async (req, res) => {
    try {
        // Use a default referee email for testing or get all matches
        const refereeEmail = 'referee20@badminton.com'; // Default referee for testing

        // Get upcoming matches (not completed and assigned to this referee)
        const upcomingMatches = await matchesBoys.find({
            refreeEmail: refereeEmail,
            matchStatus: { $in: ['upcoming'] }
        }).sort({ date: 1, time: 1 });

        // Get completed matches
        const completedMatches = await matchesBoys.find({
            refreeEmail: refereeEmail,
            matchStatus: 'complete'
        }).sort({ date: -1 });

        // Get live matches
        const liveMatches = await matchesBoys.find({
            refreeEmail: refereeEmail,
            matchStatus: 'live'
        });

        // Format matches for display
        const formatMatches = async (matches) => {
            return Promise.all(matches.map(async (match) => {
                // Get college info
                const college1 = await collegeInfo.findOne({ email: match.email1 });
                const college2 = await collegeInfo.findOne({ email: match.email2 });

                return {
                    _id: match._id,
                    matchNo: `M${match._id.toString().slice(-4)}`,
                    college1Name: match.college1Name,
                    college2Name: match.college2Name,
                    date: match.date,
                    time: match.time,
                    court: match.court || 'TBD',
                    matchStatus: match.matchStatus,
                    winnerEmail: match.winnerEmail,
                    score: match.score,
                    singlesMatchId: match.singlesMatchId,
                    doublesMatchId: match.doublesMatchId
                };
            }));
        };

        const formattedUpcoming = await formatMatches(upcomingMatches);
        const formattedCompleted = await formatMatches(completedMatches);
        const formattedLive = await formatMatches(liveMatches);

        res.json({
            success: true,
            upcomingMatches: formattedUpcoming,
            completedMatches: formattedCompleted,
            liveMatches: formattedLive
        });

    } catch (error) {
        console.error('Error getting matches info:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get match details for match info page
router.get('/match-info/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await matchesBoys.findById(matchId);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // Get college info and players
        const college1 = await collegeInfo.findOne({ email: match.email1 });
        const college2 = await collegeInfo.findOne({ email: match.email2 });

        const college1Players = await playerInfoId.find({ 
            _id: { $in: college1.playerInfoIdBoys } 
        });
        const college2Players = await playerInfoId.find({ 
            _id: { $in: college2.playerInfoIdBoys } 
        });

        // Create clean match object for JSON serialization
        const cleanMatch = {
            _id: match._id,
            college1Name: match.college1Name,
            college2Name: match.college2Name,
            email1: match.email1,
            email2: match.email2,
            date: match.date,
            time: match.time,
            court: match.court,
            round: match.round,
            matchStatus: match.matchStatus,
            refreeEmail: match.refreeEmail,
            refreeName: match.refreeName,
            refreeId: match.refreeId,
            // Include existing player allocations if any
            match1Singles: match.match1Singles,
            match2Singles: match.match2Singles,
            match3Doubles: match.match3Doubles,
            match4Singles: match.match4Singles,
            match5Doubles: match.match5Doubles,
            matchResults: match.matchResults,
            completedMatches: match.completedMatches,
            overallWinner: match.overallWinner
        };

        res.render('match-info', {
            match: cleanMatch,
            college1,
            college2,
            college1Players,
            college2Players
        });

    } catch (error) {
        console.error('Error getting match info:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Start a specific match (singles or doubles)
router.post('/start-match', async (req, res) => {
    try {
        const {
            matchId,
            matchType, // 'singles' or 'doubles'
            matchNumber, // 1, 2, 3 for singles or 1, 2 for doubles
            player1Email,
            player2Email,
            team1Player1Email,
            team1Player2Email,
            team2Player1Email,
            team2Player2Email,
            maxPoints,
            numberOfSets,
            courtNumber,
            firstServer
        } = req.body;

        const mainMatch = await matchesBoys.findById(matchId);
        if (!mainMatch) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        if (matchType === 'singles') {
            // Create or update singles match
            const player1 = await playerInfoId.findOne({ email: player1Email });
            const player2 = await playerInfoId.findOne({ email: player2Email });

            const singlesMatchData = new singlesMatch({
                matchNumber: matchNumber,
                email1: player1Email,
                email2: player2Email,
                player1Name: player1.playerName,
                player2Name: player2.playerName,
                singlesMatchStatus: 'live',
                numberOfSet: numberOfSets,
                maxSetPoint: maxPoints,
                singlesMatchWinnerEmail: '',
                singlesMatchWinnerName: '',
                isMatchComplete: false,
                court: `court_${courtNumber}`,
                sets: []
            });

            const savedSinglesMatch = await singlesMatchData.save();

            // Update main match with singles match ID
            mainMatch.singlesMatchId.push(savedSinglesMatch._id);
            mainMatch.matchStatus = 'live';
            await mainMatch.save();

            // Store match info in session for scorecard
            req.session.currentMatch = {
                type: 'singles',
                matchId: savedSinglesMatch._id,
                mainMatchId: matchId,
                player1Name: player1.playerName,
                player2Name: player2.playerName,
                maxPoints: maxPoints,
                numberOfSets: numberOfSets,
                courtNumber: courtNumber,
                firstServer: firstServer
            };

        } else if (matchType === 'doubles') {
            // Create or update doubles match
            const team1Player1 = await playerInfoId.findOne({ email: team1Player1Email });
            const team1Player2 = await playerInfoId.findOne({ email: team1Player2Email });
            const team2Player1 = await playerInfoId.findOne({ email: team2Player1Email });
            const team2Player2 = await playerInfoId.findOne({ email: team2Player2Email });

            const doublesMatchData = new doublesMatch({
                matchNumber: matchNumber,
                email1: mainMatch.email1,
                email2: mainMatch.email2,
                team1Player1Name: team1Player1.playerName,
                team1Player2Name: team1Player2.playerName,
                team2Player1Name: team2Player1.playerName,
                team2Player2Name: team2Player2.playerName,
                singlesMatchStatus: 'live',
                numberOfSet: numberOfSets,
                maxSetPoint: maxPoints,
                doublesMatchWinnerEmail: '',
                doublesMatchWinnerName1: '',
                doublesMatchWinnerName2: '',
                isMatchComplete: false,
                court: `court_${courtNumber}`,
                sets: []
            });

            const savedDoublesMatch = await doublesMatchData.save();

            // Update main match with doubles match ID
            mainMatch.doublesMatchId.push(savedDoublesMatch._id);
            mainMatch.matchStatus = 'live';
            await mainMatch.save();

            // Store match info in session for scorecard
            req.session.currentMatch = {
                type: 'doubles',
                matchId: savedDoublesMatch._id,
                mainMatchId: matchId,
                team1Player1Name: team1Player1.playerName,
                team1Player2Name: team1Player2.playerName,
                team2Player1Name: team2Player1.playerName,
                team2Player2Name: team2Player2.playerName,
                maxPoints: maxPoints,
                numberOfSets: numberOfSets,
                courtNumber: courtNumber,
                firstServer: firstServer
            };
        }

        res.json({ success: true, message: 'Match started successfully' });

    } catch (error) {
        console.error('Error starting match:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get scorecard page
router.get('/scorecard', async (req, res) => {
    try {
        // For testing, create a default current match if not exists
        let currentMatch = req.session.currentMatch;
        if (!currentMatch) {
            currentMatch = {
                type: 'singles',
                matchId: 'test123',
                mainMatchId: 'main123',
                player1Name: 'Test Player 1',
                player2Name: 'Test Player 2',
                maxPoints: 21,
                numberOfSets: 3,
                courtNumber: 1,
                firstServer: 'team1'
            };
        }
        res.render('scorecard', { currentMatch });

    } catch (error) {
        console.error('Error loading scorecard:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update match score
router.post('/update-score', async (req, res) => {
    try {
        const { setData, matchComplete, winner } = req.body;
        const currentMatch = req.session.currentMatch;

        if (currentMatch.type === 'singles') {
            const match = await singlesMatch.findById(currentMatch.matchId);
            
            // Save set data
            const setDoc = new set({
                maxPoint: currentMatch.maxPoints,
                player1point: setData.player1Score,
                player2point: setData.player2Score,
                isSetComplete: true,
                serve: setData.lastServer,
                setWinnerEmail: setData.winnerEmail
            });
            
            const savedSet = await setDoc.save();
            match.sets.push(savedSet._id);

            if (matchComplete) {
                match.singlesMatchStatus = 'complete';
                match.isMatchComplete = true;
                match.singlesMatchWinnerEmail = winner.email;
                match.singlesMatchWinnerName = winner.name;
            }

            await match.save();

        } else if (currentMatch.type === 'doubles') {
            const match = await doublesMatch.findById(currentMatch.matchId);
            
            // Save set data
            const setDoc = new set({
                maxPoint: currentMatch.maxPoints,
                player1point: setData.player1Score,
                player2point: setData.player2Score,
                isSetComplete: true,
                serve: setData.lastServer,
                setWinnerEmail: setData.winnerEmail
            });
            
            const savedSet = await setDoc.save();
            match.sets.push(savedSet._id);

            if (matchComplete) {
                match.singlesMatchStatus = 'complete';
                match.isMatchComplete = true;
                match.doublesMatchWinnerEmail = winner.email;
                match.doublesMatchWinnerName1 = winner.name1;
                match.doublesMatchWinnerName2 = winner.name2;
            }

            await match.save();
        }

        if (matchComplete) {
            // Check if all individual matches in the main match are complete
            const mainMatch = await matchesBoys.findById(currentMatch.mainMatchId);
            
            // Get all singles and doubles matches for this main match
            const allSingles = await singlesMatch.find({ 
                _id: { $in: mainMatch.singlesMatchId } 
            });
            const allDoubles = await doublesMatch.find({ 
                _id: { $in: mainMatch.doublesMatchId } 
            });

            const allMatches = [...allSingles, ...allDoubles];
            const allComplete = allMatches.every(m => 
                m.singlesMatchStatus === 'complete' || m.isMatchComplete
            );

            if (allComplete) {
                // Calculate overall match winner based on individual match results
                let college1Wins = 0;
                let college2Wins = 0;

                allSingles.forEach(match => {
                    // Determine which college the winner belongs to
                    // This requires checking player emails against college rosters
                    if (match.singlesMatchWinnerEmail) {
                        // Add logic to determine college based on player email
                        // For now, simplified logic
                        college1Wins++; // This should be properly calculated
                    }
                });

                allDoubles.forEach(match => {
                    if (match.doublesMatchWinnerEmail) {
                        // Add logic to determine college based on team email
                        college1Wins++; // This should be properly calculated
                    }
                });

                mainMatch.matchStatus = 'complete';
                mainMatch.winnerEmail = college1Wins > college2Wins ? 
                    mainMatch.email1 : mainMatch.email2;
                await mainMatch.save();
            }

            // Clear current match from session
            delete req.session.currentMatch;
        }

        res.json({ success: true, message: 'Score updated successfully' });

    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get colleges and their players for a match
router.get('/get-match-players/:matchId', async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await matchesBoys.findById(matchId);

        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        // Get college info
        const college1 = await collegeInfo.findOne({ email: match.email1 });
        const college2 = await collegeInfo.findOne({ email: match.email2 });

        // Get players
        const college1Players = await playerInfoId.find({ 
            _id: { $in: college1.playerInfoIdBoys } 
        });
        const college2Players = await playerInfoId.find({ 
            _id: { $in: college2.playerInfoIdBoys } 
        });

        res.json({
            success: true,
            match: {
                _id: match._id,
                college1Name: match.college1Name,
                college2Name: match.college2Name,
                date: match.date,
                time: match.time
            },
            college1: {
                name: college1.collegeName,
                players: college1Players
            },
            college2: {
                name: college2.collegeName,
                players: college2Players
            }
        });

    } catch (error) {
        console.error('Error getting match players:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get college players for player selection
router.get('/college/:email/players', async (req, res) => {
    try {
        const collegeEmail = req.params.email;
        
        // Find college info
        const college = await collegeInfo.findOne({ email: collegeEmail });
        if (!college) {
            return res.status(404).json({ success: false, message: 'College not found' });
        }

        // Get players for this college using the playerInfoIdBoys array
        const players = await playerInfoId.find({ 
            _id: { $in: college.playerInfoIdBoys || [] }
        }).select('playerName email');
        
        console.log(`Found ${players.length} players for college ${college.collegeName}`);
        res.json(players);
    } catch (error) {
        console.error('Error fetching college players:', error);
        res.status(500).json({ success: false, message: 'Error fetching players' });
    }
});

// Get all referees
router.get('/all-referees', async (req, res) => {
    try {
        const referees = await refreeInfo.find({}).select('name refEmail');
        // Map to use consistent field names
        const formattedReferees = referees.map(ref => ({
            name: ref.name,
            email: ref.refEmail
        }));
        console.log('Found referees:', formattedReferees);
        res.json(formattedReferees);
    } catch (error) {
        console.error('Error fetching referees:', error);
        res.status(500).json({ success: false, message: 'Error fetching referees' });
    }
});

// Assign additional referee to match
router.post('/match/:id/assign-referee', async (req, res) => {
    try {
        const matchId = req.params.id;
        const { refereeEmail } = req.body;

        // Find the referee
        const referee = await refreeInfo.findOne({ refEmail: refereeEmail });
        if (!referee) {
            return res.json({ success: false, message: 'Referee not found' });
        }

        // Update match with new referee
        const match = await matchesBoys.findById(matchId);
        if (!match.refreeId) {
            match.refreeId = [];
        }
        
        // Add referee if not already assigned
        if (!match.refreeId.includes(referee._id)) {
            match.refreeId.push(referee._id);
            await match.save();
        }

        res.json({ success: true, message: 'Referee assigned successfully' });
    } catch (error) {
        console.error('Error assigning referee:', error);
        res.json({ success: false, message: 'Error assigning referee' });
    }
});

// Allocate players to match
router.post('/match/:id/allocate-players', async (req, res) => {
    try {
        const matchId = req.params.id;
        const playerAllocations = req.body;

        // Update match with player allocations
        const updatedMatch = await matchesBoys.findByIdAndUpdate(
            matchId, 
            {
                ...playerAllocations,
                matchStatus: 'players_allocated',
                // Initialize match results array
                matchResults: [
                    { matchNumber: 1, winnerTeam: null, winnerEmail: null, isComplete: false },
                    { matchNumber: 2, winnerTeam: null, winnerEmail: null, isComplete: false },
                    { matchNumber: 3, winnerTeam: null, winnerEmail: null, isComplete: false },
                    { matchNumber: 4, winnerTeam: null, winnerEmail: null, isComplete: false },
                    { matchNumber: 5, winnerTeam: null, winnerEmail: null, isComplete: false }
                ],
                completedMatches: 0,
                overallWinner: null
            },
            { new: true }
        );

        if (!updatedMatch) {
            return res.json({ success: false, message: 'Match not found' });
        }

        res.json({ success: true, message: 'Player allocations saved successfully', match: updatedMatch });
    } catch (error) {
        console.error('Error allocating players:', error);
        res.json({ success: false, message: 'Error saving player allocations' });
    }
});

// Get assigned referees for a match
router.get('/match/:id/assigned-referees', async (req, res) => {
    try {
        const matchId = req.params.id;
        const match = await matchesBoys.findById(matchId).populate('refreeId');
        
        if (!match) {
            return res.json({ success: false, message: 'Match not found' });
        }

        const assignedReferees = [];
        if (match.refreeId && Array.isArray(match.refreeId)) {
            for (let refereeId of match.refreeId) {
                const referee = await refreeInfo.findById(refereeId);
                if (referee) {
                    assignedReferees.push({
                        name: referee.name,
                        email: referee.refEmail
                    });
                }
            }
        }

        res.json({ success: true, referees: assignedReferees });
    } catch (error) {
        console.error('Error getting assigned referees:', error);
        res.json({ success: false, message: 'Error getting assigned referees' });
    }
});

module.exports = router;