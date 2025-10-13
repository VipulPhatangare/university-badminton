const mongoose = require('mongoose');
const { collegeInfo } = require('./database/schema.js');

async function testCreate() {
    try {
        await mongoose.connect('mongodb://localhost:27017/university-badminton');
        console.log('Connected to MongoDB');
        
        // Create a test college
        const testCollege = new collegeInfo({
            collegeName: "Test College",
            managerName: "Test Manager",
            email: "test@test.com",
            phone: 1234567890,
            password: "test123",
            matchesBoys: [],
            matchesGirls: [],
            currentRoundBoys: "round_1",
            currentRoundGirls: "not_participating",
            isMatchAllocateBoys: false,
            isMatchAllocateGirls: false,
            playerInfoIdBoys: [],
            playerInfoIdGirls: []
        });
        
        const saved = await testCollege.save();
        console.log('Test college created:', saved.collegeName);
        
        // Check if it's there
        const found = await collegeInfo.findOne({ collegeName: "Test College" });
        console.log('Test college found:', found ? found.collegeName : 'Not found');
        
        // Count all colleges
        const count = await collegeInfo.countDocuments();
        console.log('Total colleges in database:', count);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testCreate();