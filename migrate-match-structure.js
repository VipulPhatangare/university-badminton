// Migration script to convert old matchResults array structure to new integrated structure
const mongoose = require('mongoose');
const { matchesBoys, matchesGirls } = require('./database/schema');

// Load environment variables
require('dotenv').config();

async function migrateMatchStructure() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for migration');

        // Migrate Boys matches
        console.log('Migrating boys matches...');
        const boysMatches = await matchesBoys.find({ matchResults: { $exists: true, $ne: [] } });
        
        for (const match of boysMatches) {
            let updated = false;
            
            if (match.matchResults && match.matchResults.length > 0) {
                console.log(`Migrating boys match ${match._id}...`);
                
                match.matchResults.forEach(result => {
                    let targetMatch;
                    switch(result.matchNumber) {
                        case 1: targetMatch = match.match1Singles; break;
                        case 2: targetMatch = match.match2Singles; break;
                        case 3: targetMatch = match.match3Doubles; break;
                        case 4: targetMatch = match.match4Singles; break;
                        case 5: targetMatch = match.match5Doubles; break;
                    }
                    
                    if (targetMatch) {
                        targetMatch.isStarted = result.isStarted || false;
                        targetMatch.isCompleted = result.isCompleted || result.isComplete || false;
                        targetMatch.winnerTeam = result.winnerTeam;
                        targetMatch.winnerEmail = result.winnerEmail;
                        targetMatch.startedAt = result.startedAt;
                        targetMatch.completedAt = result.completedAt;
                        targetMatch.matchSettings = result.matchSettings;
                        updated = true;
                    }
                });
                
                if (updated) {
                    // Remove old matchResults array
                    match.matchResults = undefined;
                    await match.save();
                    console.log(`✅ Migrated boys match ${match._id}`);
                }
            }
        }

        // Migrate Girls matches
        console.log('Migrating girls matches...');
        const girlsMatches = await matchesGirls.find({ matchResults: { $exists: true, $ne: [] } });
        
        for (const match of girlsMatches) {
            let updated = false;
            
            if (match.matchResults && match.matchResults.length > 0) {
                console.log(`Migrating girls match ${match._id}...`);
                
                match.matchResults.forEach(result => {
                    let targetMatch;
                    switch(result.matchNumber) {
                        case 1: targetMatch = match.match1Singles; break;
                        case 2: targetMatch = match.match2Doubles; break;
                        case 3: targetMatch = match.match3Singles; break;
                    }
                    
                    if (targetMatch) {
                        targetMatch.isStarted = result.isStarted || false;
                        targetMatch.isCompleted = result.isCompleted || result.isComplete || false;
                        targetMatch.winnerTeam = result.winnerTeam;
                        targetMatch.winnerEmail = result.winnerEmail;
                        targetMatch.startedAt = result.startedAt;
                        targetMatch.completedAt = result.completedAt;
                        targetMatch.matchSettings = result.matchSettings;
                        updated = true;
                    }
                });
                
                if (updated) {
                    // Remove old matchResults array
                    match.matchResults = undefined;
                    await match.save();
                    console.log(`✅ Migrated girls match ${match._id}`);
                }
            }
        }

        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateMatchStructure();
}

module.exports = { migrateMatchStructure };


