const express = require('express');
const router = express.Router();
const { matchesBoys, matchesGirls, refreeInfo } = require('../database/schema');

// Middleware to check if user is authenticated as referee
const requireRefereeAuth = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.type === 'referee') {
        return next();
    } else {
        return res.status(401).json({ success: false, message: 'Referee authentication required' });
    }
};

// Get assigned matches for referee
router.get('/assigned-matches', requireRefereeAuth, async (req, res) => {
    try {
        const refereeEmail = req.session.user.email;
        
        // Find all matches assigned to this referee
        const boysMatches = await matchesBoys.find({ 
            refreeEmail: refereeEmail
        }).sort({ date: 1, time: 1 });

        const girlsMatches = await matchesGirls.find({ 
            refreeEmail: refereeEmail
        }).sort({ date: 1, time: 1 });

        // Combine and categorize matches
        const assignedMatches = [];
        const completedMatches = [];

        [...boysMatches, ...girlsMatches].forEach(match => {
            const matchData = {
                _id: match._id,
                college1Name: match.college1Name,
                college2Name: match.college2Name,
                date: match.date,
                time: match.time,
                court: match.court,
                round: match.round,
                matchStatus: match.matchStatus,
                gender: boysMatches.includes(match) ? 'boys' : 'girls',
                setStarted: match.setStarted || false,
                setInProgress: match.setInProgress || false,
                completedMatches: match.completedMatches || 0,
                overallWinner: match.overallWinner || null
            };

            if (match.matchStatus === 'complete') {
                completedMatches.push(matchData);
            } else {
                assignedMatches.push(matchData);
            }
        });

        res.json({
            success: true,
            assignedMatches,
            completedMatches
        });

    } catch (error) {
        console.error('Error fetching referee matches:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get match details for referee
router.get('/match-details/:matchId', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId } = req.params;
        const refereeEmail = req.session.user.email;

        // Try to find in boys matches first
        let match = await matchesBoys.findOne({ 
            _id: matchId, 
            refreeEmail: refereeEmail 
        });
        
        let gender = 'boys';
        
        // If not found in boys, try girls matches
        if (!match) {
            match = await matchesGirls.findOne({ 
                _id: matchId, 
                refreeEmail: refereeEmail 
            });
            gender = 'girls';
        }

        if (!match) {
            return res.status(404).json({ 
                success: false, 
                message: 'Match not found or not assigned to you' 
            });
        }

        // Format match data for frontend
        const matchDetails = {
            _id: match._id,
            college1Name: match.college1Name,
            college2Name: match.college2Name,
            date: match.date,
            time: match.time,
            court: match.court,
            round: match.round,
            matchStatus: match.matchStatus,
            gender,
            setStarted: match.setStarted || false,
            setInProgress: match.setInProgress || false,
            completedMatches: match.completedMatches || 0,
            overallWinner: match.overallWinner || null,
            currentActiveMatch: match.currentActiveMatch || null,
            matches: {}
        };

        // Add individual match details based on gender
        if (gender === 'boys') {
            matchDetails.matches = {
                match1Singles: match.match1Singles || {},
                match2Singles: match.match2Singles || {},
                match3Doubles: match.match3Doubles || {},
                match4Singles: match.match4Singles || {},
                match5Doubles: match.match5Doubles || {}
            };
        } else {
            matchDetails.matches = {
                match1Singles: match.match1Singles || {},
                match2Doubles: match.match2Doubles || {},
                match3Singles: match.match3Singles || {}
            };
        }

        res.json({
            success: true,
            match: matchDetails
        });

    } catch (error) {
        console.error('Error fetching match details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Start match set
router.post('/start-set/:matchId', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId } = req.params;
        const { courtNumber, firstServeCollege } = req.body;
        const refereeEmail = req.session.user.email;

        if (!courtNumber || !firstServeCollege) {
            return res.status(400).json({
                success: false,
                message: 'Court number and first serve college are required'
            });
        }

        // Try to find and update in boys matches first
        let match = await matchesBoys.findOneAndUpdate(
            { _id: matchId, refreeEmail: refereeEmail },
            { 
                setStarted: true,
                setStartedAt: new Date(),
                setInProgress: true,
                court: `court_${courtNumber}`
            },
            { new: true }
        );
        
        let gender = 'boys';
        
        // If not found in boys, try girls matches
        if (!match) {
            match = await matchesGirls.findOneAndUpdate(
                { _id: matchId, refreeEmail: refereeEmail },
                { 
                    setStarted: true,
                    setStartedAt: new Date(),
                    setInProgress: true,
                    court: `court_${courtNumber}`
                },
                { new: true }
            );
            gender = 'girls';
        }

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found or not assigned to you'
            });
        }

        res.json({
            success: true,
            message: 'Set started successfully',
            match: {
                _id: match._id,
                setStarted: match.setStarted,
                setInProgress: match.setInProgress,
                court: match.court,
                gender
            }
        });

    } catch (error) {
        console.error('Error starting set:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Start individual match within a set
router.post('/start-match/:matchId/:matchType', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId, matchType } = req.params;
        const { maxPoints, numberOfSets, courtNumber, firstServePlayer } = req.body;
        const refereeEmail = req.session.user.email;

        if (!maxPoints || !numberOfSets || !courtNumber || !firstServePlayer) {
            return res.status(400).json({
                success: false,
                message: 'All match settings are required'
            });
        }

        const updateData = {};
        updateData[`${matchType}.isStarted`] = true;
        updateData[`${matchType}.startedAt`] = new Date();
        updateData[`${matchType}.matchSettings`] = {
            maxPoints,
            numberOfSets,
            courtNumber,
            firstServePlayer
        };
        updateData.currentActiveMatch = matchType;
        updateData.matchStatus = 'live';

        // Initialize scorecard data for this match
        updateData[`scorecardData.${matchType.replace('match', 'match')}`] = {
            currentSet: 0,
            scores: [],
            currentScore: {
                player1: 0,
                player2: 0,
                server: firstServePlayer === 'college1' ? 0 : 1
            },
            lastUpdated: new Date()
        };

        // Try boys matches first
        let match = await matchesBoys.findOneAndUpdate(
            { _id: matchId, refreeEmail: refereeEmail },
            updateData,
            { new: true }
        );
        
        let gender = 'boys';
        
        // If not found in boys, try girls matches
        if (!match) {
            match = await matchesGirls.findOneAndUpdate(
                { _id: matchId, refreeEmail: refereeEmail },
                updateData,
                { new: true }
            );
            gender = 'girls';
        }

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found or not assigned to you'
            });
        }

        res.json({
            success: true,
            message: 'Match started successfully',
            match: {
                _id: match._id,
                currentActiveMatch: match.currentActiveMatch,
                matchStatus: match.matchStatus,
                gender,
                matchSettings: match[matchType]?.matchSettings
            }
        });

    } catch (error) {
        console.error('Error starting individual match:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update match score
router.post('/update-score/:matchId/:matchType', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId, matchType } = req.params;
        const { player1Score, player2Score, setNumber, isSetComplete, winnerTeam } = req.body;
        const refereeEmail = req.session.user.email;

        const updateData = {};
        const scorecardField = `scorecardData.${matchType.replace('match', 'match')}`;
        
        // Update current score
        updateData[`${scorecardField}.currentScore.player1`] = player1Score;
        updateData[`${scorecardField}.currentScore.player2`] = player2Score;
        updateData[`${scorecardField}.lastUpdated`] = new Date();

        if (isSetComplete) {
            // Add completed set to scores array
            updateData[`${scorecardField}.scores`] = {
                setNumber,
                player1Score,
                player2Score,
                isComplete: true,
                completedAt: new Date()
            };
            
            // Reset current score for next set
            updateData[`${scorecardField}.currentScore.player1`] = 0;
            updateData[`${scorecardField}.currentScore.player2`] = 0;
            updateData[`${scorecardField}.currentSet`] = setNumber;
        }

        // Try boys matches first
        let match = await matchesBoys.findOneAndUpdate(
            { _id: matchId, refreeEmail: refereeEmail },
            updateData,
            { new: true }
        );
        
        let gender = 'boys';
        
        // If not found in boys, try girls matches
        if (!match) {
            match = await matchesGirls.findOneAndUpdate(
                { _id: matchId, refreeEmail: refereeEmail },
                updateData,
                { new: true }
            );
            gender = 'girls';
        }

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found or not assigned to you'
            });
        }

        res.json({
            success: true,
            message: 'Score updated successfully',
            scorecardData: match.scorecardData?.[matchType.replace('match', 'match')]
        });

    } catch (error) {
        console.error('Error updating score:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Complete individual match
router.post('/complete-match/:matchId/:matchType', requireRefereeAuth, async (req, res) => {
    try {
        const { matchId, matchType } = req.params;
        const { winnerTeam, winnerEmail } = req.body;
        const refereeEmail = req.session.user.email;

        const updateData = {};
        updateData[`${matchType}.isCompleted`] = true;
        updateData[`${matchType}.completedAt`] = new Date();
        updateData[`${matchType}.winnerTeam`] = winnerTeam;
        updateData[`${matchType}.winnerEmail`] = winnerEmail;

        // Try boys matches first
        let match = await matchesBoys.findOne({ _id: matchId, refreeEmail: refereeEmail });
        let gender = 'boys';
        let Model = matchesBoys;
        
        // If not found in boys, try girls matches
        if (!match) {
            match = await matchesGirls.findOne({ _id: matchId, refreeEmail: refereeEmail });
            gender = 'girls';
            Model = matchesGirls;
        }

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found or not assigned to you'
            });
        }

        // Update completed matches count
        const completedCount = (match.completedMatches || 0) + 1;
        updateData.completedMatches = completedCount;
        updateData.currentActiveMatch = null;

        // Check if set is complete (boys: 5 matches, girls: 3 matches)
        const maxMatches = gender === 'boys' ? 5 : 3;
        
        // Check win condition (first to win majority of matches)
        const winThreshold = Math.ceil(maxMatches / 2);
        
        // Count wins for each team
        let team1Wins = 0;
        let team2Wins = 0;

        if (gender === 'boys') {
            [1, 2, 3, 4, 5].forEach(num => {
                const matchKey = num <= 2 || num === 4 ? `match${num}Singles` : 
                                 num === 3 ? 'match3Doubles' : 'match5Doubles';
                const matchData = match[matchKey];
                if (matchData?.winnerTeam === 'team1') team1Wins++;
                else if (matchData?.winnerTeam === 'team2') team2Wins++;
            });
        } else {
            ['match1Singles', 'match2Doubles', 'match3Singles'].forEach(matchKey => {
                const matchData = match[matchKey];
                if (matchData?.winnerTeam === 'team1') team1Wins++;
                else if (matchData?.winnerTeam === 'team2') team2Wins++;
            });
        }

        // Add current match win
        if (winnerTeam === 'team1') team1Wins++;
        else team2Wins++;

        // Check if someone won the set
        if (team1Wins >= winThreshold || team2Wins >= winThreshold) {
            updateData.overallWinner = team1Wins > team2Wins ? 'team1' : 'team2';
            updateData.matchStatus = 'complete';
            updateData.setInProgress = false;
            updateData.winnerEmail = team1Wins > team2Wins ? match.email1 : match.email2;
        }

        // Update the match
        const updatedMatch = await Model.findOneAndUpdate(
            { _id: matchId, refreeEmail: refereeEmail },
            updateData,
            { new: true }
        );

        res.json({
            success: true,
            message: 'Match completed successfully',
            match: {
                _id: updatedMatch._id,
                completedMatches: updatedMatch.completedMatches,
                overallWinner: updatedMatch.overallWinner,
                matchStatus: updatedMatch.matchStatus,
                setComplete: !!updatedMatch.overallWinner
            }
        });

    } catch (error) {
        console.error('Error completing match:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;