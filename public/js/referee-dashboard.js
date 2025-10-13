// Global variables
let currentUser = null;
let allAssignedMatches = [];
let allCompletedMatches = [];

// DOM elements
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuToggle = document.getElementById('menu-toggle');
const mainContent = document.getElementById('main-content');
const dashboardPage = document.getElementById('dashboard-page');
const completedMatchesPage = document.getElementById('completed-matches-page');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkAuthenticationAndLoadData();
});

// Set up event listeners
function initializeEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', handleMenuClick);
    });

    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }

    // Overlay click
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Search functionality
    const searchMatches = document.getElementById('search-matches');
    if (searchMatches) {
        searchMatches.addEventListener('input', handleSearchMatches);
    }

    const searchCompleted = document.getElementById('search-completed');
    if (searchCompleted) {
        searchCompleted.addEventListener('input', handleSearchCompleted);
    }
}

// Check authentication and load initial data
async function checkAuthenticationAndLoadData() {
    try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (data.success && data.user && data.user.type === 'referee') {
            currentUser = data.user;
            await loadDashboardData();
        } else {
            // Redirect to login if not authenticated
            window.location.href = '/?auth=required&type=referee';
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        showNotification('Authentication error. Please log in again.', 'error');
        window.location.href = '/?auth=required&type=referee';
    }
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        // Load stats, assigned matches, and completed matches in parallel
        await Promise.all([
            loadDashboardStats(),
            loadAssignedMatches(),
            loadCompletedMatches()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/referee/dashboard-stats');
        const data = await response.json();

        if (data.success) {
            displayStats(data.stats);
        } else {
            console.error('Error loading stats:', data.message);
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Display statistics cards
function displayStats(stats) {
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = `
        <div class="stat-card">
            <span class="stat-number">${stats.upcoming}</span>
            <div class="stat-label">
                <i class="fas fa-clock"></i>
                Upcoming Matches
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-number">${stats.live}</span>
            <div class="stat-label">
                <i class="fas fa-play-circle"></i>
                Live Matches
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-number">${stats.completed}</span>
            <div class="stat-label">
                <i class="fas fa-check-circle"></i>
                Completed Matches
            </div>
        </div>
        <div class="stat-card">
            <span class="stat-number">${stats.total}</span>
            <div class="stat-label">
                <i class="fas fa-trophy"></i>
                Total Assigned
            </div>
        </div>
    `;
}

// Load assigned matches
async function loadAssignedMatches() {
    try {
        showLoading('assigned-matches-loading');
        
        const response = await fetch('/api/referee/assigned-matches');
        const data = await response.json();

        hideLoading('assigned-matches-loading');

        if (data.success) {
            allAssignedMatches = data.matches;
            displayAssignedMatches(allAssignedMatches);
        } else {
            console.error('Error loading assigned matches:', data.message);
            showNotification('Error loading assigned matches', 'error');
        }
    } catch (error) {
        hideLoading('assigned-matches-loading');
        console.error('Error fetching assigned matches:', error);
        showNotification('Error loading assigned matches', 'error');
    }
}

// Display assigned matches
function displayAssignedMatches(matches) {
    const container = document.getElementById('assigned-matches-container');
    
    if (!matches || matches.length === 0) {
        container.innerHTML = `
            <div class="no-matches">
                <i class="fas fa-calendar-times"></i>
                <h3>No Assigned Matches</h3>
                <p>You don't have any upcoming or live matches assigned at the moment.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = matches.map(match => createMatchCard(match)).join('');
}

// Create match card HTML
function createMatchCard(match) {
    const matchDate = new Date(match.date).toLocaleDateString();
    const matchTime = match.time || 'TBD';
    
    // Determine if this is an active set or needs to be started
    const isActiveSet = match.setStarted === true;
    const cardClass = isActiveSet ? 'match-card active-set' : 'match-card';
    const clickHandler = isActiveSet ? `openMatchSets('${match._id}', '${match.gender}')` : `showStartSetConfirmation('${match._id}', '${match.gender}', '${match.round}', '${match.college1Name}', '${match.college2Name}')`;

    return `
        <div class="${cardClass}" onclick="${clickHandler}">
            <div class="match-card-header">
                <div class="match-round-header">
                    ${match.round || 'Match'}
                </div>
                ${isActiveSet ? `
                    <div class="active-set-badge">
                        <i class="fas fa-play-circle"></i>
                        IN PROGRESS
                    </div>
                ` : ''}
            </div>
            <div class="match-card-body">
                <div class="match-teams">
                    <div class="team">${match.college1Name}</div>
                    <div class="vs-text">VS</div>
                    <div class="team">${match.college2Name}</div>
                </div>
                <div class="match-details">
                    <div class="match-info">
                        <i class="fas fa-calendar"></i>
                        ${matchDate}
                    </div>
                    <div class="match-info">
                        <i class="fas fa-clock"></i>
                        ${matchTime}
                    </div>
                    <div class="match-info">
                        <i class="fas fa-map-marker-alt"></i>
                        Court ${match.court || 'TBD'}
                    </div>
                </div>
                ${match.completedMatches && isActiveSet ? `
                    <div class="match-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(match.completedMatches / (match.gender === 'boys' ? 5 : 3)) * 100}%"></div>
                        </div>
                        <small class="progress-text">
                            ${match.completedMatches}/${match.gender === 'boys' ? 5 : 3} matches completed
                        </small>
                    </div>
                ` : ''}
                ${!isActiveSet ? `
                    <div class="start-set-indicator">
                        <i class="fas fa-play"></i>
                        Click to start this set of matches
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Load completed matches
async function loadCompletedMatches() {
    try {
        showLoading('completed-matches-loading');
        
        const response = await fetch('/api/referee/completed-matches');
        const data = await response.json();

        hideLoading('completed-matches-loading');

        if (data.success) {
            allCompletedMatches = data.matches;
            displayCompletedMatches(allCompletedMatches);
        } else {
            console.error('Error loading completed matches:', data.message);
        }
    } catch (error) {
        hideLoading('completed-matches-loading');
        console.error('Error fetching completed matches:', error);
    }
}

// Display completed matches in table
function displayCompletedMatches(matches) {
    const tableBody = document.getElementById('completed-matches-table');
    
    if (!matches || matches.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
                    <strong>No Completed Matches</strong><br>
                    <small>You haven't completed any matches yet.</small>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = matches.map(match => {
        const matchDate = new Date(match.date).toLocaleDateString();
        const winnerCollege = match.overallWinner === 'team1' ? match.college1Name : match.college2Name;
        
        return `
            <tr>
                <td>
                    <strong>${match.round || 'Match'}</strong><br>
                    <small style="color: var(--gray);">#${match._id.slice(-6)}</small>
                </td>
                <td>
                    <div><strong>${match.college1Name}</strong></div>
                    <div style="color: var(--gray); font-size: 0.9rem;">vs</div>
                    <div><strong>${match.college2Name}</strong></div>
                </td>
                <td>
                    <span class="gender-badge" style="position: static; background-color: ${match.gender === 'boys' ? '#007bff' : '#e83e8c'}; color: white;">
                        ${match.gender}
                    </span>
                </td>
                <td>
                    <span class="winner-badge">
                        <i class="fas fa-trophy"></i>
                        ${winnerCollege}
                    </span>
                </td>
                <td>${matchDate}</td>
                <td>
                    <span class="court-info">
                        Court ${match.court || 'N/A'}
                    </span>
                </td>
                <td>${match.round || 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

// Show confirmation popup before starting a set
function showStartSetConfirmation(matchId, gender, round, college1, college2) {
    const modal = document.createElement('div');
    modal.className = 'confirmation-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Start Match Set</h3>
                <button class="close-btn" onclick="this.closest('.confirmation-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="confirmation-message">
                    <i class="fas fa-play-circle" style="color: var(--primary-red); font-size: 2rem; margin-bottom: 15px;"></i>
                    <h4>Ready to start this set of matches?</h4>
                    <p><strong>${round}</strong></p>
                    <p>${college1} vs ${college2}</p>
                    <div class="warning-note">
                        <i class="fas fa-exclamation-triangle"></i>
                        <small>Once started, you cannot start another set until this one is completed.</small>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="this.closest('.confirmation-modal').remove()">
                    Cancel
                </button>
                <button class="btn btn-primary" onclick="confirmStartSet('${matchId}', '${gender}')">
                    <i class="fas fa-play"></i>
                    Start Set
                </button>
            </div>
        </div>
    `;

    // Add modal styles if not already added
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
        styles.textContent = `
            .confirmation-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
            }
            .modal-content {
                position: relative;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                max-width: 450px;
                width: 90%;
                max-height: 80vh;
                overflow: auto;
            }
            .modal-header {
                padding: 20px 20px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .modal-header h3 {
                margin: 0;
                color: var(--dark-gray);
            }
            .close-btn {
                background: none;
                border: none;
                font-size: 1.2rem;
                color: var(--gray);
                cursor: pointer;
                padding: 5px;
            }
            .close-btn:hover {
                color: var(--dark-gray);
            }
            .modal-body {
                padding: 20px;
            }
            .confirmation-message {
                text-align: center;
            }
            .confirmation-message h4 {
                margin: 10px 0;
                color: var(--dark-gray);
            }
            .confirmation-message p {
                margin: 5px 0;
                color: var(--gray);
            }
            .warning-note {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 10px;
                margin-top: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .warning-note i {
                color: #856404;
            }
            .warning-note small {
                color: #856404;
            }
            .modal-actions {
                padding: 0 20px 20px;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
            }
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s;
            }
            .btn-primary {
                background: var(--primary-red);
                color: white;
            }
            .btn-primary:hover {
                background: #c82333;
            }
            .btn-secondary {
                background: var(--light-gray);
                color: var(--dark-gray);
            }
            .btn-secondary:hover {
                background: var(--gray);
                color: white;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(modal);
    
    // Close modal when clicking overlay
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        modal.remove();
    });
}

// Confirm and start the set
async function confirmStartSet(matchId, gender) {
    try {
        // Remove the confirmation modal
        document.querySelector('.confirmation-modal').remove();
        
        // Show loading notification
        showNotification('Starting match set...', 'info');
        
        const response = await fetch('/api/referee/start-set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matchId: matchId,
                gender: gender
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Match set started successfully!', 'success');
            
            // Refresh the matches to show updated state
            await loadAssignedMatches();
            
            // Navigate to match sets page after a short delay
            setTimeout(() => {
                const url = `/match-sets?matchId=${matchId}&gender=${gender}`;
                window.location.href = url;
            }, 1500);
        } else {
            if (data.activeMatchId) {
                showNotification(`You already have an active set in progress. Opening that set...`, 'warning');
                setTimeout(() => {
                    const url = `/match-sets?matchId=${data.activeMatchId}&gender=${data.activeGender}`;
                    window.location.href = url;
                }, 2000);
            } else {
                showNotification(data.message || 'Failed to start match set', 'error');
            }
        }
    } catch (error) {
        console.error('Error starting set:', error);
        showNotification('Error starting match set. Please try again.', 'error');
    }
}

// Open match sets page (for active sets)
function openMatchSets(matchId, gender) {
    const url = `/match-sets?matchId=${matchId}&gender=${gender}`;
    window.location.href = url;
}

// Handle menu navigation
function handleMenuClick(event) {
    const menuItem = event.currentTarget;
    const page = menuItem.getAttribute('data-page');

    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    menuItem.classList.add('active');

    // Show appropriate page
    if (page === 'dashboard') {
        dashboardPage.style.display = 'block';
        completedMatchesPage.style.display = 'none';
    } else if (page === 'completed-matches') {
        dashboardPage.style.display = 'none';
        completedMatchesPage.style.display = 'block';
        // Load completed matches if not already loaded
        if (allCompletedMatches.length === 0) {
            loadCompletedMatches();
        }
    }

    // Close sidebar on mobile
    closeSidebar();
}

// Search functionality for assigned matches
function handleSearchMatches(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredMatches = allAssignedMatches.filter(match => 
        match.college1Name.toLowerCase().includes(searchTerm) ||
        match.college2Name.toLowerCase().includes(searchTerm) ||
        match.round.toLowerCase().includes(searchTerm) ||
        match.gender.toLowerCase().includes(searchTerm)
    );
    displayAssignedMatches(filteredMatches);
}

// Search functionality for completed matches
function handleSearchCompleted(event) {
    const searchTerm = event.target.value.toLowerCase();
    const filteredMatches = allCompletedMatches.filter(match => 
        match.college1Name.toLowerCase().includes(searchTerm) ||
        match.college2Name.toLowerCase().includes(searchTerm) ||
        match.round.toLowerCase().includes(searchTerm) ||
        match.gender.toLowerCase().includes(searchTerm)
    );
    displayCompletedMatches(filteredMatches);
}

// Refresh functions
async function refreshMatches() {
    await Promise.all([
        loadDashboardStats(),
        loadAssignedMatches()
    ]);
    showNotification('Matches refreshed successfully', 'success');
}

async function refreshCompletedMatches() {
    await loadCompletedMatches();
    showNotification('Completed matches refreshed', 'success');
}

// Mobile sidebar functions
function toggleSidebar() {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    mainContent.classList.toggle('sidebar-active');
}

function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    mainContent.classList.remove('sidebar-active');
}

// Logout function
async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            showNotification('Error logging out', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error logging out', 'error');
    }
}

// Utility functions
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'flex';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="close-btn" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--white);
                color: var(--dark-gray);
                padding: 15px 20px;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-medium);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 300px;
                border-left: 4px solid var(--primary-red);
                animation: slideIn 0.3s ease-out;
            }
            .notification-success { border-left-color: var(--success); }
            .notification-error { border-left-color: var(--danger); }
            .notification-info { border-left-color: var(--primary-red); }
            .notification .close-btn {
                background: none;
                border: none;
                color: var(--gray);
                cursor: pointer;
                margin-left: auto;
                font-size: 1rem;
            }
            .notification .close-btn:hover { color: var(--dark-gray); }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}