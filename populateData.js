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

const rounds = ["round_1"]; // Only round 1 matches

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
        
        // Add your specific referee first
        const vipulReferee = new refreeInfo({
            name: "Vipul Phatangare",
            password: generatePassword(),
            refEmail: "vipulphatangare3@gmail.com",
            phone: generatePhone().toString()
        });
        referees.push(vipulReferee);
        
        // Create other referees (only 4 more to make total 5)
        for (let i = 1; i <= 4; i++) {
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
        console.log(`Created ${referees.length} referees (including vipulphatangare3@gmail.com)`);

        // Create colleges with players
        console.log('Creating colleges and players...');
        const colleges = [];
        const allPlayers = [];

        for (let i = 0; i < 50; i++) {
            const collegeName = collegeNames[i];
            const managerName = `Manager ${i + 1}`;
            const managerEmail = generateEmail(managerName, collegeName);
            
            // Create boys players for this college (boys only tournament)
            const boysPlayers = [];
            const selectedBoyNames = getRandomElements(boyNames, 7); // Get 7 players per college
            
            for (let j = 0; j < 7; j++) {
                const player = new playerInfoId({
                    playerName: selectedBoyNames[j],
                    email: generateEmail(selectedBoyNames[j], collegeName),
                    gender: "male",
                    phone: generatePhone().toString(),
                    collegeEmail: managerEmail,
                    collegeName: collegeName
                });
                boysPlayers.push(player);
                allPlayers.push(player);
            }

            // Save players to get their IDs
            const savedBoysPlayers = await playerInfoId.insertMany(boysPlayers);

            // All colleges are in round_1 only
            let currentRoundBoys = "round_1";

            // Create college (boys only tournament)
            const college = new collegeInfo({
                collegeName: collegeName,
                managerName: managerName,
                email: managerEmail,
                phone: generatePhone(),
                password: generatePassword(),
                matchesBoys: [], // Will be populated when matches are created
                matchesGirls: [], // Not used in boys-only tournament
                currentRoundBoys: currentRoundBoys,
                currentRoundGirls: "not_participating", // Not participating in girls tournament
                isMatchAllocateBoys: Math.random() > 0.7, // 30% chance of having match allocated
                isMatchAllocateGirls: false, // Not participating in girls tournament
                playerInfoIdBoys: savedBoysPlayers.map(p => p._id),
                playerInfoIdGirls: [] // No girls players
            });

            colleges.push(college);
        }

        await collegeInfo.insertMany(colleges);
        console.log(`Created ${colleges.length} colleges with players`);

        // Create tournament matches with different rounds
        console.log('Creating tournament matches with different rounds...');
        const savedColleges = await collegeInfo.find({});
        const savedReferees = await refreeInfo.find({});
        
        const tournamentRounds = [
            { round: 'round_1', matches: 8 },      // 8 matches in round 1
            { round: 'round_2', matches: 4 },      // 4 matches in round 2  
            { round: 'quarter_final', matches: 2 }, // 2 quarter final matches
            { round: 'semi_final', matches: 1 },    // 1 semi final match
            { round: 'final', matches: 1 }          // 1 final match
        ];
        
        const matches = [];
        let matchCounter = 1;
        
        for (const roundInfo of tournamentRounds) {
            console.log(`Creating ${roundInfo.matches} matches for ${roundInfo.round}...`);
            
            for (let i = 0; i < roundInfo.matches; i++) {
                const college1 = getRandomElement(savedColleges);
                let college2 = getRandomElement(savedColleges.filter(c => c._id.toString() !== college1._id.toString()));
                
                // Ensure we have a second college
                if (!college2) {
                    college2 = savedColleges.find(c => c._id.toString() !== college1._id.toString());
                }
                
                const referee = getRandomElement(savedReferees);
                
                const match = new matchesBoys({
                    college1Name: college1.collegeName,
                    college2Name: college2.collegeName,
                    email1: college1.email,
                    email2: college2.email,
                    singlesMatchId: [],
                    doublesMatchId: [],
                    winnerEmail: null,
                    score: [],
                    refreeEmail: referee.refEmail,
                    refreeName: referee.name,
                    refreeId: [referee._id],
                    matchStatus: "upcoming",
                    date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    time: `${Math.floor(Math.random() * 12) + 8}:${Math.random() > 0.5 ? '00' : '30'}`,
                    court: `court_${Math.floor(Math.random() * 4) + 1}`,
                    round: roundInfo.round, // Different rounds for tournament format
                    completedMatches: 0,
                    overallWinner: null,
                    isBye: false,
                    // Tournament format fields based on round
                    matchFormat: (roundInfo.round === 'semi_final' || roundInfo.round === 'final') ? 'best_of_5' : 'best_of_3',
                    requiredWins: (roundInfo.round === 'semi_final' || roundInfo.round === 'final') ? 3 : 2,
                    totalMatches: (roundInfo.round === 'semi_final' || roundInfo.round === 'final') ? 5 : 3
                });

                matches.push(match);
                matchCounter++;
            }
        }

        await matchesBoys.insertMany(matches);
        console.log(`Created ${matches.length} sample matches`);

        // Create some sample singles matches
        console.log('Creating sample singles and doubles matches...');
        const savedMatches = await matchesBoys.find({});
        
        for (const match of savedMatches.slice(0, 5)) { // Create detailed matches for first 5
            // Skip bye matches for detailed match creation
            if (match.isBye) {
                continue;
            }
            
            const college1 = savedColleges.find(c => c.email === match.email1);
            const college2 = savedColleges.find(c => c.email === match.email2);
            
            if (!college1 || !college2) {
                console.log('Skipping match due to missing college data');
                continue;
            }
            
            const college1Players = await playerInfoId.find({ _id: { $in: college1.playerInfoIdBoys } });
            const college2Players = await playerInfoId.find({ _id: { $in: college2.playerInfoIdBoys } });
            
            // Update match with individual match data (5-match boys format) - all upcoming
            const updateData = {
                match1Singles: {
                    player1Name: college1Players[0]?.playerName || 'TBD',
                    player2Name: college2Players[0]?.playerName || 'TBD',
                    player1Email: college1Players[0]?.email || '',
                    player2Email: college2Players[0]?.email || '',
                    isCompleted: false, // All matches are not completed yet
                    winnerTeam: null, // No winner for upcoming matches
                    matchSettings: {
                        maxPoints: 21,
                        numberOfSets: 3,
                        courtNumber: Math.floor(Math.random() * 4) + 1
                    }
                },
                match2Singles: {
                    player1Name: college1Players[1]?.playerName || 'TBD',
                    player2Name: college2Players[1]?.playerName || 'TBD',
                    player1Email: college1Players[1]?.email || '',
                    player2Email: college2Players[1]?.email || '',
                    isCompleted: false, // All matches are not completed yet
                    winnerTeam: null, // No winner for upcoming matches
                    matchSettings: {
                        maxPoints: 21,
                        numberOfSets: 3,
                        courtNumber: Math.floor(Math.random() * 4) + 1
                    }
                },
                match3Doubles: {
                    team1Player1Name: college1Players[2]?.playerName || 'TBD',
                    team1Player2Name: college1Players[3]?.playerName || 'TBD',
                    team2Player1Name: college2Players[2]?.playerName || 'TBD',
                    team2Player2Name: college2Players[3]?.playerName || 'TBD',
                    team1Player1Email: college1Players[2]?.email || '',
                    team1Player2Email: college1Players[3]?.email || '',
                    team2Player1Email: college2Players[2]?.email || '',
                    team2Player2Email: college2Players[3]?.email || '',
                    isCompleted: false, // All matches are not completed yet
                    winnerTeam: null, // No winner for upcoming matches
                    matchSettings: {
                        maxPoints: 21,
                        numberOfSets: 3,
                        courtNumber: Math.floor(Math.random() * 4) + 1
                    }
                },
                match4Singles: {
                    player1Name: college1Players[4]?.playerName || 'TBD',
                    player2Name: college2Players[4]?.playerName || 'TBD',
                    player1Email: college1Players[4]?.email || '',
                    player2Email: college2Players[4]?.email || '',
                    isCompleted: false, // All matches are not completed yet
                    winnerTeam: null, // No winner for upcoming matches
                    matchSettings: {
                        maxPoints: 21,
                        numberOfSets: 3,
                        courtNumber: Math.floor(Math.random() * 4) + 1
                    }
                },
                match5Doubles: {
                    team1Player1Name: college1Players[5]?.playerName || 'TBD',
                    team1Player2Name: college1Players[6]?.playerName || 'TBD',
                    team2Player1Name: college2Players[5]?.playerName || 'TBD',
                    team2Player2Name: college2Players[6]?.playerName || 'TBD',
                    team1Player1Email: college1Players[5]?.email || '',
                    team1Player2Email: college1Players[6]?.email || '',
                    team2Player1Email: college2Players[5]?.email || '',
                    team2Player2Email: college2Players[6]?.email || '',
                    isCompleted: false, // All matches are not completed yet
                    winnerTeam: null, // No winner for upcoming matches
                    matchSettings: {
                        maxPoints: 21,
                        numberOfSets: 3,
                        courtNumber: Math.floor(Math.random() * 4) + 1
                    }
                }
            };
            
            // Set completed matches count to 0 for upcoming matches
            updateData.completedMatches = 0;
            
            // No overall winner for upcoming matches
            updateData.overallWinner = null;
            
            await matchesBoys.findByIdAndUpdate(match._id, updateData);

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
                    singlesMatchStatus: "upcoming", // Only upcoming matches
                    numberOfSet: Math.random() > 0.5 ? 2 : 3,
                    maxSetPoint: 21,
                    singlesMatchWinnerEmail: null, // No winner for upcoming matches
                    singlesMatchWinnerName: null, // No winner for upcoming matches
                    isMatchComplete: false, // Not complete for upcoming matches
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
                    singlesMatchStatus: "upcoming", // Only upcoming matches
                    numberOfSet: Math.random() > 0.5 ? 2 : 3,
                    maxSetPoint: 21,
                    doublesMatchWinnerEmail: null, // No winner for upcoming matches
                    doublesMatchWinnerName1: null, // No winner for upcoming matches
                    doublesMatchWinnerName2: null, // No winner for upcoming matches
                    isMatchComplete: false, // Not complete for upcoming matches
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
        console.log(`Players: ${playerCount} (Boys: ${playerCount}, Girls: 0) - Boys only tournament`);
        console.log(`Main Matches: ${matchCount}`);
        console.log(`Singles Matches: ${singlesMatchCount}`);
        console.log(`Doubles Matches: ${doublesMatchCount}`);
        console.log(`Referees: ${refereeCount}`);

        console.log('\n=== TOURNAMENT MATCHES BY ROUND ===');
        const matchRoundStats = await matchesBoys.aggregate([
            {
                $group: {
                    _id: "$round",
                    count: { $sum: 1 },
                    format: { $first: "$matchFormat" },
                    requiredWins: { $first: "$requiredWins" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
        
        matchRoundStats.forEach(stat => {
            const formatInfo = stat.format ? `(${stat.format.replace('_', ' ')}, need ${stat.requiredWins} wins)` : '';
            console.log(`${stat._id.toUpperCase()}: ${stat.count} matches ${formatInfo}`);
        });

        console.log('\n=== COLLEGE ROUND DISTRIBUTION ===');
        const collegeRoundStats = await collegeInfo.aggregate([
            {
                $group: {
                    _id: "$currentRoundBoys",
                    count: { $sum: 1 }
                }
            }
        ]);
        collegeRoundStats.forEach(stat => {
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