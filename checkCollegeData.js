const mongoose = require('mongoose');
const { collegeInfo } = require('./database/schema');

async function checkCollegeData() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/badminton_tournament');
        console.log('Connected to MongoDB');

        // Get total count of colleges
        const totalColleges = await collegeInfo.countDocuments();
        console.log(`Total colleges in database: ${totalColleges}`);

        if (totalColleges > 0) {
            // Sample a few colleges
            const sampleColleges = await collegeInfo.find().limit(5);
            console.log('\nSample colleges:');
            sampleColleges.forEach(college => {
                console.log(`- ${college.name} (${college.email}) - Players: Boys=${college.playerInfoIdBoys?.length || 0}, Girls=${college.playerInfoIdGirls?.length || 0}`);
            });

            // Check if any college has player arrays
            const collegesWithPlayers = await collegeInfo.find({
                $or: [
                    { playerInfoIdBoys: { $exists: true, $ne: [] } },
                    { playerInfoIdGirls: { $exists: true, $ne: [] } }
                ]
            });
            console.log(`\nColleges with players: ${collegesWithPlayers.length}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkCollegeData();