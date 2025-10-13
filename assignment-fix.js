// Enhanced Admin Dashboard Assignment Functions
// This file contains the missing assignment functionality for the admin dashboard

// Function to assign referee and players to a match
async function assignMatchRefereeAndPlayers(matchId, refereeId, playerAssignments) {
    try {
        const response = await fetch(`/api/admin/assign-referee-to-match`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matchId: matchId,
                refereeEmail: refereeId, // This should actually be referee email or we need to update
                gender: 'boys', // Default to boys for now
                ...playerAssignments
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Assignment successful:', result);
            showAlert('Match assigned successfully!', 'success');
            return result.match;
        } else {
            throw new Error(result.message || 'Assignment failed');
        }
    } catch (error) {
        console.error('Error assigning match:', error);
        showAlert('Error assigning match: ' + error.message, 'error');
        return null;
    }
}

// Function to submit complete match assignment (referee + all players)
async function submitMatchAssignment() {
    try {
        if (!currentSetupMatch) {
            throw new Error('No match selected for assignment');
        }

        // Collect referee assignment
        const refereeSelect = document.getElementById('referee-select');
        if (!refereeSelect || !refereeSelect.value) {
            throw new Error('Please select a referee');
        }

        // Collect all player assignments
        const playerAssignments = {};
        let playerCount = 0;
        
        // Boys match: 5 sub-matches (Singles 1, Singles 2, Doubles 1, Singles 3, Doubles 2)
        const matchTypes = [
            { num: 1, type: 'singles' },
            { num: 2, type: 'singles' },
            { num: 3, type: 'doubles' },
            { num: 4, type: 'singles' },
            { num: 5, type: 'doubles' }
        ];

        const subMatches = [];

        for (const match of matchTypes) {
            const subMatch = {
                matchNumber: match.num,
                refereeId: refereeSelect.value, // Same referee for all sub-matches for now
                type: match.type
            };

            if (match.type === 'singles') {
                const player1Select = document.getElementById(`match${match.num}_player1`);
                const player2Select = document.getElementById(`match${match.num}_player2`);
                
                if (!player1Select?.value || !player2Select?.value) {
                    throw new Error(`Please select players for Match ${match.num} (Singles)`);
                }
                
                subMatch.team1Player = player1Select.value;
                subMatch.team2Player = player2Select.value;
                playerCount += 2;
            } else {
                // Doubles
                const team1Player1 = document.getElementById(`match${match.num}_team1_player1`);
                const team1Player2 = document.getElementById(`match${match.num}_team1_player2`);
                const team2Player1 = document.getElementById(`match${match.num}_team2_player1`);
                const team2Player2 = document.getElementById(`match${match.num}_team2_player2`);
                
                if (!team1Player1?.value || !team1Player2?.value || 
                    !team2Player1?.value || !team2Player2?.value) {
                    throw new Error(`Please select all players for Match ${match.num} (Doubles)`);
                }
                
                subMatch.team1Player1 = team1Player1.value;
                subMatch.team1Player2 = team1Player2.value;
                subMatch.team2Player1 = team2Player1.value;
                subMatch.team2Player2 = team2Player2.value;
                playerCount += 4;
            }
            
            subMatches.push(subMatch);
        }

        // Validate we have all required players assigned
        if (playerCount < 10) {
            throw new Error('Please assign all required players (10 total for boys match)');
        }

        // Submit the assignment
        const assignmentData = {
            matchId: currentSetupMatch._id,
            gender: 'boys',
            subMatches: subMatches
        };

        console.log('Submitting assignment:', assignmentData);

        const response = await fetch('/api/admin/matches/assign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignmentData)
        });

        const result = await response.json();
        
        if (result.success) {
            showAlert('Match assignment completed successfully!', 'success');
            closeSetupModal();
            loadAllMatches(); // Refresh the matches display
            return true;
        } else {
            throw new Error(result.error || 'Assignment failed');
        }

    } catch (error) {
        console.error('Error submitting match assignment:', error);
        showAlert('Error: ' + error.message, 'error');
        return false;
    }
}

// Function to validate no player is assigned twice
function validatePlayerAssignments() {
    const assignedPlayers = new Set();
    let isValid = true;
    let duplicatePlayer = '';

    // Check all player dropdowns
    const playerSelects = document.querySelectorAll('.player-select');
    
    playerSelects.forEach(select => {
        if (select.value) {
            if (assignedPlayers.has(select.value)) {
                isValid = false;
                // Find player name for error message
                const option = select.querySelector(`option[value="${select.value}"]`);
                duplicatePlayer = option ? option.textContent : select.value;
            } else {
                assignedPlayers.add(select.value);
            }
        }
    });

    if (!isValid) {
        showAlert(`Player "${duplicatePlayer}" is assigned to multiple matches. Each player can only be assigned once.`, 'error');
    }

    return isValid;
}

// Function to load referee options into dropdown
async function loadRefereeOptions(selectElement) {
    try {
        const response = await fetch('/api/admin/get-referees');
        const result = await response.json();
        
        if (result.success) {
            selectElement.innerHTML = '<option value="">Select Referee</option>';
            
            result.referees.forEach(referee => {
                const option = document.createElement('option');
                option.value = referee._id;
                option.textContent = referee.name;
                selectElement.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading referee options:', error);
    }
}

// Function to load player options for a specific college
async function loadPlayerOptions(selectElement, collegeEmail, teamClass = '') {
    try {
        const response = await fetch(`/api/admin/college/${encodeURIComponent(collegeEmail)}/players`);
        const players = await response.json();
        
        selectElement.innerHTML = '<option value="">Select Player</option>';
        selectElement.className = `form-control player-select ${teamClass}`;
        
        if (players && players.length > 0) {
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player._id;
                option.textContent = player.playerName;
                selectElement.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No players available';
            option.disabled = true;
            selectElement.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading player options:', error);
        selectElement.innerHTML = '<option value="">Error loading players</option>';
    }
}

// Function to add validation listeners
function addValidationListeners() {
    document.addEventListener('change', function(event) {
        if (event.target.classList.contains('player-select')) {
            // Remove any existing error highlighting
            document.querySelectorAll('.player-select').forEach(select => {
                select.style.borderColor = '';
            });
            
            // Validate on each change
            setTimeout(validatePlayerAssignments, 100);
        }
    });
}

// Initialize the assignment system
function initializeAssignmentSystem() {
    addValidationListeners();
    console.log('Assignment system initialized');
}

// Export functions for global use (if needed)
if (typeof window !== 'undefined') {
    window.assignMatchRefereeAndPlayers = assignMatchRefereeAndPlayers;
    window.submitMatchAssignment = submitMatchAssignment;
    window.validatePlayerAssignments = validatePlayerAssignments;
    window.loadRefereeOptions = loadRefereeOptions;
    window.loadPlayerOptions = loadPlayerOptions;
    window.initializeAssignmentSystem = initializeAssignmentSystem;
}