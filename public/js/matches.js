
// Configuration
const USE_DUMMY_DATA = false; // Set to false to use real API data
const API_BASE_URL = 'http://localhost:8080/api';

// Global state
let currentMatchId = null;
let currentSubmatchId = null;
let currentSubmatchType = null; // 'singles' or 'doubles'
let currentGender = 'boys'; // 'boys' or 'girls'

// Dummy Data for Testing - Boys Matches
const DUMMY_MATCHES_BOYS = [
    {
        _id: 'match1',
        college1Name: 'PCCOE',
        college2Name: 'PCCOER',
        email1: 'pccoe@gmail.com',
        email2: 'pccoer@gmail.com',
        refreeName: 'Rahul Sharma',
        refreeEmail: 'rahul@ref.com',
        matchStatus: 'complete',
        date: '2024-03-15',
        time: '10:00 AM',
        score: [3, 2],
        gender: 'boys',
        singlesMatchId: ['s1', 's2', 's3'],
        doublesMatchId: ['d1', 'd2']
    },
    {
        _id: 'match2',
        college1Name: 'MIT',
        college2Name: 'COEP',
        email1: 'mit@gmail.com',
        email2: 'coep@gmail.com',
        refreeName: 'Priya Patel',
        refreeEmail: 'priya@ref.com',
        matchStatus: 'live',
        date: '2024-03-16',
        time: '02:00 PM',
        score: [2, 1],
        gender: 'boys',
        singlesMatchId: ['s4', 's5', 's6'],
        doublesMatchId: ['d3', 'd4']
    },
    {
        _id: 'match3',
        college1Name: 'VIT',
        college2Name: 'PICT',
        email1: 'vit@gmail.com',
        email2: 'pict@gmail.com',
        refreeName: 'Amit Kumar',
        refreeEmail: 'amit@ref.com',
        matchStatus: 'upcoming',
        date: '2024-03-17',
        time: '11:00 AM',
        score: [0, 0],
        gender: 'boys',
        singlesMatchId: ['s7', 's8', 's9'],
        doublesMatchId: ['d5', 'd6']
    }
];

// Dummy Data for Testing - Girls Matches
const DUMMY_MATCHES_GIRLS = [
    {
        _id: 'gmatch1',
        college1Name: 'PCCOE',
        college2Name: 'PCCOER',
        email1: 'pccoe@gmail.com',
        email2: 'pccoer@gmail.com',
        refreeName: 'Sneha Patil',
        refreeEmail: 'sneha@ref.com',
        matchStatus: 'complete',
        date: '2024-03-15',
        time: '08:00 AM',
        score: [3, 0],
        gender: 'girls',
        singlesMatchId: ['gs1', 'gs2', 'gs3'],
        doublesMatchId: ['gd1', 'gd2']
    },
    {
        _id: 'gmatch2',
        college1Name: 'MIT',
        college2Name: 'COEP',
        email1: 'mit@gmail.com',
        email2: 'coep@gmail.com',
        refreeName: 'Kavita Shah',
        refreeEmail: 'kavita@ref.com',
        matchStatus: 'live',
        date: '2024-03-16',
        time: '08:01 AM',
        score: [1, 2],
        gender: 'girls',
        singlesMatchId: ['gs4', 'gs5', 'gs6'],
        doublesMatchId: ['gd3', 'gd4']
    },
    {
        _id: 'gmatch3',
        college1Name: 'VIT',
        college2Name: 'PICT',
        email1: 'vit@gmail.com',
        email2: 'pict@gmail.com',
        refreeName: 'Pooja Desai',
        refreeEmail: 'pooja@ref.com',
        matchStatus: 'upcoming',
        date: '2024-03-17',
        time: '09:00 AM',
        score: [0, 0],
        gender: 'girls',
        singlesMatchId: ['gs7', 'gs8', 'gs9'],
        doublesMatchId: ['gd5', 'gd6']
    }
];

const DUMMY_MATCHES = DUMMY_MATCHES_BOYS; // For backward compatibility

const DUMMY_SINGLES = {
    's1': {
        _id: 's1',
        matchNumber: 1,
        player1Name: 'Arjun Mehta',
        player2Name: 'Rohan Singh',
        email1: 'arjun@pccoe.com',
        email2: 'rohan@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 3,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'arjun@pccoe.com',
        singlesMatchWinnerName: 'Arjun Mehta',
        isMatchComplete: true,
        court: 'Court 1',
        sets: ['set1', 'set2', 'set3']
    },
    's2': {
        _id: 's2',
        matchNumber: 2,
        player1Name: 'Vikram Shah',
        player2Name: 'Karan Desai',
        email1: 'vikram@pccoe.com',
        email2: 'karan@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 2,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'karan@pccoer.com',
        singlesMatchWinnerName: 'Karan Desai',
        isMatchComplete: true,
        court: 'Court 2',
        sets: ['set4', 'set5']
    },
    's3': {
        _id: 's3',
        matchNumber: 3,
        player1Name: 'Siddharth Joshi',
        player2Name: 'Aditya Patil',
        email1: 'siddharth@pccoe.com',
        email2: 'aditya@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 3,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'siddharth@pccoe.com',
        singlesMatchWinnerName: 'Siddharth Joshi',
        isMatchComplete: true,
        court: 'Court 3',
        sets: ['set6', 'set7', 'set8']
    },
    's4': {
        _id: 's4',
        matchNumber: 1,
        player1Name: 'Ravi Deshmukh',
        player2Name: 'Amit Kulkarni',
        email1: 'ravi@mit.com',
        email2: 'amit@coep.com',
        singlesMatchStatus: 'live',
        numberOfSet: 2,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'ravi@mit.com',
        singlesMatchWinnerName: 'Ravi Deshmukh',
        isMatchComplete: false,
        court: 'Court 1',
        sets: ['set14', 'set15']
    },
    's5': {
        _id: 's5',
        matchNumber: 2,
        player1Name: 'Sunil Rane',
        player2Name: 'Prakash Joshi',
        email1: 'sunil@mit.com',
        email2: 'prakash@coep.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 2,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'sunil@mit.com',
        singlesMatchWinnerName: 'Sunil Rane',
        isMatchComplete: true,
        court: 'Court 2',
        sets: ['set16', 'set17']
    },
    's6': {
        _id: 's6',
        matchNumber: 3,
        player1Name: 'Manoj Bhosale',
        player2Name: 'Sachin Pawar',
        email1: 'manoj@mit.com',
        email2: 'sachin@coep.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: '',
        singlesMatchWinnerName: '',
        isMatchComplete: false,
        court: 'Court 3',
        sets: []
    },
    's7': {
        _id: 's7',
        matchNumber: 1,
        player1Name: 'Akash Thakur',
        player2Name: 'Vishal Gaikwad',
        email1: 'akash@vit.com',
        email2: 'vishal@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: '',
        singlesMatchWinnerName: '',
        isMatchComplete: false,
        court: 'Court 1',
        sets: []
    },
    's8': {
        _id: 's8',
        matchNumber: 2,
        player1Name: 'Pranav Sharma',
        player2Name: 'Rohit Kadam',
        email1: 'pranav@vit.com',
        email2: 'rohit@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: '',
        singlesMatchWinnerName: '',
        isMatchComplete: false,
        court: 'Court 2',
        sets: []
    },
    's9': {
        _id: 's9',
        matchNumber: 3,
        player1Name: 'Kunal Patil',
        player2Name: 'Aniket Desai',
        email1: 'kunal@vit.com',
        email2: 'aniket@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: '',
        singlesMatchWinnerName: '',
        isMatchComplete: false,
        court: 'Court 3',
        sets: []
    }
};

const DUMMY_DOUBLES = {
    'd1': {
        _id: 'd1',
        matchNumber: 1,
        team1Player1Name: 'Rahul Verma',
        team1Player2Name: 'Amit Kumar',
        team2Player1Name: 'Suresh Gupta',
        team2Player2Name: 'Manoj Yadav',
        email1: 'rahul@pccoe.com',
        email2: 'suresh@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 3,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: 'rahul@pccoe.com',
        doublesMatchWinnerName1: 'Rahul Verma',
        doublesMatchWinnerName2: 'Amit Kumar',
        isMatchComplete: true,
        court: 'Court 4',
        sets: ['set9', 'set10', 'set11']
    },
    'd2': {
        _id: 'd2',
        matchNumber: 2,
        team1Player1Name: 'Nikhil Sharma',
        team1Player2Name: 'Rajesh Singh',
        team2Player1Name: 'Deepak Patel',
        team2Player2Name: 'Vivek Reddy',
        email1: 'nikhil@pccoe.com',
        email2: 'deepak@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 2,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: 'deepak@pccoer.com',
        doublesMatchWinnerName1: 'Deepak Patel',
        doublesMatchWinnerName2: 'Vivek Reddy',
        isMatchComplete: true,
        court: 'Court 5',
        sets: ['set12', 'set13']
    },
    'd3': {
        _id: 'd3',
        matchNumber: 1,
        team1Player1Name: 'Sagar Bhatt',
        team1Player2Name: 'Karan Mehta',
        team2Player1Name: 'Nitin Jadhav',
        team2Player2Name: 'Rohan More',
        email1: 'sagar@mit.com',
        email2: 'nitin@coep.com',
        singlesMatchStatus: 'live',
        numberOfSet: 2,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: 'sagar@mit.com',
        doublesMatchWinnerName1: 'Sagar Bhatt',
        doublesMatchWinnerName2: 'Karan Mehta',
        isMatchComplete: false,
        court: 'Court 4',
        sets: ['set18', 'set19']
    },
    'd4': {
        _id: 'd4',
        matchNumber: 2,
        team1Player1Name: 'Varun Shinde',
        team1Player2Name: 'Ajay Nair',
        team2Player1Name: 'Ganesh Rao',
        team2Player2Name: 'Dinesh Kumar',
        email1: 'varun@mit.com',
        email2: 'ganesh@coep.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: '',
        doublesMatchWinnerName1: '',
        doublesMatchWinnerName2: '',
        isMatchComplete: false,
        court: 'Court 5',
        sets: []
    },
    'd5': {
        _id: 'd5',
        matchNumber: 1,
        team1Player1Name: 'Aditya Shah',
        team1Player2Name: 'Vinay Patil',
        team2Player1Name: 'Shreyas Deshpande',
        team2Player2Name: 'Omkar Gokhale',
        email1: 'aditya@vit.com',
        email2: 'shreyas@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: '',
        doublesMatchWinnerName1: '',
        doublesMatchWinnerName2: '',
        isMatchComplete: false,
        court: 'Court 4',
        sets: []
    },
    'd6': {
        _id: 'd6',
        matchNumber: 2,
        team1Player1Name: 'Yash Kulkarni',
        team1Player2Name: 'Tushar Jain',
        team2Player1Name: 'Saurabh Wagh',
        team2Player2Name: 'Kshitij Bhagat',
        email1: 'yash@vit.com',
        email2: 'saurabh@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: '',
        doublesMatchWinnerName1: '',
        doublesMatchWinnerName2: '',
        isMatchComplete: false,
        court: 'Court 5',
        sets: []
    }
};

const DUMMY_SETS = {
    // Singles Match 1 Sets (Arjun wins 2-1)
    'set1': {
        _id: 'set1',
        maxPoint: 21,
        player1point: 21,
        player2point: 18,
        isSetComplete: true,
        serve: 'Arjun Mehta',
        setWinnerEmail: 'arjun@pccoe.com',
        pointHistory: [
            { pointNumber: 1, player1Score: 1, player2Score: 0, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 2, player1Score: 1, player2Score: 1, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 3, player1Score: 2, player2Score: 1, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 4, player1Score: 3, player2Score: 1, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 5, player1Score: 3, player2Score: 2, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 6, player1Score: 4, player2Score: 2, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 7, player1Score: 5, player2Score: 2, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 8, player1Score: 5, player2Score: 3, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 9, player1Score: 6, player2Score: 3, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 10, player1Score: 7, player2Score: 3, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 11, player1Score: 8, player2Score: 3, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 12, player1Score: 8, player2Score: 4, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 13, player1Score: 9, player2Score: 4, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 14, player1Score: 10, player2Score: 4, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 15, player1Score: 11, player2Score: 4, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 16, player1Score: 11, player2Score: 5, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 17, player1Score: 12, player2Score: 5, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 18, player1Score: 13, player2Score: 5, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 19, player1Score: 13, player2Score: 6, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 20, player1Score: 14, player2Score: 6, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 21, player1Score: 15, player2Score: 6, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 22, player1Score: 15, player2Score: 7, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 23, player1Score: 16, player2Score: 7, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 24, player1Score: 17, player2Score: 7, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 25, player1Score: 17, player2Score: 8, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 26, player1Score: 18, player2Score: 8, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 27, player1Score: 18, player2Score: 9, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 28, player1Score: 19, player2Score: 9, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 29, player1Score: 19, player2Score: 10, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 30, player1Score: 20, player2Score: 10, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 31, player1Score: 20, player2Score: 11, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 32, player1Score: 20, player2Score: 12, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 33, player1Score: 20, player2Score: 13, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 34, player1Score: 20, player2Score: 14, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 35, player1Score: 20, player2Score: 15, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 36, player1Score: 20, player2Score: 16, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 37, player1Score: 20, player2Score: 17, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 38, player1Score: 20, player2Score: 18, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 39, player1Score: 21, player2Score: 18, winner: 'Arjun Mehta', serve: 'Arjun Mehta' }
        ]
    },
    'set2': {
        _id: 'set2',
        maxPoint: 21,
        player1point: 19,
        player2point: 21,
        isSetComplete: true,
        serve: 'Rohan Singh',
        setWinnerEmail: 'rohan@pccoer.com',
        pointHistory: [
            { pointNumber: 1, player1Score: 0, player2Score: 1, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 2, player1Score: 1, player2Score: 1, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 3, player1Score: 1, player2Score: 2, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 4, player1Score: 2, player2Score: 2, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 5, player1Score: 2, player2Score: 3, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 6, player1Score: 3, player2Score: 3, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 7, player1Score: 3, player2Score: 4, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 8, player1Score: 4, player2Score: 4, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 9, player1Score: 5, player2Score: 4, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 10, player1Score: 6, player2Score: 4, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 11, player1Score: 6, player2Score: 5, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 12, player1Score: 7, player2Score: 5, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 13, player1Score: 8, player2Score: 5, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 14, player1Score: 8, player2Score: 6, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 15, player1Score: 9, player2Score: 6, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 16, player1Score: 9, player2Score: 7, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 17, player1Score: 10, player2Score: 7, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 18, player1Score: 10, player2Score: 8, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 19, player1Score: 11, player2Score: 8, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 20, player1Score: 11, player2Score: 9, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 21, player1Score: 12, player2Score: 9, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 22, player1Score: 12, player2Score: 10, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 23, player1Score: 13, player2Score: 10, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 24, player1Score: 13, player2Score: 11, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 25, player1Score: 14, player2Score: 11, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 26, player1Score: 14, player2Score: 12, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 27, player1Score: 15, player2Score: 12, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 28, player1Score: 15, player2Score: 13, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 29, player1Score: 16, player2Score: 13, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 30, player1Score: 16, player2Score: 14, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 31, player1Score: 17, player2Score: 14, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 32, player1Score: 17, player2Score: 15, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 33, player1Score: 18, player2Score: 15, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 34, player1Score: 18, player2Score: 16, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 35, player1Score: 19, player2Score: 16, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 36, player1Score: 19, player2Score: 17, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 37, player1Score: 19, player2Score: 18, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 38, player1Score: 19, player2Score: 19, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 39, player1Score: 19, player2Score: 20, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 40, player1Score: 19, player2Score: 21, winner: 'Rohan Singh', serve: 'Rohan Singh' }
        ]
    },
    'set3': {
        _id: 'set3',
        maxPoint: 21,
        player1point: 21,
        player2point: 19,
        isSetComplete: true,
        serve: 'Arjun Mehta',
        setWinnerEmail: 'arjun@pccoe.com',
        pointHistory: [
            { pointNumber: 1, player1Score: 1, player2Score: 0, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 2, player1Score: 1, player2Score: 1, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 3, player1Score: 2, player2Score: 1, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 4, player1Score: 2, player2Score: 2, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 5, player1Score: 3, player2Score: 2, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 6, player1Score: 3, player2Score: 3, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 7, player1Score: 4, player2Score: 3, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 8, player1Score: 5, player2Score: 3, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 9, player1Score: 5, player2Score: 4, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 10, player1Score: 6, player2Score: 4, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 11, player1Score: 7, player2Score: 4, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 12, player1Score: 7, player2Score: 5, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 13, player1Score: 8, player2Score: 5, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 14, player1Score: 8, player2Score: 6, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 15, player1Score: 9, player2Score: 6, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 16, player1Score: 10, player2Score: 6, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 17, player1Score: 10, player2Score: 7, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 18, player1Score: 11, player2Score: 7, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 19, player1Score: 11, player2Score: 8, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 20, player1Score: 12, player2Score: 8, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 21, player1Score: 13, player2Score: 8, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 22, player1Score: 13, player2Score: 9, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 23, player1Score: 14, player2Score: 9, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 24, player1Score: 14, player2Score: 10, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 25, player1Score: 15, player2Score: 10, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 26, player1Score: 15, player2Score: 11, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 27, player1Score: 16, player2Score: 11, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 28, player1Score: 16, player2Score: 12, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 29, player1Score: 17, player2Score: 12, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 30, player1Score: 17, player2Score: 13, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 31, player1Score: 18, player2Score: 13, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 32, player1Score: 18, player2Score: 14, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 33, player1Score: 19, player2Score: 14, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 34, player1Score: 19, player2Score: 15, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 35, player1Score: 19, player2Score: 16, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 36, player1Score: 19, player2Score: 17, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 37, player1Score: 19, player2Score: 18, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 38, player1Score: 19, player2Score: 19, winner: 'Rohan Singh', serve: 'Rohan Singh' },
            { pointNumber: 39, player1Score: 20, player2Score: 19, winner: 'Arjun Mehta', serve: 'Arjun Mehta' },
            { pointNumber: 40, player1Score: 21, player2Score: 19, winner: 'Arjun Mehta', serve: 'Arjun Mehta' }
        ]
    },
    // Add more sets for other matches (simplified for brevity)
    'set4': {
        _id: 'set4',
        maxPoint: 21,
        player1point: 18,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'karan@pccoer.com',
        pointHistory: []
    },
    'set5': {
        _id: 'set5',
        maxPoint: 21,
        player1point: 19,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'karan@pccoer.com',
        pointHistory: []
    },
    'set6': {
        _id: 'set6',
        maxPoint: 21,
        player1point: 21,
        player2point: 17,
        isSetComplete: true,
        setWinnerEmail: 'siddharth@pccoe.com',
        pointHistory: []
    },
    'set7': {
        _id: 'set7',
        maxPoint: 21,
        player1point: 19,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'aditya@pccoer.com',
        pointHistory: []
    },
    'set8': {
        _id: 'set8',
        maxPoint: 21,
        player1point: 21,
        player2point: 18,
        isSetComplete: true,
        setWinnerEmail: 'siddharth@pccoe.com',
        pointHistory: []
    },
    // Doubles sets
    'set9': {
        _id: 'set9',
        maxPoint: 21,
        player1point: 21,
        player2point: 19,
        isSetComplete: true,
        setWinnerEmail: 'rahul@pccoe.com',
        pointHistory: []
    },
    'set10': {
        _id: 'set10',
        maxPoint: 21,
        player1point: 18,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'suresh@pccoer.com',
        pointHistory: []
    },
    'set11': {
        _id: 'set11',
        maxPoint: 21,
        player1point: 21,
        player2point: 16,
        isSetComplete: true,
        setWinnerEmail: 'rahul@pccoe.com',
        pointHistory: []
    },
    'set12': {
        _id: 'set12',
        maxPoint: 21,
        player1point: 19,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'deepak@pccoer.com',
        pointHistory: []
    },
    'set13': {
        _id: 'set13',
        maxPoint: 21,
        player1point: 18,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'deepak@pccoer.com',
        pointHistory: []
    },
    // MIT vs COEP sets
    'set14': {
        _id: 'set14',
        maxPoint: 21,
        player1point: 21,
        player2point: 18,
        isSetComplete: true,
        setWinnerEmail: 'ravi@mit.com',
        pointHistory: []
    },
    'set15': {
        _id: 'set15',
        maxPoint: 21,
        player1point: 21,
        player2point: 19,
        isSetComplete: true,
        setWinnerEmail: 'ravi@mit.com',
        pointHistory: []
    },
    'set16': {
        _id: 'set16',
        maxPoint: 21,
        player1point: 21,
        player2point: 17,
        isSetComplete: true,
        setWinnerEmail: 'sunil@mit.com',
        pointHistory: []
    },
    'set17': {
        _id: 'set17',
        maxPoint: 21,
        player1point: 21,
        player2point: 19,
        isSetComplete: true,
        setWinnerEmail: 'sunil@mit.com',
        pointHistory: []
    },
    'set18': {
        _id: 'set18',
        maxPoint: 21,
        player1point: 21,
        player2point: 16,
        isSetComplete: true,
        setWinnerEmail: 'sagar@mit.com',
        pointHistory: []
    },
    'set19': {
        _id: 'set19',
        maxPoint: 21,
        player1point: 21,
        player2point: 18,
        isSetComplete: true,
        setWinnerEmail: 'sagar@mit.com',
        pointHistory: []
    }
};

// Dummy Data for Girls Singles Matches
const DUMMY_SINGLES_GIRLS = {
    'gs1': {
        _id: 'gs1',
        matchNumber: 1,
        player1Name: 'Priya Sharma',
        player2Name: 'Anjali Patel',
        email1: 'priya@pccoe.com',
        email2: 'anjali@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 3,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'priya@pccoe.com',
        singlesMatchWinnerName: 'Priya Sharma',
        isMatchComplete: true,
        court: 'Court 1',
        sets: ['gset1', 'gset2', 'gset3']
    },
    'gs2': {
        _id: 'gs2',
        matchNumber: 2,
        player1Name: 'Sneha Kulkarni',
        player2Name: 'Kavya Desai',
        email1: 'sneha@pccoe.com',
        email2: 'kavya@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 3,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'sneha@pccoe.com',
        singlesMatchWinnerName: 'Sneha Kulkarni',
        isMatchComplete: true,
        court: 'Court 2',
        sets: ['gset4', 'gset5', 'gset6']
    },
    'gs3': {
        _id: 'gs3',
        matchNumber: 3,
        player1Name: 'Riya Gupta',
        player2Name: 'Pooja Joshi',
        email1: 'riya@pccoe.com',
        email2: 'pooja@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 3,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'riya@pccoe.com',
        singlesMatchWinnerName: 'Riya Gupta',
        isMatchComplete: true,
        court: 'Court 3',
        sets: ['gset7', 'gset8', 'gset9']
    },
    'gs4': {
        _id: 'gs4',
        matchNumber: 1,
        player1Name: 'Neha Singh',
        player2Name: 'Divya Rao',
        email1: 'neha@mit.com',
        email2: 'divya@coep.com',
        singlesMatchStatus: 'live',
        numberOfSet: 2,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: '',
        singlesMatchWinnerName: '',
        isMatchComplete: false,
        court: 'Court 1',
        sets: ['gset10', 'gset11']
    },
    'gs5': {
        _id: 'gs5',
        matchNumber: 2,
        player1Name: 'Aisha Khan',
        player2Name: 'Simran Verma',
        email1: 'aisha@mit.com',
        email2: 'simran@coep.com',
        singlesMatchStatus: 'live',
        numberOfSet: 3,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'simran@coep.com',
        singlesMatchWinnerName: 'Simran Verma',
        isMatchComplete: true,
        court: 'Court 2',
        sets: ['gset12', 'gset13', 'gset14']
    },
    'gs6': {
        _id: 'gs6',
        matchNumber: 3,
        player1Name: 'Meera Nair',
        player2Name: 'Tanvi Reddy',
        email1: 'meera@mit.com',
        email2: 'tanvi@coep.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 3,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: 'tanvi@coep.com',
        singlesMatchWinnerName: 'Tanvi Reddy',
        isMatchComplete: true,
        court: 'Court 3',
        sets: ['gset15', 'gset16', 'gset17']
    },
    'gs7': {
        _id: 'gs7',
        matchNumber: 1,
        player1Name: 'Shruti Mehta',
        player2Name: 'Isha Patel',
        email1: 'shruti@vit.com',
        email2: 'isha@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: '',
        singlesMatchWinnerName: '',
        isMatchComplete: false,
        court: 'Court 1',
        sets: []
    },
    'gs8': {
        _id: 'gs8',
        matchNumber: 2,
        player1Name: 'Aditi Sharma',
        player2Name: 'Sanya Singh',
        email1: 'aditi@vit.com',
        email2: 'sanya@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: '',
        singlesMatchWinnerName: '',
        isMatchComplete: false,
        court: 'Court 2',
        sets: []
    },
    'gs9': {
        _id: 'gs9',
        matchNumber: 3,
        player1Name: 'Naina Kumar',
        player2Name: 'Ritu Deshmukh',
        email1: 'naina@vit.com',
        email2: 'ritu@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        singlesMatchWinnerEmail: '',
        singlesMatchWinnerName: '',
        isMatchComplete: false,
        court: 'Court 3',
        sets: []
    }
};

// Dummy Data for Girls Doubles Matches
const DUMMY_DOUBLES_GIRLS = {
    'gd1': {
        _id: 'gd1',
        matchNumber: 1,
        team1Player1Name: 'Sakshi Rane',
        team1Player2Name: 'Prachi Shah',
        team2Player1Name: 'Mansi Bhatt',
        team2Player2Name: 'Swati More',
        email1: 'sakshi@pccoe.com',
        email2: 'mansi@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 3,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: 'sakshi@pccoe.com',
        doublesMatchWinnerName1: 'Sakshi Rane',
        doublesMatchWinnerName2: 'Prachi Shah',
        isMatchComplete: true,
        court: 'Court 4',
        sets: ['gset18', 'gset19', 'gset20']
    },
    'gd2': {
        _id: 'gd2',
        matchNumber: 2,
        team1Player1Name: 'Kriti Jain',
        team1Player2Name: 'Diya Agarwal',
        team2Player1Name: 'Nikita Shinde',
        team2Player2Name: 'Gayatri Jadhav',
        email1: 'kriti@pccoe.com',
        email2: 'nikita@pccoer.com',
        singlesMatchStatus: 'complete',
        numberOfSet: 3,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: 'nikita@pccoer.com',
        doublesMatchWinnerName1: 'Nikita Shinde',
        doublesMatchWinnerName2: 'Gayatri Jadhav',
        isMatchComplete: true,
        court: 'Court 5',
        sets: ['gset21', 'gset22', 'gset23']
    },
    'gd3': {
        _id: 'gd3',
        matchNumber: 1,
        team1Player1Name: 'Ananya Bansal',
        team1Player2Name: 'Tanya Chopra',
        team2Player1Name: 'Juhi Mishra',
        team2Player2Name: 'Payal Iyer',
        email1: 'ananya@mit.com',
        email2: 'juhi@coep.com',
        singlesMatchStatus: 'live',
        numberOfSet: 2,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: '',
        doublesMatchWinnerName1: '',
        doublesMatchWinnerName2: '',
        isMatchComplete: false,
        court: 'Court 4',
        sets: ['gset24', 'gset25']
    },
    'gd4': {
        _id: 'gd4',
        matchNumber: 2,
        team1Player1Name: 'Vidya Menon',
        team1Player2Name: 'Archana Pillai',
        team2Player1Name: 'Komal Thakur',
        team2Player2Name: 'Prerna Soni',
        email1: 'vidya@mit.com',
        email2: 'komal@coep.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: '',
        doublesMatchWinnerName1: '',
        doublesMatchWinnerName2: '',
        isMatchComplete: false,
        court: 'Court 5',
        sets: []
    },
    'gd5': {
        _id: 'gd5',
        matchNumber: 1,
        team1Player1Name: 'Ishita Malhotra',
        team1Player2Name: 'Ritika Saxena',
        team2Player1Name: 'Gargi Bose',
        team2Player2Name: 'Myra Kapoor',
        email1: 'ishita@vit.com',
        email2: 'gargi@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: '',
        doublesMatchWinnerName1: '',
        doublesMatchWinnerName2: '',
        isMatchComplete: false,
        court: 'Court 4',
        sets: []
    },
    'gd6': {
        _id: 'gd6',
        matchNumber: 2,
        team1Player1Name: 'Varsha Pandey',
        team1Player2Name: 'Nidhi Yadav',
        team2Player1Name: 'Shweta Khanna',
        team2Player2Name: 'Palak Arora',
        email1: 'varsha@vit.com',
        email2: 'shweta@pict.com',
        singlesMatchStatus: 'upcoming',
        numberOfSet: 0,
        maxSetPoint: 21,
        doublesMatchWinnerEmail: '',
        doublesMatchWinnerName1: '',
        doublesMatchWinnerName2: '',
        isMatchComplete: false,
        court: 'Court 5',
        sets: []
    }
};

// Dummy Data for Girls Sets
const DUMMY_SETS_GIRLS = {
    'gset1': {
        _id: 'gset1',
        maxPoint: 21,
        player1point: 21,
        player2point: 15,
        isSetComplete: true,
        setWinnerEmail: 'priya@pccoe.com',
        pointHistory: []
    },
    'gset2': {
        _id: 'gset2',
        maxPoint: 21,
        player1point: 21,
        player2point: 18,
        isSetComplete: true,
        setWinnerEmail: 'priya@pccoe.com',
        pointHistory: []
    },
    'gset3': {
        _id: 'gset3',
        maxPoint: 21,
        player1point: 19,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'anjali@pccoer.com',
        pointHistory: []
    },
    'gset4': {
        _id: 'gset4',
        maxPoint: 21,
        player1point: 21,
        player2point: 16,
        isSetComplete: true,
        setWinnerEmail: 'sneha@pccoe.com',
        pointHistory: []
    },
    'gset5': {
        _id: 'gset5',
        maxPoint: 21,
        player1point: 21,
        player2point: 19,
        isSetComplete: true,
        setWinnerEmail: 'sneha@pccoe.com',
        pointHistory: []
    },
    'gset6': {
        _id: 'gset6',
        maxPoint: 21,
        player1point: 21,
        player2point: 18,
        isSetComplete: true,
        setWinnerEmail: 'sneha@pccoe.com',
        pointHistory: []
    },
    'gset7': {
        _id: 'gset7',
        maxPoint: 21,
        player1point: 21,
        player2point: 14,
        isSetComplete: true,
        setWinnerEmail: 'riya@pccoe.com',
        pointHistory: []
    },
    'gset8': {
        _id: 'gset8',
        maxPoint: 21,
        player1point: 21,
        player2point: 17,
        isSetComplete: true,
        setWinnerEmail: 'riya@pccoe.com',
        pointHistory: []
    },
    'gset9': {
        _id: 'gset9',
        maxPoint: 21,
        player1point: 21,
        player2point: 19,
        isSetComplete: true,
        setWinnerEmail: 'riya@pccoe.com',
        pointHistory: []
    },
    'gset10': {
        _id: 'gset10',
        maxPoint: 21,
        player1point: 18,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'divya@coep.com',
        pointHistory: []
    },
    'gset11': {
        _id: 'gset11',
        maxPoint: 21,
        player1point: 20,
        player2point: 22,
        isSetComplete: true,
        setWinnerEmail: 'divya@coep.com',
        pointHistory: []
    },
    'gset12': {
        _id: 'gset12',
        maxPoint: 21,
        player1point: 19,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'simran@coep.com',
        pointHistory: []
    },
    'gset13': {
        _id: 'gset13',
        maxPoint: 21,
        player1point: 21,
        player2point: 18,
        isSetComplete: true,
        setWinnerEmail: 'aisha@mit.com',
        pointHistory: []
    },
    'gset14': {
        _id: 'gset14',
        maxPoint: 21,
        player1point: 18,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'simran@coep.com',
        pointHistory: []
    },
    'gset15': {
        _id: 'gset15',
        maxPoint: 21,
        player1point: 20,
        player2point: 22,
        isSetComplete: true,
        setWinnerEmail: 'tanvi@coep.com',
        pointHistory: []
    },
    'gset16': {
        _id: 'gset16',
        maxPoint: 21,
        player1point: 17,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'tanvi@coep.com',
        pointHistory: []
    },
    'gset17': {
        _id: 'gset17',
        maxPoint: 21,
        player1point: 19,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'tanvi@coep.com',
        pointHistory: []
    },
    'gset18': {
        _id: 'gset18',
        maxPoint: 21,
        player1point: 21,
        player2point: 16,
        isSetComplete: true,
        setWinnerEmail: 'sakshi@pccoe.com',
        pointHistory: []
    },
    'gset19': {
        _id: 'gset19',
        maxPoint: 21,
        player1point: 21,
        player2point: 19,
        isSetComplete: true,
        setWinnerEmail: 'sakshi@pccoe.com',
        pointHistory: []
    },
    'gset20': {
        _id: 'gset20',
        maxPoint: 21,
        player1point: 21,
        player2point: 18,
        isSetComplete: true,
        setWinnerEmail: 'sakshi@pccoe.com',
        pointHistory: []
    },
    'gset21': {
        _id: 'gset21',
        maxPoint: 21,
        player1point: 18,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'nikita@pccoer.com',
        pointHistory: []
    },
    'gset22': {
        _id: 'gset22',
        maxPoint: 21,
        player1point: 19,
        player2point: 21,
        isSetComplete: true,
        setWinnerEmail: 'nikita@pccoer.com',
        pointHistory: []
    },
    'gset23': {
        _id: 'gset23',
        maxPoint: 21,
        player1point: 20,
        player2point: 22,
        isSetComplete: true,
        setWinnerEmail: 'nikita@pccoer.com',
        pointHistory: []
    },
    'gset24': {
        _id: 'gset24',
        maxPoint: 21,
        player1point: 21,
        player2point: 18,
        isSetComplete: true,
        setWinnerEmail: 'ananya@mit.com',
        pointHistory: []
    },
    'gset25': {
        _id: 'gset25',
        maxPoint: 21,
        player1point: 21,
        player2point: 19,
        isSetComplete: true,
        setWinnerEmail: 'ananya@mit.com',
        pointHistory: []
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the matches list page
    const matchesContainer = document.getElementById('matchesContainer');
    if (matchesContainer) {
        initializeApp();
    }
});

function initializeApp() {
    // Set up event listeners
    setupFilterTabs();
    setupDetailTabs();
    
    // Load initial data
    loadMatches('all');
}

// Toggle Gender
function toggleGender() {
    const switchInput = document.getElementById('genderSwitch');
    const boysLabel = document.getElementById('boysLabel');
    const girlsLabel = document.getElementById('girlsLabel');
    
    if (switchInput.checked) {
        currentGender = 'girls';
        boysLabel.classList.remove('active');
        girlsLabel.classList.add('active');
    } else {
        currentGender = 'boys';
        girlsLabel.classList.remove('active');
        boysLabel.classList.add('active');
    }
    
    // Reload matches for the selected gender
    const activeFilter = document.querySelector('.filter-tabs .tab-btn.active');
    const filter = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
    loadMatches(filter);
}

// Setup Filter Tabs
function setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const filter = tab.getAttribute('data-filter');
            loadMatches(filter);
        });
    });
}

// Setup Detail Tabs
function setupDetailTabs() {
    const detailTabs = document.querySelectorAll('.tab-btn-detail');
    detailTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            detailTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const tabName = tab.getAttribute('data-tab');
            const tabPanes = document.querySelectorAll('.tab-pane');
            tabPanes.forEach(pane => pane.classList.remove('active'));
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });
}

// Load Matches
async function loadMatches(filter) {
    const loading = document.getElementById('loading');
    const matchesContainer = document.getElementById('matchesContainer');
    const noMatches = document.getElementById('noMatches');
    
    loading.style.display = 'block';
    matchesContainer.innerHTML = '';
    noMatches.style.display = 'none';
    
    try {
        let matches;
        if (USE_DUMMY_DATA) {
            // Select matches based on current gender
            matches = currentGender === 'boys' ? DUMMY_MATCHES_BOYS : DUMMY_MATCHES_GIRLS;
            
            if (filter !== 'all') {
                matches = matches.filter(m => m.matchStatus === filter);
            }
        } else {
            console.log('Fetching matches from API...');
            const endpoint = filter === 'all' ? '/matches' : `/matches/status/${filter}`;
            const response = await fetch(API_BASE_URL + endpoint);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }
            
            matches = await response.json();
            console.log('Fetched', matches.length, 'matches from database');
            
            // Note: Schema doesn't have gender field, so showing all matches
            // If you need gender filter, add gender field to schema
        }
        
        // Sort matches: live first, then upcoming, then complete
        matches.sort((a, b) => {
            const statusOrder = { 'live': 1, 'upcoming': 2, 'complete': 3 };
            return (statusOrder[a.matchStatus] || 999) - (statusOrder[b.matchStatus] || 999);
        });
        
        loading.style.display = 'none';
        
        if (matches.length === 0) {
            noMatches.style.display = 'block';
        } else {
            displayMatches(matches);
        }
    } catch (error) {
        console.error('Error loading matches:', error);
        loading.style.display = 'none';
        matchesContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ff4444;">
                <h3>❌ Error Loading Matches</h3>
                <p>${error.message}</p>
                <p style="margin-top: 15px; color: #666;">
                    ${USE_DUMMY_DATA ? 'Check browser console for details' : 'Make sure server is running and database is populated'}
                </p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

// Display Matches
function displayMatches(matches) {
    const matchesContainer = document.getElementById('matchesContainer');
    matchesContainer.innerHTML = '';
    
    matches.forEach(match => {
        const matchCard = createMatchCard(match);
        matchesContainer.appendChild(matchCard);
    });
}

// Create Match Card
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.onclick = () => showMatchDetail(match._id);
    
    const status = match.matchStatus || 'upcoming';
    const statusClass = status.toLowerCase();
    const statusText = status.toUpperCase();
    const score = match.score || [0, 0];
    
    card.innerHTML = `
        <div class="match-card-header">
            <span class="match-status ${statusClass}">${statusText}</span>
            <span class="match-date-time">${match.date || '-'} | ${match.time || '-'}</span>
        </div>
        <div class="match-teams">
            <div class="team">
                <div class="team-name">${match.college1Name || '-'}</div>
                <div class="team-score">${score[0] !== undefined ? score[0] : '-'}</div>
            </div>
            <div class="vs">VS</div>
            <div class="team">
                <div class="team-name">${match.college2Name || '-'}</div>
                <div class="team-score">${score[1] !== undefined ? score[1] : '-'}</div>
            </div>
        </div>
    `;
    
    return card;
}

// Show Match Detail - Navigate to new page
async function showMatchDetail(matchId) {
    // Navigate to the match detail page
    window.location.href = `/match/${matchId}`;
}

// Display Match Detail
function displayMatchDetail(match) {
    // Match Header
    const matchHeader = document.getElementById('matchHeader');
    matchHeader.innerHTML = `
        <div class="match-title">
            <h1 class="colleges">${match.college1Name} vs ${match.college2Name}</h1>
            <span class="match-status-badge ${match.matchStatus}">${match.matchStatus.toUpperCase()}</span>
        </div>
        <div class="match-details-info">
            <div>
                <strong>Date:</strong>
                <span>${match.date}</span>
            </div>
            <div>
                <strong>Time:</strong>
                <span>${match.time}</span>
            </div>
            <div>
                <strong>Referee:</strong>
                <span>${match.refreeName}</span>
            </div>
        </div>
    `;
    
    // Overall Score
    const overallScoreContainer = document.getElementById('overallScoreContainer');
    const winnerClass1 = match.score[0] > match.score[1] ? 'winner' : 'loser';
    const winnerClass2 = match.score[1] > match.score[0] ? 'winner' : 'loser';
    
    overallScoreContainer.innerHTML = `
        <div class="overall-score">
            <h2>Overall Score</h2>
            <div class="score-display-overall">
                <div class="college-score ${winnerClass1}">${match.score[0]}</div>
                <div class="vs">-</div>
                <div class="college-score ${winnerClass2}">${match.score[1]}</div>
            </div>
        </div>
    `;
    
    // Submatches
    const submatchesContainer = document.getElementById('submatchesContainer');
    submatchesContainer.innerHTML = '';
    
    // Singles Matches
    if (match.singlesMatches && match.singlesMatches.length > 0) {
        const singlesSection = document.createElement('div');
        singlesSection.className = 'submatch-section';
        singlesSection.innerHTML = '<h2>Singles Matches</h2>';
        
        match.singlesMatches.forEach(singles => {
            const singlesCard = createSubmatchCard(singles, 'singles');
            singlesSection.appendChild(singlesCard);
        });
        
        submatchesContainer.appendChild(singlesSection);
    }
    
    // Doubles Matches
    if (match.doublesMatches && match.doublesMatches.length > 0) {
        const doublesSection = document.createElement('div');
        doublesSection.className = 'submatch-section';
        doublesSection.innerHTML = '<h2>Doubles Matches</h2>';
        
        match.doublesMatches.forEach(doubles => {
            const doublesCard = createSubmatchCard(doubles, 'doubles');
            doublesSection.appendChild(doublesCard);
        });
        
        submatchesContainer.appendChild(doublesSection);
    }
}

// Create Submatch Card
function createSubmatchCard(submatch, type) {
    const card = document.createElement('div');
    card.className = 'submatch-card';
    card.onclick = () => showSubmatchDetail(submatch._id, type);
    
    const statusClass = submatch.singlesMatchStatus.toLowerCase();
    const statusText = submatch.singlesMatchStatus.toUpperCase();
    
    // Determine if this is a girls' match by checking the ID prefix
    const isGirls = submatch._id.startsWith('g');
    const setsData = isGirls ? DUMMY_SETS_GIRLS : DUMMY_SETS;
    
    let player1Display, player2Display, score1, score2;
    
    if (type === 'singles') {
        player1Display = submatch.player1Name;
        player2Display = submatch.player2Name;
        
        // Calculate scores from sets
        score1 = 0;
        score2 = 0;
        submatch.sets.forEach(setId => {
            const setData = setsData[setId];
            if (setData) {
                if (setData.setWinnerEmail === submatch.email1) score1++;
                else if (setData.setWinnerEmail === submatch.email2) score2++;
            }
        });
    } else {
        player1Display = `${submatch.team1Player1Name} / ${submatch.team1Player2Name}`;
        player2Display = `${submatch.team2Player1Name} / ${submatch.team2Player2Name}`;
        
        // Calculate scores from sets
        score1 = 0;
        score2 = 0;
        submatch.sets.forEach(setId => {
            const setData = setsData[setId];
            if (setData) {
                if (setData.setWinnerEmail === submatch.email1) score1++;
                else if (setData.setWinnerEmail === submatch.email2) score2++;
            }
        });
    }
    
    const winner1 = type === 'singles' ? 
        (submatch.singlesMatchWinnerEmail === submatch.email1 ? 'winner' : '') :
        (submatch.doublesMatchWinnerEmail === submatch.email1 ? 'winner' : '');
    
    const winner2 = type === 'singles' ?
        (submatch.singlesMatchWinnerEmail === submatch.email2 ? 'winner' : '') :
        (submatch.doublesMatchWinnerEmail === submatch.email2 ? 'winner' : '');
    
    // Determine winner name for display
    let winnerName = '';
    if (submatch.isMatchComplete) {
        if (type === 'singles') {
            winnerName = submatch.singlesMatchWinnerName;
        } else {
            winnerName = submatch.doublesMatchWinnerName1 && submatch.doublesMatchWinnerName2 
                ? `${submatch.doublesMatchWinnerName1} / ${submatch.doublesMatchWinnerName2}`
                : '';
        }
    }
    
    card.innerHTML = `
        <div class="submatch-header">
            <div class="submatch-title">${type === 'singles' ? 'Singles' : 'Doubles'} ${submatch.matchNumber}</div>
            <span class="submatch-status ${statusClass}">${statusText}</span>
        </div>
        <div class="submatch-players-vertical">
            <div class="player-row">
                <div class="player-name ${winner1}">${player1Display}</div>
                <div class="player-score">${score1}</div>
            </div>
            <div class="player-row">
                <div class="player-name ${winner2}">${player2Display}</div>
                <div class="player-score">${score2}</div>
            </div>
        </div>
        ${winnerName ? `<div class="winner-announcement">${winnerName} won the match</div>` : ''}
        <div class="court-info">🏸 ${submatch.court}</div>
    `;
    
    return card;
}

// Show Submatch Detail
async function showSubmatchDetail(submatchId, type) {
    currentSubmatchId = submatchId;
    currentSubmatchType = type;
    
    try {
        let submatchData;
        if (USE_DUMMY_DATA) {
            // Determine if this is a girls' match by checking the ID prefix
            const isGirls = submatchId.startsWith('g');
            
            // Select appropriate data source
            const singlesData = isGirls ? DUMMY_SINGLES_GIRLS : DUMMY_SINGLES;
            const doublesData = isGirls ? DUMMY_DOUBLES_GIRLS : DUMMY_DOUBLES;
            const setsData = isGirls ? DUMMY_SETS_GIRLS : DUMMY_SETS;
            
            const submatch = type === 'singles' ? singlesData[submatchId] : doublesData[submatchId];
            submatchData = {
                ...submatch,
                setsData: submatch.sets.map(setId => setsData[setId])
            };
        } else {
            const endpoint = type === 'singles' ? 
                `/matches/singles/${submatchId}` : 
                `/matches/doubles/${submatchId}`;
            const response = await fetch(API_BASE_URL + endpoint);
            submatchData = await response.json();
        }
        
        displaySubmatchDetail(submatchData, type);
        
        // Switch views
        document.getElementById('matchDetailView').classList.remove('active');
        document.getElementById('submatchDetailView').classList.add('active');
    } catch (error) {
        console.error('Error loading submatch details:', error);
        alert('Error loading submatch details');
    }
}

// Display Submatch Detail
function displaySubmatchDetail(submatch, type) {
    // Match Info Header
    const matchInfo = document.getElementById('matchInfo');
    const matchType = type === 'singles' ? 
        `Singles Match ${submatch.matchNumber}` : 
        `Doubles Match ${submatch.matchNumber}`;
    
    matchInfo.innerHTML = `
        <h1>${matchType}</h1>
        <p class="match-type">${submatch.court}</p>
    `;
    
    // Score Section
    const scoreSection = document.getElementById('scoreSection');
    
    let player1Name, player2Name, player1Initial, player2Initial;
    let winnerEmail, score1 = 0, score2 = 0;
    
    if (type === 'singles') {
        player1Name = submatch.player1Name;
        player2Name = submatch.player2Name;
        player1Initial = player1Name.charAt(0);
        player2Initial = player2Name.charAt(0);
        winnerEmail = submatch.singlesMatchWinnerEmail;
    } else {
        player1Name = `${submatch.team1Player1Name} / ${submatch.team1Player2Name}`;
        player2Name = `${submatch.team2Player1Name} / ${submatch.team2Player2Name}`;
        player1Initial = submatch.team1Player1Name.charAt(0) + submatch.team1Player2Name.charAt(0);
        player2Initial = submatch.team2Player1Name.charAt(0) + submatch.team2Player2Name.charAt(0);
        winnerEmail = submatch.doublesMatchWinnerEmail;
    }
    
    // Calculate match score from sets
    submatch.setsData.forEach(set => {
        if (set.setWinnerEmail === submatch.email1) score1++;
        else if (set.setWinnerEmail === submatch.email2) score2++;
    });
    
    const winner1Class = winnerEmail === submatch.email1 ? 'winner' : '';
    const winner2Class = winnerEmail === submatch.email2 ? 'winner' : '';
    
    const matchStatusText = submatch.isMatchComplete ? 'FINISHED' : 'IN PROGRESS';
    const matchStatusClass = submatch.isMatchComplete ? 'finished' : '';
    
    scoreSection.innerHTML = `
        <div class="players-score">
            <div class="player-card ${winner1Class}">
                <div class="player-photo">${player1Initial}</div>
                <div class="player-name-detail">${player1Name}</div>
                <div class="player-rank">Player 1</div>
            </div>
            <div class="score-display">${score1} - ${score2}</div>
            <div class="player-card ${winner2Class}">
                <div class="player-photo">${player2Initial}</div>
                <div class="player-name-detail">${player2Name}</div>
                <div class="player-rank">Player 2</div>
            </div>
        </div>
        <div class="match-status-label ${matchStatusClass}">${matchStatusText}</div>
    `;
    
    // Score Table (Summary Tab)
    displayScoreSummary(submatch, player1Name, player2Name);
    
    // Point History Tab
    displayPointHistory(submatch, player1Name, player2Name);
}

// Display Score Summary
function displayScoreSummary(submatch, player1Name, player2Name) {
    const scoreTable = document.getElementById('scoreTable');
    
    let setsHTML = '<h3>Set Scores</h3><div class="sets-grid">';
    
    submatch.setsData.forEach((set, index) => {
        const winner1 = set.setWinnerEmail === submatch.email1 ? 'winner' : '';
        const winner2 = set.setWinnerEmail === submatch.email2 ? 'winner' : '';
        
        setsHTML += `
            <div class="set-row">
                <div class="set-label">Set ${index + 1}</div>
                <span class="set-score ${winner1}">${set.player1point}</span>
                <span class="set-score ${winner2}">${set.player2point}</span>
            </div>
        `;
    });
    
    setsHTML += '</div>';
    scoreTable.innerHTML = setsHTML;
}

// Display Point History
function displayPointHistory(submatch, player1Name, player2Name) {
    const pointHistory = document.getElementById('pointHistory');
    
    let historyHTML = '<h3>Point by Point History</h3>';
    
    // Create Set Tabs
    historyHTML += '<div class="set-tabs">';
    submatch.setsData.forEach((set, setIndex) => {
        const activeClass = setIndex === 0 ? 'active' : '';
        historyHTML += `
            <button class="set-tab-btn ${activeClass}" onclick="showSetHistory(${setIndex})">
                SET ${setIndex + 1}
            </button>
        `;
    });
    historyHTML += '</div>';
    
    // Create Set Content
    submatch.setsData.forEach((set, setIndex) => {
        const activeClass = setIndex === 0 ? 'active' : '';
        if (set.pointHistory && set.pointHistory.length > 0) {
            historyHTML += `
                <div class="set-history ${activeClass}" id="set-history-${setIndex}">
                    <h4>Set ${setIndex + 1} - ${set.player1point} : ${set.player2point}</h4>
                    <div class="points-list">
            `;
            
            set.pointHistory.forEach(point => {
                historyHTML += `
                    <div class="point-item">
                        <div class="point-number">${point.pointNumber}</div>
                        <div class="point-scores">${point.player1Score} - ${point.player2Score}</div>
                        <div class="point-serve">Serve: ${point.serve}</div>
                    </div>
                `;
            });
            
            historyHTML += '</div></div>';
        } else {
            historyHTML += `
                <div class="set-history ${activeClass}" id="set-history-${setIndex}">
                    <h4>Set ${setIndex + 1} - ${set.player1point} : ${set.player2point}</h4>
                    <p style="color: #999; padding: 20px 0; text-align: center;">No point history available for this set</p>
                </div>
            `;
        }
    });
    
    pointHistory.innerHTML = historyHTML;
}

// Show Set History by Index
function showSetHistory(setIndex) {
    // Hide all set histories
    const allSetHistories = document.querySelectorAll('.set-history');
    allSetHistories.forEach(history => history.classList.remove('active'));
    
    // Remove active class from all tabs
    const allTabs = document.querySelectorAll('.set-tab-btn');
    allTabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected set history
    const selectedHistory = document.getElementById(`set-history-${setIndex}`);
    if (selectedHistory) {
        selectedHistory.classList.add('active');
    }
    
    // Activate selected tab
    const tabs = document.querySelectorAll('.set-tab-btn');
    if (tabs[setIndex]) {
        tabs[setIndex].classList.add('active');
    }
}

// Navigation Functions
function showMatchesList() {
    document.getElementById('matchDetailView').classList.remove('active');
    document.getElementById('submatchDetailView').classList.remove('active');
    document.getElementById('matchesListView').classList.add('active');
}

function goBackToMatchDetail() {
    document.getElementById('submatchDetailView').classList.remove('active');
    document.getElementById('matchDetailView').classList.add('active');
    
    // Reset tabs to summary
    document.querySelectorAll('.tab-btn-detail').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelector('.tab-btn-detail[data-tab="summary"]').classList.add('active');
    document.getElementById('summaryTab').classList.add('active');
}
