// ===========================
// ADMIN DASHBOARD JAVASCRIPT
// ===========================

const API_BASE_URL = 'http://localhost:3000';

// Global state
let currentCollegeData = null;
let currentGender = 'boys';
let editingPlayer = null;
let editingReferee = null;
let confirmCallback = null;

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadColleges();
});

function initializeEventListeners() {
    // Sidebar menu
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchSection(btn.dataset.section);
        });
    });

    // Search inputs with debounce
    const collegeSearch = document.getElementById('collegeSearch');
    const refereeSearch = document.getElementById('refereeSearch');
    
    collegeSearch.addEventListener('input', debounce(() => {
        loadColleges(collegeSearch.value);
    }, 300));
    
    refereeSearch.addEventListener('input', debounce(() => {
        loadReferees(refereeSearch.value);
    }, 300));

    // Forms
    document.getElementById('playerForm').addEventListener('submit', handlePlayerSubmit);
    document.getElementById('refereeForm').addEventListener('submit', handleRefereeSubmit);

    // Modal close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeAllModals();
            }
        });
    });
}

// ===========================
// UTILITY FUNCTIONS
// ===========================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showToast(message, type = 'success') {
    // Simple alert for now, you can enhance this later
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    alert(`${icon} ${message}`);
}

// ===========================
// SECTION SWITCHING
// ===========================
function switchSection(sectionName) {
    // Update sidebar
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    if (sectionName === 'colleges') {
        document.getElementById('collegesSection').classList.add('active');
        loadColleges();
    } else if (sectionName === 'referees') {
        document.getElementById('refereesSection').classList.add('active');
        loadReferees();
    } else if (sectionName === 'matches') {
        document.getElementById('matchesSection').classList.add('active');
        loadMatches();
    }
}

// ===========================
// COLLEGE MANAGEMENT
// ===========================
async function loadColleges(search = '') {
    try {
        const tableBody = document.getElementById('collegesTableBody');
        const loading = document.getElementById('collegesLoading');
        const empty = document.getElementById('collegesEmpty');
        
        // Show loading
        tableBody.innerHTML = '';
        loading.style.display = 'flex';
        empty.style.display = 'none';

        const url = search 
            ? `${API_BASE_URL}/api/admin/colleges?search=${encodeURIComponent(search)}`
            : `${API_BASE_URL}/api/admin/colleges`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch colleges');
        
        const colleges = await response.json();
        
        // Hide loading
        loading.style.display = 'none';
        
        if (colleges.length === 0) {
            empty.style.display = 'flex';
            return;
        }

        // Render table (colleges already include actualBoysCount, actualGirlsCount, and totalPlayers from backend)
        tableBody.innerHTML = colleges.map(college => `
            <tr>
                <td><strong>${college.collegeName}</strong></td>
                <td>${college.email}</td>
                <td>${college.phone || 'Not provided'}</td>
                <td><span class="player-count boys">${college.actualBoysCount || 0}/7</span></td>
                <td><span class="player-count girls">${college.actualGirlsCount || 0}/5</span></td>
                <td><span class="player-count total">${college.totalPlayers || 0}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn btn-view" onclick="viewTeamDetails('${college._id}')" title="View Team">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading colleges:', error);
        document.getElementById('collegesLoading').style.display = 'none';
        showToast('Error loading colleges', 'error');
    }
}

async function viewTeamDetails(collegeId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/admin/colleges/${collegeId}`);
        if (!response.ok) throw new Error('Failed to fetch college details');
        
        const data = await response.json();
        currentCollegeData = data;
        
        // Update modal content
        document.getElementById('teamModalTitle').textContent = `${data.college.collegeName} - Team Details`;
        document.getElementById('modalCollegeName').textContent = data.college.collegeName;
        document.getElementById('modalCollegeEmail').textContent = data.college.email;
        document.getElementById('modalCollegeContact').textContent = data.college.phone || 'Not provided';
        
        // Update counts
        document.getElementById('boysCount').textContent = data.players.boys.length;
        document.getElementById('girlsCount').textContent = data.players.girls.length;
        
        // Set college ID for new players
        document.getElementById('playerCollege').value = data.college._id;
        
        // Load players for current gender
        switchTeamGender('boys');
        
        // Show modal
        document.getElementById('teamModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading team details:', error);
        showToast('Error loading team details', 'error');
    } finally {
        hideLoading();
    }
}

function switchTeamGender(gender) {
    currentGender = gender;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-gender="${gender}"]`).classList.add('active');
    
    // Update players sections
    document.querySelectorAll('.players-list').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${gender}PlayersSection`).classList.add('active');
    
    // Load players
    loadTeamPlayers(gender);
}

function loadTeamPlayers(gender) {
    if (!currentCollegeData) return;
    
    const players = currentCollegeData.players[gender];
    const container = document.getElementById(`${gender}PlayersList`);
    const emptyState = document.getElementById(`${gender}EmptyState`);
    
    if (players.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    container.innerHTML = players.map(player => `
        <div class="player-card">
            <div class="player-card-header">
                <div class="player-info">
                    <h4>${player.playerName}</h4>
                    <p>${player.email}</p>
                </div>
                <div class="player-actions">
                    <button class="action-btn btn-edit" onclick="editPlayer('${player._id}')" title="Edit Player">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="deletePlayer('${player._id}', '${player.playerName}')" title="Delete Player">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function closeTeamModal() {
    document.getElementById('teamModal').classList.remove('active');
    currentCollegeData = null;
}

// ===========================
// PLAYER MANAGEMENT
// ===========================
function openAddPlayerModal() {
    if (!currentCollegeData) return;
    
    editingPlayer = null;
    document.getElementById('playerModalTitle').textContent = 'Add Player';
    document.getElementById('playerSubmitText').textContent = 'Add Player';
    document.getElementById('playerForm').reset();
    document.getElementById('playerCollege').value = currentCollegeData.college.email;
    document.getElementById('playerGender').value = currentGender === 'boys' ? 'male' : 'female';
    document.getElementById('playerModal').classList.add('active');
}

async function editPlayer(playerId) {
    try {
        showLoading();
        
        // Find player in current data
        const allPlayers = [...currentCollegeData.players.boys, ...currentCollegeData.players.girls];
        const player = allPlayers.find(p => p._id === playerId);
        
        if (!player) {
            throw new Error('Player not found');
        }
        
        editingPlayer = player;
        document.getElementById('playerModalTitle').textContent = 'Edit Player';
        document.getElementById('playerSubmitText').textContent = 'Update Player';
        
        // Populate form
        document.getElementById('playerName').value = player.playerName;
        document.getElementById('playerEmail').value = player.email;
        document.getElementById('playerPhone').value = player.phone || '';
        document.getElementById('playerGender').value = player.gender;
        document.getElementById('playerCollege').value = currentCollegeData.college._id;
        
        document.getElementById('playerModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading player for edit:', error);
        showToast('Error loading player details', 'error');
    } finally {
        hideLoading();
    }
}

async function handlePlayerSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const playerData = {
        playerName: formData.get('playerName'),
        email: formData.get('playerEmail'),
        phone: formData.get('playerPhone'),
        gender: formData.get('playerGender'),
        collegeId: formData.get('playerCollege')
    };
    
    // Show confirmation before saving
    const action = editingPlayer ? 'update' : 'add';
    const message = `Are you sure you want to ${action} player "${playerData.playerName}"?`;
    
    showConfirmModal(message, () => submitPlayerData(playerData));
}

async function submitPlayerData(playerData) {
    try {
        showLoading();
        
        let response;
        if (editingPlayer) {
            // Update player
            response = await fetch(`${API_BASE_URL}/api/admin/players/${editingPlayer._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(playerData)
            });
        } else {
            // Add new player
            response = await fetch(`${API_BASE_URL}/api/admin/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(playerData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save player');
        }
        
        showToast(editingPlayer ? 'Player updated successfully' : 'Player added successfully');
        closePlayerModal();
        
        // Refresh team details
        if (currentCollegeData) {
            viewTeamDetails(currentCollegeData.college._id);
        }
        
        // Refresh colleges table
        loadColleges();
        
    } catch (error) {
        console.error('Error saving player:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function deletePlayer(playerId, playerName) {
    showConfirmModal(
        `Are you sure you want to delete player "${playerName}"? This action cannot be undone.`,
        () => confirmDeletePlayer(playerId)
    );
}

async function confirmDeletePlayer(playerId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/admin/players/${playerId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete player');
        }
        
        showToast('Player deleted successfully');
        
        // Refresh team details
        if (currentCollegeData) {
            viewTeamDetails(currentCollegeData.college._id);
        }
        
        // Refresh colleges table
        loadColleges();
        
    } catch (error) {
        console.error('Error deleting player:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function closePlayerModal() {
    document.getElementById('playerModal').classList.remove('active');
    editingPlayer = null;
}

// ===========================
// REFEREE MANAGEMENT
// ===========================
async function loadReferees(search = '') {
    try {
        const tableBody = document.getElementById('refereesTableBody');
        const loading = document.getElementById('refereesLoading');
        const empty = document.getElementById('refereesEmpty');
        
        // Show loading
        tableBody.innerHTML = '';
        loading.style.display = 'flex';
        empty.style.display = 'none';

        const url = search 
            ? `${API_BASE_URL}/api/admin/referees?search=${encodeURIComponent(search)}`
            : `${API_BASE_URL}/api/admin/referees`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch referees');
        
        const referees = await response.json();
        
        // Hide loading
        loading.style.display = 'none';
        
        if (referees.length === 0) {
            empty.style.display = 'flex';
            return;
        }

        // Render table
        tableBody.innerHTML = referees.map(referee => `
            <tr>
                <td><strong>${referee.name}</strong></td>
                <td>${referee.refEmail}</td>
                <td>${referee.createdAt ? new Date(referee.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn btn-edit" onclick="editReferee('${referee._id}')" title="Edit Referee">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn btn-delete" onclick="deleteReferee('${referee._id}', '${referee.name}')" title="Delete Referee">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading referees:', error);
        document.getElementById('refereesLoading').style.display = 'none';
        showToast('Error loading referees', 'error');
    }
}

function openAddRefereeModal() {
    editingReferee = null;
    document.getElementById('refereeModalTitle').textContent = 'Add Referee';
    document.getElementById('refereeSubmitText').textContent = 'Add Referee';
    document.getElementById('refereeForm').reset();
    document.getElementById('refereeModal').classList.add('active');
}

async function editReferee(refereeId) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/admin/referees`);
        if (!response.ok) throw new Error('Failed to fetch referees');
        
        const referees = await response.json();
        const referee = referees.find(r => r._id === refereeId);
        
        if (!referee) {
            throw new Error('Referee not found');
        }
        
        editingReferee = referee;
        document.getElementById('refereeModalTitle').textContent = 'Edit Referee';
        document.getElementById('refereeSubmitText').textContent = 'Update Referee';
        
        // Populate form
        document.getElementById('refereeName').value = referee.name;
        document.getElementById('refereeEmail').value = referee.refEmail;
        document.getElementById('refereePhone').value = referee.phone || '';
        document.getElementById('refereePassword').value = referee.password;
        
        document.getElementById('refereeModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading referee for edit:', error);
        showToast('Error loading referee details', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRefereeSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const refereeData = {
        refereeName: formData.get('refereeName'),
        email: formData.get('refereeEmail'),
        phone: formData.get('refereePhone'),
        password: formData.get('refereePassword')
    };
    
    // Show confirmation before saving
    const action = editingReferee ? 'update' : 'add';
    const message = `Are you sure you want to ${action} referee "${refereeData.refereeName}"?`;
    
    showConfirmModal(message, () => submitRefereeData(refereeData));
}

async function submitRefereeData(refereeData) {
    try {
        showLoading();
        
        let response;
        if (editingReferee) {
            // Update referee
            response = await fetch(`${API_BASE_URL}/api/admin/referees/${editingReferee._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refereeData)
            });
        } else {
            // Add new referee
            response = await fetch(`${API_BASE_URL}/api/admin/referees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(refereeData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save referee');
        }
        
        showToast(editingReferee ? 'Referee updated successfully' : 'Referee added successfully');
        closeRefereeModal();
        loadReferees();
        
    } catch (error) {
        console.error('Error saving referee:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function deleteReferee(refereeId, refereeName) {
    showConfirmModal(
        `Are you sure you want to delete referee "${refereeName}"? This action cannot be undone.`,
        () => confirmDeleteReferee(refereeId)
    );
}

async function confirmDeleteReferee(refereeId) {
    try {
        showLoading();
        
        console.log('Attempting to delete referee with ID:', refereeId);
        const url = `${API_BASE_URL}/api/admin/referees/${refereeId}`;
        console.log('Delete URL:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
            console.error('Delete error response:', error);
            throw new Error(error.error || 'Failed to delete referee');
        }
        
        const result = await response.json();
        console.log('Delete success:', result);
        showToast('Referee deleted successfully');
        loadReferees();
        
    } catch (error) {
        console.error('Error deleting referee:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

function closeRefereeModal() {
    document.getElementById('refereeModal').classList.remove('active');
    editingReferee = null;
}

// ===========================
// CONFIRMATION MODAL
// ===========================
function showConfirmModal(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    document.getElementById('confirmModal').classList.add('active');
    
    // Set up confirm button
    const confirmBtn = document.getElementById('confirmBtn');
    confirmBtn.onclick = () => {
        closeConfirmModal();
        if (confirmCallback) {
            confirmCallback();
        }
    };
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    confirmCallback = null;
}

// ===========================
// MODAL MANAGEMENT
// ===========================
function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
    });
    editingPlayer = null;
    editingReferee = null;
    confirmCallback = null;
}

// ===========================
// MATCH ASSIGNMENT MANAGEMENT
// ===========================

let currentMatchGender = 'boys';
let currentMatchData = null;
let availableReferees = [];
let team1Players = [];
let team2Players = [];

// Switch between boys and girls matches
function switchMatchGender(gender) {
    currentMatchGender = gender;
    
    // Update toggle buttons
    document.querySelectorAll('.match-toggle .toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-gender="${gender}"]`).classList.add('active');
    
    // Update match sections
    document.querySelectorAll('.matches-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${gender}MatchesSection`).classList.add('active');
    
    // Load matches for selected gender
    loadMatches();
}

// Load ongoing matches
async function loadMatches() {
    try {
        const gridId = `${currentMatchGender}MatchesGrid`;
        const loadingId = `${currentMatchGender}MatchesLoading`;
        const emptyId = `${currentMatchGender}MatchesEmpty`;
        
        const grid = document.getElementById(gridId);
        const loading = document.getElementById(loadingId);
        const empty = document.getElementById(emptyId);
        
        // Show loading
        grid.innerHTML = '';
        loading.style.display = 'flex';
        empty.style.display = 'none';
        
        // Fetch matches for current gender
        const response = await fetch(`${API_BASE_URL}/api/admin/matches?gender=${currentMatchGender}&status=upcoming,assigned,partial`);
        if (!response.ok) throw new Error('Failed to fetch matches');
        
        const matches = await response.json();
        
        // Hide loading
        loading.style.display = 'none';
        
        if (matches.length === 0) {
            empty.style.display = 'flex';
            return;
        }
        
        // Render match cards
        grid.innerHTML = matches.map(match => createMatchCard(match)).join('');
        
    } catch (error) {
        console.error('Error loading matches:', error);
        document.getElementById(`${currentMatchGender}MatchesLoading`).style.display = 'none';
        showToast('Error loading matches', 'error');
    }
}

// Create match card HTML
function createMatchCard(match) {
    const statusClass = getMatchStatusClass(match);
    const statusText = getMatchStatusText(match);
    
    return `
        <div class="match-card" onclick="openMatchAssignment('${match._id}')">
            <div class="match-header">
                <span class="match-status ${statusClass}">${statusText}</span>
            </div>
            <div class="match-teams">
                <div class="team-info">
                    <div class="team-name">${match.college1Name}</div>
                    <div class="team-email">${match.email1}</div>
                </div>
                <div class="vs-divider">VS</div>
                <div class="team-info">
                    <div class="team-name">${match.college2Name}</div>
                    <div class="team-email">${match.email2}</div>
                </div>
            </div>
            <div class="match-info">
                <span class="match-round">${match.round}</span>
                <span>${match.date || 'Date TBD'}</span>
                <span>${match.time || 'Time TBD'}</span>
            </div>
        </div>
    `;
}

// Get match status class
function getMatchStatusClass(match) {
    if (!match.refreeId || match.refreeId.length === 0) return 'upcoming';
    
    const requiredMatches = currentMatchGender === 'boys' ? 5 : 3;
    const assignedMatches = (match.refreeId || []).length;
    
    if (assignedMatches === requiredMatches) return 'assigned';
    if (assignedMatches > 0) return 'partial';
    return 'upcoming';
}

// Get match status text
function getMatchStatusText(match) {
    if (!match.refreeId || match.refreeId.length === 0) return 'Not Assigned';
    
    const requiredMatches = currentMatchGender === 'boys' ? 5 : 3;
    const assignedMatches = (match.refreeId || []).length;
    
    if (assignedMatches === requiredMatches) return 'Fully Assigned';
    if (assignedMatches > 0) return `Partially Assigned (${assignedMatches}/${requiredMatches})`;
    return 'Not Assigned';
}

// Open match assignment modal
async function openMatchAssignment(matchId) {
    try {
        showLoading();
        
        // Fetch match details
        const matchResponse = await fetch(`${API_BASE_URL}/api/admin/matches/${matchId}`);
        if (!matchResponse.ok) throw new Error('Failed to fetch match details');
        
        currentMatchData = await matchResponse.json();
        
        // Fetch available referees
        const refereesResponse = await fetch(`${API_BASE_URL}/api/admin/referees`);
        if (!refereesResponse.ok) throw new Error('Failed to fetch referees');
        
        availableReferees = await refereesResponse.json();
        
        // Fetch team players
        const [team1Response, team2Response] = await Promise.all([
            fetch(`${API_BASE_URL}/api/admin/players?college=${encodeURIComponent(currentMatchData.email1)}&gender=${currentMatchGender === 'boys' ? 'male' : 'female'}`),
            fetch(`${API_BASE_URL}/api/admin/players?college=${encodeURIComponent(currentMatchData.email2)}&gender=${currentMatchGender === 'boys' ? 'male' : 'female'}`)
        ]);
        
        if (!team1Response.ok || !team2Response.ok) {
            throw new Error('Failed to fetch team players');
        }
        
        team1Players = await team1Response.json();
        team2Players = await team2Response.json();
        
        // Update modal content
        updateMatchAssignmentModal();
        
        // Show modal
        document.getElementById('matchAssignmentModal').classList.add('active');
        
    } catch (error) {
        console.error('Error opening match assignment:', error);
        showToast('Error loading match details', 'error');
    } finally {
        hideLoading();
    }
}

// Update match assignment modal
function updateMatchAssignmentModal() {
    // Update match info
    document.getElementById('matchAssignmentTitle').textContent = `Match Assignment - ${currentMatchData.college1Name} vs ${currentMatchData.college2Name}`;
    document.getElementById('team1Name').textContent = currentMatchData.college1Name;
    document.getElementById('team1Email').textContent = currentMatchData.email1;
    document.getElementById('team2Name').textContent = currentMatchData.college2Name;
    document.getElementById('team2Email').textContent = currentMatchData.email2;
    document.getElementById('matchRound').textContent = currentMatchData.round;
    document.getElementById('matchGender').textContent = currentMatchGender === 'boys' ? 'Boys' : 'Girls';
    document.getElementById('matchDate').textContent = `Date: ${currentMatchData.date || 'TBD'}`;
    
    // Show appropriate sub-matches section
    if (currentMatchGender === 'boys') {
        document.getElementById('boysSubMatches').style.display = 'block';
        document.getElementById('girlsSubMatches').style.display = 'none';
    } else {
        document.getElementById('boysSubMatches').style.display = 'none';
        document.getElementById('girlsSubMatches').style.display = 'block';
    }
    
    // Populate referee dropdowns
    populateRefereeDropdowns();
    
    // Populate player dropdowns
    populatePlayerDropdowns();
    
    // Load existing assignments if any
    loadExistingAssignments();
}

// Populate referee dropdowns
function populateRefereeDropdowns() {
    const prefix = currentMatchGender === 'boys' ? '' : 'girls';
    const matchCount = currentMatchGender === 'boys' ? 5 : 3;
    
    for (let i = 1; i <= matchCount; i++) {
        const selectId = `${prefix}${prefix ? 'R' : 'r'}eferee${i}`;
        const select = document.getElementById(selectId);
        
        if (select) {
            select.innerHTML = '<option value="">Select Referee</option>';
            availableReferees.forEach(referee => {
                const option = document.createElement('option');
                option.value = referee._id;
                option.textContent = referee.name;
                select.appendChild(option);
            });
        }
    }
}

// Populate player dropdowns
function populatePlayerDropdowns() {
    const prefix = currentMatchGender === 'boys' ? '' : 'girls';
    const matchCount = currentMatchGender === 'boys' ? 5 : 3;
    
    for (let i = 1; i <= matchCount; i++) {
        // Singles matches
        if ((currentMatchGender === 'boys' && (i === 1 || i === 2 || i === 4)) || 
            (currentMatchGender === 'girls' && (i === 1 || i === 3))) {
            
            const team1SelectId = `${prefix}${prefix ? 'T' : 't'}eam1Match${i}`;
            const team2SelectId = `${prefix}${prefix ? 'T' : 't'}eam2Match${i}`;
            
            populatePlayerSelect(team1SelectId, team1Players);
            populatePlayerSelect(team2SelectId, team2Players);
        }
        // Doubles matches
        else {
            const matchNum = currentMatchGender === 'boys' ? (i === 3 ? 3 : 5) : 2;
            
            const team1Player1Id = `${prefix}${prefix ? 'T' : 't'}eam1Match${matchNum}Player1`;
            const team1Player2Id = `${prefix}${prefix ? 'T' : 't'}eam1Match${matchNum}Player2`;
            const team2Player1Id = `${prefix}${prefix ? 'T' : 't'}eam2Match${matchNum}Player1`;
            const team2Player2Id = `${prefix}${prefix ? 'T' : 't'}eam2Match${matchNum}Player2`;
            
            populatePlayerSelect(team1Player1Id, team1Players);
            populatePlayerSelect(team1Player2Id, team1Players);
            populatePlayerSelect(team2Player1Id, team2Players);
            populatePlayerSelect(team2Player2Id, team2Players);
        }
    }
}

// Populate individual player select
function populatePlayerSelect(selectId, players) {
    const select = document.getElementById(selectId);
    if (select) {
        select.innerHTML = '<option value="">Select Player</option>';
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player._id;
            option.textContent = player.playerName;
            select.appendChild(option);
        });
    }
}

// Load existing assignments
function loadExistingAssignments() {
    // Load existing referee assignments
    if (currentMatchData.refreeId && currentMatchData.refreeId.length > 0) {
        // Populate existing referee assignments
    }
    
    // Load existing player assignments
    // Implementation depends on how player assignments are stored in the match data
}

// Assign match
async function assignMatch() {
    try {
        // Validate all assignments
        const assignments = collectAssignments();
        if (!validateAssignments(assignments)) {
            return;
        }
        
        // Show confirmation
        const matchCount = currentMatchGender === 'boys' ? 5 : 3;
        const message = `Are you sure you want to assign all ${matchCount} sub-matches for ${currentMatchData.college1Name} vs ${currentMatchData.college2Name}?`;
        
        showConfirmModal(message, () => confirmAssignMatch(assignments));
        
    } catch (error) {
        console.error('Error assigning match:', error);
        showToast('Error assigning match', 'error');
    }
}

// Collect all assignments
function collectAssignments() {
    const assignments = {
        matchId: currentMatchData._id,
        gender: currentMatchGender,
        subMatches: []
    };
    
    const prefix = currentMatchGender === 'boys' ? '' : 'girls';
    const matchCount = currentMatchGender === 'boys' ? 5 : 3;
    
    for (let i = 1; i <= matchCount; i++) {
        const refereeSelectId = `${prefix}${prefix ? 'R' : 'r'}eferee${i}`;
        const refereeSelect = document.getElementById(refereeSelectId);
        
        const subMatch = {
            matchNumber: i,
            refereeId: refereeSelect.value,
            type: getMatchType(i, currentMatchGender)
        };
        
        // Get player assignments based on match type
        if (subMatch.type === 'singles') {
            const team1SelectId = `${prefix}${prefix ? 'T' : 't'}eam1Match${i}`;
            const team2SelectId = `${prefix}${prefix ? 'T' : 't'}eam2Match${i}`;
            
            subMatch.team1Player = document.getElementById(team1SelectId)?.value;
            subMatch.team2Player = document.getElementById(team2SelectId)?.value;
        } else {
            const matchNum = currentMatchGender === 'boys' ? (i === 3 ? 3 : 5) : 2;
            
            subMatch.team1Player1 = document.getElementById(`${prefix}${prefix ? 'T' : 't'}eam1Match${matchNum}Player1`)?.value;
            subMatch.team1Player2 = document.getElementById(`${prefix}${prefix ? 'T' : 't'}eam1Match${matchNum}Player2`)?.value;
            subMatch.team2Player1 = document.getElementById(`${prefix}${prefix ? 'T' : 't'}eam2Match${matchNum}Player1`)?.value;
            subMatch.team2Player2 = document.getElementById(`${prefix}${prefix ? 'T' : 't'}eam2Match${matchNum}Player2`)?.value;
        }
        
        assignments.subMatches.push(subMatch);
    }
    
    return assignments;
}

// Get match type based on match number and gender
function getMatchType(matchNumber, gender) {
    if (gender === 'boys') {
        return [1, 2, 4].includes(matchNumber) ? 'singles' : 'doubles';
    } else {
        return [1, 3].includes(matchNumber) ? 'singles' : 'doubles';
    }
}

// Validate assignments
function validateAssignments(assignments) {
    const usedPlayers = new Set();
    
    for (const subMatch of assignments.subMatches) {
        // Validate referee
        if (!subMatch.refereeId) {
            showToast(`Please select a referee for Match ${subMatch.matchNumber}`, 'error');
            return false;
        }
        
        // Validate players
        if (subMatch.type === 'singles') {
            if (!subMatch.team1Player || !subMatch.team2Player) {
                showToast(`Please select players for Match ${subMatch.matchNumber}`, 'error');
                return false;
            }
            
            // Check for duplicate player assignments
            if (usedPlayers.has(subMatch.team1Player) || usedPlayers.has(subMatch.team2Player)) {
                showToast(`Player already assigned to another match`, 'error');
                return false;
            }
            
            usedPlayers.add(subMatch.team1Player);
            usedPlayers.add(subMatch.team2Player);
        } else {
            if (!subMatch.team1Player1 || !subMatch.team1Player2 || !subMatch.team2Player1 || !subMatch.team2Player2) {
                showToast(`Please select all players for Match ${subMatch.matchNumber}`, 'error');
                return false;
            }
            
            // Check for duplicate player assignments
            const doublePlayers = [subMatch.team1Player1, subMatch.team1Player2, subMatch.team2Player1, subMatch.team2Player2];
            for (const player of doublePlayers) {
                if (usedPlayers.has(player)) {
                    showToast(`Player already assigned to another match`, 'error');
                    return false;
                }
                usedPlayers.add(player);
            }
        }
    }
    
    return true;
}

// Confirm assign match
async function confirmAssignMatch(assignments) {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/api/admin/matches/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assignments)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to assign match');
        }
        
        showToast('Match assigned successfully');
        closeMatchAssignmentModal();
        loadMatches(); // Refresh matches list
        
    } catch (error) {
        console.error('Error confirming match assignment:', error);
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Close match assignment modal
function closeMatchAssignmentModal() {
    document.getElementById('matchAssignmentModal').classList.remove('active');
    currentMatchData = null;
    team1Players = [];
    team2Players = [];
    availableReferees = [];
}

// ===========================
// LOGOUT FUNCTION
// ===========================
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        window.location.href = '/';
    }
}