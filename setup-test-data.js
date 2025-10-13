const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./database/db');
const { 
    collegeInfo, 
    playerInfoId, 
    matchesBoys, 
    matchesGirls, 
    matches,
    singlesMatch, 
    doublesMatch, 
    set, 
    refreeInfo 
} = require('./database/schema');

async function clearAllData() {
    try {
        console.log('🗑️  Clearing all existing data...');
        
        // Clear all collections
        await collegeInfo.deleteMany({});
        await playerInfoId.deleteMany({});
        await matchesBoys.deleteMany({});
        await matchesGirls.deleteMany({});
        await matches.deleteMany({});
        await singlesMatch.deleteMany({});
        await doublesMatch.deleteMany({});
        await set.deleteMany({});
        await refreeInfo.deleteMany({});
        
        console.log('✅ All data cleared successfully!');
    } catch (error) {
        console.error('❌ Error clearing data:', error);
        throw error;
    }
}

async function createTestColleges() {
    const colleges = [
        {
            collegeName: 'MIT College of Engineering',
            managerName: 'John Smith',
            email: 'mit@college.com',
            phone: 9876543210,
            password: '123456',
            matchesBoys: [],
            matchesGirls: [],
            currentRoundBoys: 'round_1',
            currentRoundGirls: 'round_1',
            isMatchAllocateBoys: false,
            isMatchAllocateGirls: false,
            playerInfoIdBoys: [],
            playerInfoIdGirls: []
        },
        {
            collegeName: 'PCCOE Pune',
            managerName: 'Sarah Johnson',
            email: 'pccoe@college.com',
            phone: 9876543211,
            password: '123456',
            matchesBoys: [],
            matchesGirls: [],
            currentRoundBoys: 'round_1',
            currentRoundGirls: 'round_1',
            isMatchAllocateBoys: false,
            isMatchAllocateGirls: false,
            playerInfoIdBoys: [],
            playerInfoIdGirls: []
        },
        {
            collegeName: 'IIT Bombay',
            managerName: 'Rahul Sharma',
            email: 'iitbombay@college.com',
            phone: 9876543212,
            password: '123456',
            matchesBoys: [],
            matchesGirls: [],
            currentRoundBoys: 'round_1',
            currentRoundGirls: 'round_1',
            isMatchAllocateBoys: false,
            isMatchAllocateGirls: false,
            playerInfoIdBoys: [],
            playerInfoIdGirls: []
        },
        {
            collegeName: 'Pune University',
            managerName: 'Priya Patel',
            email: 'pune@university.com',
            phone: 9876543213,
            password: '123456',
            matchesBoys: [],
            matchesGirls: [],
            currentRoundBoys: 'round_1',
            currentRoundGirls: 'round_1',
            isMatchAllocateBoys: false,
            isMatchAllocateGirls: false,
            playerInfoIdBoys: [],
            playerInfoIdGirls: []
        },
        {
            collegeName: 'Delhi University',
            managerName: 'Amit Kumar',
            email: 'delhi@university.com',
            phone: 9876543214,
            password: '123456',
            matchesBoys: [],
            matchesGirls: [],
            currentRoundBoys: 'round_1',
            currentRoundGirls: 'round_1',
            isMatchAllocateBoys: false,
            isMatchAllocateGirls: false,
            playerInfoIdBoys: [],
            playerInfoIdGirls: []
        },
        {
            collegeName: 'Mumbai University',
            managerName: 'Neha Gupta',
            email: 'mumbai@university.com',
            phone: 9876543215,
            password: '123456',
            matchesBoys: [],
            matchesGirls: [],
            currentRoundBoys: 'round_1',
            currentRoundGirls: 'round_1',
            isMatchAllocateBoys: false,
            isMatchAllocateGirls: false,
            playerInfoIdBoys: [],
            playerInfoIdGirls: []
        }
    ];

    console.log('🏫 Creating test colleges...');
    const createdColleges = await collegeInfo.insertMany(colleges);
    console.log(`✅ Created ${createdColleges.length} colleges`);
    return createdColleges;
}

async function createTestPlayers(colleges) {
    const players = [];
    
    colleges.forEach((college, collegeIndex) => {
        // Create 6 male players per college
        for (let i = 1; i <= 6; i++) {
            players.push({
                playerName: `${college.collegeName.split(' ')[0]} Boy ${i}`,
                email: `boy${i}.${college.collegeName.toLowerCase().replace(/[^a-z]/g, '')}@player.com`,
                gender: 'male',
                phone: `987654${collegeIndex}${i}10`,
                collegeEmail: college.email,
                collegeName: college.collegeName
            });
        }
        
        // Create 4 female players per college
        for (let i = 1; i <= 4; i++) {
            players.push({
                playerName: `${college.collegeName.split(' ')[0]} Girl ${i}`,
                email: `girl${i}.${college.collegeName.toLowerCase().replace(/[^a-z]/g, '')}@player.com`,
                gender: 'female',
                phone: `987654${collegeIndex}${i}20`,
                collegeEmail: college.email,
                collegeName: college.collegeName
            });
        }
    });

    console.log('👥 Creating test players...');
    const createdPlayers = await playerInfoId.insertMany(players);
    console.log(`✅ Created ${createdPlayers.length} players`);
    return createdPlayers;
}

async function createTestReferees() {
    const referees = [
        {
            name: 'Referee John',
            password: '123456',
            refEmail: 'referee1@badminton.com',
            phone: '9876543301'
        },
        {
            name: 'Referee Sarah',
            password: '123456',
            refEmail: 'referee2@badminton.com',
            phone: '9876543302'
        },
        {
            name: 'Referee Mike',
            password: '123456',
            refEmail: 'referee3@badminton.com',
            phone: '9876543303'
        },
        {
            name: 'Referee Lisa',
            password: '123456',
            refEmail: 'referee4@badminton.com',
            phone: '9876543304'
        }
    ];

    console.log('👨‍⚖️ Creating test referees...');
    const createdReferees = await refreeInfo.insertMany(referees);
    console.log(`✅ Created ${createdReferees.length} referees`);
    return createdReferees;
}

async function createTestMatches(colleges, referees, players) {
    console.log('🏸 Creating test matches...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };
    
    const boysMatches = [];
    const girlsMatches = [];
    
    // Create boys matches (using first 4 colleges)
    for (let i = 0; i < 4; i += 2) {
        const college1 = colleges[i];
        const college2 = colleges[i + 1];
        const referee = referees[i / 2];
        
        // Get players for this match
        const college1Boys = players.filter(p => p.gender === 'male' && p.collegeName === college1.collegeName);
        const college2Boys = players.filter(p => p.gender === 'male' && p.collegeName === college2.collegeName);
        
        const boysMatch = {
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
            matchStatus: 'upcoming',
            date: formatDate(i === 0 ? today : tomorrow),
            time: i === 0 ? '14:00' : '16:00',
            court: `court_${i/2 + 1}`,
            round: 'round_1',
            
            // Assign players to matches
            match1Singles: {
                player1Name: college1Boys[0]?.playerName || 'TBD',
                player2Name: college2Boys[0]?.playerName || 'TBD',
                player1Email: college1Boys[0]?.email || '',
                player2Email: college2Boys[0]?.email || ''
            },
            match2Singles: {
                player1Name: college1Boys[1]?.playerName || 'TBD',
                player2Name: college2Boys[1]?.playerName || 'TBD',
                player1Email: college1Boys[1]?.email || '',
                player2Email: college2Boys[1]?.email || ''
            },
            match3Doubles: {
                team1Player1Name: college1Boys[2]?.playerName || 'TBD',
                team1Player2Name: college1Boys[3]?.playerName || 'TBD',
                team2Player1Name: college2Boys[2]?.playerName || 'TBD',
                team2Player2Name: college2Boys[3]?.playerName || 'TBD',
                team1Player1Email: college1Boys[2]?.email || '',
                team1Player2Email: college1Boys[3]?.email || '',
                team2Player1Email: college2Boys[2]?.email || '',
                team2Player2Email: college2Boys[3]?.email || ''
            },
            match4Singles: {
                player1Name: college1Boys[4]?.playerName || 'TBD',
                player2Name: college2Boys[4]?.playerName || 'TBD',
                player1Email: college1Boys[4]?.email || '',
                player2Email: college2Boys[4]?.email || ''
            },
            match5Doubles: {
                team1Player1Name: college1Boys[5]?.playerName || 'TBD',
                team1Player2Name: college1Boys[0]?.playerName || 'TBD', // Reuse first player
                team2Player1Name: college2Boys[5]?.playerName || 'TBD',
                team2Player2Name: college2Boys[0]?.playerName || 'TBD', // Reuse first player
                team1Player1Email: college1Boys[5]?.email || '',
                team1Player2Email: college1Boys[0]?.email || '',
                team2Player1Email: college2Boys[5]?.email || '',
                team2Player2Email: college2Boys[0]?.email || ''
            },
            
            matchResults: [],
            overallWinner: null,
            completedMatches: 0,
            maxPoints: 21,
            numberOfSets: 3,
            courtNumber: i/2 + 1
        };
        
        boysMatches.push(boysMatch);
    }
    
    // Create girls matches
    for (let i = 0; i < 4; i += 2) {
        const college1 = colleges[i];
        const college2 = colleges[i + 1];
        const referee = referees[(i / 2) + 2]; // Use different referees
        
        // Get players for this match
        const college1Girls = players.filter(p => p.gender === 'female' && p.collegeName === college1.collegeName);
        const college2Girls = players.filter(p => p.gender === 'female' && p.collegeName === college2.collegeName);
        
        const girlsMatch = {
            college1Name: college1.collegeName,
            college2Name: college2.collegeName,
            email1: college1.email,
            email2: college2.email,
            winnerEmail: null,
            score: [],
            refreeEmail: referee.refEmail,
            refreeName: referee.name,
            refreeId: [referee._id],
            matchStatus: 'upcoming',
            date: formatDate(i === 0 ? today : tomorrow),
            time: i === 0 ? '15:00' : '17:00',
            court: `court_${i/2 + 3}`,
            round: 'round_1',
            
            // Assign players to matches (3 matches for girls)
            match1Singles: {
                player1Name: college1Girls[0]?.playerName || 'TBD',
                player2Name: college2Girls[0]?.playerName || 'TBD',
                player1Email: college1Girls[0]?.email || '',
                player2Email: college2Girls[0]?.email || ''
            },
            match2Doubles: {
                team1Player1Name: college1Girls[1]?.playerName || 'TBD',
                team1Player2Name: college1Girls[2]?.playerName || 'TBD',
                team2Player1Name: college2Girls[1]?.playerName || 'TBD',
                team2Player2Name: college2Girls[2]?.playerName || 'TBD',
                team1Player1Email: college1Girls[1]?.email || '',
                team1Player2Email: college1Girls[2]?.email || '',
                team2Player1Email: college2Girls[1]?.email || '',
                team2Player2Email: college2Girls[2]?.email || ''
            },
            match3Singles: {
                player1Name: college1Girls[3]?.playerName || 'TBD',
                player2Name: college2Girls[3]?.playerName || 'TBD',
                player1Email: college1Girls[3]?.email || '',
                player2Email: college2Girls[3]?.email || ''
            },
            
            matchResults: [],
            overallWinner: null,
            completedMatches: 0,
            maxPoints: 21,
            numberOfSets: 3,
            courtNumber: i/2 + 3
        };
        
        girlsMatches.push(girlsMatch);
    }
    
    // Insert matches
    const createdBoysMatches = await matchesBoys.insertMany(boysMatches);
    const createdGirlsMatches = await matchesGirls.insertMany(girlsMatches);
    
    console.log(`✅ Created ${createdBoysMatches.length} boys matches`);
    console.log(`✅ Created ${createdGirlsMatches.length} girls matches`);
    
    return { boysMatches: createdBoysMatches, girlsMatches: createdGirlsMatches };
}

async function createAdminAccount() {
    console.log('👨‍💼 Creating admin account for testing...');
    
    // Check if we need to create admin collection/account
    // For now, we'll just log the info since admin might be handled differently
    console.log('ℹ️  Admin login typically uses a separate system');
    console.log('📝 Default admin credentials (if implemented):');
    console.log('   Email: admin@badminton.com');
    console.log('   Password: admin123');
}

async function displayTestCredentials(colleges, referees) {
    console.log('\n' + '='.repeat(50));
    console.log('🎯 TEST CREDENTIALS FOR LOGIN');
    console.log('='.repeat(50));
    
    console.log('\n👨‍⚖️ REFEREE ACCOUNTS:');
    referees.forEach((referee, index) => {
        console.log(`${index + 1}. Name: ${referee.name}`);
        console.log(`   Email: ${referee.refEmail}`);
        console.log(`   Password: 123456`);
        console.log('');
    });
    
    console.log('\n🏫 COLLEGE ACCOUNTS:');
    colleges.forEach((college, index) => {
        console.log(`${index + 1}. College: ${college.collegeName}`);
        console.log(`   Manager: ${college.managerName}`);
        console.log(`   Email: ${college.email}`);
        console.log(`   Password: 123456`);
        console.log('');
    });
    
    console.log('\n👨‍💼 ADMIN ACCOUNT:');
    console.log('   Email: admin@badminton.com');
    console.log('   Password: admin123');
    console.log('');
    
    console.log('='.repeat(50));
    console.log('🚀 ALL TEST DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(50));
}

async function main() {
    try {
        // Connect to database
        await connectDB();
        console.log('📡 Connected to database');
        
        // Clear all existing data
        await clearAllData();
        
        // Create fresh test data
        const colleges = await createTestColleges();
        const players = await createTestPlayers(colleges);
        const referees = await createTestReferees();
        const matches = await createTestMatches(colleges, referees, players);
        await createAdminAccount();
        
        // Display credentials
        await displayTestCredentials(colleges, referees);
        
    } catch (error) {
        console.error('❌ Error setting up test data:', error);
    } finally {
        // Close database connection
        mongoose.connection.close();
        console.log('📡 Database connection closed');
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main };