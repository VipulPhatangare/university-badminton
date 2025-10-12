const mongoose = require('mongoose');
require('dotenv').config();
const { connectDB } = require('./database/db');
const {
    collegeInfo,
    matchesBoys,
    refreeInfo
} = require('./database/schema');

// Function to get random element from array
function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Function to get random elements from array
function getRandomElements(arr, count) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Generate random date in next 30 days
function getRandomFutureDate() {
    const today = new Date();
    const futureDate = new Date(today.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000);
    return futureDate.toISOString().split('T')[0];
}

// Generate random time
function getRandomTime() {
    const hours = Math.floor(Math.random() * 12) + 8; // 8 AM to 7 PM
    const minutes = Math.random() > 0.5 ? '00' : '30';
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

async function createMoreMatches() {
    try {
        // Connect to database
        await connectDB();
        console.log('Connected to database');

        // Get all colleges
        const colleges = await collegeInfo.find({});
        console.log(`Found ${colleges.length} colleges`);

        // Check if referee20 exists
        const referee = await refreeInfo.findOne({ refEmail: 'referee20@badminton.com' });
        if (!referee) {
            console.log('Referee20 not found, creating...');
            const newReferee = new refreeInfo({
                name: 'Referee 20',
                password: '123456',
                refEmail: 'referee20@badminton.com',
                phone: '9876543220'
            });
            await newReferee.save();
            console.log('Created referee20');
        }

        // Create 15 upcoming matches assigned to referee20@badminton.com
        const newMatches = [];
        const rounds = ['round_1', 'round_2', 'quarter', 'semi'];
        const courts = ['court_1', 'court_2', 'court_3', 'court_4'];

        for (let i = 0; i < 15; i++) {
            // Get two random different colleges
            const selectedColleges = getRandomElements(colleges, 2);
            const college1 = selectedColleges[0];
            const college2 = selectedColleges[1];

            const match = new matchesBoys({
                college1Name: college1.collegeName,
                college2Name: college2.collegeName,
                email1: college1.email,
                email2: college2.email,
                singlesMatchId: [],
                doublesMatchId: [],
                winnerEmail: '',
                score: [],
                refreeEmail: 'referee20@badminton.com',
                refreeName: 'Referee 20',
                matchStatus: 'upcoming',
                date: getRandomFutureDate(),
                time: getRandomTime(),
                court: getRandomElement(courts),
                round: getRandomElement(rounds)
            });

            newMatches.push(match);
        }

        // Save all matches
        await matchesBoys.insertMany(newMatches);
        console.log(`Created ${newMatches.length} upcoming matches for referee20@badminton.com`);

        // Display some statistics
        const totalUpcomingMatches = await matchesBoys.countDocuments({
            refreeEmail: 'referee20@badminton.com',
            matchStatus: 'upcoming'
        });

        const totalCompletedMatches = await matchesBoys.countDocuments({
            refreeEmail: 'referee20@badminton.com',
            matchStatus: 'complete'
        });

        console.log('\n=== REFEREE20 MATCH STATISTICS ===');
        console.log(`Upcoming matches: ${totalUpcomingMatches}`);
        console.log(`Completed matches: ${totalCompletedMatches}`);

        // Show some sample upcoming matches
        const sampleMatches = await matchesBoys.find({
            refreeEmail: 'referee20@badminton.com',
            matchStatus: 'upcoming'
        }).limit(5).sort({ date: 1, time: 1 });

        console.log('\n=== SAMPLE UPCOMING MATCHES ===');
        sampleMatches.forEach((match, index) => {
            console.log(`${index + 1}. ${match.college1Name} vs ${match.college2Name}`);
            console.log(`   Date: ${match.date}, Time: ${match.time}, Court: ${match.court}`);
            console.log(`   Round: ${match.round}, Match ID: ${match._id}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error creating matches:', error);
        process.exit(1);
    }
}

// Run the script
createMoreMatches();