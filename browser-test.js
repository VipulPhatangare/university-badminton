// Browser console test for match assignment API
// Copy and paste this into the browser console on the admin dashboard page

async function testAssignmentAPI() {
    try {
        console.log('🏸 Testing Match Assignment API...');
        
        // Get test data
        console.log('1. Getting test data...');
        const [matchesRes, playersRes, refereesRes] = await Promise.all([
            fetch('/api/admin/get-all-matches'),
            fetch('/api/admin/get-players'), 
            fetch('/api/admin/get-referees')
        ]);
        
        const matchesData = await matchesRes.json();
        const playersData = await playersRes.json();
        const refereesData = await refereesRes.json();
        
        console.log('Matches:', matchesData.success ? `${matchesData.matches.length} found` : 'Failed to load');
        console.log('Players:', playersData.success ? `${playersData.players.length} found` : 'Failed to load');
        console.log('Referees:', refereesData.success ? `${refereesData.referees.length} found` : 'Failed to load');
        
        if (!matchesData.success || matchesData.matches.length === 0) {
            console.log('❌ No matches available for testing');
            return;
        }
        
        if (!playersData.success || playersData.players.length < 4) {
            console.log('❌ Need at least 4 players for testing');
            return;
        }
        
        if (!refereesData.success || refereesData.referees.length === 0) {
            console.log('❌ No referees available for testing');
            return;
        }
        
        // Use first available match, referee, and some players
        const testMatch = matchesData.matches[0];
        const testReferee = refereesData.referees[0];
        const players = playersData.players;
        
        console.log('2. Test data selected:');
        console.log(`   Match: ${testMatch.college1Name} vs ${testMatch.college2Name} (ID: ${testMatch._id})`);
        console.log(`   Referee: ${testReferee.name} (ID: ${testReferee._id})`);
        console.log(`   Player 1: ${players[0].playerName} (ID: ${players[0]._id})`);
        console.log(`   Player 2: ${players[1].playerName} (ID: ${players[1]._id})`);
        
        // Create simple assignment data
        const assignmentData = {
            matchId: testMatch._id,
            gender: 'boys',
            subMatches: [
                {
                    matchNumber: 1,
                    refereeId: testReferee._id,
                    type: 'singles',
                    team1Player: players[0]._id,
                    team2Player: players[1]._id
                }
            ]
        };
        
        console.log('3. Submitting assignment...');
        console.log('Assignment data:', assignmentData);
        
        // Make the assignment API call
        const response = await fetch('/api/admin/matches/assign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });
        
        console.log('4. Response received:');
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        const result = await response.json();
        console.log('   Result:', result);
        
        if (response.ok && result.success) {
            console.log('✅ Assignment successful!');
            console.log(`   Message: ${result.message}`);
            if (result.match) {
                console.log(`   Match Status: ${result.match.matchStatus}`);
                console.log(`   Referee Email: ${result.match.refreeEmail}`);
                console.log(`   Referee Name: ${result.match.refreeName}`);
            }
        } else {
            console.log('❌ Assignment failed!');
            console.log(`   Error: ${result.error || result.message || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed with exception:', error);
    }
}

// Test just referee assignment first
async function testRefereeAssignmentOnly() {
    try {
        console.log('🏸 Testing Referee Assignment Only...');
        
        const [matchesRes, refereesRes] = await Promise.all([
            fetch('/api/admin/get-all-matches'),
            fetch('/api/admin/get-referees')
        ]);
        
        const matchesData = await matchesRes.json();
        const refereesData = await refereesRes.json();
        
        if (!matchesData.success || matchesData.matches.length === 0) {
            console.log('❌ No matches available');
            return;
        }
        
        if (!refereesData.success || refereesData.referees.length === 0) {
            console.log('❌ No referees available');
            return;
        }
        
        const testMatch = matchesData.matches[0];
        const testReferee = refereesData.referees[0];
        
        console.log(`Testing with match: ${testMatch._id} and referee: ${testReferee.refEmail}`);
        
        const response = await fetch('/api/admin/assign-referee-to-match', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matchId: testMatch._id,
                refereeEmail: testReferee.refEmail,
                gender: 'boys'
            })
        });
        
        const result = await response.json();
        
        console.log('Response:', response.status, result);
        
        if (result.success) {
            console.log('✅ Referee assignment successful!');
        } else {
            console.log('❌ Referee assignment failed:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Referee test failed:', error);
    }
}

console.log('Test functions loaded. Run testAssignmentAPI() or testRefereeAssignmentOnly() to test.');