// ============================================
// Foodie Delight - Admin panel JS
// Chart.js rendering is handled inline per-page (see admin/dashboard.ejs).
// This file is reserved for any additional shared admin interactivity.
// ============================================

// Auto-hide flash messages after a few seconds
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.flash-message').forEach(el => {
        setTimeout(() => { el.style.transition = 'opacity 0.5s'; el.style.opacity = '0'; }, 4000);
    });
});
