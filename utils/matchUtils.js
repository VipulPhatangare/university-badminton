/**
 * Utility functions for match management and round advancement
 */

/**
 * Advance winner college to next round and eliminate loser college
 * @param {string} winnerEmail - Winner college email
 * @param {string} loserEmail - Loser college email  
 * @param {string} matchType - 'boys' or 'girls'
 * @param {Object} collegeInfo - College model from schema
 */
async function advanceCollegeRound(winnerEmail, loserEmail, matchType, collegeInfo) {
    try {
        // Determine next round mapping
        const rounds = ['round_1', 'round_2', 'quater', 'semi', 'final'];
        
        // Load colleges
        const winnerCollege = await collegeInfo.findOne({ email: winnerEmail });
        const loserCollege = loserEmail ? await collegeInfo.findOne({ email: loserEmail }) : null;
        
        if (winnerCollege) {
            // Advance to next round (if not final)
            const roundField = (matchType === 'girls') ? 'currentRoundGirls' : 'currentRoundBoys';
            const allocationField = (matchType === 'girls') ? 'isMatchAllocateGirls' : 'isMatchAllocateBoys';
            
            let idx = rounds.indexOf(winnerCollege[roundField]);
            if (idx === -1) idx = 0; // if null or unknown, treat as round_1
            if (idx < rounds.length - 1) {
                winnerCollege[roundField] = rounds[idx + 1];
            } else {
                winnerCollege[roundField] = 'final';
            }
            
            // Reset the match allocation status so college can be allocated to new matches in next round
            winnerCollege[allocationField] = false;
            
            await winnerCollege.save();
            
            console.log(`Advanced winner college ${winnerCollege.collegeName} from round ${idx} to ${winnerCollege[roundField]} and reset allocation status`);
        }
        
        if (loserCollege) {
            const roundField = (matchType === 'girls') ? 'currentRoundGirls' : 'currentRoundBoys';
            const allocationField = (matchType === 'girls') ? 'isMatchAllocateGirls' : 'isMatchAllocateBoys';
            
            loserCollege[roundField] = null;
            // Reset the match allocation status for eliminated college
            loserCollege[allocationField] = false;
            
            await loserCollege.save();
            
            console.log(`Eliminated loser college ${loserCollege.collegeName} and reset allocation status`);
        }
        
        return {
            success: true,
            winnerAdvanced: !!winnerCollege,
            loserEliminated: !!loserCollege
        };
        
    } catch (error) {
        console.error('Error advancing college rounds:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get the next round name
 * @param {string} currentRound - Current round name
 * @returns {string} Next round name
 */
function getNextRound(currentRound) {
    const roundProgression = {
        'round_1': 'round_2',
        'round_2': 'quater', 
        'quater': 'semi',
        'semi': 'final',
        'final': 'champion'
    };
    
    return roundProgression[currentRound] || currentRound;
}

/**
 * Get tournament format based on round
 * @param {string} round - Tournament round
 * @returns {Object} Tournament format configuration
 */
function getTournamentFormat(round) {
    const roundLower = round ? round.toLowerCase() : 'round_1';
    
    // All rounds now use Best of 5 format (3 singles + 2 doubles, need 3 wins)
    // This includes round_1, round_2, quarter, semi, and final rounds
    return {
        matchFormat: 'best_of_5',
        requiredWins: 3,
        totalMatches: 5,
        matchTypes: ['singles', 'singles', 'doubles', 'singles', 'doubles'], // S-S-D-S-D format
        matchNames: ['Singles 1', 'Singles 2', 'Doubles 1', 'Singles 3', 'Doubles 2']
    };
}

module.exports = {
    advanceCollegeRound,
    getNextRound,
    getTournamentFormat
};