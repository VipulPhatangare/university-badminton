const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./database/db');
const {
    collegeInfo,
    playerInfoId,
    matchesBoys,
    singlesMatch,
    doublesMatch,
    set,
    refreeInfo
} = require('./database/schema');

// Sample data arrays
const collegeNames = [
    "MIT College of Engineering", "Delhi University", "Mumbai University", "IIT Bombay", "IIT Delhi",
    "Pune University", "Chennai University", "Bangalore University", "Hyderabad University", "Kolkata University",
    "Ahmedabad University", "Jaipur University", "Lucknow University", "Chandigarh University", "Goa University",
    "Bhopal University", "Indore University", "Nagpur University", "Patna University", "Ranchi University",
    "Guwahati University", "Shimla University", "Dehradun University", "Jammu University", "Srinagar University",
    "Thiruvananthapuram University", "Kochi University", "Coimbatore University", "Madurai University", "Salem University",
    "Vijayawada University", "Visakhapatnam University", "Warangal University", "Mysore University", "Mangalore University",
    "Hubli University", "Belgaum University", "Gulbarga University", "Bijapur University", "Davangere University",
    "Shimoga University", "Udupi University", "Tumkur University", "Chitradurga University", "Hassan University",
    "Mandya University", "Chamarajanagar University", "Kodagu University", "Chikmagalur University", "Ballari University"
];

const boyNames = [
    "Arjun Sharma", "Rohit Kumar", "Vikash Singh", "Ankit Gupta", "Raj Patel", "Amit Verma", "Suresh Yadav",
    "Deepak Joshi", "Rahul Agarwal", "Nikhil Tiwari", "Pradeep Kumar", "Ashish Mishra", "Manoj Singh", "Ravi Sharma",
    "Sanjay Gupta", "Vinay Kumar", "Ajay Singh", "Kiran Patel", "Harsh Vardhan", "Akash Agrawal", "Gaurav Sharma",
    "Vivek Kumar", "Sachin Singh", "Naveen Gupta", "Rakesh Yadav", "Mahesh Kumar", "Yogesh Singh", "Ramesh Patel"
];

const girlNames = [
    "Priya Sharma", "Anjali Kumar", "Sneha Singh", "Pooja Gupta", "Kavya Patel", "Riya Verma", "Neha Yadav",
    "Shruti Joshi", "Nikita Agarwal", "Swati Tiwari", "Megha Kumar", "Divya Mishra", "Sakshi Singh", "Aarti Sharma",
    "Manisha Gupta", "Preeti Kumar", "Shweta Singh", "Komal Patel", "Isha Vardhan", "Nisha Agrawal", "Simran Sharma",
    "Ritika Kumar", "Deepika Singh", "Prachi Gupta", "Vaishali Yadav", "Rashmi Kumar", "Sapna Singh", "Sunita Patel"
];

const rounds = ["round_1", "round_2", "quarter", "semi", "final"];

// Generate random phone number
function generatePhone() {
    return Math.floor(6000000000 + Math.random() * 4000000000);
}

// Generate random email
function generateEmail(name, collegeName) {
    const cleanName = name.toLowerCase().replace(/\s+/g, '.');
    const cleanCollege = collegeName.toLowerCase().replace(/\s+/g, '').replace(/university|college/gi, '');
    return `${cleanName}@${cleanCollege}.edu.in`;
}

// Generate password (set to 123456 for all)
function generatePassword() {
    return "123456";
}

// Function to get random element from array
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Function to get random elements from array
function getRandomElements(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

async function populateDatabase() {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Clear existing data
        console.log('Clearing existing data...');
        await collegeInfo.deleteMany({});
        await playerInfoId.deleteMany({});
        await matchesBoys.deleteMany({});
        await singlesMatch.deleteMany({});
        await doublesMatch.deleteMany({});
        await set.deleteMany({});
        await refreeInfo.deleteMany({});
        console.log('Existing data cleared');

        // Create referees first
        console.log('Creating referees...');
        const referees = [];
        for (let i = 1; i <= 20; i++) {
            const refereeName = `Referee ${i}`;
            const referee = new refreeInfo({
                name: refereeName,
                password: generatePassword(),
                refEmail: `referee${i}@badminton.com`,
                phone: generatePhone().toString()
            });
            referees.push(referee);
        }
        await refreeInfo.insertMany(referees);
        console.log(`Created ${referees.length} referees`);

        // Create colleges with players
        console.log('Creating colleges and players...');
        const colleges = [];
        const allPlayers = [];

        for (let i = 0; i < 50; i++) {
            const collegeName = collegeNames[i];
            const managerName = `Manager ${i + 1}`;
            const managerEmail = generateEmail(managerName, collegeName);
            
            // Create boys players for this college
            const boysPlayers = [];
            const selectedBoyNames = getRandomElements(boyNames, 7);
            
            for (let j = 0; j < 7; j++) {
                const player = new playerInfoId({
                    playerName: selectedBoyNames[j],
                    email: generateEmail(selectedBoyNames[j], collegeName),
                    gender: "male",
                    phone: generatePhone().toString()
                });
                boysPlayers.push(player);
                allPlayers.push(player);
            }

            // Create girls players for this college
            const girlsPlayers = [];
            const selectedGirlNames = getRandomElements(girlNames, 5);
            
            for (let k = 0; k < 5; k++) {
                const player = new playerInfoId({
                    playerName: selectedGirlNames[k],
                    email: generateEmail(selectedGirlNames[k], collegeName),
                    gender: "female",
                    phone: generatePhone().toString()
                });
                girlsPlayers.push(player);
                allPlayers.push(player);
            }

            // Save players to get their IDs
            const savedBoysPlayers = await playerInfoId.insertMany(boysPlayers);
            const savedGirlsPlayers = await playerInfoId.insertMany(girlsPlayers);

            // Determine current round (most colleges in round_1, some in advanced rounds)
            let currentRoundBoys, currentRoundGirls;
            if (i < 40) {
                // 40 colleges in round_1
                currentRoundBoys = "round_1";
                currentRoundGirls = "round_1";
            } else if (i < 45) {
                // 5 colleges in round_2
                currentRoundBoys = "round_2";
                currentRoundGirls = "round_2";
            } else if (i < 48) {
                // 3 colleges in quarter
                currentRoundBoys = "quarter";
                currentRoundGirls = "quarter";
            } else if (i < 49) {
                // 1 college in semi
                currentRoundBoys = "semi";
                currentRoundGirls = "semi";
            } else {
                // 1 college in final
                currentRoundBoys = "final";
                currentRoundGirls = "final";
            }

            // Create college
            const college = new collegeInfo({
                collegeName: collegeName,
                managerName: managerName,
                email: managerEmail,
                phone: generatePhone(),
                password: generatePassword(),
                matchesBoys: [], // Will be populated when matches are created
                matchesGirls: [], // Will be populated when matches are created
                currentRoundBoys: currentRoundBoys,
                currentRoundGirls: currentRoundGirls,
                isMatchAllocateBoys: Math.random() > 0.7, // 30% chance of having match allocated
                isMatchAllocateGirls: Math.random() > 0.7, // 30% chance of having match allocated
                playerInfoIdBoys: savedBoysPlayers.map(p => p._id),
                playerInfoIdGirls: savedGirlsPlayers.map(p => p._id)
            });

            colleges.push(college);
        }

        await collegeInfo.insertMany(colleges);
        console.log(`Created ${colleges.length} colleges with players`);

        // Create some sample matches
        console.log('Creating sample matches...');
        const savedColleges = await collegeInfo.find({});
        const savedReferees = await refreeInfo.find({});
        
        // Create 10 sample matches
        const matches = [];
        for (let i = 0; i < 10; i++) {
            const college1 = getRandomElement(savedColleges);
            const college2 = getRandomElement(savedColleges.filter(c => c._id !== college1._id));
            const referee = getRandomElement(savedReferees);

            const match = new matchesBoys({
                college1Name: college1.collegeName,
                college2Name: college2.collegeName,
                email1: college1.email,
                email2: college2.email,
                singlesMatchId: [], // Will be populated with singles matches
                doublesMatchId: [], // Will be populated with doubles matches
                winnerEmail: Math.random() > 0.5 ? college1.email : college2.email,
                score: [],
                refreeEmail: referee.refEmail,
                refreeName: referee.name,
                matchStatus: getRandomElement(["complete", "live", "upcoming"]),
                date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date in next 30 days
                time: `${Math.floor(Math.random() * 12) + 8}:${Math.random() > 0.5 ? '00' : '30'}`
            });

            matches.push(match);
        }

        await matchesBoys.insertMany(matches);
        console.log(`Created ${matches.length} sample matches`);

        // Create some sample singles matches
        console.log('Creating sample singles and doubles matches...');
        const savedMatches = await matchesBoys.find({});
        
        for (const match of savedMatches.slice(0, 5)) { // Create detailed matches for first 5
            const college1 = savedColleges.find(c => c.email === match.email1);
            const college2 = savedColleges.find(c => c.email === match.email2);
            
            const college1Players = await playerInfoId.find({ _id: { $in: college1.playerInfoIdBoys } });
            const college2Players = await playerInfoId.find({ _id: { $in: college2.playerInfoIdBoys } });

            // Create 3 singles matches
            const singlesMatches = [];
            for (let i = 1; i <= 3; i++) {
                const player1 = getRandomElement(college1Players);
                const player2 = getRandomElement(college2Players);
                
                const singleMatch = new singlesMatch({
                    matchNumber: i,
                    email1: player1.email,
                    email2: player2.email,
                    player1Name: player1.playerName,
                    player2Name: player2.playerName,
                    singlesMatchStatus: getRandomElement(["complete", "live", "upcoming"]),
                    numberOfSet: Math.random() > 0.5 ? 2 : 3,
                    maxSetPoint: 21,
                    singlesMatchWinnerEmail: Math.random() > 0.5 ? player1.email : player2.email,
                    singlesMatchWinnerName: Math.random() > 0.5 ? player1.playerName : player2.playerName,
                    isMatchComplete: Math.random() > 0.3,
                    court: `court_${Math.floor(Math.random() * 4) + 1}`,
                    sets: []
                });

                singlesMatches.push(singleMatch);
            }

            // Create 2 doubles matches
            const doublesMatches = [];
            for (let i = 1; i <= 2; i++) {
                const team1Players = getRandomElements(college1Players, 2);
                const team2Players = getRandomElements(college2Players, 2);
                
                const doublesMatchData = new doublesMatch({
                    matchNumber: i,
                    email1: college1.email,
                    email2: college2.email,
                    team1Player1Name: team1Players[0].playerName,
                    team1Player2Name: team1Players[1].playerName,
                    team2Player1Name: team2Players[0].playerName,
                    team2Player2Name: team2Players[1].playerName,
                    singlesMatchStatus: getRandomElement(["complete", "live", "upcoming"]),
                    numberOfSet: Math.random() > 0.5 ? 2 : 3,
                    maxSetPoint: 21,
                    doublesMatchWinnerEmail: Math.random() > 0.5 ? college1.email : college2.email,
                    doublesMatchWinnerName1: Math.random() > 0.5 ? team1Players[0].playerName : team2Players[0].playerName,
                    doublesMatchWinnerName2: Math.random() > 0.5 ? team1Players[1].playerName : team2Players[1].playerName,
                    isMatchComplete: Math.random() > 0.3,
                    court: `court_${Math.floor(Math.random() * 4) + 1}`,
                    sets: []
                });

                doublesMatches.push(doublesMatchData);
            }

            await singlesMatch.insertMany(singlesMatches);
            await doublesMatch.insertMany(doublesMatches);
        }

        console.log('Database population completed successfully!');
        
        // Display statistics
        const collegeCount = await collegeInfo.countDocuments();
        const playerCount = await playerInfoId.countDocuments();
        const matchCount = await matchesBoys.countDocuments();
        const singlesMatchCount = await singlesMatch.countDocuments();
        const doublesMatchCount = await doublesMatch.countDocuments();
        const refereeCount = await refreeInfo.countDocuments();

        console.log('\n=== DATABASE STATISTICS ===');
        console.log(`Colleges: ${collegeCount}`);
        console.log(`Players: ${playerCount} (Boys: ${playerCount - (collegeCount * 5)}, Girls: ${collegeCount * 5})`);
        console.log(`Main Matches: ${matchCount}`);
        console.log(`Singles Matches: ${singlesMatchCount}`);
        console.log(`Doubles Matches: ${doublesMatchCount}`);
        console.log(`Referees: ${refereeCount}`);

        console.log('\n=== ROUND DISTRIBUTION ===');
        const roundStats = await collegeInfo.aggregate([
            {
                $group: {
                    _id: "$currentRoundBoys",
                    count: { $sum: 1 }
                }
            }
        ]);
        roundStats.forEach(stat => {
            console.log(`${stat._id}: ${stat.count} colleges`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error populating database:', error);
        process.exit(1);
    }
}

// Run the population script
populateDatabase();