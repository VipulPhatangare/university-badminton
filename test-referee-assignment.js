const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./database/db');
const { matchesBoys, matchesGirls, refreeInfo } = require('./database/schema');

async function testRefereeAssignment() {
    try {
        await connectDB();
        console.log('📡 Connected to database');

        // Get the first referee
        const referee = await refreeInfo.findOne();
        if (!referee) {
            console.log('❌ No referees found in database');
            return;
        }

        console.log(`\n👨‍⚖️ Testing with referee: ${referee.name} (${referee.refEmail})`);

        // Manually assign the referee to the first boys match
        const boysMatch = await matchesBoys.findOne();
        if (boysMatch) {
            boysMatch.refreeEmail = referee.refEmail;
            boysMatch.refreeName = referee.name;
            boysMatch.matchStatus = 'players_allocated'; // This is the status after admin assignment
            await boysMatch.save();
            console.log(`✅ Assigned referee to boys match: ${boysMatch.college1Name} vs ${boysMatch.college2Name}`);
        }

        // Manually assign the referee to the first girls match
        const girlsMatch = await matchesGirls.findOne();
        if (girlsMatch) {
            girlsMatch.refreeEmail = referee.refEmail;
            girlsMatch.refreeName = referee.name;
            girlsMatch.matchStatus = 'players_allocated'; // This is the status after admin assignment
            await girlsMatch.save();
            console.log(`✅ Assigned referee to girls match: ${girlsMatch.college1Name} vs ${girlsMatch.college2Name}`);
        }

        // Now check what matches the referee should see
        console.log('\n🔍 Checking assigned matches for referee...');

        const assignedBoysMatches = await matchesBoys.find({
            refreeEmail: referee.refEmail,
            matchStatus: { $in: ['upcoming', 'live', 'players_allocated'] }
        });

        const assignedGirlsMatches = await matchesGirls.find({
            refreeEmail: referee.refEmail,
            matchStatus: { $in: ['upcoming', 'live', 'players_allocated'] }
        });

        console.log(`📊 Found ${assignedBoysMatches.length} boys matches assigned to ${referee.name}`);
        console.log(`📊 Found ${assignedGirlsMatches.length} girls matches assigned to ${referee.name}`);

        if (assignedBoysMatches.length > 0) {
            console.log('\n🏸 Boys Matches:');
            assignedBoysMatches.forEach(match => {
                console.log(`  - ${match.college1Name} vs ${match.college2Name} (Status: ${match.matchStatus})`);
            });
        }

        if (assignedGirlsMatches.length > 0) {
            console.log('\n🏸 Girls Matches:');
            assignedGirlsMatches.forEach(match => {
                console.log(`  - ${match.college1Name} vs ${match.college2Name} (Status: ${match.matchStatus})`);
            });
        }

        console.log('\n✅ Referee assignment test completed!');
        console.log(`\n🎯 Now login as: ${referee.refEmail} / 123456 to see these matches`);

    } catch (error) {
        console.error('❌ Error testing referee assignment:', error);
    } finally {
        mongoose.connection.close();
        console.log('📡 Database connection closed');
    }
}

if (require.main === module) {
    testRefereeAssignment();
}

module.exports = { testRefereeAssignment };