// Configuration
const API_BASE_URL = 'http://localhost:8080/api';
let currentCollegeEmail = localStorage.getItem('collegeEmail') || '';
let currentGender = 'boys';
let currentFilter = 'all';
let currentPlayerGender = 'boys';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (currentCollegeEmail) {
        showMainContent();
    } else {
        showLoginSection();
    }
    
    setupEventListeners();
});

function setupEventListeners() {
    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadMatches();
        });
    });
    
    // Gender switch
    const genderSwitch = document.getElementById('genderSwitch');
    if (genderSwitch) {
        genderSwitch.addEventListener('change', toggleGender);
    }
    
    // Player gender tabs
    document.querySelectorAll('.player-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPlayerGender = btn.dataset.gender;
            document.querySelectorAll('.player-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayPlayers();
        });
    });
    
    // Add player form
    document.getElementById('addPlayerForm')?.addEventListener('submit', handleAddPlayer);
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        alert('Please enter college email');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/college/${email}`);
        if (!response.ok) {
            throw new Error('College not found. Please check your email.');
        }
        
        const college = await response.json();
        currentCollegeEmail = email;
        localStorage.setItem('collegeEmail', email);
        
        document.getElementById('collegeName').textContent = college.collegeName || email;
        showMainContent();
        
    } catch (error) {
        alert(error.message);
        console.error('Login error:', error);
    }
}

function showLoginSection() {
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
}

function showMainContent() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    loadCollegeInfo();
    loadMatches();
}

// Load college info
async function loadCollegeInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/team/college/${currentCollegeEmail}`);
        const college = await response.json();
        document.getElementById('collegeName').textContent = college.collegeName || currentCollegeEmail;
    } catch (error) {
        console.error('Error loading college info:', error);
    }
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tabName === 'matches') {
        document.getElementById('matchesTab').classList.add('active');
        loadMatches();
    } else if (tabName === 'players') {
        document.getElementById('playersTab').classList.add('active');
        loadPlayers();
    }
}

// Toggle gender
function toggleGender() {
    const switchInput = document.getElementById('genderSwitch');
    const boysLabel = document.getElementById('boysLabel');
    const girlsLabel = document.getElementById('girlsLabel');
    
    if (switchInput.checked) {
        currentGender = 'girls';
        girlsLabel.classList.add('active');
        boysLabel.classList.remove('active');
    } else {
        currentGender = 'boys';
        boysLabel.classList.add('active');
        girlsLabel.classList.remove('active');
    }
    
    loadMatches();
}

// Load matches
async function loadMatches() {
    const loading = document.getElementById('matchesLoading');
    const container = document.getElementById('matchesContainer');
    const noMatches = document.getElementById('noMatches');
    
    loading.style.display = 'block';
    container.innerHTML = '';
    noMatches.style.display = 'none';
    
    try {
        const endpoint = currentFilter === 'all' 
            ? `/team/matches/${currentCollegeEmail}`
            : `/team/matches/${currentCollegeEmail}/${currentFilter}`;
            
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        
        if (!response.ok) {
            throw new Error('Failed to load matches');
        }
        
        let matches = await response.json();
        console.log('Fetched matches:', matches);
        
        // Sort matches
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
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <h3>❌ Error Loading Matches</h3>
                <p>${error.message}</p>
                <button onclick="loadMatches()" style="margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

// Display matches
function displayMatches(matches) {
    const container = document.getElementById('matchesContainer');
    container.innerHTML = '';
    
    matches.forEach(match => {
        const card = createMatchCard(match);
        container.appendChild(card);
    });
}

// Create match card
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.onclick = () => window.open(`/match/${match._id}`, '_blank');
    
    const status = match.matchStatus || 'upcoming';
    const score = match.score || [0, 0];
    const isMyTeam1 = match.email1 === currentCollegeEmail;
    const isMyTeam2 = match.email2 === currentCollegeEmail;
    
    card.innerHTML = `
        <div class="match-card-header">
            <span class="match-status ${status}">${status.toUpperCase()}</span>
            <span class="match-date-time">${match.date || '-'} | ${match.time || '-'}</span>
        </div>
        <div class="match-teams">
            <div class="team">
                <div class="team-name" style="${isMyTeam1 ? 'color: #2563eb; font-weight: 800;' : ''}">
                    ${isMyTeam1 ? '🏆 ' : ''}${match.college1Name || '-'}
                </div>
                <div class="team-score">${score[0] !== undefined ? score[0] : '-'}</div>
            </div>
            <div class="vs">VS</div>
            <div class="team">
                <div class="team-name" style="${isMyTeam2 ? 'color: #2563eb; font-weight: 800;' : ''}">
                    ${isMyTeam2 ? '🏆 ' : ''}${match.college2Name || '-'}
                </div>
                <div class="team-score">${score[1] !== undefined ? score[1] : '-'}</div>
            </div>
        </div>
    `;
    
    return card;
}

// Load players
let allPlayers = { boys: [], girls: [] };

async function loadPlayers() {
    const loading = document.getElementById('playersLoading');
    const container = document.getElementById('playersContainer');
    const noPlayers = document.getElementById('noPlayers');
    
    loading.style.display = 'block';
    container.innerHTML = '';
    noPlayers.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/players/${currentCollegeEmail}`);
        
        if (!response.ok) {
            throw new Error('Failed to load players');
        }
        
        allPlayers = await response.json();
        console.log('Fetched players:', allPlayers);
        
        loading.style.display = 'none';
        displayPlayers();
        
    } catch (error) {
        console.error('Error loading players:', error);
        loading.style.display = 'none';
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <h3>❌ Error Loading Players</h3>
                <p>${error.message}</p>
                <button onclick="loadPlayers()" style="margin-top: 15px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    🔄 Retry
                </button>
            </div>
        `;
    }
}

// Display players
function displayPlayers() {
    const container = document.getElementById('playersContainer');
    const noPlayers = document.getElementById('noPlayers');
    
    container.innerHTML = '';
    
    const players = currentPlayerGender === 'boys' ? allPlayers.boys : allPlayers.girls;
    
    if (players.length === 0) {
        noPlayers.style.display = 'block';
        container.style.display = 'none';
    } else {
        noPlayers.style.display = 'none';
        container.style.display = 'grid';
        
        players.forEach(player => {
            const card = createPlayerCard(player);
            container.appendChild(card);
        });
    }
}

// Create player card
function createPlayerCard(player) {
    const card = document.createElement('div');
    card.className = 'player-card';
    
    const initials = player.playerName ? player.playerName.charAt(0).toUpperCase() : '?';
    const genderIcon = player.gender?.toLowerCase() === 'female' ? '♀' : '♂';
    
    card.innerHTML = `
        <div class="player-header">
            <div class="player-avatar">${initials}</div>
            <div class="player-info">
                <div class="player-name">${player.playerName || '-'}</div>
                <div class="player-email">${player.email || '-'}</div>
            </div>
        </div>
        <div class="player-details">
            <div class="player-detail-item">
                <span class="player-detail-label">Gender:</span>
                <span class="player-detail-value">${genderIcon} ${player.gender || '-'}</span>
            </div>
            <div class="player-detail-item">
                <span class="player-detail-label">Phone:</span>
                <span class="player-detail-value">${player.phone || '-'}</span>
            </div>
        </div>
        <div class="player-actions">
            <button class="btn-delete" onclick="deletePlayer('${player._id}')">Delete</button>
        </div>
    `;
    
    return card;
}

// Add player modal
function openAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'block';
    document.getElementById('addPlayerForm').reset();
}

function closeAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
}

// Handle add player
async function handleAddPlayer(e) {
    e.preventDefault();
    
    const playerData = {
        playerName: document.getElementById('playerName').value.trim(),
        email: document.getElementById('playerEmail').value.trim(),
        gender: document.getElementById('playerGender').value,
        phone: document.getElementById('playerPhone').value.trim()
    };
    
    if (!playerData.playerName || !playerData.email || !playerData.gender) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/players/${currentCollegeEmail}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(playerData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add player');
        }
        
        alert('Player added successfully!');
        closeAddPlayerModal();
        loadPlayers();
        
    } catch (error) {
        alert(error.message);
        console.error('Error adding player:', error);
    }
}

// Delete player
async function deletePlayer(playerId) {
    if (!confirm('Are you sure you want to delete this player?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/team/players/${currentCollegeEmail}/${playerId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete player');
        }
        
        alert('Player deleted successfully!');
        loadPlayers();
        
    } catch (error) {
        alert(error.message);
        console.error('Error deleting player:', error);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addPlayerModal');
    if (event.target === modal) {
        closeAddPlayerModal();
    }
}
