// Simple test to verify the assignment API is working with proper ObjectIds
const fetch = require('node-fetch'); // You might need to install node-fetch

const API_BASE_URL = 'http://localhost:3000';

async function testAssignmentWithValidIds() {
    try {
        console.log('Testing assignment with proper ObjectId validation...');
        
        // First get some test data
        const [matchesRes, playersRes, refereesRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/admin/get-all-matches`),
            fetch(`${API_BASE_URL}/api/admin/get-players`),
            fetch(`${API_BASE_URL}/api/admin/get-referees`)
        ]);
        
        const matchesData = await matchesRes.json();
        const playersData = await playersRes.json();
        const refereesData = await refereesRes.json();
        
        if (!matchesData.success || matchesData.matches.length === 0) {
            console.log('❌ No matches available');
            return;
        }
        
        if (!playersData.success || playersData.players.length < 4) {
            console.log('❌ Need at least 4 players for testing');
            return;
        }
        
        if (!refereesData.success || refereesData.referees.length === 0) {
            console.log('❌ No referees available');
            return;
        }
        
        const testMatch = matchesData.matches[0];
        const players = playersData.players;
        const referee = refereesData.referees[0];
        
        console.log(`✅ Test match: ${testMatch.college1Name} vs ${testMatch.college2Name}`);
        console.log(`✅ Using ${players.length} available players`);
        console.log(`✅ Using referee: ${referee.name}`);
        
        // Create a simple assignment with just 2 singles matches for testing
        const assignmentData = {
            matchId: testMatch._id,
            gender: 'boys',
            subMatches: [
                {
                    matchNumber: 1,
                    refereeId: referee._id, // This should be a valid ObjectId
                    type: 'singles',
                    team1Player: players[0]._id, // This should be a valid ObjectId
                    team2Player: players[1]._id  // This should be a valid ObjectId
                }
            ]
        };
        
        console.log('Submitting assignment data:');
        console.log('Match ID:', testMatch._id);
        console.log('Referee ID:', referee._id);
        console.log('Player 1 ID:', players[0]._id, '- Name:', players[0].playerName);
        console.log('Player 2 ID:', players[1]._id, '- Name:', players[1].playerName);
        
        // Make the API call
        const response = await fetch(`${API_BASE_URL}/api/admin/matches/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ Assignment successful!');
            console.log('Result:', result.message);
            console.log('Updated match status:', result.match?.matchStatus);
        } else {
            console.log('❌ Assignment failed!');
            console.log('Status:', response.status);
            console.log('Error:', result.error || result.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

// Only run if node-fetch is available
if (typeof fetch !== 'undefined' || require) {
    testAssignmentWithValidIds();
} else {
    console.log('This test requires node-fetch. Install it with: npm install node-fetch');
}