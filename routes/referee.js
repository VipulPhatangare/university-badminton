const express = require('express');
const router = express.Router();
const { matchesBoys, matchesGirls, refreeInfo, singlesMatch, doublesMatch, set } = require('../database/schema');

// Middleware to check if user is authenticated as referee
const requireRefereeAuth = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.type === 'referee') {
        return next();
    } else {
        return res.status(401).json({ success: false, message: 'Referee authentication required' });
    }
};

// Get assigned matches for a referee (upcoming and live)
router.get('/assigned-matches', requireRefereeAuth, async (req, res) => {
    try {
        const refereeEmail = req.session.user.email;
        
        // Check if referee has already started a set and it's not completed
        const activeBoysMatch = await matchesBoys.findOne({
            refreeEmail: refereeEmail,
            setStarted: true,
            matchStatus: { $in: ['live', 'players_allocated'] }
        }).sort({ setStartedAt: -1 });

        const activeGirlsMatch = await matchesGirls.findOne({
            refreeEmail: refereeEmail,
            setStarted: true,
            matchStatus: { $in: ['live', 'players_allocated'] }
        }).sort({ setStartedAt: -1 });

        let allMatches = [];

        // If referee has an active set in progress, only show that set
        if (activeBoysMatch || activeGirlsMatch) {
            if (activeBoysMatch) {
                allMatches.push({ ...activeBoysMatch.toObject(), gender: 'boys' });
            }
            if (activeGirlsMatch) {
                allMatches.push({ ...activeGirlsMatch.toObject(), gender: 'girls' });
            }
        } else {
            // Show only unstarted matches if no active set
            const boysMatches = await matchesBoys.find({
                refreeEmail: refereeEmail,
                setStarted: { $ne: true },
                matchStatus: { $in: ['upcoming', 'players_allocated'] }
            }).sort({ date: 1, time: 1 });

            const girlsMatches = await matchesGirls.find({
                refreeEmail: refereeEmail,
                setStarted: { $ne: true },
                matchStatus: { $in: ['upcoming', 'players_allocated'] }
            }).sort({ date: 1, time: 1 });

            // Combine and add gender field
            allMatches = [
                ...boysMatches.map(match => ({ ...match.toObject(), gender: 'boys' })),
                ...girlsMatches.map(match => ({ ...match.toObject(), gender: 'girls' }))
            ];

            // Sort by date and time
            allMatches.sort((a, b) => {
                const dateA = new Date(a.date + ' ' + a.time);
                const dateB = new Date(b.date + ' ' + b.time);
                return dateA - dateB;
            });
        }

        res.json({
            success: true,
            matches: allMatches,
            hasActiveSet: !!(activeBoysMatch || activeGirlsMatch)
        });

    } catch (error) {
        console.error('Error getting assigned matches:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving assigned matches'
        });
    }
});

// Get completed matches for a referee
router.get('/completed-matches', requireRefereeAuth, async (req, res) => {
    try {
        const refereeEmail = req.session.user.email;
        
        // Get completed boys matches
        const boysMatches = await matchesBoys.find({
            refreeEmail: refereeEmail,
            matchStatus: 'complete'
        }).sort({ date: -1, time: -1 });

        // Get completed girls matches
        const girlsMatches = await matchesGirls.find({
            refreeEmail: refereeEmail,
            matchStatus: 'complete'
        }).sort({ date: -1, time: -1 });

        // Combine and add gender field
        const allMatches = [
            ...boysMatches.map(match => ({ ...match.toObject(), gender: 'boys' })),
            ...girlsMatches.map(match => ({ ...match.toObject(), gender: 'girls' }))
        ];

        // Sort by date and time (most recent first)
        allMatches.sort((a, b) => {
            const dateA = new Date(a.date + ' ' + a.time);
            const dateB = new Date(b.date + ' ' + b.time);
            return dateB - dateA;
        });

        res.json({
            success: true,
            matches: allMatches
        });

    } catch (error) {
        console.error('Error getting completed matches:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving completed matches'
        });
    }
});

// Get detailed match information for match sets view
router.get('/match/:matchId/:gender', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId, gender } = req.params;
        const refereeEmail = req.session.user.email;

        let match;
        if (gender === 'boys') {
            match = await matchesBoys.findById(matchId);
        } else if (gender === 'girls') {
            match = await matchesGirls.findById(matchId);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid gender parameter. Must be "boys" or "girls"'
            });
        }

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        // Verify referee is assigned to this match
        if (match.refreeEmail !== refereeEmail) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not assigned to this match.'
            });
        }

        // Prepare match data with sub-matches
        let matchData = {
            ...match.toObject(),
            gender: gender,
            subMatches: []
        };

        // Helper function to get the match object based on match number
        const getMatchObject = (matchNumber) => {
            if (gender === 'boys') {
                switch(matchNumber) {
                    case 1: return match.match1Singles;
                    case 2: return match.match2Singles;
                    case 3: return match.match3Doubles;
                    case 4: return match.match4Singles;
                    case 5: return match.match5Doubles;
                    default: return null;
                }
            } else {
                switch(matchNumber) {
                    case 1: return match.match1Singles;
                    case 2: return match.match2Doubles;
                    case 3: return match.match3Singles;
                    default: return null;
                }
            }
        };

        // Helper function to get match status and scorecard availability
        const getMatchStatus = (matchNumber) => {
            const matchObj = getMatchObject(matchNumber);
            if (!matchObj) return 'upcoming';
            if (matchObj.isCompleted) return 'completed';
            if (matchObj.isStarted) return 'live';
            return 'upcoming';
        };
        
        const isMatchStarted = (matchNumber) => {
            const matchObj = getMatchObject(matchNumber);
            return matchObj?.isStarted === true;
        };

        const isMatchCompleted = (matchNumber) => {
            const matchObj = getMatchObject(matchNumber);
            return matchObj?.isCompleted === true;
        };
        
        const hasScorecard = (matchNumber) => {
            // Check if scorecard data exists for this specific match
            if (match.scorecardData && match.scorecardData[`match${matchNumber}`]) {
                const matchData = match.scorecardData[`match${matchNumber}`];
                const hasData = matchData.scores && matchData.scores.length > 0;
                if (hasData) {
                    console.log(`Match ${matchId} has scorecard data for match number ${matchNumber}`);
                }
                return hasData;
            }
            
            // Fallback to legacy structure check
            const hasLegacyData = match.scorecardData && 
                                 match.scorecardData.scores && 
                                 match.scorecardData.scores.length > 0;
            if (hasLegacyData) {
                console.log(`Match ${matchId} has legacy scorecard data (not match-specific)`);
            }
            return hasLegacyData;
        };

        if (gender === 'boys') {
            // Boys have 5 matches: Singles1, Singles2, Doubles1, Singles3, Doubles2
            matchData.subMatches = [
                {
                    matchNumber: 1,
                    type: 'singles',
                    title: 'Singles Match 1',
                    player1: match.match1Singles?.player1Name || 'TBD',
                    player2: match.match1Singles?.player2Name || 'TBD',
                    college1: match.college1Name,
                    college2: match.college2Name,
                    status: getMatchStatus(1),
                    hasScorecard: hasScorecard(1),
                    isStarted: isMatchStarted(1),
                    isCompleted: isMatchCompleted(1),
                    winner: match.match1Singles?.winnerTeam || null,
                    matchSettings: match.match1Singles?.matchSettings || null
                },
                {
                    matchNumber: 2,
                    type: 'singles',
                    title: 'Singles Match 2',
                    player1: match.match2Singles?.player1Name || 'TBD',
                    player2: match.match2Singles?.player2Name || 'TBD',
                    college1: match.college1Name,
                    college2: match.college2Name,
                    status: getMatchStatus(2),
                    hasScorecard: hasScorecard(2),
                    isStarted: isMatchStarted(2),
                    isCompleted: isMatchCompleted(2),
                    winner: match.match2Singles?.winnerTeam || null,
                    matchSettings: match.match2Singles?.matchSettings || null
                },
                {
                    matchNumber: 3,
                    type: 'doubles',
                    title: 'Doubles Match 1',
                    team1: `${match.match3Doubles?.team1Player1Name || 'TBD'} & ${match.match3Doubles?.team1Player2Name || 'TBD'}`,
                    team2: `${match.match3Doubles?.team2Player1Name || 'TBD'} & ${match.match3Doubles?.team2Player2Name || 'TBD'}`,
                    college1: match.college1Name,
                    college2: match.college2Name,
                    status: getMatchStatus(3),
                    hasScorecard: hasScorecard(3),
                    isStarted: isMatchStarted(3),
                    isCompleted: isMatchCompleted(3),
                    winner: match.match3Doubles?.winnerTeam || null,
                    matchSettings: match.match3Doubles?.matchSettings || null
                },
                {
                    matchNumber: 4,
                    type: 'singles',
                    title: 'Singles Match 3',
                    player1: match.match4Singles?.player1Name || 'TBD',
                    player2: match.match4Singles?.player2Name || 'TBD',
                    college1: match.college1Name,
                    college2: match.college2Name,
                    status: getMatchStatus(4),
                    hasScorecard: hasScorecard(4),
                    isStarted: isMatchStarted(4),
                    isCompleted: isMatchCompleted(4),
                    winner: match.match4Singles?.winnerTeam || null,
                    matchSettings: match.match4Singles?.matchSettings || null
                },
                {
                    matchNumber: 5,
                    type: 'doubles',
                    title: 'Doubles Match 2',
                    team1: `${match.match5Doubles?.team1Player1Name || 'TBD'} & ${match.match5Doubles?.team1Player2Name || 'TBD'}`,
                    team2: `${match.match5Doubles?.team2Player1Name || 'TBD'} & ${match.match5Doubles?.team2Player2Name || 'TBD'}`,
                    college1: match.college1Name,
                    college2: match.college2Name,
                    status: getMatchStatus(5),
                    hasScorecard: hasScorecard(5),
                    isStarted: isMatchStarted(5),
                    isCompleted: isMatchCompleted(5),
                    winner: match.match5Doubles?.winnerTeam || null,
                    matchSettings: match.match5Doubles?.matchSettings || null
                }
            ];
        } else {
            // Girls have 3 matches: Singles1, Doubles1, Singles2
            matchData.subMatches = [
                {
                    matchNumber: 1,
                    type: 'singles',
                    title: 'Singles Match 1',
                    player1: match.match1Singles?.player1Name || 'TBD',
                    player2: match.match1Singles?.player2Name || 'TBD',
                    college1: match.college1Name,
                    college2: match.college2Name,
                    status: getMatchStatus(1),
                    hasScorecard: hasScorecard(1),
                    isStarted: isMatchStarted(1),
                    isCompleted: isMatchCompleted(1),
                    winner: match.match1Singles?.winnerTeam || null,
                    matchSettings: match.match1Singles?.matchSettings || null
                },
                {
                    matchNumber: 2,
                    type: 'doubles',
                    title: 'Doubles Match',
                    team1: `${match.match2Doubles?.team1Player1Name || 'TBD'} & ${match.match2Doubles?.team1Player2Name || 'TBD'}`,
                    team2: `${match.match2Doubles?.team2Player1Name || 'TBD'} & ${match.match2Doubles?.team2Player2Name || 'TBD'}`,
                    college1: match.college1Name,
                    college2: match.college2Name,
                    status: getMatchStatus(2),
                    isStarted: isMatchStarted(2),
                    hasScorecard: hasScorecard(2),
                    isCompleted: isMatchCompleted(2),
                    winner: match.match2Doubles?.winnerTeam || null,
                    matchSettings: match.match2Doubles?.matchSettings || null
                },
                {
                    matchNumber: 3,
                    type: 'singles',
                    title: 'Singles Match 2',
                    player1: match.match3Singles?.player1Name || 'TBD',
                    player2: match.match3Singles?.player2Name || 'TBD',
                    college1: match.college1Name,
                    college2: match.college2Name,
                    status: getMatchStatus(3),
                    hasScorecard: hasScorecard(3),
                    isStarted: isMatchStarted(3),
                    isCompleted: isMatchCompleted(3),
                    winner: match.match3Singles?.winnerTeam || null,
                    matchSettings: match.match3Singles?.matchSettings || null
                }
            ];
        }

        res.json({
            success: true,
            match: matchData
        });

    } catch (error) {
        console.error('Error getting match details:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving match details'
        });
    }
});

// Start a specific match within a set - FIXED
router.post('/start-match', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId, gender, matchNumber, maxPoints, numberOfSets, courtNumber, firstServePlayer } = req.body;

        console.log('🚀 Starting match:', { matchId, gender, matchNumber, maxPoints, numberOfSets, courtNumber, firstServePlayer });

        if (!matchId || !gender || !matchNumber || !maxPoints || !numberOfSets || !courtNumber || !firstServePlayer) {
            return res.status(400).json({
                success: false,
                message: 'All match parameters are required'
            });
        }

        let matchModel = gender === 'boys' ? matchesBoys : matchesGirls;
        const match = await matchModel.findById(matchId);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        // Update match configuration
        match.maxPoints = maxPoints;
        match.numberOfSets = numberOfSets;
        match.courtNumber = courtNumber;

        // Mark specific match as started
        const matchSettings = {
            maxPoints: maxPoints,
            numberOfSets: numberOfSets,
            courtNumber: courtNumber,
            firstServePlayer: firstServePlayer
        };
        
        let targetMatch;
        if (gender === 'boys') {
            switch(parseInt(matchNumber)) {
                case 1: 
                    if (!match.match1Singles) match.match1Singles = {};
                    targetMatch = match.match1Singles; 
                    break;
                case 2: 
                    if (!match.match2Singles) match.match2Singles = {};
                    targetMatch = match.match2Singles; 
                    break;
                case 3: 
                    if (!match.match3Doubles) match.match3Doubles = {};
                    targetMatch = match.match3Doubles; 
                    break;
                case 4: 
                    if (!match.match4Singles) match.match4Singles = {};
                    targetMatch = match.match4Singles; 
                    break;
                case 5: 
                    if (!match.match5Doubles) match.match5Doubles = {};
                    targetMatch = match.match5Doubles; 
                    break;
            }
        } else {
            switch(parseInt(matchNumber)) {
                case 1: 
                    if (!match.match1Singles) match.match1Singles = {};
                    targetMatch = match.match1Singles; 
                    break;
                case 2: 
                    if (!match.match2Doubles) match.match2Doubles = {};
                    targetMatch = match.match2Doubles; 
                    break;
                case 3: 
                    if (!match.match3Singles) match.match3Singles = {};
                    targetMatch = match.match3Singles; 
                    break;
            }
        }
        
        if (targetMatch) {
            targetMatch.isStarted = true;
            targetMatch.startedAt = new Date();
            targetMatch.matchSettings = matchSettings;
            console.log(`✅ Updated match ${matchNumber} object`);
        }

        // Initialize scorecard data structure
        const matchKey = `match${matchNumber}`;
        
        if (!match.scorecardData) {
            match.scorecardData = {};
        }
        
        // Only initialize if it doesn't exist
        if (!match.scorecardData[matchKey]) {
            match.scorecardData[matchKey] = {
                currentSet: 0,
                scores: [{
                    setNumber: 1,
                    player1Score: 0,
                    player2Score: 0,
                    isComplete: false
                }],
                currentScore: {
                    player1: 0,
                    player2: 0,
                    server: 0
                },
                lastUpdated: new Date()
            };
            console.log(`✅ Initialized scorecard data for ${matchKey}`);
        }

        console.log(`🔍 Final scorecardData:`, match.scorecardData);
        
        await match.save();
        
        console.log(`✅ Match ${matchNumber} started successfully`);

        res.json({
            success: true,
            message: 'Match started successfully',
            scorecardUrl: `/scorecard?matchId=${matchId}&gender=${gender}&matchNumber=${matchNumber}&maxPoints=${maxPoints}&sets=${numberOfSets}&court=${courtNumber}&firstServe=${encodeURIComponent(firstServePlayer)}`
        });

    } catch (error) {
        console.error('❌ Error starting match:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting match'
        });
    }
});
// Get scorecard URL for already started match
router.get('/get-scorecard-url/:matchId/:gender/:matchNumber', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId, gender, matchNumber } = req.params;
        const refereeEmail = req.session.user.email;

        let matchModel = gender === 'boys' ? matchesBoys : matchesGirls;
        const match = await matchModel.findById(matchId);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        // Verify referee is assigned to this match
        if (match.refreeEmail !== refereeEmail) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not assigned to this match.'
            });
        }

        // Find the match object to get saved settings
        let targetMatch;
        if (gender === 'boys') {
            switch(parseInt(matchNumber)) {
                case 1: targetMatch = match.match1Singles || {}; break;
                case 2: targetMatch = match.match2Singles || {}; break;
                case 3: targetMatch = match.match3Doubles || {}; break;
                case 4: targetMatch = match.match4Singles || {}; break;
                case 5: targetMatch = match.match5Doubles || {}; break;
            }
        } else {
            switch(parseInt(matchNumber)) {
                case 1: targetMatch = match.match1Singles || {}; break;
                case 2: targetMatch = match.match2Doubles || {}; break;
                case 3: targetMatch = match.match3Singles || {}; break;
            }
        }

        if (!targetMatch || !targetMatch.isStarted) {
            return res.status(400).json({
                success: false,
                message: 'Match has not been started yet'
            });
        }

        const settings = targetMatch.matchSettings;
        if (!settings) {
            return res.status(400).json({
                success: false,
                message: 'Match settings not found. Please start the match again.'
            });
        }

        res.json({
            success: true,
            scorecardUrl: `/scorecard?matchId=${matchId}&gender=${gender}&matchNumber=${matchNumber}&maxPoints=${settings.maxPoints}&sets=${settings.numberOfSets}&court=${settings.courtNumber}&firstServe=${encodeURIComponent(settings.firstServePlayer)}`
        });

    } catch (error) {
        console.error('Error getting scorecard URL:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting scorecard URL'
        });
    }
});

// Update match result and check for overall winner
router.post('/update-match-result', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId, gender, matchNumber, winnerTeam, winnerEmail, scorecardData } = req.body;

        let matchModel = gender === 'boys' ? matchesBoys : matchesGirls;
        const match = await matchModel.findById(matchId);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        // Update the appropriate match object directly
        let targetMatch;
        if (gender === 'boys') {
            switch(parseInt(matchNumber)) {
                case 1: targetMatch = match.match1Singles; break;
                case 2: targetMatch = match.match2Singles; break;
                case 3: targetMatch = match.match3Doubles; break;
                case 4: targetMatch = match.match4Singles; break;
                case 5: targetMatch = match.match5Doubles; break;
            }
        } else {
            switch(parseInt(matchNumber)) {
                case 1: targetMatch = match.match1Singles; break;
                case 2: targetMatch = match.match2Doubles; break;
                case 3: targetMatch = match.match3Singles; break;
            }
        }
        
        if (targetMatch) {
            targetMatch.winnerTeam = winnerTeam;
            targetMatch.winnerEmail = winnerEmail;
            targetMatch.isCompleted = true;
            targetMatch.completedAt = new Date();
            
            // Ensure it's marked as started if not already
            if (!targetMatch.isStarted) {
                targetMatch.isStarted = true;
                targetMatch.startedAt = new Date();
            }

            // Save scorecard data for this specific match
            if (scorecardData) {
                if (!match.scorecardData) {
                    match.scorecardData = {};
                }
                match.scorecardData[`match${matchNumber}`] = scorecardData;
            }
        } else {
            return res.status(400).json({
                success: false,
                message: `Invalid match number ${matchNumber} for ${gender} match`
            });
        }

        // Calculate completed matches count
        const completedMatches = [];
        if (gender === 'boys') {
            if (match.match1Singles?.isCompleted) completedMatches.push(match.match1Singles);
            if (match.match2Singles?.isCompleted) completedMatches.push(match.match2Singles);
            if (match.match3Doubles?.isCompleted) completedMatches.push(match.match3Doubles);
            if (match.match4Singles?.isCompleted) completedMatches.push(match.match4Singles);
            if (match.match5Doubles?.isCompleted) completedMatches.push(match.match5Doubles);
        } else {
            if (match.match1Singles?.isCompleted) completedMatches.push(match.match1Singles);
            if (match.match2Doubles?.isCompleted) completedMatches.push(match.match2Doubles);
            if (match.match3Singles?.isCompleted) completedMatches.push(match.match3Singles);
        }
        
        match.completedMatches = completedMatches.length;

        // Check for overall winner
        const totalMatches = gender === 'boys' ? 5 : 3;
        const requiredWins = Math.ceil(totalMatches / 2); // 3 for boys, 2 for girls

        const team1Wins = completedMatches.filter(m => m.winnerTeam === 'team1').length;
        const team2Wins = completedMatches.filter(m => m.winnerTeam === 'team2').length;

        let overallWinner = null;
        let matchComplete = false;

        if (team1Wins >= requiredWins) {
            overallWinner = 'team1';
            match.overallWinner = 'team1';
            match.winnerEmail = match.email1;
            match.matchStatus = 'complete';
            match.setInProgress = false; // Mark set as completed
            matchComplete = true;
        } else if (team2Wins >= requiredWins) {
            overallWinner = 'team2';
            match.overallWinner = 'team2';
            match.winnerEmail = match.email2;
            match.matchStatus = 'complete';
            match.setInProgress = false; // Mark set as completed
            matchComplete = true;
        }

        await match.save();

        console.log(`✅ Match ${matchNumber} result updated for ${gender} match ${matchId}`);
        console.log(`✅ Team1 Wins: ${team1Wins}, Team2 Wins: ${team2Wins}, Required: ${requiredWins}`);

        res.json({
            success: true,
            message: 'Match result updated successfully',
            overallWinner: overallWinner,
            matchComplete: matchComplete,
            team1Wins: team1Wins,
            team2Wins: team2Wins,
            requiredWins: requiredWins
        });

    } catch (error) {
        console.error('Error updating match result:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating match result'
        });
    }
});
// Start a set of matches (when referee clicks on match card)
router.post('/start-set', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId, gender } = req.body;
        const refereeEmail = req.session.user.email;

        if (!matchId || !gender) {
            return res.status(400).json({
                success: false,
                message: 'Match ID and gender are required'
            });
        }

        // Check if referee already has an active set
        const activeBoysMatch = await matchesBoys.findOne({
            refreeEmail: refereeEmail,
            setStarted: true,
            matchStatus: { $in: ['live', 'players_allocated'] }
        });

        const activeGirlsMatch = await matchesGirls.findOne({
            refreeEmail: refereeEmail,
            setStarted: true,
            matchStatus: { $in: ['live', 'players_allocated'] }
        });

        if (activeBoysMatch || activeGirlsMatch) {
            return res.status(400).json({
                success: false,
                message: 'You already have an active set in progress. Please complete it before starting another.',
                activeMatchId: activeBoysMatch ? activeBoysMatch._id : activeGirlsMatch._id,
                activeGender: activeBoysMatch ? 'boys' : 'girls'
            });
        }

        // Find and update the match
        let matchModel = gender === 'boys' ? matchesBoys : matchesGirls;
        const match = await matchModel.findById(matchId);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        // Verify referee is assigned to this match
        if (match.refreeEmail !== refereeEmail) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not assigned to this match.'
            });
        }

        // Start the set
        match.setStarted = true;
        match.setStartedAt = new Date();
        match.setInProgress = true;
        if (match.matchStatus === 'upcoming') {
            match.matchStatus = 'players_allocated';
        }

        await match.save();

        res.json({
            success: true,
            message: 'Set started successfully',
            match: {
                _id: match._id,
                college1Name: match.college1Name,
                college2Name: match.college2Name,
                round: match.round,
                gender: gender
            }
        });

    } catch (error) {
        console.error('Error starting set:', error);
        res.status(500).json({
            success: false,
            message: 'Error starting set'
        });
    }
});

// Debug endpoint to check match data
router.get('/debug-match/:matchId/:gender', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId, gender } = req.params;
        
        let matchModel = gender === 'boys' ? matchesBoys : matchesGirls;
        const match = await matchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }
        
        res.json({
            success: true,
            matches: {
                match1Singles: match.match1Singles,
                match2Singles: match.match2Singles || null,
                match3Doubles: match.match3Doubles || null,
                match2Doubles: match.match2Doubles || null,
                match3Singles: match.match3Singles || null,
                match4Singles: match.match4Singles || null,
                match5Doubles: match.match5Doubles || null
            },
            scorecardData: match.scorecardData,
            matchId: matchId,
            gender: gender
        });
        
    } catch (error) {
        console.error('Error debugging match:', error);
        res.status(500).json({
            success: false,
            message: 'Error debugging match'
        });
    }
});

// Get referee dashboard stats
router.get('/dashboard-stats', requireRefereeAuth, async (req, res) => {
    try {
        const refereeEmail = req.session.user.email;

        // Get counts for different match statuses
        const upcomingBoysMatches = await matchesBoys.countDocuments({
            refreeEmail: refereeEmail,
            setStarted: { $ne: true },
            matchStatus: { $in: ['upcoming', 'players_allocated'] }
        });

        const upcomingGirlsMatches = await matchesGirls.countDocuments({
            refreeEmail: refereeEmail,
            setStarted: { $ne: true },
            matchStatus: { $in: ['upcoming', 'players_allocated'] }
        });

        const liveBoysMatches = await matchesBoys.countDocuments({
            refreeEmail: refereeEmail,
            $or: [
                { matchStatus: 'live' },
                { setStarted: true, matchStatus: { $in: ['players_allocated', 'live'] } }
            ]
        });

        const liveGirlsMatches = await matchesGirls.countDocuments({
            refreeEmail: refereeEmail,
            $or: [
                { matchStatus: 'live' },
                { setStarted: true, matchStatus: { $in: ['players_allocated', 'live'] } }
            ]
        });

        const completedBoysMatches = await matchesBoys.countDocuments({
            refreeEmail: refereeEmail,
            matchStatus: 'complete'
        });

        const completedGirlsMatches = await matchesGirls.countDocuments({
            refreeEmail: refereeEmail,
            matchStatus: 'complete'
        });

        res.json({
            success: true,
            stats: {
                upcoming: upcomingBoysMatches + upcomingGirlsMatches,
                live: liveBoysMatches + liveGirlsMatches,
                completed: completedBoysMatches + completedGirlsMatches,
                total: upcomingBoysMatches + upcomingGirlsMatches + liveBoysMatches + liveGirlsMatches + completedBoysMatches + completedGirlsMatches
            }
        });

    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving dashboard statistics'
        });
    }
});

module.exports = router;