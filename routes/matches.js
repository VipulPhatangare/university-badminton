const express = require('express');
const router = express.Router();
const { matchesBoys, singlesMatch, doublesMatch, set } = require('../database/schema');

// Get all matches
router.get('/', async (req, res) => {
    try {
        const matches = await matchesBoys.find().sort({ date: -1, time: -1 });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get matches by status (live, upcoming, complete)
router.get('/status/:status', async (req, res) => {
    try {
        const status = req.params.status;
        const matches = await matchesBoys.find({ matchStatus: status }).sort({ date: -1, time: -1 });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get live matches specifically for homepage
router.get('/live', async (req, res) => {
    try {
        const liveMatches = await matchesBoys.find({ 
            matchStatus: 'live' 
        }).sort({ date: -1, time: -1 }).limit(6); // Limit to 6 for homepage display
        
        res.json(liveMatches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single match details with all submatches
router.get('/:matchId', async (req, res) => {
    try {
        // Validate MongoDB ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.matchId)) {
            return res.status(400).json({ 
                message: 'Invalid match ID format. Please use a valid MongoDB ObjectId from your database.' 
            });
        }
        
        const match = await matchesBoys.findById(req.params.matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        // Fetch all singles matches with null checks
        let singlesMatches = [];
        if (match.singlesMatchId && match.singlesMatchId.length > 0) {
            const singlesPromises = match.singlesMatchId.map(id => singlesMatch.findById(id).catch(() => null));
            singlesMatches = (await Promise.all(singlesPromises)).filter(m => m !== null);
        }

        // Fetch all doubles matches with null checks
        let doublesMatches = [];
        if (match.doublesMatchId && match.doublesMatchId.length > 0) {
            const doublesPromises = match.doublesMatchId.map(id => doublesMatch.findById(id).catch(() => null));
            doublesMatches = (await Promise.all(doublesPromises)).filter(m => m !== null);
        }

        res.json({
            ...match.toObject(),
            singlesMatches,
            doublesMatches
        });
    } catch (error) {
        console.error('Error in /:matchId route:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get singles match details with sets
router.get('/singles/:singlesId', async (req, res) => {
    try {
        const singlesMatchData = await singlesMatch.findById(req.params.singlesId);
        if (!singlesMatchData) {
            return res.status(404).json({ message: 'Singles match not found' });
        }

        // Fetch all sets for this match
        const sets = await Promise.all(
            singlesMatchData.sets.map(setId => set.findById(setId))
        );

        res.json({
            ...singlesMatchData.toObject(),
            setsData: sets
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get doubles match details with sets
router.get('/doubles/:doublesId', async (req, res) => {
    try {
        const doublesMatchData = await doublesMatch.findById(req.params.doublesId);
        if (!doublesMatchData) {
            return res.status(404).json({ message: 'Doubles match not found' });
        }

        // Fetch all sets for this match
        const sets = await Promise.all(
            doublesMatchData.sets.map(setId => set.findById(setId))
        );

        res.json({
            ...doublesMatchData.toObject(),
            setsData: sets
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Complete bye match and advance team to next round
router.post('/:matchId/complete-bye', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.matchId)) {
            return res.status(400).json({ 
                message: 'Invalid match ID format' 
            });
        }
        
        const match = await matchesBoys.findById(req.params.matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }
        
        // Verify this is actually a bye match
        if (!match.isBye) {
            return res.status(400).json({ 
                message: 'This is not a bye match. Cannot complete as bye.' 
            });
        }
        
        // Update match status to completed
        const updatedMatch = await matchesBoys.findByIdAndUpdate(
            req.params.matchId,
            {
                matchStatus: 'complete',
                overallWinner: 'team1', // College1 wins the bye
                winnerEmail: match.email1,
                completedAt: new Date()
            },
            { new: true }
        );
        
        // TODO: In a real tournament system, you would also:
        // 1. Create the next round match for this team
        // 2. Update the college's currentRound status
        // 3. Send notifications to the college
        
        // For now, we'll just update the college's round status
        const { collegeInfo } = require('../database/schema');
        await collegeInfo.findOneAndUpdate(
            { email: match.email1 },
            { 
                $push: { matchesBoys: match._id },
                // Advance to next round (this is a simplified version)
                currentRoundBoys: getNextRound(match.round)
            }
        );
        
        res.json({
            success: true,
            message: 'Bye match completed successfully',
            match: updatedMatch
        });
        
    } catch (error) {
        console.error('Error completing bye match:', error);
        res.status(500).json({ message: error.message });
    }
});

// Helper function to determine next round
function getNextRound(currentRound) {
    const roundProgression = {
        'round_1': 'round_2',
        'round_2': 'quarter', 
        'quarter': 'semi',
        'semi': 'final',
        'final': 'champion'
    };
    
    return roundProgression[currentRound] || currentRound;
}

module.exports = router;
