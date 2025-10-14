const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import the database connection and models
const { connectDB } = require('./database/db');
const { collegeInfo } = require('./database/schema');

// Function to parse CSV data
function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Add the last value
        
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index];
            });
            data.push(row);
        }
    }
    
    return data;
}

async function populateColleges() {
    try {
        console.log('🔄 Starting database population...');
        
        // Connect to database
        await connectDB();
        
        console.log('✅ Database connected');
        
        // Clear existing college data
        console.log('🗑️ Clearing existing college data...');
        await collegeInfo.deleteMany({});
        console.log('✅ Existing college data cleared');
        
        // Read CSV file from the Desktop
        const csvFilePath = path.join('C:', 'Users', 'vipul', 'OneDrive', 'Desktop', 'university badminton 2.csv');
        console.log(`📄 Reading CSV file: ${csvFilePath}`);
        
        if (!fs.existsSync(csvFilePath)) {
            throw new Error(`CSV file not found at: ${csvFilePath}`);
        }
        
        const csvData = fs.readFileSync(csvFilePath, 'utf-8');
        
        console.log('📄 Parsing CSV data...');
        const colleges = parseCSV(csvData);
        console.log(`📊 Found ${colleges.length} colleges in CSV`);
        
        // Set the default password (plain text)
        const defaultPassword = '123456';
        console.log('🔐 Using default password: 123456');
        
        // Insert colleges into database
        console.log('💾 Inserting colleges into database...');
        const insertPromises = colleges.map(async (college) => {
            const newCollege = new collegeInfo({
                email: college.email,
                collegeName: college.collegeName,
                managerName: college.managerName,
                phone: parseInt(college.phone) || 0,
                password: defaultPassword,
                matchesBoys: [],
                matchesGirls: [],
                currentRoundBoys: 'round_1',
                currentRoundGirls: 'round_1',
                isMatchAllocateBoys: false,
                isMatchAllocateGirls: false,
                playerInfoIdBoys: [],
                playerInfoIdGirls: []
            });
            
            try {
                await newCollege.save();
                console.log(`✅ Added: ${college.collegeName}`);
            } catch (error) {
                console.error(`❌ Error adding ${college.collegeName}:`, error.message);
            }
        });
        
        await Promise.all(insertPromises);
        
        // Verify the count
        const totalColleges = await collegeInfo.countDocuments();
        console.log(`\n🎉 Successfully populated ${totalColleges} colleges!`);
        console.log('✅ All colleges have been added with:');
        console.log('   - Default password: 123456 (plain text)');
        console.log('   - Current round (Boys): round_1');
        console.log('   - Current round (Girls): round_1');
        console.log('   - Match allocation: false for both boys and girls');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error during population:', error);
        process.exit(1);
    }
}

// Run the population
populateColleges();