const mongoose = require('mongoose');
const { matchesBoys, matchesGirls, refreeInfo } = require('./database/schema');

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/university-badminton');
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};

// Sample referee data
const refereeData = [
    {
        refreeName: 'John Smith',
        email: 'referee1@example.com',
        phone: '9876543210',
        password: 'password123',
        experience: 5,
        certificationLevel: 'Level 3',
        isActive: true
    },
    {
        refreeName: 'Sarah Johnson',
        email: 'referee2@example.com', 
        phone: '9876543211',
        password: 'password123',
        experience: 3,
        certificationLevel: 'Level 2',
        isActive: true
    },
    {
        refreeName: 'Mike Wilson',
        email: 'referee3@example.com',
        phone: '9876543212', 
        password: 'password123',
        experience: 7,
        certificationLevel: 'Level 4',
        isActive: true
    }
];

// Sample boys match data
const boysMatchData = [
    {
        college1Name: 'Pimpri Chinchwad College of Engineering',
        college2Name: 'MIT World Peace University',
        email1: 'pccoer@college.edu',
        email2: 'mitwpu@college.edu',
        refreeEmail: 'referee1@example.com',
        refreeName: 'John Smith',
        matchStatus: 'upcoming',
        date: '2024-12-20',
        time: '10:00 AM',
        court: 'Court 1',
        round: 'Quarter Final',
        
        // Initialize match structure
        match1Singles: {
            player1Name: 'Rahul Sharma',
            player2Name: 'Amit Patel',
            player1Email: 'rahul@pccoer.edu',
            player2Email: 'amit@mitwpu.edu'
        },
        match2Singles: {
            player1Name: 'Vikram Singh',
            player2Name: 'Suresh Kumar',
            player1Email: 'vikram@pccoer.edu',
            player2Email: 'suresh@mitwpu.edu'
        },
        match3Doubles: {
            team1Player1Name: 'Rohan Gupta',
            team1Player2Name: 'Arjun Mehta',
            team2Player1Name: 'Kiran Joshi',
            team2Player2Name: 'Deepak Rao',
            team1Player1Email: 'rohan@pccoer.edu',
            team1Player2Email: 'arjun@pccoer.edu',
            team2Player1Email: 'kiran@mitwpu.edu',
            team2Player2Email: 'deepak@mitwpu.edu'
        },
        match4Singles: {
            player1Name: 'Sanjay Verma',
            player2Name: 'Rajesh Nair',
            player1Email: 'sanjay@pccoer.edu',
            player2Email: 'rajesh@mitwpu.edu'
        },
        match5Doubles: {
            team1Player1Name: 'Manish Agarwal',
            team1Player2Name: 'Pradeep Kumar',
            team2Player1Name: 'Ravi Shankar',
            team2Player2Name: 'Manoj Tiwari',
            team1Player1Email: 'manish@pccoer.edu',
            team1Player2Email: 'pradeep@pccoer.edu',
            team2Player1Email: 'ravi@mitwpu.edu',
            team2Player2Email: 'manoj@mitwpu.edu'
        },
        
        completedMatches: 0,
        setStarted: false,
        setInProgress: false
    },
    {
        college1Name: 'COEP Technological University',
        college2Name: 'Pune Institute of Computer Technology',
        email1: 'coep@college.edu',
        email2: 'pict@college.edu',
        refreeEmail: 'referee2@example.com',
        refreeName: 'Sarah Johnson',
        matchStatus: 'live',
        date: '2024-12-20',
        time: '2:00 PM',
        court: 'Court 2',
        round: 'Semi Final',
        
        match1Singles: {
            player1Name: 'Aditya Bhosale',
            player2Name: 'Chinmay Deshpande',
            player1Email: 'aditya@coep.edu',
            player2Email: 'chinmay@pict.edu'
        },
        match2Singles: {
            player1Name: 'Omkar Patil',
            player2Name: 'Siddharth More',
            player1Email: 'omkar@coep.edu',
            player2Email: 'siddharth@pict.edu'
        },
        match3Doubles: {
            team1Player1Name: 'Aniket Jain',
            team1Player2Name: 'Kunal Desai',
            team2Player1Name: 'Harsh Kulkarni',
            team2Player2Name: 'Yash Pawar',
            team1Player1Email: 'aniket@coep.edu',
            team1Player2Email: 'kunal@coep.edu',
            team2Player1Email: 'harsh@pict.edu',
            team2Player2Email: 'yash@pict.edu'
        },
        match4Singles: {
            player1Name: 'Rohit Gadgil',
            player2Name: 'Akshay Bhosle',
            player1Email: 'rohit@coep.edu',
            player2Email: 'akshay@pict.edu'
        },
        match5Doubles: {
            team1Player1Name: 'Pranav Chavan',
            team1Player2Name: 'Nikhil Sawant',
            team2Player1Name: 'Vaibhav Joshi',
            team2Player2Name: 'Sachin Kamble',
            team1Player1Email: 'pranav@coep.edu',
            team1Player2Email: 'nikhil@coep.edu',
            team2Player1Email: 'vaibhav@pict.edu',
            team2Player2Email: 'sachin@pict.edu'
        },
        
        completedMatches: 0,
        setStarted: true,
        setInProgress: true,
        setStartedAt: new Date()
    }
];

// Sample girls match data
const girlsMatchData = [
    {
        college1Name: 'Pimpri Chinchwad College of Engineering',
        college2Name: 'MIT World Peace University',
        email1: 'pccoer@college.edu',
        email2: 'mitwpu@college.edu',
        refreeEmail: 'referee3@example.com',
        refreeName: 'Mike Wilson',
        matchStatus: 'upcoming',
        date: '2024-12-21',
        time: '11:00 AM',
        court: 'Court 3',
        round: 'Final',
        
        match1Singles: {
            player1Name: 'Priya Sharma',
            player2Name: 'Sneha Patel',
            player1Email: 'priya@pccoer.edu',
            player2Email: 'sneha@mitwpu.edu'
        },
        match2Doubles: {
            team1Player1Name: 'Kavya Singh',
            team1Player2Name: 'Anjali Mehta',
            team2Player1Name: 'Pooja Joshi',
            team2Player2Name: 'Ritu Rao',
            team1Player1Email: 'kavya@pccoer.edu',
            team1Player2Email: 'anjali@pccoer.edu',
            team2Player1Email: 'pooja@mitwpu.edu',
            team2Player2Email: 'ritu@mitwpu.edu'
        },
        match3Singles: {
            player1Name: 'Meera Verma',
            player2Name: 'Nisha Nair',
            player1Email: 'meera@pccoer.edu',
            player2Email: 'nisha@mitwpu.edu'
        },
        
        completedMatches: 0,
        setStarted: false,
        setInProgress: false
    },
    {
        college1Name: 'COEP Technological University',
        college2Name: 'Pune Institute of Computer Technology',
        email1: 'coep@college.edu',
        email2: 'pict@college.edu',
        refreeEmail: 'referee1@example.com',
        refreeName: 'John Smith',
        matchStatus: 'completed',
        date: '2024-12-19',
        time: '3:00 PM',
        court: 'Court 1',
        round: 'Semi Final',
        
        match1Singles: {
            player1Name: 'Aditi Bhosale',
            player2Name: 'Shruti Deshpande',
            player1Email: 'aditi@coep.edu',
            player2Email: 'shruti@pict.edu',
            isCompleted: true,
            winnerTeam: 'team1',
            winnerEmail: 'aditi@coep.edu'
        },
        match2Doubles: {
            team1Player1Name: 'Sakshi Patil',
            team1Player2Name: 'Manasi More',
            team2Player1Name: 'Shweta Kulkarni',
            team2Player2Name: 'Pallavi Pawar',
            team1Player1Email: 'sakshi@coep.edu',
            team1Player2Email: 'manasi@coep.edu',
            team2Player1Email: 'shweta@pict.edu',
            team2Player2Email: 'pallavi@pict.edu',
            isCompleted: true,
            winnerTeam: 'team2',
            winnerEmail: 'shweta@pict.edu'
        },
        match3Singles: {
            player1Name: 'Tejashree Gadgil',
            player2Name: 'Aparna Bhosle',
            player1Email: 'tejashree@coep.edu',
            player2Email: 'aparna@pict.edu',
            isCompleted: true,
            winnerTeam: 'team1',
            winnerEmail: 'tejashree@coep.edu'
        },
        
        completedMatches: 3,
        overallWinner: 'team1',
        setStarted: true,
        setInProgress: false,
        setStartedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        
        // Add completed scorecard
        scorecard: {
            sets: [
                {
                    setNumber: 1,
                    player1Score: 21,
                    player2Score: 18,
                    completed: true,
                    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    completedAt: new Date(Date.now() - 90 * 60 * 1000),
                    lastUpdated: new Date(Date.now() - 90 * 60 * 1000)
                },
                {
                    setNumber: 2,
                    player1Score: 19,
                    player2Score: 21,
                    completed: true,
                    startedAt: new Date(Date.now() - 90 * 60 * 1000),
                    completedAt: new Date(Date.now() - 60 * 60 * 1000),
                    lastUpdated: new Date(Date.now() - 60 * 60 * 1000)
                },
                {
                    setNumber: 3,
                    player1Score: 21,
                    player2Score: 15,
                    completed: true,
                    startedAt: new Date(Date.now() - 60 * 60 * 1000),
                    completedAt: new Date(Date.now() - 30 * 60 * 1000),
                    lastUpdated: new Date(Date.now() - 30 * 60 * 1000)
                }
            ],
            matchWinner: 'college1',
            matchCompleted: true
        }
    }
];

const populateData = async () => {
    try {
        await connectDB();
        
        // Clear existing data
        console.log('🧹 Clearing existing referee data...');
        await refreeInfo.deleteMany({});
        await matchesBoys.deleteMany({ refreeEmail: { $in: refereeData.map(r => r.email) } });
        await matchesGirls.deleteMany({ refreeEmail: { $in: refereeData.map(r => r.email) } });
        
        // Insert referee data
        console.log('👨‍⚖️ Creating referee accounts...');
        const createdReferees = await refreeInfo.insertMany(refereeData);
        console.log(`✅ Created ${createdReferees.length} referees`);
        
        // Insert boys matches
        console.log('🏸 Creating boys matches...');
        const createdBoysMatches = await matchesBoys.insertMany(boysMatchData);
        console.log(`✅ Created ${createdBoysMatches.length} boys matches`);
        
        // Insert girls matches  
        console.log('🏸 Creating girls matches...');
        const createdGirlsMatches = await matchesGirls.insertMany(girlsMatchData);
        console.log(`✅ Created ${createdGirlsMatches.length} girls matches`);
        
        console.log('\n🎉 Sample referee data populated successfully!');
        console.log('\n📋 Test Login Credentials:');
        console.log('Referee 1: referee1@example.com / password123');
        console.log('Referee 2: referee2@example.com / password123');
        console.log('Referee 3: referee3@example.com / password123');
        
        console.log('\n🏆 Match Assignment Summary:');
        console.log('John Smith (referee1@example.com):');
        console.log('  - Boys: PCCOE vs MIT WPU (Upcoming)');
        console.log('  - Girls: COEP vs PICT (Completed)');
        console.log('\nSarah Johnson (referee2@example.com):');
        console.log('  - Boys: COEP vs PICT (Live)');
        console.log('\nMike Wilson (referee3@example.com):');
        console.log('  - Girls: PCCOE vs MIT WPU (Upcoming)');
        
    } catch (error) {
        console.error('❌ Error populating referee data:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n📴 Database connection closed');
    }
};

// Run the population script
if (require.main === module) {
    populateData();
}

module.exports = { populateData };