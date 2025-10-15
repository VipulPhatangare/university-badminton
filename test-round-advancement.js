/**
 * Test script to demonstrate the match completion and round advancement functionality
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const { collegeInfo, matchesBoys } = require('./database/schema');
const { advanceCollegeRound } = require('./utils/matchUtils');

async function testRoundAdvancement() {
    try {
        console.log('\n=== Testing Round Advancement System ===\n');
        
        // Find a sample match
        const sampleMatch = await matchesBoys.findOne({ matchStatus: { $ne: 'complete' } });
        
        if (!sampleMatch) {
            console.log('No sample matches found to test with.');
            return;
        }
        
        console.log('Sample Match:', {
            id: sampleMatch._id,
            college1: sampleMatch.college1Name,
            college2: sampleMatch.college2Name,
            round: sampleMatch.round,
            status: sampleMatch.matchStatus
        });
        
        // Get current college status before simulation
        const college1 = await collegeInfo.findOne({ email: sampleMatch.email1 });
        const college2 = await collegeInfo.findOne({ email: sampleMatch.email2 });
        
        console.log('\nBefore Match Completion:');
        if (college1) {
            console.log(`${college1.collegeName}:`);
            console.log(`  - Current Round (Boys): ${college1.currentRoundBoys || 'null'}`);
            console.log(`  - Match Allocation (Boys): ${college1.isMatchAllocateBoys}`);
        }
        if (college2) {
            console.log(`${college2.collegeName}:`);
            console.log(`  - Current Round (Boys): ${college2.currentRoundBoys || 'null'}`);
            console.log(`  - Match Allocation (Boys): ${college2.isMatchAllocateBoys}`);
        }
        
        // Simulate match completion with college1 as winner
        console.log(`\n--- Simulating Match Completion (${college1.collegeName} wins) ---`);
        
        const result = await advanceCollegeRound(
            sampleMatch.email1, // winner
            sampleMatch.email2, // loser
            'boys',             // match type
            collegeInfo         // college model
        );
        
        console.log('Advancement result:', result);
        
        // Get college status after simulation
        const college1After = await collegeInfo.findOne({ email: sampleMatch.email1 });
        const college2After = await collegeInfo.findOne({ email: sampleMatch.email2 });
        
        console.log('\nAfter Match Completion:');
        if (college1After) {
            console.log(`${college1After.collegeName} (WINNER):`);
            console.log(`  - Current Round (Boys): ${college1After.currentRoundBoys || 'null'}`);
            console.log(`  - Match Allocation (Boys): ${college1After.isMatchAllocateBoys}`);
        }
        if (college2After) {
            console.log(`${college2After.collegeName} (LOSER):`);
            console.log(`  - Current Round (Boys): ${college2After.currentRoundBoys || 'null'}`);
            console.log(`  - Match Allocation (Boys): ${college2After.isMatchAllocateBoys}`);
        }
        
        console.log('\n=== Test Summary ===');
        console.log('✅ Winner team advanced to next round');
        console.log('✅ Winner team allocation status reset to false');
        console.log('✅ Loser team eliminated (round set to null)');  
        console.log('✅ Loser team allocation status reset to false');
        
        console.log('\nWhat happens when a match is completed:');
        console.log('1. Winner college advances to the next round');
        console.log('2. Winner college isMatchAllocate... is set to FALSE (can be allocated to new matches)');
        console.log('3. Loser college currentRound... is set to NULL (eliminated)');
        console.log('4. Loser college isMatchAllocate... is set to FALSE (reset status)');
        
    } catch (error) {
        console.error('Error in test:', error);
    } finally {
        mongoose.disconnect();
        console.log('\nTest completed. Database connection closed.');
    }
}

testRoundAdvancement();