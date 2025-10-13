const { connectDB } = require('./database/db');
const { refreeInfo, matchesBoys, matchesGirls, collegeInfo } = require('./database/schema');

// Sample referee data
const sampleReferees = [
    {
        name: 'John Smith',
        refEmail: 'john.referee@example.com',
        password: 'referee123',
        phone: '9876543210'
    },
    {
        name: 'Sarah Johnson', 
        refEmail: 'sarah.referee@example.com',
        password: 'referee123',
        phone: '9876543211'
    },
    {
        name: 'Mike Wilson',
        refEmail: 'mike.referee@example.com', 
        password: 'referee123',
        phone: '9876543212'
    }
];

// Sample match data with referee assignments
const sampleBoysMatches = [
    {
        college1Name: 'MIT College',
        college2Name: 'Stanford University',
        email1: 'mit.team@example.com',
        email2: 'stanford.team@example.com',
        refreeEmail: 'john.referee@example.com',
        refreeName: 'John Smith',
        matchStatus: 'players_allocated',
        date: '2025-10-14',
        time: '10:00 AM',
        court: 'court_1',
        round: 'quarter-final',
        setStarted: false,
        setInProgress: false,
        completedMatches: 0,
        
        // Player allocations
        match1Singles: {
            player1Name: 'Alex Chen',
            player2Name: 'David Brown',
            player1Email: 'alex.chen@mit.edu',
            player2Email: 'david.brown@stanford.edu'
        },
        match2Singles: {
            player1Name: 'Ryan Kumar',
            player2Name: 'James Wilson',
            player1Email: 'ryan.kumar@mit.edu',
            player2Email: 'james.wilson@stanford.edu'
        },
        match3Doubles: {
            team1Player1Name: 'Alex Chen',
            team1Player2Name: 'Ryan Kumar',
            team2Player1Name: 'David Brown',
            team2Player2Name: 'James Wilson',
            team1Player1Email: 'alex.chen@mit.edu',
            team1Player2Email: 'ryan.kumar@mit.edu',
            team2Player1Email: 'david.brown@stanford.edu',
            team2Player2Email: 'james.wilson@stanford.edu'
        },
        match4Singles: {
            player1Name: 'Sam Patel',
            player2Name: 'Tom Anderson',
            player1Email: 'sam.patel@mit.edu',
            player2Email: 'tom.anderson@stanford.edu'
        },
        match5Doubles: {
            team1Player1Name: 'Sam Patel',
            team1Player2Name: 'Alex Chen',
            team2Player1Name: 'Tom Anderson',
            team2Player2Name: 'David Brown',
            team1Player1Email: 'sam.patel@mit.edu',
            team1Player2Email: 'alex.chen@mit.edu',
            team2Player1Email: 'tom.anderson@stanford.edu',
            team2Player2Email: 'david.brown@stanford.edu'
        }
    },
    {
        college1Name: 'Harvard University',
        college2Name: 'Yale University',
        email1: 'harvard.team@example.com',
        email2: 'yale.team@example.com',
        refreeEmail: 'sarah.referee@example.com',
        refreeName: 'Sarah Johnson',
        matchStatus: 'players_allocated',
        date: '2025-10-14',
        time: '2:00 PM',
        court: 'court_2',
        round: 'quarter-final',
        setStarted: false,
        setInProgress: false,
        completedMatches: 0,
        
        // Player allocations
        match1Singles: {
            player1Name: 'Kevin Lee',
            player2Name: 'Mark Thompson',
            player1Email: 'kevin.lee@harvard.edu',
            player2Email: 'mark.thompson@yale.edu'
        },
        match2Singles: {
            player1Name: 'Chris Martinez',
            player2Name: 'Paul Davis',
            player1Email: 'chris.martinez@harvard.edu',
            player2Email: 'paul.davis@yale.edu'
        },
        match3Doubles: {
            team1Player1Name: 'Kevin Lee',
            team1Player2Name: 'Chris Martinez',
            team2Player1Name: 'Mark Thompson',
            team2Player2Name: 'Paul Davis',
            team1Player1Email: 'kevin.lee@harvard.edu',
            team1Player2Email: 'chris.martinez@harvard.edu',
            team2Player1Email: 'mark.thompson@yale.edu',
            team2Player2Email: 'paul.davis@yale.edu'
        },
        match4Singles: {
            player1Name: 'Nick Garcia',
            player2Name: 'Steve Miller',
            player1Email: 'nick.garcia@harvard.edu',
            player2Email: 'steve.miller@yale.edu'
        },
        match5Doubles: {
            team1Player1Name: 'Nick Garcia',
            team1Player2Name: 'Kevin Lee',
            team2Player1Name: 'Steve Miller',
            team2Player2Name: 'Mark Thompson',
            team1Player1Email: 'nick.garcia@harvard.edu',
            team1Player2Email: 'kevin.lee@harvard.edu',
            team2Player1Email: 'steve.miller@yale.edu',
            team2Player2Email: 'mark.thompson@yale.edu'
        }
    }
];

const sampleGirlsMatches = [
    {
        college1Name: 'Princeton University',
        college2Name: 'Columbia University',
        email1: 'princeton.team@example.com',
        email2: 'columbia.team@example.com',
        refreeEmail: 'mike.referee@example.com',
        refreeName: 'Mike Wilson',
        matchStatus: 'players_allocated',
        date: '2025-10-14',
        time: '11:30 AM',
        court: 'court_3',
        round: 'semi-final',
        setStarted: false,
        setInProgress: false,
        completedMatches: 0,
        
        // Player allocations for girls (3 matches)
        match1Singles: {
            player1Name: 'Emma Watson',
            player2Name: 'Lisa Chang',
            player1Email: 'emma.watson@princeton.edu',
            player2Email: 'lisa.chang@columbia.edu'
        },
        match2Doubles: {
            team1Player1Name: 'Emma Watson',
            team1Player2Name: 'Sophie Turner',
            team2Player1Name: 'Lisa Chang',
            team2Player2Name: 'Anna Kim',
            team1Player1Email: 'emma.watson@princeton.edu',
            team1Player2Email: 'sophie.turner@princeton.edu',
            team2Player1Email: 'lisa.chang@columbia.edu',
            team2Player2Email: 'anna.kim@columbia.edu'
        },
        match3Singles: {
            player1Name: 'Sophie Turner',
            player2Name: 'Anna Kim',
            player1Email: 'sophie.turner@princeton.edu',
            player2Email: 'anna.kim@columbia.edu'
        }
    }
];

async function populateRefereeData() {
    try {
        console.log('Connecting to database...');
        await connectDB();
        
        console.log('Clearing existing referee data...');
        await refreeInfo.deleteMany({});
        await matchesBoys.deleteMany({ refreeEmail: { $exists: true } });
        await matchesGirls.deleteMany({ refreeEmail: { $exists: true } });
        
        console.log('Inserting sample referees...');
        await refreeInfo.insertMany(sampleReferees);
        console.log(`✓ Inserted ${sampleReferees.length} referees`);
        
        console.log('Inserting sample boys matches...');
        await matchesBoys.insertMany(sampleBoysMatches);
        console.log(`✓ Inserted ${sampleBoysMatches.length} boys matches`);
        
        console.log('Inserting sample girls matches...');
        await matchesGirls.insertMany(sampleGirlsMatches);
        console.log(`✓ Inserted ${sampleGirlsMatches.length} girls matches`);
        
        console.log('\n📋 Referee Login Credentials:');
        sampleReferees.forEach(ref => {
            console.log(`Name: ${ref.name}`);
            console.log(`Email: ${ref.refEmail}`);
            console.log(`Password: ${ref.password}`);
            console.log('---');
        });
        
        console.log('\n✅ Referee data populated successfully!');
        console.log('🏸 You can now login as a referee and manage matches.');
        
    } catch (error) {
        console.error('❌ Error populating referee data:', error);
    } finally {
        process.exit(0);
    }
}

// Run the population script
populateRefereeData();