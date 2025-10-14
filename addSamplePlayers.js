const mongoose = require('mongoose');
const { connectDB } = require('./database/db');
const { collegeInfo, playerInfoId } = require('./database/schema');

async function addSamplePlayers() {
    try {
        console.log('🔄 Adding sample players...');
        
        // Connect to database
        await connectDB();
        
        // Get some colleges to add players to
        const colleges = await collegeInfo.find().limit(10);
        console.log(`Found ${colleges.length} colleges`);
        
        if (colleges.length === 0) {
            console.log('No colleges found. Please run populateFromCSV2.js first.');
            return;
        }
        
        // Clear existing players
        await playerInfoId.deleteMany({});
        console.log('✅ Cleared existing players');
        
        const playersToAdd = [];
        
        // Add 5 male and 5 female players for the first few colleges
        for (let i = 0; i < Math.min(5, colleges.length); i++) {
            const college = colleges[i];
            
            // Add 5 male players
            for (let j = 1; j <= 5; j++) {
                const malePlayer = {
                    playerName: `${college.name} Male Player ${j}`,
                    email: `male${j}.${college.email.split('@')[0]}@college.com`,
                    gender: 'male',
                    phone: `90000000${i}${j}`,
                    collegeEmail: college.email,
                    collegeName: college.name
                };
                playersToAdd.push(malePlayer);
            }
            
            // Add 5 female players
            for (let j = 1; j <= 5; j++) {
                const femalePlayer = {
                    playerName: `${college.name} Female Player ${j}`,
                    email: `female${j}.${college.email.split('@')[0]}@college.com`,
                    gender: 'female',
                    phone: `91000000${i}${j}`,
                    collegeEmail: college.email,
                    collegeName: college.name
                };
                playersToAdd.push(femalePlayer);
            }
        }
        
        // Insert all players
        const insertedPlayers = await playerInfoId.insertMany(playersToAdd);
        console.log(`✅ Added ${insertedPlayers.length} players`);
        
        // Update college records with player IDs
        for (const college of colleges.slice(0, 5)) {
            const malePlayerIds = insertedPlayers
                .filter(p => p.collegeEmail === college.email && p.gender === 'male')
                .map(p => p._id);
            
            const femalePlayerIds = insertedPlayers
                .filter(p => p.collegeEmail === college.email && p.gender === 'female')
                .map(p => p._id);
            
            await collegeInfo.updateOne(
                { _id: college._id },
                {
                    playerInfoIdBoys: malePlayerIds,
                    playerInfoIdGirls: femalePlayerIds
                }
            );
            
            console.log(`✅ Updated ${college.name} with ${malePlayerIds.length} male and ${femalePlayerIds.length} female players`);
        }
        
        console.log('🎉 Successfully added sample players!');
        
    } catch (error) {
        console.error('Error adding sample players:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

addSamplePlayers();