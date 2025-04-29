/**
 * Energy Anomaly Detection - Sidebar Scripts
 * This file contains scripts for the sidebar functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar toggle
    initSidebarToggle();
    
    // Highlight active menu item
    highlightActiveMenuItem();
    
    // Add smooth transitions
    addSmoothTransitions();
});

/**
 * Initialize sidebar toggle functionality
 */
function initSidebarToggle() {
    const sidebarToggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const contentWrapper = document.querySelector('.content-wrapper');
    
    if (sidebarToggleBtn && sidebar && contentWrapper) {
        sidebarToggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            contentWrapper.classList.toggle('expanded');
            
            // Store sidebar state in local storage
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed);
            
            // Update toggle icon
            const toggleIcon = sidebarToggleBtn.querySelector('i');
            if (toggleIcon) {
                if (isCollapsed) {
                    toggleIcon.classList.remove('fa-chevron-left');
                    toggleIcon.classList.add('fa-chevron-right');
                } else {
                    toggleIcon.classList.remove('fa-chevron-right');
                    toggleIcon.classList.add('fa-chevron-left');
                }
            }
        });
        
        // Check if sidebar state is stored in local storage
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            contentWrapper.classList.add('expanded');
            
            // Update toggle icon
            const toggleIcon = sidebarToggleBtn.querySelector('i');
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-chevron-left');
                toggleIcon.classList.add('fa-chevron-right');
            }
        }
    }
}

/**
 * Highlight the active menu item based on current page
 */
function highlightActiveMenuItem() {
    // Get current page URL path
    const currentPath = window.location.pathname;
    
    // Find all menu items
    const menuItems = document.querySelectorAll('.sidebar .nav-link');
    
    // Loop through menu items and check if href matches current path
    menuItems.forEach(item => {
        const itemPath = item.getAttribute('href');
        
        // Skip if no href attribute
        if (!itemPath) return;
        
        // Check if current path matches item path or if it's a substring
        // (for example /results/123 should highlight Results menu item with href="/results")
        if (currentPath === itemPath || 
            (itemPath !== '/' && currentPath.startsWith(itemPath))) {
            
            // Add active class
            item.classList.add('active');
            
            // If item is in a collapsible section, expand it
            const parent = item.closest('.collapse');
            if (parent) {
                parent.classList.add('show');
                const trigger = document.querySelector(`[data-bs-target="#${parent.id}"]`);
                if (trigger) {
                    trigger.setAttribute('aria-expanded', 'true');
                    trigger.classList.remove('collapsed');
                }
            }
        } else {
            // Remove active class
            item.classList.remove('active');
        }
    });
}

/**
 * Add smooth transitions to page elements
 */
function addSmoothTransitions() {
    // Add fade-in animation to main content
    const mainContent = document.querySelector('.content-wrapper > .container-fluid');
    if (mainContent) {
        mainContent.classList.add('fade-in');
    }
    
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        // Add staggered animation delay
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}
