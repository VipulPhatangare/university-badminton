const express = require('express');
const router = express.Router();
const { matchesBoys, matchesGirls, refreeInfo, collegeInfo, matches } = require('../database/schema');
const auth = require('./auth');

// Utility function to determine tournament format based on round
function getTournamentFormat(round) {
    const roundLower = round.toLowerCase();
    
    // Best of 3 format (2 singles + 1 doubles, need 2 wins)
    if (roundLower.includes('round_1') || roundLower.includes('round_2') || roundLower.includes('quarter')) {
        return {
            matchFormat: 'best_of_3',
            requiredWins: 2,
            totalMatches: 3,
            matchTypes: ['singles', 'singles', 'doubles'],
            matchNames: ['Singles 1', 'Singles 2', 'Doubles 1']
        };
    }
    
    // Best of 5 format (3 singles + 2 doubles, need 3 wins)
    if (roundLower.includes('semi') || roundLower.includes('final')) {
        return {
            matchFormat: 'best_of_5',
            requiredWins: 3,
            totalMatches: 5,
            matchTypes: ['singles', 'singles', 'doubles', 'singles', 'doubles'],
            matchNames: ['Singles 1', 'Singles 2', 'Doubles 1', 'Singles 3', 'Doubles 2']
        };
    }
    
    // Default to best of 3 for unknown rounds
    return {
        matchFormat: 'best_of_3',
        requiredWins: 2,
        totalMatches: 3,
        matchTypes: ['singles', 'singles', 'doubles'],
        matchNames: ['Singles 1', 'Singles 2', 'Doubles 1']
    };
}

// Middleware to check if user is a referee
const requireReferee = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.type === 'referee') {
        return next();
    } else {
        return res.status(401).json({ 
            success: false, 
            message: 'Referee authentication required' 
        });
    }
};

// Use auth middleware for routes that need authentication
const requireAuth = auth.requireAuth;

// Get assigned matches for the logged-in referee
router.get('/matches/assigned', requireReferee, async (req, res) => {
    try {
        const refereeEmail = req.session.user.email;
        
        // Get boys matches assigned to this referee
        const boysMatches = await matchesBoys.find({
            refreeEmail: refereeEmail,
            matchStatus: { $ne: 'complete' }
        });
        
        // Get girls matches assigned to this referee
        const girlsMatches = await matchesGirls.find({
            refreeEmail: refereeEmail,
            matchStatus: { $ne: 'complete' }
        });
        
        // Add gender identifier to each match
        const formattedBoysMatches = boysMatches.map(match => {
            const matchObj = match.toObject();
            matchObj.gender = 'boys';
            return matchObj;
        });
        
        const formattedGirlsMatches = girlsMatches.map(match => {
            const matchObj = match.toObject();
            matchObj.gender = 'girls';
            return matchObj;
        });
        
        // Combine and sort by date
        const allMatches = [...formattedBoysMatches, ...formattedGirlsMatches]
            .sort((a, b) => {
                // Sort by in-progress status first
                if (a.setInProgress && !b.setInProgress) return -1;
                if (!a.setInProgress && b.setInProgress) return 1;
                
                // Then by date (if available)
                if (a.date && b.date) {
                    return new Date(a.date) - new Date(b.date);
                }
                return 0;
            });
        
        res.json({ success: true, matches: allMatches });
    } catch (error) {
        console.error('Error fetching assigned matches:', error);
        res.status(500).json({ success: false, message: 'Error fetching assigned matches' });
    }
});

// Get tournament format for a specific match
router.get('/match/:id/tournament-format', requireReferee, async (req, res) => {
    try {
        const matchId = req.params.id;
        
        // Try boys matches first
        let match = await matchesBoys.findById(matchId);
        if (!match) {
            // Try girls matches
            match = await matchesGirls.findById(matchId);
        }
        
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        const tournamentFormat = getTournamentFormat(match.round || 'round_1');
        
        res.json({ 
            success: true, 
            tournamentFormat,
            matchRound: match.round,
            gender: match.gender || 'boys'
        });
    } catch (error) {
        console.error('Error fetching tournament format:', error);
        res.status(500).json({ success: false, message: 'Error fetching tournament format' });
    }
});

// Get completed matches for the logged-in referee
router.get('/matches/completed', requireReferee, async (req, res) => {
    try {
        const refereeEmail = req.session.user.email;
        
        // Get completed boys matches assigned to this referee
        const boysMatches = await matchesBoys.find({
            refreeEmail: refereeEmail,
            matchStatus: 'complete'
        });
        
        // Get completed girls matches assigned to this referee
        const girlsMatches = await matchesGirls.find({
            refreeEmail: refereeEmail,
            matchStatus: 'complete'
        });
        
        // Add gender identifier to each match
        const formattedBoysMatches = boysMatches.map(match => {
            const matchObj = match.toObject();
            matchObj.gender = 'boys';
            return matchObj;
        });
        
        const formattedGirlsMatches = girlsMatches.map(match => {
            const matchObj = match.toObject();
            matchObj.gender = 'girls';
            return matchObj;
        });
        
        // Combine and sort by date (most recent first)
        const allMatches = [...formattedBoysMatches, ...formattedGirlsMatches]
            .sort((a, b) => {
                if (a.date && b.date) {
                    return new Date(b.date) - new Date(a.date);
                }
                return 0;
            });
        
        res.json({ success: true, matches: allMatches });
    } catch (error) {
        console.error('Error fetching completed matches:', error);
        res.status(500).json({ success: false, message: 'Error fetching completed matches' });
    }
});

// Get details for a specific match
router.get('/matches/:matchId', requireReferee, async (req, res) => {
    try {
        const { matchId } = req.params;
        const { gender = 'boys' } = req.query;
        
        // Determine which collection to query based on gender
        const MatchModel = gender === 'girls' ? matchesGirls : matchesBoys;
        
        // Find the match by ID
        const match = await MatchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        // Add gender to the match object
        const matchWithGender = match.toObject();
        matchWithGender.gender = gender;
        
        res.json({ success: true, match: matchWithGender });
    } catch (error) {
        console.error('Error fetching match details:', error);
        res.status(500).json({ success: false, message: 'Error fetching match details' });
    }
});

// Search for matches (assigned or completed)
router.get('/matches/search', requireReferee, async (req, res) => {
    try {
        const { query, type } = req.query;
        const refereeEmail = req.session.user.email;
        
        // Create search criteria
        const searchCriteria = {
            refreeEmail: refereeEmail,
            $or: [
                { college1Name: new RegExp(query, 'i') },
                { college2Name: new RegExp(query, 'i') },
                { round: new RegExp(query, 'i') }
            ]
        };
        
        // Add status criteria based on the search type
        if (type === 'assigned') {
            searchCriteria.matchStatus = { $ne: 'complete' };
        } else if (type === 'completed') {
            searchCriteria.matchStatus = 'complete';
        }
        
        // Query both collections
        const boysMatches = await matchesBoys.find(searchCriteria);
        const girlsMatches = await matchesGirls.find(searchCriteria);
        
        // Add gender identifier to each match
        const formattedBoysMatches = boysMatches.map(match => {
            const matchObj = match.toObject();
            matchObj.gender = 'boys';
            return matchObj;
        });
        
        const formattedGirlsMatches = girlsMatches.map(match => {
            const matchObj = match.toObject();
            matchObj.gender = 'girls';
            return matchObj;
        });
        
        // Combine and sort by date
        const allMatches = [...formattedBoysMatches, ...formattedGirlsMatches]
            .sort((a, b) => {
                // For assigned matches, sort by in-progress status first
                if (type === 'assigned') {
                    if (a.setInProgress && !b.setInProgress) return -1;
                    if (!a.setInProgress && b.setInProgress) return 1;
                }
                
                // Then by date
                if (a.date && b.date) {
                    // For completed matches, show newest first
                    if (type === 'completed') {
                        return new Date(b.date) - new Date(a.date);
                    }
                    // For assigned matches, show oldest first
                    return new Date(a.date) - new Date(b.date);
                }
                return 0;
            });
        
        res.json({ success: true, matches: allMatches });
    } catch (error) {
        console.error('Error searching matches:', error);
        res.status(500).json({ success: false, message: 'Error searching matches' });
    }
});

// Start a submatch
// Start a main match (mark as started)
router.post('/matches/start-match', requireReferee, async (req, res) => {
    try {
        const { matchId, gender = 'boys' } = req.body;
        
        // Validate the required parameters
        if (!matchId) {
            return res.status(400).json({ success: false, message: 'Missing match ID' });
        }
        
        // Determine which collection to update based on gender
        const MatchModel = gender === 'girls' ? matchesGirls : matchesBoys;
        
        // Find the match by ID
        const match = await MatchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        // Update the match to mark it as started
        const updateObj = {
            setInProgress: true,
            matchStarted: true,
            matchStartedAt: new Date(),
            matchStatus: 'live'
        };
        
        await MatchModel.findByIdAndUpdate(matchId, updateObj);
        
        res.json({ success: true, message: 'Match started successfully' });
    } catch (error) {
        console.error('Error starting match:', error);
        res.status(500).json({ success: false, message: 'Error starting match' });
    }
});

router.post('/matches/start-submatch', requireReferee, async (req, res) => {
    try {
        const { matchId, submatchKey, maxPoints = 21, numberOfSets = 3, courtNumber, initialServer, gender = 'boys' } = req.body;
        
        // Validate the required parameters
        if (!matchId || !submatchKey || !courtNumber || !initialServer) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        // Determine which collection to update based on gender
        const MatchModel = gender === 'girls' ? matchesGirls : matchesBoys;
        
        // Find the match by ID
        const match = await MatchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        // Get the data key for scorecard data
        const dataKey = getSubmatchDataKey(submatchKey);
        
        // Update the match to mark the submatch as started
        // Create an update object with dynamic key based on submatchKey
        const updateObj = {};
        updateObj[`${submatchKey}.isStarted`] = true;
        updateObj[`${submatchKey}.startedAt`] = new Date();
        updateObj[`${submatchKey}.matchSettings.courtNumber`] = parseInt(courtNumber);
        updateObj[`${submatchKey}.matchSettings.firstServePlayer`] = initialServer;
        updateObj[`${submatchKey}.matchSettings.maxPoints`] = parseInt(maxPoints);
        updateObj[`${submatchKey}.matchSettings.numberOfSets`] = parseInt(numberOfSets);
        updateObj.matchStatus = 'live';
        updateObj.currentActiveMatch = submatchKey;
        
        // Initialize scorecard data structure for this submatch
        updateObj[`scorecardData.${dataKey}`] = {
            currentSet: 1,
            scores: [],
            currentScore: {
                player1: 0,
                player2: 0,
                server: initialServer === 'team1' ? 0 : 1
            },
            lastUpdated: new Date()
        };
        
        await MatchModel.findByIdAndUpdate(matchId, updateObj);
        
        res.json({ success: true, message: 'Submatch started successfully' });
    } catch (error) {
        console.error('Error starting submatch:', error);
        res.status(500).json({ success: false, message: 'Error starting submatch' });
    }
});

// Route to render the referee dashboard page
router.get('/', (req, res) => {
    // Check if the user is logged in as a referee
    if (req.session && req.session.user && req.session.user.type === 'referee') {
        res.render('referee-dashboard');
    } else {
        // Redirect to login page if not authenticated as a referee
        res.redirect('/?auth=required&type=referee');
    }
});

// Additional routes related to the scorecard

// Get match info for the scorecard
router.get('/get-match-info', requireReferee, async (req, res) => {
    try {
        const { matchId, matchType, submatchKey } = req.query;
        
        if (!matchId || !matchType || !submatchKey) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        // Determine which collection to query based on matchType
        const MatchModel = matchType === 'girls' ? matchesGirls : matchesBoys;
        
        // Find the match by ID
        const match = await MatchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        // Extract the relevant submatch information
        const submatch = match[submatchKey];
        
        if (!submatch) {
            return res.status(404).json({ success: false, message: 'Submatch not found' });
        }
        
        // Determine player names based on match type
        let playerName1, playerName2;
        
        // Check if it's a singles or doubles match
        if (submatchKey.includes('Singles')) {
            playerName1 = submatch.player1Name;
            playerName2 = submatch.player2Name;
        } else {
            // For doubles, combine player names
            playerName1 = `${submatch.team1Player1Name} / ${submatch.team1Player2Name}`;
            playerName2 = `${submatch.team2Player1Name} / ${submatch.team2Player2Name}`;
        }
        
        // Get the court number, server, and match settings
        const courtNumber = submatch.matchSettings?.courtNumber || 1;
        const firstServePlayer = submatch.matchSettings?.firstServePlayer || 'team1';
        const maxSetPoint = submatch.matchSettings?.maxPoints || 21;
        const numberOfSets = submatch.matchSettings?.numberOfSets || 3;
        
        // Get scorecard data for this submatch
        const dataKey = getSubmatchDataKey(submatchKey);
        const scorecardData = match.scorecardData?.[dataKey];
        
        // Create the match info object
        const matchInfo = {
            matchId,
            matchType,
            submatchKey,
            submatchIndex: getSubmatchIndex(submatchKey, matchType),
            college1Name: match.college1Name,
            college2Name: match.college2Name,
            playerName1,
            playerName2,
            courtNumber,
            firstServePlayer,
            maxSetPoint,
            numberOfSets,
            round: match.round || 'round_1',
            matchNo: match.matchNo || 1,
            // Include any existing sets
            sets: scorecardData?.scores || [],
            // Include current game state
            currentSet: scorecardData?.currentSet || 1,
            currentScore: scorecardData?.currentScore || {
                player1: 0,
                player2: 0,
                server: firstServePlayer === 'team1' ? 0 : 1
            },
            isMatchActive: submatch?.isStarted && !submatch?.isCompleted,
            // Include completed sets information
            setsWon: calculateSetsWon(scorecardData?.scores || [])
        };
        
        res.json(matchInfo);
    } catch (error) {
        console.error('Error fetching match info for scorecard:', error);
        res.status(500).json({ success: false, message: 'Error fetching match info' });
    }
});

// Update score during a match
router.post('/update-score', requireReferee, async (req, res) => {
    try {
        let requestData = req.body;
        
        // If data was sent as text/plain (sendBeacon), parse it
        if (typeof req.body === 'string') {
            try {
                requestData = JSON.parse(req.body);
            } catch (e) {
                console.error('Failed to parse request body:', req.body);
                return res.status(400).json({ success: false, message: 'Invalid JSON data' });
            }
        }
        
        // If still no data, log for debugging
        if (!requestData) {
            console.error('No request data found. Content-Type:', req.get('Content-Type'));
            console.error('Raw body:', req.body);
            return res.status(400).json({ success: false, message: 'No data received' });
        }
        
        const { matchId, matchType, submatchKey, player1Point, player2Point, currentSet, server } = requestData;
        
        if (!matchId || !matchType || !submatchKey) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        // Determine which collection to update based on matchType
        const MatchModel = matchType === 'girls' ? matchesGirls : matchesBoys;
        
        // Get the data key for the scorecard data
        const dataKey = getSubmatchDataKey(submatchKey);
        
        // Find the match to check if scorecard data exists
        const match = await MatchModel.findById(matchId);
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        // Initialize scorecard data structure if it doesn't exist
        if (!match.scorecardData) {
            match.scorecardData = {};
        }
        
        if (!match.scorecardData[dataKey]) {
            match.scorecardData[dataKey] = {
                currentSet: currentSet || 1,
                scores: [],
                currentScore: {
                    player1: 0,
                    player2: 0,
                    server: 0
                },
                lastUpdated: new Date()
            };
        }
        
        // Create the update object
        const updateObj = {};
        updateObj[`scorecardData.${dataKey}.currentScore.player1`] = player1Point;
        updateObj[`scorecardData.${dataKey}.currentScore.player2`] = player2Point;
        updateObj[`scorecardData.${dataKey}.currentScore.server`] = server;
        updateObj[`scorecardData.${dataKey}.currentSet`] = currentSet;
        updateObj[`scorecardData.${dataKey}.lastUpdated`] = new Date();
        
        // Update the match
        await MatchModel.findByIdAndUpdate(matchId, updateObj);
        
        res.json({ success: true, message: 'Score updated successfully' });
    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({ success: false, message: 'Error updating score' });
    }
});

// Start a new set in a match
router.post('/new-set', requireReferee, async (req, res) => {
    try {
        const { matchId, matchType, submatchKey, setNumber } = req.body;
        
        if (!matchId || !matchType || !submatchKey || !setNumber) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        // Determine which collection to update based on matchType
        const MatchModel = matchType === 'girls' ? matchesGirls : matchesBoys;
        
        // Get the data key for the scorecard data
        const dataKey = getSubmatchDataKey(submatchKey);
        
        // Find the match
        const match = await MatchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        // Make sure scorecardData exists
        if (!match.scorecardData) {
            match.scorecardData = {};
        }
        
        // Make sure the submatch scorecard data exists
        if (!match.scorecardData[dataKey]) {
            match.scorecardData[dataKey] = {
                currentSet: 0,
                scores: [],
                currentScore: {
                    player1: 0,
                    player2: 0,
                    server: 0
                },
                lastUpdated: new Date()
            };
        }
        
        // Update the current set
        match.scorecardData[dataKey].currentSet = setNumber;
        
        // Reset current scores
        match.scorecardData[dataKey].currentScore = {
            player1: 0,
            player2: 0,
            server: 0
        };
        
        // Update lastUpdated
        match.scorecardData[dataKey].lastUpdated = new Date();
        
        // Save the match
        await match.save();
        
        res.json({ success: true, message: 'New set started successfully' });
    } catch (error) {
        console.error('Error starting new set:', error);
        res.status(500).json({ success: false, message: 'Error starting new set' });
    }
});

// Complete a set in a match
router.post('/complete-set', requireReferee, async (req, res) => {
    try {
        const { matchId, matchType, submatchKey, setNumber, winnerIndex, player1Point, player2Point, server } = req.body;
        
        if (!matchId || !matchType || !submatchKey || setNumber === undefined || winnerIndex === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        // Determine which collection to update based on matchType
        const MatchModel = matchType === 'girls' ? matchesGirls : matchesBoys;
        
        // Get the data key for the scorecard data
        const dataKey = getSubmatchDataKey(submatchKey);
        
        // Find the match
        const match = await MatchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        // Make sure scorecardData exists
        if (!match.scorecardData) {
            match.scorecardData = {};
        }
        
        // Make sure the submatch scorecard data exists
        if (!match.scorecardData[dataKey]) {
            match.scorecardData[dataKey] = {
                currentSet: setNumber,
                scores: [],
                currentScore: {
                    player1: player1Point,
                    player2: player2Point,
                    server
                },
                lastUpdated: new Date()
            };
        }
        
        // Add the completed set to scores array
        match.scorecardData[dataKey].scores.push({
            setNumber,
            player1Score: player1Point,
            player2Score: player2Point,
            isComplete: true,
            completedAt: new Date()
        });
        
        // Save the match
        await match.save();
        
        res.json({ success: true, message: 'Set completed successfully' });
    } catch (error) {
        console.error('Error completing set:', error);
        res.status(500).json({ success: false, message: 'Error completing set' });
    }
});

// Complete a match
router.post('/complete-match', requireReferee, async (req, res) => {
    try {
        const { matchId, matchType, submatchKey, winnerIndex, setsWon } = req.body;
        
        if (!matchId || !matchType || !submatchKey || winnerIndex === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        // Determine which collection to update based on matchType
        const MatchModel = matchType === 'girls' ? matchesGirls : matchesBoys;
        
        // Find the match
        const match = await MatchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        // Update the submatch to mark it as completed
        const updateObj = {};
        updateObj[`${submatchKey}.isCompleted`] = true;
        updateObj[`${submatchKey}.completedAt`] = new Date();
        updateObj[`${submatchKey}.winnerTeam`] = winnerIndex === 0 ? 'team1' : 'team2';
        
        // Update the match winner name based on the winner team
        if (updateObj[`${submatchKey}.winnerTeam`] === 'team1') {
            if (submatchKey.includes('Singles')) {
                updateObj[`${submatchKey}.winnerName`] = match[submatchKey].player1Name;
            } else {
                updateObj[`${submatchKey}.winnerName`] = `${match[submatchKey].team1Player1Name} / ${match[submatchKey].team1Player2Name}`;
            }
        } else {
            if (submatchKey.includes('Singles')) {
                updateObj[`${submatchKey}.winnerName`] = match[submatchKey].player2Name;
            } else {
                updateObj[`${submatchKey}.winnerName`] = `${match[submatchKey].team2Player1Name} / ${match[submatchKey].team2Player2Name}`;
            }
        }
        
        // Increment completedMatches count
        updateObj.completedMatches = (match.completedMatches || 0) + 1;
        
        // Clear currentActiveMatch if this was the active match
        if (match.currentActiveMatch === submatchKey) {
            updateObj.currentActiveMatch = null;
        }
        
        // Don't automatically mark match as complete - let frontend handle this
        // The match will only be marked complete when the referee clicks "End Match" button
        // This ensures the winner popup is shown properly before completion
        
        // Check if match should be complete (for frontend reference only)
        const isMatchComplete = checkMatchCompletion(match, submatchKey, winnerIndex, matchType);
        
        // Update the match (but don't change matchStatus)
        await MatchModel.findByIdAndUpdate(matchId, updateObj);
        
        res.json({ success: true, message: 'Submatch completed successfully', isMatchComplete });
    } catch (error) {
        console.error('Error completing match:', error);
        res.status(500).json({ success: false, message: 'Error completing match' });
    }
});

// Reset a match (for testing purposes)
router.post('/reset-match', requireReferee, async (req, res) => {
    try {
        const { matchId, matchType } = req.body;
        
        if (!matchId || !matchType) {
            return res.status(400).json({ success: false, message: 'Missing required parameters' });
        }
        
        // Determine which collection to update based on matchType
        const MatchModel = matchType === 'girls' ? matchesGirls : matchesBoys;
        
        // Find the match
        const match = await MatchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }
        
        // Reset all match properties related to scoring
        const updateObj = {
            matchStatus: 'upcoming',
            completedMatches: 0,
            currentActiveMatch: null,
            overallWinner: null,
            winnerName: null,
            scorecardData: {}
        };
        
        // Get tournament format to determine correct submatch keys
        const tournamentFormat = getTournamentFormat(match.round || 'round_1');
        
        // Reset all submatches based on tournament format
        const submatchKeys = tournamentFormat.totalMatches === 3 
            ? ['match1Singles', 'match2Singles', 'match3Doubles'] 
            : ['match1Singles', 'match2Singles', 'match3Doubles', 'match4Singles', 'match5Doubles'];
        
        submatchKeys.forEach(key => {
            updateObj[`${key}.isStarted`] = false;
            updateObj[`${key}.isCompleted`] = false;
            updateObj[`${key}.startedAt`] = null;
            updateObj[`${key}.completedAt`] = null;
            updateObj[`${key}.winnerTeam`] = null;
            updateObj[`${key}.winnerName`] = null;
            updateObj[`${key}.matchSettings.courtNumber`] = null;
            updateObj[`${key}.matchSettings.firstServePlayer`] = null;
        });
        
        // Update the match
        await MatchModel.findByIdAndUpdate(matchId, updateObj);
        
        res.json({ success: true, message: 'Match reset successfully' });
    } catch (error) {
        console.error('Error resetting match:', error);
        res.status(500).json({ success: false, message: 'Error resetting match' });
    }
});

// End entire match: finalize, advance rounds, clear losing college round, assign next match to referee
router.post('/matches/end-match', requireReferee, async (req, res) => {
    try {
        const { matchId, gender = 'boys' } = req.body;
        if (!matchId) return res.status(400).json({ success: false, message: 'Missing matchId' });

        const MatchModel = gender === 'girls' ? matchesGirls : matchesBoys;
        const match = await MatchModel.findById(matchId);
        if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

        // Determine overall winner team (no longer using emails)
        const overallWinner = match.overallWinner || null;

        // If no overallWinner, compute based on completed submatches
        let winnerTeam = overallWinner;
        if (!winnerTeam) {
            // Get tournament format to determine match structure and required wins
            const tournamentFormat = getTournamentFormat(match.round || 'round_1');
            const requiredWins = tournamentFormat.requiredWins;
            
            // Count wins based on tournament format
            const submatchKeys = tournamentFormat.totalMatches === 3 
                ? ['match1Singles', 'match2Singles', 'match3Doubles'] 
                : ['match1Singles', 'match2Singles', 'match3Doubles', 'match4Singles', 'match5Doubles'];
                
            let team1Wins = 0, team2Wins = 0;
            submatchKeys.forEach(k => {
                if (match[k]?.isCompleted) {
                    if (match[k].winnerTeam === 'team1') team1Wins++;
                    if (match[k].winnerTeam === 'team2') team2Wins++;
                }
            });
            
            console.log(`Counting wins - Team1: ${team1Wins}, Team2: ${team2Wins}, Required: ${requiredWins}`);
            
            // Determine winner based on required wins for this tournament format
            if (team1Wins >= requiredWins) winnerTeam = 'team1';
            else if (team2Wins >= requiredWins) winnerTeam = 'team2';
        }

        // Update match status to complete if not already
        const updateObj = { matchStatus: 'complete', matchCompletedAt: new Date() };
        if (winnerTeam) {
            updateObj.overallWinner = winnerTeam;
            updateObj.winnerCollegeEmail = winnerTeam === 'team1' ? match.email1 : match.email2;
        }

        await MatchModel.findByIdAndUpdate(matchId, updateObj);

        // Advance winner college round and clear loser round
        try {
            // Determine next round mapping
            const rounds = ['round_1','round_2','quater','semi','final'];
            // Winner & loser emails (college level)
            const winnerCollegeEmail = updateObj.winnerCollegeEmail || match.email1;
            const loserCollegeEmail = (winnerCollegeEmail === match.email1) ? match.email2 : match.email1;

            // Load colleges
            const winnerCollege = await collegeInfo.findOne({ email: winnerCollegeEmail });
            const loserCollege = await collegeInfo.findOne({ email: loserCollegeEmail });

            if (winnerCollege) {
                // advance to next round (if not final)
                const currentRound = winnerCollege.currentRoundBoys || winnerCollege.currentRoundGirls || null;
                // We need to decide based on gender which field to use
                const roundField = (gender === 'girls') ? 'currentRoundGirls' : 'currentRoundBoys';
                const allocationField = (gender === 'girls') ? 'isMatchAllocateGirls' : 'isMatchAllocateBoys';
                
                let idx = rounds.indexOf(winnerCollege[roundField]);
                if (idx === -1) idx = 0; // if null or unknown, treat as round_1
                if (idx < rounds.length - 1) {
                    winnerCollege[roundField] = rounds[idx + 1];
                } else {
                    winnerCollege[roundField] = 'final';
                }
                
                // Reset the match allocation status so college can be allocated to new matches in next round
                winnerCollege[allocationField] = false;
                
                await winnerCollege.save();
            }

            if (loserCollege) {
                const roundField = (gender === 'girls') ? 'currentRoundGirls' : 'currentRoundBoys';
                const allocationField = (gender === 'girls') ? 'isMatchAllocateGirls' : 'isMatchAllocateBoys';
                
                loserCollege[roundField] = null;
                // Reset the match allocation status for eliminated college
                loserCollege[allocationField] = false;
                
                await loserCollege.save();
            }
        } catch (e) {
            console.error('Error advancing college rounds:', e);
        }

        // Assign next available match to this referee: find next match without refreeEmail
        let nextMatchAssigned = false;
        let nextMatchInfo = null;
        try {
            const refereeEmail = req.session.user.email;
            
            // First try to find an unassigned match in boys collection
            let nextMatch = await matchesBoys.findOne({ 
                refreeEmail: { $exists: false }, 
                matchStatus: { $ne: 'complete' } 
            });
            
            // If no boys match, try girls collection
            if (!nextMatch) {
                nextMatch = await matchesGirls.findOne({ 
                    refreeEmail: { $exists: false }, 
                    matchStatus: { $ne: 'complete' } 
                });
            }
            
            if (nextMatch) {
                // Assign to this referee
                nextMatch.refreeEmail = refereeEmail;
                nextMatch.refreeName = req.session.user.name || 'Referee';
                await nextMatch.save();
                nextMatchAssigned = true;
                nextMatchInfo = {
                    id: nextMatch._id,
                    college1: nextMatch.college1Name,
                    college2: nextMatch.college2Name,
                    round: nextMatch.round,
                    gender: nextMatch.gender || (nextMatch.constructor.modelName === 'matchesGirls' ? 'girls' : 'boys')
                };
            }
        } catch (e) {
            console.error('Error assigning next match:', e);
        }

        res.json({ 
            success: true, 
            message: 'Match ended and rounds updated',
            nextMatchAssigned,
            nextMatchInfo
        });
    } catch (error) {
        console.error('Error ending match:', error);
        res.status(500).json({ success: false, message: 'Error ending match' });
    }
});

// Helper function to get the submatch index from the key
function getSubmatchIndex(submatchKey, matchType, round = 'round_1') {
    // Get tournament format to determine correct order
    const tournamentFormat = getTournamentFormat(round);
    
    // Use tournament format to determine order
    const order = tournamentFormat.totalMatches === 3 
        ? ['match1Singles', 'match2Singles', 'match3Doubles']
        : ['match1Singles', 'match2Singles', 'match3Doubles', 'match4Singles', 'match5Doubles'];
    
    return order.indexOf(submatchKey) + 1;
}

// Helper function to get the data key for scorecard data
function getSubmatchDataKey(submatchKey) {
    // Map submatchKey to the data key used in scorecardData
    const keyMap = {
        'match1Singles': 'match1',
        'match2Singles': 'match2',
        'match3Doubles': 'match3',
        'match4Singles': 'match4',
        'match5Doubles': 'match5'
    };
    
    return keyMap[submatchKey] || submatchKey;
}

// Helper function to check if a match is complete
function checkMatchCompletion(match, submatchKey, winnerIndex, matchType) {
    // Get tournament format based on round to determine required wins
    const tournamentFormat = getTournamentFormat(match.round || 'round_1');
    const matchesNeeded = tournamentFormat.requiredWins;
    
    console.log(`Match round: ${match.round}, Required wins: ${matchesNeeded}, Format: ${tournamentFormat.matchFormat}`);
    
    // Calculate wins for each team
    let team1Wins = 0;
    let team2Wins = 0;
    
    // Check all submatches based on tournament format
    const submatchKeys = tournamentFormat.totalMatches === 3 
        ? ['match1Singles', 'match2Singles', 'match3Doubles'] 
        : ['match1Singles', 'match2Singles', 'match3Doubles', 'match4Singles', 'match5Doubles'];
    
    for (const key of submatchKeys) {
        if (match[key]?.isCompleted) {
            if (match[key].winnerTeam === 'team1') {
                team1Wins++;
            } else if (match[key].winnerTeam === 'team2') {
                team2Wins++;
            }
        }
    }
    
    // Add the current submatch's winner if it's not already counted
    if (!match[submatchKey]?.isCompleted) {
        if (winnerIndex === 0) {
            team1Wins++;
        } else {
            team2Wins++;
        }
    }
    
    // Check if either team has won enough matches
    return team1Wins >= matchesNeeded || team2Wins >= matchesNeeded;
}

// Helper function to calculate sets won by each player/team
function calculateSetsWon(sets) {
    let player1Sets = 0;
    let player2Sets = 0;
    
    sets.forEach(set => {
        if (set.isComplete) {
            if (set.player1Score > set.player2Score) {
                player1Sets++;
            } else {
                player2Sets++;
            }
        }
    });
    
    return [player1Sets, player2Sets];
}

module.exports = router;
