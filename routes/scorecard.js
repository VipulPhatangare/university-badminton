const express = require('express');
const router = express.Router();
const { matchesBoys, matchesGirls } = require('../database/schema');

// Update score - SIMPLIFIED for new schema
router.post('/update-score', async (req, res) => {
    try {
        const { player1Point, player2Point, currentSet, matchId, matchType, server, matchNumber } = req.body;

        console.log('🔄 Updating score for match:', {
            matchId,
            matchType,
            matchNumber,
            currentSet,
            player1Point,
            player2Point,
            server
        });

        if (matchId && matchId !== 'default' && matchType && matchType !== 'default') {
            const matchModel = matchType === 'boys' ? matchesBoys : matchesGirls;
            const match = await matchModel.findById(matchId);
            
            if (match) {
                const matchKey = `match${matchNumber}`;
                
                // Initialize scorecardData if it doesn't exist
                if (!match.scorecardData) {
                    match.scorecardData = {};
                }
                
                // Initialize match data if it doesn't exist
                if (!match.scorecardData[matchKey]) {
                    match.scorecardData[matchKey] = {
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
                
                const matchData = match.scorecardData[matchKey];
                
                // Find or create current set
                let currentSetData = matchData.scores.find(s => s.setNumber === currentSet);
                if (!currentSetData) {
                    currentSetData = {
                        setNumber: currentSet,
                        player1Score: 0,
                        player2Score: 0,
                        isComplete: false
                    };
                    matchData.scores.push(currentSetData);
                }
                
                // Update scores
                currentSetData.player1Score = player1Point;
                currentSetData.player2Score = player2Point;
                
                // Update current state
                matchData.currentSet = currentSet - 1;
                matchData.currentScore = {
                    player1: player1Point,
                    player2: player2Point,
                    server: server === matchData.currentScore?.server ? server : 
                            (server.includes('Singh') || server.includes('University')) ? 0 : 1
                };
                matchData.lastUpdated = new Date();
                
                console.log(`✅ Score updated for ${matchKey}:`, matchData);
                
                await match.save();
                console.log('✅ Score saved successfully');
            }
            
            return res.json({ success: true, message: `Score updated for match ${matchNumber}` });
        }

        res.json({ success: true, message: 'Score updated successfully' });

    } catch (error) {
        console.error('❌ Error updating score:', error);
        res.status(500).json({ success: false, message: 'Error updating score' });
    }
});

// Get match information - SIMPLIFIED
router.get('/get-match-info', async (req, res) => {
    try {
        const { matchId, matchType, matchNumber } = req.query;
        
        console.log('🔍 Fetching match info:', { matchId, matchType, matchNumber });
        
        if (matchId && matchId !== 'default' && matchType && matchType !== 'default') {
            const matchModel = matchType === 'boys' ? matchesBoys : matchesGirls;
            const match = await matchModel.findById(matchId);
            
            if (match) {
                console.log('🔍 Raw scorecardData from DB:', match.scorecardData);
                
                let scorecardData = null;
                const matchKey = `match${matchNumber}`;
                
                if (match.scorecardData && match.scorecardData[matchKey]) {
                    scorecardData = match.scorecardData[matchKey];
                    console.log(`✅ Found scorecard data for ${matchKey}:`, scorecardData);
                } else {
                    console.log(`❌ No data found for ${matchKey}`);
                }
                
                // Check if match is started
                let isMatchStarted = false;
                if (matchType === 'boys') {
                    switch(parseInt(matchNumber)) {
                        case 1: isMatchStarted = match.match1Singles?.isStarted || false; break;
                        case 2: isMatchStarted = match.match2Singles?.isStarted || false; break;
                        case 3: isMatchStarted = match.match3Doubles?.isStarted || false; break;
                        case 4: isMatchStarted = match.match4Singles?.isStarted || false; break;
                        case 5: isMatchStarted = match.match5Doubles?.isStarted || false; break;
                    }
                } else {
                    switch(parseInt(matchNumber)) {
                        case 1: isMatchStarted = match.match1Singles?.isStarted || false; break;
                        case 2: isMatchStarted = match.match2Doubles?.isStarted || false; break;
                        case 3: isMatchStarted = match.match3Singles?.isStarted || false; break;
                    }
                }
                
                return res.json({
                    success: true,
                    scorecardData: scorecardData,
                    matchId: matchId,
                    matchType: matchType,
                    matchNumber: matchNumber,
                    isMatchStarted: isMatchStarted,
                    freshStart: !scorecardData
                });
            }
        }
        
        res.json({
            success: true,
            maxSetPoint: 21,
            maxSets: 3,
            playerName1: 'Player 1',
            playerName2: 'Player 2',
            _id: 'default',
            matchType: 'default',
            matchNo: 1,
            scorecardData: null
        });
    } catch (error) {
        console.error('❌ Error getting match info:', error);
        res.status(500).json({ success: false, message: 'Error retrieving match info' });
    }
});


// Complete a set
router.post('/complete-set', async (req, res) => {
    try {
        const { setNumber, winnerIndex, player1Point, player2Point, matchId, matchType, server, matchNumber } = req.body;

        console.log('🏁 Set completed for match:', {
            matchNumber,
            setNumber,
            winnerIndex,
            player1Point,
            player2Point,
            matchId,
            matchType
        });

        // For referee matches, update the scorecard database to mark set as complete
        if (matchId && matchId !== 'default' && matchType && matchType !== 'default') {
            const matchModel = matchType === 'boys' ? matchesBoys : matchesGirls;
            const match = await matchModel.findById(matchId);
            
            if (match && match.scorecardData) {
                const matchKey = `match${matchNumber}`;
                if (match.scorecardData[matchKey]) {
                    // Find the set to mark as complete
                    const setData = match.scorecardData[matchKey].scores.find(s => s.setNumber === setNumber);
                    if (setData) {
                        setData.isComplete = true;
                        setData.completedAt = new Date();
                        setData.player1Score = player1Point;
                        setData.player2Score = player2Point;
                        
                        // Update lastUpdated
                        match.scorecardData[matchKey].lastUpdated = new Date();
                        
                        await match.save();
                        console.log(`✅ Set ${setNumber} for match ${matchNumber} marked as complete in database`);
                    }
                }
            }
            
            console.log('✅ Referee match - set completion logged and database updated for match:', matchNumber);
            return res.json({
                success: true,
                message: `Set completion logged for match ${matchNumber}`
            });
        }

        // Handle non-referee matches
        res.json({
            success: true,
            message: 'Set completed successfully'
        });

    } catch (error) {
        console.error('❌ Error completing set:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing set'
        });
    }
});


// Complete entire match
router.post('/complete-match', async (req, res) => {
    try {
        const { winnerIndex, setsWon, matchId, matchType, matchNumber } = req.body;

        console.log('Match completed:', {
            winnerIndex,
            setsWon,
            matchId,
            matchType,
            matchNumber
        });

        // For referee matches, update match completion status
        if (matchId && matchId !== 'default' && matchType && matchType !== 'default') {
            const matchModel = matchType === 'boys' ? require('../database/schema').matchesBoys : require('../database/schema').matchesGirls;
            const match = await matchModel.findById(matchId);
            
            if (match) {
                // Find and initialize the appropriate match object to update
                let targetMatch;
                if (matchType === 'boys') {
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
                    // Determine winner based on winnerIndex and match data
                    const winnerTeam = winnerIndex === 0 ? 'team1' : 'team2';
                    const winnerEmail = winnerTeam === 'team1' ? match.email1 : match.email2;
                    
                    // Update the match with completion info
                    targetMatch.isCompleted = true;
                    targetMatch.winnerTeam = winnerTeam;
                    targetMatch.winnerEmail = winnerEmail;
                    targetMatch.completedAt = new Date();
                    // Ensure it's marked as started
                    if (!targetMatch.isStarted) {
                        targetMatch.isStarted = true;
                        targetMatch.startedAt = new Date();
                    }
                    
                    // Calculate completed matches count
                    const completedMatches = [];
                    if (matchType === 'boys') {
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
                    const totalMatches = matchType === 'boys' ? 5 : 3;
                    const requiredWins = Math.ceil(totalMatches / 2); // 3 for boys, 2 for girls

                    const team1Wins = completedMatches.filter(m => m.winnerTeam === 'team1').length;
                    const team2Wins = completedMatches.filter(m => m.winnerTeam === 'team2').length;

                    if (team1Wins >= requiredWins) {
                        match.overallWinner = 'team1';
                        match.winnerEmail = match.email1;
                        match.matchStatus = 'complete';
                        match.setInProgress = false;
                    } else if (team2Wins >= requiredWins) {
                        match.overallWinner = 'team2';
                        match.winnerEmail = match.email2;
                        match.matchStatus = 'complete';
                        match.setInProgress = false;
                    }
                    
                    await match.save();
                    console.log(`Match ${matchNumber} marked as completed in database`);
                    
                    return res.json({
                        success: true,
                        message: 'Match completion updated in database',
                        overallWinner: match.overallWinner || null,
                        matchComplete: match.matchStatus === 'complete'
                    });
                }
            }
            
            console.log('Referee match - match completion logged');
            return res.json({
                success: true,
                message: 'Match completion logged for referee match'
            });
        }

        // Handle non-referee matches
        res.json({
            success: true,
            message: 'Match completed successfully'
        });

    } catch (error) {
        console.error('Error completing match:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing match'
        });
    }
});

module.exports = router;