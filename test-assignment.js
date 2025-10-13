// Test script to verify match assignment functionality
// This script tests the API endpoints to ensure referee and player assignment works correctly

const API_BASE_URL = 'http://localhost:3000';

// Test function to verify referee assignment
async function testRefereeAssignment() {
    console.log('\n=== Testing Referee Assignment ===');
    
    try {
        // First, get all matches to find one to assign
        console.log('1. Getting all matches...');
        const matchesResponse = await fetch(`${API_BASE_URL}/api/admin/get-all-matches`);
        const matchesData = await matchesResponse.json();
        
        if (!matchesData.success || matchesData.matches.length === 0) {
            console.log('❌ No matches found for testing');
            return false;
        }
        
        const testMatch = matchesData.matches[0];
        console.log(`✅ Found test match: ${testMatch.college1Name} vs ${testMatch.college2Name}`);
        
        // Get referees to assign
        console.log('2. Getting referees...');
        const refereesResponse = await fetch(`${API_BASE_URL}/api/admin/get-referees`);
        const refereesData = await refereesResponse.json();
        
        if (!refereesData.success || refereesData.referees.length === 0) {
            console.log('❌ No referees found for testing');
            return false;
        }
        
        const testReferee = refereesData.referees[0];
        console.log(`✅ Found test referee: ${testReferee.name} (${testReferee.refEmail})`);
        
        // Assign referee to match
        console.log('3. Assigning referee to match...');
        const assignResponse = await fetch(`${API_BASE_URL}/api/admin/assign-referee-to-match`, {
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
        
        const assignResult = await assignResponse.json();
        
        if (assignResult.success) {
            console.log('✅ Referee assignment successful!');
            console.log('📋 Assignment details:', {
                matchId: assignResult.match._id,
                refreeEmail: assignResult.match.refreeEmail,
                refreeName: assignResult.match.refreeName,
                matchStatus: assignResult.match.matchStatus
            });
            return true;
        } else {
            console.log('❌ Referee assignment failed:', assignResult.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error during referee assignment test:', error);
        return false;
    }
}

// Test function to verify full match assignment
async function testMatchAssignment() {
    console.log('\n=== Testing Full Match Assignment ===');
    
    try {
        // Get a match and players for testing
        console.log('1. Getting test data...');
        const [matchesResponse, playersResponse, refereesResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/admin/get-all-matches`),
            fetch(`${API_BASE_URL}/api/admin/get-players`),
            fetch(`${API_BASE_URL}/api/admin/get-referees`)
        ]);
        
        const matchesData = await matchesResponse.json();
        const playersData = await playersResponse.json();
        const refereesData = await refereesResponse.json();
        
        if (!matchesData.success || matchesData.matches.length === 0) {
            console.log('❌ No matches available for testing');
            return false;
        }
        
        if (!playersData.success || playersData.players.length < 10) {
            console.log('❌ Not enough players for testing (need at least 10)');
            return false;
        }
        
        if (!refereesData.success || refereesData.referees.length === 0) {
            console.log('❌ No referees available for testing');
            return false;
        }
        
        const testMatch = matchesData.matches[0];
        const testReferee = refereesData.referees[0];
        const players = playersData.players;
        
        console.log(`✅ Test match: ${testMatch.college1Name} vs ${testMatch.college2Name}`);
        console.log(`✅ Test referee: ${testReferee.name}`);
        console.log(`✅ Available players: ${players.length}`);
        
        // Create sub-match assignments
        const subMatches = [];
        
        // Need at least 10 players for a full boys match (2 singles + 4 doubles + 2 singles + 4 doubles = 12)
        // But we'll try with available players
        if (players.length >= 10) {
            // Match 1 - Singles
            subMatches.push({
                matchNumber: 1,
                refereeId: testReferee._id,
                type: 'singles',
                team1Player: players[0]._id,
                team2Player: players[1]._id
            });
            
            // Match 2 - Singles  
            subMatches.push({
                matchNumber: 2,
                refereeId: testReferee._id,
                type: 'singles',
                team1Player: players[2]._id,
                team2Player: players[3]._id
            });
            
            // Match 3 - Doubles
            subMatches.push({
                matchNumber: 3,
                refereeId: testReferee._id,
                type: 'doubles',
                team1Player1: players[4]._id,
                team1Player2: players[5]._id,
                team2Player1: players[6]._id,
                team2Player2: players[7]._id
            });
            
            // Match 4 - Singles
            subMatches.push({
                matchNumber: 4,
                refereeId: testReferee._id,
                type: 'singles',
                team1Player: players[8]._id,
                team2Player: players[9]._id
            });
            
            // Match 5 - Doubles (if we have enough players)
            if (players.length >= 14) {
                subMatches.push({
                    matchNumber: 5,
                    refereeId: testReferee._id,
                    type: 'doubles',
                    team1Player1: players[10]._id,
                    team1Player2: players[11]._id,
                    team2Player1: players[12]._id,
                    team2Player2: players[13]._id
                });
            }
        }
        
        if (subMatches.length === 0) {
            console.log('❌ Cannot create test assignments - not enough players');
            return false;
        }
        
        console.log(`2. Created ${subMatches.length} sub-match assignments`);
        
        // Submit the full assignment
        console.log('3. Submitting full match assignment...');
        const assignmentData = {
            matchId: testMatch._id,
            gender: 'boys',
            subMatches: subMatches
        };
        
        const assignResponse = await fetch(`${API_BASE_URL}/api/admin/matches/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });
        
        const assignResult = await assignResponse.json();
        
        if (assignResult.success) {
            console.log('✅ Full match assignment successful!');
            console.log('📋 Assignment details:', {
                matchId: assignResult.match._id,
                refreeEmail: assignResult.match.refreeEmail,
                refreeName: assignResult.match.refreeName,
                matchStatus: assignResult.match.matchStatus,
                assignedReferees: assignResult.match.assignedRefereeNames?.length || 0,
                subMatches: subMatches.length
            });
            return true;
        } else {
            console.log('❌ Full match assignment failed:', assignResult.error);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error during full match assignment test:', error);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🏸 Starting Match Assignment Tests');
    console.log('==================================');
    
    const test1 = await testRefereeAssignment();
    const test2 = await testMatchAssignment();
    
    console.log('\n=== Test Results Summary ===');
    console.log(`Referee Assignment Test: ${test1 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Full Match Assignment Test: ${test2 ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (test1 && test2) {
        console.log('\n🎉 All tests passed! The assignment system is working correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testRefereeAssignment, testMatchAssignment, runAllTests };
} else {
    // Browser environment - attach to window for console testing
    window.testAssignment = { testRefereeAssignment, testMatchAssignment, runAllTests };
}

// Auto-run if this script is executed directly
if (typeof window === 'undefined') {
    runAllTests().catch(console.error);
}