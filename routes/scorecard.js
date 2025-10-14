const express = require('express');
const router = express.Router();
const { matchesBoys, matchesGirls } = require('../database/schema.js');

// Get match info for scorecard
router.get('/get-match-info', async (req, res) => {
    try {
        const { matchId, matchType } = req.query;
        
        let match;
        if (matchType === 'boys') {
            match = await matchesBoys.findById(matchId);
        } else {
            match = await matchesGirls.findById(matchId);
        }
        
        if (!match) {
            return res.json({ success: false, message: 'Match not found' });
        }
        
        const currentSet = match.scorecard.sets[match.scorecard.sets.length - 1];
        
        const matchData = {
            _id: match._id,
            matchType: matchType,
            matchNo: `${matchType.toUpperCase()}_${match._id}`,
            college1Name: match.college1Name,
            college2Name: match.college2Name,
            playerName1: match.college1Name,
            playerName2: match.college2Name,
            maxSets: 5, // All tournaments now use 5-match format
            maxSetPoint: 21,
            set: match.scorecard.sets.map((set, index) => ({
                setNumber: index + 1,
                player1Point: set.player1Score,
                player2Point: set.player2Score,
                isSetComplete: set.completed,
                serve: set.serve || match.college1Name
            }))
        };
        
        res.json(matchData);
    } catch (error) {
        console.error('Get match info error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update score
router.post('/update-score', async (req, res) => {
    try {
        const { matchId, matchType, player1Point, player2Point, currentSet, server } = req.body;
        
        let match;
        if (matchType === 'boys') {
            match = await matchesBoys.findById(matchId);
        } else {
            match = await matchesGirls.findById(matchId);
        }
        
        if (!match) {
            return res.json({ success: false, message: 'Match not found' });
        }
        
        // Update current set scores
        if (match.scorecard.sets.length > 0) {
            const currentSetIndex = match.scorecard.sets.length - 1;
            match.scorecard.sets[currentSetIndex].player1Score = player1Point;
            match.scorecard.sets[currentSetIndex].player2Score = player2Point;
            match.scorecard.sets[currentSetIndex].serve = server;
            match.scorecard.sets[currentSetIndex].lastUpdated = new Date();
            
            await match.save();
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Update score error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Complete set
router.post('/complete-set', async (req, res) => {
    try {
        const { matchId, matchType, setNumber, winnerIndex, player1Point, player2Point, server } = req.body;
        
        let match;
        if (matchType === 'boys') {
            match = await matchesBoys.findById(matchId);
        } else {
            match = await matchesGirls.findById(matchId);
        }
        
        if (!match) {
            return res.json({ success: false, message: 'Match not found' });
        }
        
        // Mark set as completed
        if (match.scorecard.sets[setNumber - 1]) {
            match.scorecard.sets[setNumber - 1].completed = true;
            match.scorecard.sets[setNumber - 1].completedAt = new Date();
            match.scorecard.sets[setNumber - 1].player1Score = player1Point;
            match.scorecard.sets[setNumber - 1].player2Score = player2Point;
            match.scorecard.sets[setNumber - 1].serve = server;
            
            await match.save();
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Complete set error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Complete match
router.post('/complete-match', async (req, res) => {
    try {
        const { matchId, matchType, winnerIndex, setsWon } = req.body;
        
        let match;
        if (matchType === 'boys') {
            match = await matchesBoys.findById(matchId);
        } else {
            match = await matchesGirls.findById(matchId);
        }
        
        if (!match) {
            return res.json({ success: false, message: 'Match not found' });
        }
        
        // Update match as completed
        match.matchStatus = 'complete';
        match.scorecard.matchCompleted = true;
        match.scorecard.matchWinner = winnerIndex === 0 ? match.college1Name : match.college2Name;
        match.overallWinner = winnerIndex === 0 ? 'team1' : 'team2';
        match.setInProgress = false;
        
        await match.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Complete match error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;