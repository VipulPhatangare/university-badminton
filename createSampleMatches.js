const mongoose = require('mongoose');
const { matches } = require('./database/schema');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/badminton_tournament', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createSampleMatches() {
    try {
        // Clear existing matches
        await matches.deleteMany({});
        console.log('Cleared existing matches');

        // Sample matches data
        const sampleMatches = [
            {
                college1Name: 'MIT College',
                college2Name: 'Stanford University',
                email1: 'mit@college.edu',
                email2: 'stanford@university.edu',
                gender: 'boys',
                round: 'Quarter Final',
                date: '2024-01-15',
                time: '10:00 AM',
                court: 'Court 1',
                matchStatus: 'upcoming'
            },
            {
                college1Name: 'Harvard University',
                college2Name: 'Yale University',
                email1: 'harvard@university.edu',
                email2: 'yale@university.edu',
                gender: 'boys',
                round: 'Semi Final',
                date: '2024-01-16',
                time: '2:00 PM',
                court: 'Court 2',
                matchStatus: 'upcoming'
            },
            {
                college1Name: 'MIT College',
                college2Name: 'Harvard University',
                email1: 'mit@college.edu',
                email2: 'harvard@university.edu',
                gender: 'girls',
                round: 'Quarter Final',
                date: '2024-01-15',
                time: '11:30 AM',
                court: 'Court 3',
                matchStatus: 'upcoming'
            },
            {
                college1Name: 'Stanford University',
                college2Name: 'Yale University',
                email1: 'stanford@university.edu',
                email2: 'yale@university.edu',
                gender: 'girls',
                round: 'Semi Final',
                date: '2024-01-16',
                time: '3:30 PM',
                court: 'Court 4',
                matchStatus: 'upcoming'
            },
            {
                college1Name: 'Princeton University',
                college2Name: 'Columbia University',
                email1: 'princeton@university.edu',
                email2: 'columbia@university.edu',
                gender: 'boys',
                round: 'Quarter Final',
                date: '2024-01-15',
                time: '4:00 PM',
                court: 'Court 1',
                matchStatus: 'upcoming',
                refreeId: ['6742b123456789abcdef0001', '6742b123456789abcdef0002'], // Partially assigned
                subMatches: [
                    { matchNumber: 1, refereeId: '6742b123456789abcdef0001', type: 'singles' },
                    { matchNumber: 2, refereeId: '6742b123456789abcdef0002', type: 'singles' }
                ]
            }
        ];

        // Insert sample matches
        const insertedMatches = await matches.insertMany(sampleMatches);
        console.log(`Created ${insertedMatches.length} sample matches`);

        console.log('\nSample matches created:');
        insertedMatches.forEach((match, index) => {
            console.log(`${index + 1}. ${match.college1Name} vs ${match.college2Name} (${match.gender}) - ${match.round}`);
        });

    } catch (error) {
        console.error('Error creating sample matches:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the function
createSampleMatches();