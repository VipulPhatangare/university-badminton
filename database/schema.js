const mongoose = require('mongoose');

const collegeInfoSchema = new mongoose.Schema({
    collegeName: String,
    managerName: String,
    email: String,
    phone: Number,
    password: String,
    matchesBoys: Array,  // match id
    matchesGirls: Array,  // match id
    currentRoundBoys: String, // round_1, round_2, quater, semi, final
    currentRoundGirls: String, // round_1, round_2, quater, semi, final
    isMatchAllocateBoys: Boolean,
    isMatchAllocateGirls: Boolean,
    playerInfoIdBoys: Array, // players info id
    playerInfoIdGirls: Array, // players info id
});

const playerInfoIdSchema = new mongoose.Schema({
    playerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    gender: { type: String, required: true, enum: ['male', 'female'] },
    phone: { type: String },
    collegeEmail: { type: String, required: true },  // Email of the college this player belongs to
    collegeName: { type: String, required: true }    // Name of the college this player belongs to
});

// Scorecard data sub-schema for reusability
const scorecardMatchSchema = new mongoose.Schema({
    currentSet: { type: Number, default: 0 }, // Current set being played (0-indexed)
    scores: [{
        setNumber: Number,
        player1Score: { type: Number, default: 0 },
        player2Score: { type: Number, default: 0 },
        isComplete: { type: Boolean, default: false },
        completedAt: Date
    }],
    currentScore: {
        player1: { type: Number, default: 0 },
        player2: { type: Number, default: 0 },
        server: { type: Number, default: 0 } // 0 or 1
    },
    lastUpdated: Date
}, { _id: false });

const matchesBoysSchema = new mongoose.Schema({
    college1Name: String,
    college2Name: String,
    email1: String,
    email2: String,
    singlesMatchId: Array, 
    doublesMatchId: Array,
    winnerEmail: String,
    score:[],
    refreeEmail: String,
    refreeName: String,
    refreeId: Array, // Array of referee IDs assigned to this match
    matchStatus: String, // complete, live, upcoming, players_allocated
    date: String,
    time: String,
    court: String, // Added court field
    round: String, // Added round field for tournament progression
    isBye: { type: Boolean, default: false }, // True if this is a bye match
    
    // Player allocations for the 5-match system with integrated tracking
    match1Singles: {
        player1Name: String,
        player2Name: String,
        player1Email: String,
        player2Email: String,
        // Match tracking fields
        isStarted: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        winnerTeam: String, // 'team1' or 'team2'
        winnerEmail: String,
        startedAt: Date,
        completedAt: Date,
        matchSettings: {
            maxPoints: Number,
            numberOfSets: Number,
            courtNumber: Number,
            firstServePlayer: String
        }
    },
    match2Singles: {
        player1Name: String,
        player2Name: String,
        player1Email: String,
        player2Email: String,
        // Match tracking fields
        isStarted: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        winnerTeam: String, // 'team1' or 'team2'
        winnerEmail: String,
        startedAt: Date,
        completedAt: Date,
        matchSettings: {
            maxPoints: Number,
            numberOfSets: Number,
            courtNumber: Number,
            firstServePlayer: String
        }
    },
    match3Doubles: {
        team1Player1Name: String,
        team1Player2Name: String,
        team2Player1Name: String,
        team2Player2Name: String,
        team1Player1Email: String,
        team1Player2Email: String,
        team2Player1Email: String,
        team2Player2Email: String,
        // Match tracking fields
        isStarted: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        winnerTeam: String, // 'team1' or 'team2'
        winnerEmail: String,
        startedAt: Date,
        completedAt: Date,
        matchSettings: {
            maxPoints: Number,
            numberOfSets: Number,
            courtNumber: Number,
            firstServePlayer: String
        }
    },
    match4Singles: {
        player1Name: String,
        player2Name: String,
        player1Email: String,
        player2Email: String,
        // Match tracking fields
        isStarted: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        winnerTeam: String, // 'team1' or 'team2'
        winnerEmail: String,
        startedAt: Date,
        completedAt: Date,
        matchSettings: {
            maxPoints: Number,
            numberOfSets: Number,
            courtNumber: Number,
            firstServePlayer: String
        }
    },
    match5Doubles: {
        team1Player1Name: String,
        team1Player2Name: String,
        team2Player1Name: String,
        team2Player2Name: String,
        team1Player1Email: String,
        team1Player2Email: String,
        team2Player1Email: String,
        team2Player2Email: String,
        // Match tracking fields
        isStarted: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        winnerTeam: String, // 'team1' or 'team2'
        winnerEmail: String,
        startedAt: Date,
        completedAt: Date,
        matchSettings: {
            maxPoints: Number,
            numberOfSets: Number,
            courtNumber: Number,
            firstServePlayer: String
        }
    },

    overallWinner: String, // 'team1' or 'team2'
    completedMatches: Number, // Count of completed matches (0-5)
    currentActiveMatch: String, // Track which match is currently active (match1Singles, match2Singles, etc., null = none)
    
    // Set tracking fields
    setStarted: { type: Boolean, default: false }, // Whether referee has started this set
    setStartedAt: { type: Date }, // When the set was started
    setInProgress: { type: Boolean, default: false }, // Whether set is currently in progress
    
    // Scorecard data for persistent score tracking - FIXED STRUCTURE
    scorecardData: {
        match1: scorecardMatchSchema,
        match2: scorecardMatchSchema,
        match3: scorecardMatchSchema,
        match4: scorecardMatchSchema,
        match5: scorecardMatchSchema
    },
    
    // Simple scorecard for overall match tracking
    scorecard: {
        sets: [{
            setNumber: { type: Number, required: true },
            player1Score: { type: Number, default: 0 },
            player2Score: { type: Number, default: 0 },
            completed: { type: Boolean, default: false },
            startedAt: { type: Date, default: Date.now },
            completedAt: { type: Date },
            lastUpdated: { type: Date, default: Date.now }
        }],
        matchWinner: { type: String }, // college1 or college2
        matchCompleted: { type: Boolean, default: false }
    }
});

const singlesMatchSchema = new mongoose.Schema({
    matchNumber: Number, // singles 1, singles 2, singles 3
    email1: String,
    email2: String,
    player1Name: String,
    player2Name: String,
    singlesMatchStatus: String, // complete, live, upcoming
    numberOfSet: Number,
    maxSetPoint: Number,
    singlesMatchWinnerEmail: String,
    singlesMatchWinnerName: String,
    isMatchComplete: Boolean,
    refreeEmail: String,
    refreeName: String,
    court: String, // court_1, court_2, court_3, court_4
    sets: Array, // set Id
});

const doublesMatchSchema = new mongoose.Schema({
    matchNumber: Number, // singles 1, singles 2, singles 3
    email1: String,
    email2: String,
    team1Player1Name: String,
    team1Player2Name: String,
    team2Player1Name: String,
    team2Player2Name: String,
    singlesMatchStatus: String, // complete, live, upcoming
    numberOfSet: Number,
    maxSetPoint: Number,
    doublesMatchWinnerEmail: String,
    doublesMatchWinnerName1: String,
    doublesMatchWinnerName2: String,
    isMatchComplete: Boolean,
    refreeEmail: String,
    refreeName: String,
    court: String, // court_1, court_2, court_3, court_4
    sets: Array, // set Id
});

const setSchema = new mongoose.Schema({
    maxPoint: Number,
    player1point: Number,
    player2point: Number,
    isSetComplete: Boolean,
    serve: String,   // server name or email
    setWinnerEmail: String
});

const refreeInfoSchema = new mongoose.Schema({
    name: String,
    password: String,
    refEmail: String,
    phone: String
});

// Girls matches schema (3-match format)
const matchesGirlsSchema = new mongoose.Schema({
    college1Name: String,
    college2Name: String,
    email1: String,
    email2: String,
    winnerEmail: String,
    score:[],
    refreeEmail: String,
    refreeName: String,
    refreeId: Array, // Array of referee IDs assigned to this match
    matchStatus: String, // complete, live, upcoming, players_allocated
    date: String,
    time: String,
    court: String,
    round: String,
    isBye: { type: Boolean, default: false }, // True if this is a bye match
    
    // Player allocations for the 3-match system (Girls) with integrated tracking
    match1Singles: {
        player1Name: String,
        player2Name: String,
        player1Email: String,
        player2Email: String,
        // Match tracking fields
        isStarted: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        winnerTeam: String, // 'team1' or 'team2'
        winnerEmail: String,
        startedAt: Date,
        completedAt: Date,
        matchSettings: {
            maxPoints: Number,
            numberOfSets: Number,
            courtNumber: Number,
            firstServePlayer: String
        }
    },
    match2Doubles: {
        team1Player1Name: String,
        team1Player2Name: String,
        team2Player1Name: String,
        team2Player2Name: String,
        team1Player1Email: String,
        team1Player2Email: String,
        team2Player1Email: String,
        team2Player2Email: String,
        // Match tracking fields
        isStarted: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        winnerTeam: String, // 'team1' or 'team2'
        winnerEmail: String,
        startedAt: Date,
        completedAt: Date,
        matchSettings: {
            maxPoints: Number,
            numberOfSets: Number,
            courtNumber: Number,
            firstServePlayer: String
        }
    },
    match3Singles: {
        player1Name: String,
        player2Name: String,
        player1Email: String,
        player2Email: String,
        // Match tracking fields
        isStarted: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        winnerTeam: String, // 'team1' or 'team2'
        winnerEmail: String,
        startedAt: Date,
        completedAt: Date,
        matchSettings: {
            maxPoints: Number,
            numberOfSets: Number,
            courtNumber: Number,
            firstServePlayer: String
        }
    },

    overallWinner: String, // 'team1' or 'team2'
    completedMatches: Number, // Count of completed matches (0-3)
    maxPoints: { type: Number },
    numberOfSets: { type: Number },
    courtNumber: { type: Number },
    currentActiveMatch: String, // Track which match is currently active (match1Singles, match2Doubles, match3Singles, null = none)
    
    // Set tracking fields
    setStarted: { type: Boolean, default: false }, // Whether referee has started this set
    setStartedAt: { type: Date }, // When the set was started
    setInProgress: { type: Boolean, default: false }, // Whether set is currently in progress
    
    // Scorecard data for persistent score tracking - FIXED STRUCTURE
    scorecardData: {
        match1: scorecardMatchSchema,
        match2: scorecardMatchSchema,
        match3: scorecardMatchSchema
    },
    
    // Simple scorecard for overall match tracking
    scorecard: {
        sets: [{
            setNumber: { type: Number, required: true },
            player1Score: { type: Number, default: 0 },
            player2Score: { type: Number, default: 0 },
            completed: { type: Boolean, default: false },
            startedAt: { type: Date, default: Date.now },
            completedAt: { type: Date },
            lastUpdated: { type: Date, default: Date.now }
        }],
        matchWinner: { type: String }, // college1 or college2
        matchCompleted: { type: Boolean, default: false }
    }
});

// Combined matches schema for admin assignment
const matchesSchema = new mongoose.Schema({
    college1Name: String,
    college2Name: String,
    email1: String,
    email2: String,
    gender: String, // 'boys' or 'girls'
    round: String,
    date: String,
    time: String,
    court: String,
    matchStatus: String,
    refreeId: Array, // Array of referee IDs
    subMatches: Array, // Array of sub-match assignments
    assignedAt: Date,
    assignedBy: String,
    createdAt: { type: Date, default: Date.now }
});

const collegeInfo = mongoose.model('collegeInfo', collegeInfoSchema);
const playerInfoId = mongoose.model('playerInfoId', playerInfoIdSchema);
const matchesBoys = mongoose.model('matchesBoys', matchesBoysSchema);
const matchesGirls = mongoose.model('matchesGirls', matchesGirlsSchema);
const matches = mongoose.model('matches', matchesSchema);
const singlesMatch = mongoose.model('singlesMatch', singlesMatchSchema);
const doublesMatch = mongoose.model('doublesMatch', doublesMatchSchema);
const set = mongoose.model('set', setSchema);
const refreeInfo = mongoose.model('refreeInfo', refreeInfoSchema);

module.exports = {
    collegeInfo,
    playerInfoId,
    matchesBoys,
    matchesGirls,
    matches,
    singlesMatch,
    doublesMatch,
    set,
    refreeInfo
};