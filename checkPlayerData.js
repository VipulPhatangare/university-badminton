const mongoose = require('mongoose');
const { playerInfoId } = require('./database/schema');

async function checkPlayerData() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/badminton_tournament');
        console.log('Connected to MongoDB');

        // Check for players missing collegeName or collegeEmail
        const playersWithMissingCollegeName = await playerInfoId.find({ 
            $or: [
                { collegeName: { $exists: false } },
                { collegeName: null },
                { collegeName: '' }
            ]
        });

        const playersWithMissingCollegeEmail = await playerInfoId.find({ 
            $or: [
                { collegeEmail: { $exists: false } },
                { collegeEmail: null },
                { collegeEmail: '' }
            ]
        });

        console.log(`\nPlayers missing collegeName: ${playersWithMissingCollegeName.length}`);
        if (playersWithMissingCollegeName.length > 0) {
            console.log('Players with missing collegeName:');
            playersWithMissingCollegeName.forEach(player => {
                console.log(`- ID: ${player._id}, Name: ${player.playerName}, Email: ${player.email}`);
            });
        }

        console.log(`\nPlayers missing collegeEmail: ${playersWithMissingCollegeEmail.length}`);
        if (playersWithMissingCollegeEmail.length > 0) {
            console.log('Players with missing collegeEmail:');
            playersWithMissingCollegeEmail.forEach(player => {
                console.log(`- ID: ${player._id}, Name: ${player.playerName}, Email: ${player.email}`);
            });
        }

        // Also get total count of players
        const totalPlayers = await playerInfoId.countDocuments();
        console.log(`\nTotal players in database: ${totalPlayers}`);

        // Sample a few players to see their structure
        const samplePlayers = await playerInfoId.find().limit(3);
        console.log('\nSample players:');
        samplePlayers.forEach(player => {
            console.log(`- ${player.playerName} (${player.email}) - College: ${player.collegeName} (${player.collegeEmail})`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkPlayerData();