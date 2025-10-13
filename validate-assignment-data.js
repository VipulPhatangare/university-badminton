const mongoose = require('mongoose');
const { playerInfoId, refreeInfo, matchesBoys } = require('./database/schema');
require('dotenv').config();

async function validateAssignmentData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // Test data from the logs
        const testData = {
            matchId: '68ec0b8eb8298e71501e6d48',
            refereeId: '68ec0bc50893790a140483e9',
            playerIds: [
                '68ec0b8db8298e71501e6b86',
                '68ec0b8db8298e71501e6cd3',
                '68ec0b8db8298e71501e6b85',
                '68ec0b8db8298e71501e6cd2',
                '68ec0b8db8298e71501e6b87',
                '68ec0b8db8298e71501e6b88',
                '68ec0b8db8298e71501e6cd4',
                '68ec0b8db8298e71501e6cd6',
                '68ec0b8db8298e71501e6b8a',
                '68ec0b8db8298e71501e6cd7',
                '68ec0b8db8298e71501e6b89',
                '68ec0b8db8298e71501e6b8b',
                '68ec0b8db8298e71501e6cd5',
                '68ec0b8db8298e71501e6cd8'
            ]
        };

        // Validate match exists
        console.log('\n=== VALIDATING MATCH ===');
        const match = await matchesBoys.findById(testData.matchId);
        console.log('Match found:', !!match);
        if (match) {
            console.log('Match details:', {
                college1: match.college1Name,
                college2: match.college2Name,
                status: match.matchStatus
            });
        }

        // Validate referee exists
        console.log('\n=== VALIDATING REFEREE ===');
        const referee = await refreeInfo.findById(testData.refereeId);
        console.log('Referee found:', !!referee);
        if (referee) {
            console.log('Referee details:', {
                name: referee.name,
                email: referee.refEmail
            });
        }

        // Validate players exist
        console.log('\n=== VALIDATING PLAYERS ===');
        const players = await playerInfoId.find({ _id: { $in: testData.playerIds } });
        console.log('Players found:', players.length, 'out of', testData.playerIds.length, 'requested');
        
        if (players.length !== testData.playerIds.length) {
            const foundPlayerIds = players.map(p => p._id.toString());
            const missingPlayerIds = testData.playerIds.filter(id => !foundPlayerIds.includes(id.toString()));
            console.log('MISSING PLAYERS:', missingPlayerIds);
            
            // Check if the missing IDs are valid ObjectIds
            missingPlayerIds.forEach(id => {
                console.log(`ID ${id} is valid ObjectId:`, mongoose.Types.ObjectId.isValid(id));
            });
        } else {
            console.log('All players found successfully!');
            players.forEach(player => {
                console.log(`- ${player.playerName} (${player.email})`);
            });
        }

        // Validate ObjectId formats
        console.log('\n=== VALIDATING OBJECTID FORMATS ===');
        console.log('Match ID valid:', mongoose.Types.ObjectId.isValid(testData.matchId));
        console.log('Referee ID valid:', mongoose.Types.ObjectId.isValid(testData.refereeId));
        testData.playerIds.forEach((id, index) => {
            const isValid = mongoose.Types.ObjectId.isValid(id);
            if (!isValid) {
                console.log(`Player ID ${index + 1} invalid:`, id);
            }
        });

        console.log('\n=== VALIDATION COMPLETE ===');
        
    } catch (error) {
        console.error('Validation error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

validateAssignmentData();