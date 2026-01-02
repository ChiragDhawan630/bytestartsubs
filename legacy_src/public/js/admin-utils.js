// --- Admin Utils ---

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'from-green-600 to-emerald-600' :
        type === 'error' ? 'from-red-600 to-rose-600' :
            'from-gray-800 to-gray-900';
    toast.className = `fixed bottom-4 right-4 bg-gradient-to-r ${bgClass} text-white px-5 py-3 rounded-xl shadow-2xl z-50 animate-fade-in-up flex items-center gap-2`;
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
}

function getErrorTypeColor(type) {
    const colors = {
        'db': 'bg-purple-100 text-purple-700',
        'api': 'bg-blue-100 text-blue-700',
        'auth': 'bg-yellow-100 text-yellow-700',
        'payment': 'bg-orange-100 text-orange-700',
        'system': 'bg-red-100 text-red-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-up';
        toast.innerHTML = '<i class="fa-solid fa-check mr-2"></i>Copied!';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    });
}

function generateSlug(val) {
    return val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getCategoryName(id) {
    // Requires globalCategories to be available
    if (typeof globalCategories !== 'undefined') {
        const c = globalCategories.find(c => c.id === id);
        return c ? c.name : id;
    }
    return id;
}

// Admin Theme Logic
function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        const icon = document.getElementById('theme-icon');
        const label = document.getElementById('theme-label');
        if (icon) icon.textContent = '☀️';
        if (label) label.textContent = 'Light Mode';
    } else {
        document.documentElement.classList.remove('dark');
        const icon = document.getElementById('theme-icon');
        const label = document.getElementById('theme-label');
        if (icon) icon.textContent = '🌙';
        if (label) label.textContent = 'Dark Mode';
    }
    localStorage.setItem('admin_theme', theme);
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
}

function loadAdminTheme() {
    const savedTheme = localStorage.getItem('admin_theme') || 'light';
    applyTheme(savedTheme);
}

// Immediate theme application
(function () {
    const savedTheme = localStorage.getItem('admin_theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
})();

// Modal Utils
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
window.openModal = openModal;
window.closeModal = closeModal;

async function testSmtpEnv() {
    const btn = document.querySelector('button[onclick="testSmtpEnv()"]');
    const originalText = btn ? btn.innerHTML : 'Send Test Email';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Sending...';
    }

    try {
        const res = await fetch('/api/admin/test-smtp', { method: 'POST' });
        const data = await res.json();

        if (res.ok) {
            showToast('✅ Test email sent successfully to ' + data.recipient, 'success');
        } else {
            showToast('❌ Failed: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (e) {
        showToast('❌ Error: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}
