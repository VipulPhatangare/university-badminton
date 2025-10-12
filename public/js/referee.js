// Referee Dashboard JavaScript
// Global variables
let matchesData = {
    upcoming: [],
    completed: [],
    live: []
};

// DOM elements
const elements = {
    matchesContainer: document.getElementById('matches-container'),
    completedMatchesTable: document.getElementById('completed-matches-table'),
    searchInput: document.getElementById('search-matches'),
    menuItems: document.querySelectorAll('.menu-item'),
    pages: document.querySelectorAll('.content > div'),
    menuToggle: document.getElementById('menu-toggle'),
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('overlay'),
    mainContent: document.getElementById('main-content'),
    logoutBtn: document.getElementById('logout-btn')
};

// Initialize the application
async function initializeApp() {
    try {
        await loadMatchesData();
        setupEventListeners();
        renderUpcomingMatches();
        renderCompletedMatches();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load match data');
    }
}

// Load matches data from server
async function loadMatchesData() {
    try {
        const response = await fetch('/referee/get-matches-info');
        const data = await response.json();
        
        if (data.success) {
            matchesData.upcoming = data.upcomingMatches || [];
            matchesData.completed = data.completedMatches || [];
            matchesData.live = data.liveMatches || [];
        } else {
            throw new Error(data.message || 'Failed to load matches');
        }
    } catch (error) {
        console.error('Error loading matches data:', error);
        throw error;
    }
}

// Render upcoming matches
function renderUpcomingMatches() {
    const container = elements.matchesContainer;
    
    if (!container) return;
    
    // Filter matches based on search
    const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    const filteredMatches = matchesData.upcoming.filter(match => {
        if (!searchTerm) return true;
        
        return (
            match.college1Name.toLowerCase().includes(searchTerm) ||
            match.college2Name.toLowerCase().includes(searchTerm) ||
            match.matchNo.toLowerCase().includes(searchTerm)
        );
    });
    
    container.innerHTML = '';
    
    if (filteredMatches.length === 0) {
        container.innerHTML = `
            <div class="no-matches">
                <i class="fas fa-calendar-times"></i>
                <h3>No upcoming matches found</h3>
                <p>There are no matches assigned to you at the moment.</p>
            </div>
        `;
        return;
    }
    
    filteredMatches.forEach(match => {
        const matchCard = createMatchCard(match);
        container.appendChild(matchCard);
    });
}

// Create match card element
function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.dataset.matchId = match._id;
    
    // Determine round based on match status or other criteria
    const round = determineRound(match);
    
    card.innerHTML = `
        <div class="match-card-header">
            <div class="match-number">${match.matchNo}</div>
            <div class="match-round">${round}</div>
        </div>
        <div class="match-card-body">
            <div class="match-teams">
                <div class="team">${match.college1Name}</div>
                <div class="vs-text">VS</div>
                <div class="team">${match.college2Name}</div>
            </div>
            <div class="match-details">
                <div class="match-info">
                    <i class="far fa-calendar"></i>
                    <span>${formatDate(match.date)}</span>
                </div>
                <div class="match-info">
                    <i class="far fa-clock"></i>
                    <span>${match.time}</span>
                </div>
                <div class="match-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${match.court || 'TBD'}</span>
                </div>
            </div>
        </div>
    `;
    
    // Add click event to navigate to match info page
    card.addEventListener('click', () => {
        window.location.href = `/referee/match-info/${match._id}`;
    });
    
    return card;
}

// Determine match round (you can customize this logic)
function determineRound(match) {
    // This is a simple implementation - you can make it more sophisticated
    // based on your tournament structure
    if (match.round) {
        return match.round;
    }
    
    // Default rounds based on some criteria
    const rounds = ['Round 1', 'Round 2', 'Quarter Final', 'Semi Final', 'Final'];
    return rounds[0]; // Default to Round 1
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'TBD';
    
    try {
        const date = new Date(dateString);
        const options = { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        return dateString;
    }
}

// Render completed matches
function renderCompletedMatches() {
    const tableBody = elements.completedMatchesTable;
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (matchesData.completed.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--gray); padding: 40px;">
                    No completed matches yet
                </td>
            </tr>
        `;
        return;
    }
    
    matchesData.completed.forEach(match => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${match.matchNo}</td>
            <td>${match.college1Name} vs ${match.college2Name}</td>
            <td>${getWinnerName(match)}</td>
            <td>${formatDate(match.date)}</td>
            <td>${match.court || 'TBD'}</td>
        `;
        
        // Add hover effect
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(178, 34, 34, 0.05)';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        tableBody.appendChild(row);
    });
}

// Get winner name from match data
function getWinnerName(match) {
    if (!match.winnerEmail) return 'TBD';
    
    // Determine winner based on email
    if (match.winnerEmail === match.email1) {
        return match.college1Name;
    } else if (match.winnerEmail === match.email2) {
        return match.college2Name;
    }
    
    return 'TBD';
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', debounce(() => {
            renderUpcomingMatches();
        }, 300));
    }
    
    // Menu toggle for mobile
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', () => {
            elements.sidebar.classList.toggle('active');
            elements.mainContent.classList.toggle('sidebar-active');
            elements.overlay.classList.toggle('active');
        });
    }
    
    // Close sidebar when clicking on overlay
    if (elements.overlay) {
        elements.overlay.addEventListener('click', () => {
            closeSidebar();
        });
    }
    
    // Menu item clicks
    if (elements.menuItems) {
        elements.menuItems.forEach(item => {
            item.addEventListener('click', function() {
                const pageId = this.dataset.page;
                if (pageId) {
                    // Remove active class from all menu items
                    elements.menuItems.forEach(menuItem => {
                        menuItem.classList.remove('active');
                    });
                    
                    // Add active class to clicked item
                    this.classList.add('active');
                    
                    // Show corresponding page
                    showPage(pageId);
                }
                
                // Close sidebar on mobile after selection
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            });
        });
    }
    
    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Window resize handler for responsive behavior
    window.addEventListener('resize', handleWindowResize);
}

// Show specific page
function showPage(pageId) {
    const pages = {
        'dashboard': 'dashboard-page',
        'completed-matches': 'completed-matches-page'
    };
    
    const targetPageId = pages[pageId];
    if (!targetPageId) return;
    
    // Hide all pages
    document.querySelectorAll('.content > div').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show target page
    const targetPage = document.getElementById(targetPageId);
    if (targetPage) {
        targetPage.style.display = 'block';
    }
    
    // If showing completed matches, refresh the data
    if (pageId === 'completed-matches') {
        renderCompletedMatches();
    }
}

// Close sidebar
function closeSidebar() {
    if (elements.sidebar) elements.sidebar.classList.remove('active');
    if (elements.mainContent) elements.mainContent.classList.remove('sidebar-active');
    if (elements.overlay) elements.overlay.classList.remove('active');
}

// Handle logout
async function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.success) {
                window.location.href = '/';
            } else {
                alert('Error logging out: ' + data.message);
            }
        } catch (error) {
            console.error('Error logging out:', error);
            alert('Error logging out');
        }
    }
}

// Handle window resize
function handleWindowResize() {
    if (window.innerWidth > 768) {
        // Desktop view - ensure sidebar is visible and overlay is hidden
        if (elements.sidebar) elements.sidebar.classList.remove('active');
        if (elements.mainContent) elements.mainContent.classList.remove('sidebar-active');
        if (elements.overlay) elements.overlay.classList.remove('active');
    }
}

// Utility function: Debounce
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

// Show error message
function showError(message) {
    // You can customize this to show a nice error notification
    alert('Error: ' + message);
}

// Show success message
function showSuccess(message) {
    // You can customize this to show a nice success notification
    alert('Success: ' + message);
}

// Refresh matches data
async function refreshMatches() {
    try {
        await loadMatchesData();
        renderUpcomingMatches();
        renderCompletedMatches();
        showSuccess('Matches refreshed successfully');
    } catch (error) {
        console.error('Error refreshing matches:', error);
        showError('Failed to refresh matches');
    }
}

// Auto-refresh matches every 30 seconds
setInterval(async () => {
    try {
        await loadMatchesData();
        renderUpcomingMatches();
        renderCompletedMatches();
    } catch (error) {
        console.error('Auto-refresh failed:', error);
    }
}, 30000);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Export functions for potential use by other scripts
window.RefereeApp = {
    refreshMatches,
    showError,
    showSuccess,
    loadMatchesData,
    renderUpcomingMatches,
    renderCompletedMatches
};