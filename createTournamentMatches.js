const mongoose = require('mongoose');
const { connectDB } = require('./database/db');
const { matchesBoys, collegeInfo } = require('./database/schema');

async function createTournamentMatches() {
    try {
        await connectDB();
        console.log('Connected to MongoDB');

        // Get some colleges for creating matches
        const colleges = await collegeInfo.find().limit(20);
        console.log(`Found ${colleges.length} colleges`);

        if (colleges.length < 4) {
            console.log('Need at least 4 colleges to create tournament matches');
            return;
        }

        // Clear existing matches
        await matchesBoys.deleteMany({});
        console.log('Cleared existing matches');

        const rounds = ['round_1', 'round_2', 'quarter_final', 'semi_final', 'final'];
        const matches = [];

        // Create matches for different rounds
        for (let i = 0; i < rounds.length; i++) {
            const round = rounds[i];
            const numMatches = Math.max(1, Math.floor(Math.random() * 3) + 1); // 1-3 matches per round
            
            for (let j = 0; j < numMatches; j++) {
                const college1 = colleges[Math.floor(Math.random() * colleges.length)];
                const college2 = colleges[Math.floor(Math.random() * colleges.length)];
                
                // Make sure colleges are different
                if (college1._id.toString() === college2._id.toString()) {
                    continue;
                }

                const match = {
                    college1Name: college1.collegeName,
                    college2Name: college2.collegeName,
                    email1: college1.email,
                    email2: college2.email,
                    singlesMatchId: [],
                    doublesMatchId: [],
                    winnerEmail: null,
                    score: [],
                    refreeEmail: null,
                    refreeName: null,
                    refreeId: [],
                    matchStatus: 'upcoming',
                    date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date in next 30 days
                    time: `${Math.floor(Math.random() * 12) + 8}:${Math.random() > 0.5 ? '00' : '30'}`,
                    court: `court_${Math.floor(Math.random() * 4) + 1}`,
                    round: round,
                    isBye: false,
                    completedMatches: 0,
                    overallWinner: null
                };

                matches.push(match);
            }
        }

        // Insert all matches
        const insertedMatches = await matchesBoys.insertMany(matches);
        console.log(`✅ Created ${insertedMatches.length} tournament matches`);

        // Display matches by round
        console.log('\n=== TOURNAMENT MATCHES BY ROUND ===');
        for (const round of rounds) {
            const roundMatches = insertedMatches.filter(m => m.round === round);
            console.log(`${round.toUpperCase()}: ${roundMatches.length} matches`);
            roundMatches.forEach((match, index) => {
                console.log(`  ${index + 1}. ${match.college1Name} vs ${match.college2Name}`);
            });
        }

        console.log('\n🎉 Tournament structure created successfully!');
        
    } catch (error) {
        console.error('Error creating tournament matches:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

createTournamentMatches();