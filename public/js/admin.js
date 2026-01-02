// --- Admin Core ---

let globalCategories = [];
let globalPlans = [];
let currentInvoiceItems = [];
let razorpayPlansCache = null;

const hsnCodes = [
    "998311 - Management consulting services",
    "998313 - IT consulting and support services",
    "998314 - Information technology design and development services",
    "998315 - Hosting and infrastructure provisioning services",
    "998316 - IT infrastructure and network management services",
    "998319 - Other information technology services",
    "998211 - Advertising services",
    "998312 - Business consulting services",
    "998361 - Advertising agency services",
    "998362 - Purchase or sale of advertising space",
    "998399 - Other professional, technical and business services",
    "998413 - Trade show and exhibition organization services",
    "998599 - Other support services n.e.c.",
    "998719 - Maintenance and repair services of other goods",
    "995411 - Construction services of single dwelling or multi dwelling",
    "995412 - Construction services of other residential buildings",
    "995413 - Construction services of industrial buildings",
    "995414 - Construction services of commercial buildings",
    "995415 - Construction services of other non-residential buildings",
    "995421 - General construction services of highways, streets, roads, bridges",
    "9971 - Financial and related services",
    "997111 - Central banking services",
    "997112 - Other monetary intermediation services",
    "997113 - Other financial intermediation services",
    "997114 - Financial leasing services",
    "997119 - Other financial services",
    "997131 - Life insurance services",
    "997132 - Accident and health insurance services",
    "997133 - Motor vehicle insurance services",
    "997134 - Marine, aviation and other transport insurance services",
    "997135 - Fire and other damage to property insurance services",
    "997136 - General liability insurance services",
    "997137 - Credit and surety insurance services",
    "997139 - Other non-life insurance services",
    "997151 - Portfolio management services",
    "997152 - Trust services",
    "997153 - Custody services",
    "997154 - Financial market regulatory services",
    "997155 - Financial market operational services",
    "997159 - Other services auxiliary to financial services"
];

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
    init();

    // Theme
    loadAdminTheme();

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Registration Failed:', err));
    }

    // Global Emoji Picker
    initGlobalEmojiPicker();
});

async function init() {
    try {
        const res = await fetch('/api/admin/check');
        if (res.ok) {
            showDashboard();
        } else {
            document.getElementById('login-section').classList.remove('hidden');
        }

        // Inject HSN
        if (!document.getElementById('hsn-codes')) {
            const dl = document.createElement('datalist');
            dl.id = 'hsn-codes';
            dl.innerHTML = hsnCodes.map(c => `<option value="${c.split(' - ')[0]}">${c}</option>`).join('');
            document.body.appendChild(dl);
        }
    } catch (e) { console.error(e); }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (res.ok) showDashboard();
        else alert('Invalid Credentials');
    } catch (e) { alert('Login Error'); }
}

async function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    loadStats();
    loadErrorCount();
    fetchCategories().then(() => switchTab('plans'));

    // Check environment
    try {
        const res = await fetch('/api/admin/env');
        const env = await res.json();
        if (env.APP_ENV === 'dev') {
            const badge = document.getElementById('env-badge');
            if (badge) badge.classList.remove('hidden');
        }
    } catch (e) { }
}

async function logout() {
    window.location.href = '/auth/logout';
}

async function loadStats() {
    try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        document.getElementById('stat-revenue').innerText = '₹' + (data.revenue || 0).toLocaleString();

        if (data.totalUsers !== undefined) {
            document.getElementById('stat-users').innerText = (data.totalUsers || 0).toLocaleString();
            document.getElementById('stat-users-card').style.display = 'flex';
        }
    } catch (e) {
        console.error('Failed to load stats:', e);
    }
}

async function fetchCategories() {
    const res = await fetch('/api/admin/categories');
    globalCategories = await res.json();
}

async function switchTab(tab) {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.sidebar-link')).find(el => {
        const onClick = el.getAttribute('onclick');
        return onClick && onClick.includes(`'${tab}'`);
    });
    if (activeBtn) activeBtn.classList.add('active');

    const title = document.getElementById('page-title');
    const content = document.getElementById('content-area');
    content.innerHTML = '<div class="flex justify-center py-16"><div class="relative"><div class="animate-spin h-12 w-12 border-4 border-gray-200 rounded-full"></div><div class="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full absolute top-0 left-0"></div></div></div>';

    try {
        if (tab === 'plans') {
            title.innerText = 'Plans Management';
            await fetchCategories();
            const res = await fetch('/api/admin/plans?t=' + Date.now());
            globalPlans = await res.json();
            renderPlans(content);
        } else if (tab === 'categories') {
            title.innerText = 'Category Management';
            await fetchCategories();
            renderCategories(content);
        } else if (tab === 'settings') {
            title.innerText = 'Site Settings';
            await renderSettings(content);
        } else if (tab === 'razorpay-plans') {
            title.innerText = 'Razorpay Plans';
            await renderRazorpayPlans(content);
        } else if (tab === 'customers') {
            title.innerText = 'Customer Management';
            const res = await fetch('/api/admin/customers');
            const data = await res.json();
            renderCustomers(content, data);
        } else if (tab === 'email-templates') {
            title.innerText = 'Email Template Management';
            await renderEmailTemplates(content);
        } else if (tab === 'invoices') {
            title.innerText = 'Invoice Management';
            const res = await fetch('/api/admin/invoices');
            const data = await res.json();
            window.globalInvoices = data;
            renderInvoices(content, data);
        } else if (tab === 'errors') {
            title.innerText = 'Error Logs';
            const res = await fetch('/api/admin/errors');
            const data = await res.json();
            renderErrors(content, data);
        } else {
            title.innerText = tab.charAt(0).toUpperCase() + tab.slice(1);
            const res = await fetch(`/api/admin/${tab}`);
            const data = await res.json();
            if (tab === 'users') {
                window.globalUsers = data; // Store users globally for edit modal
                renderUsers(content, data);
            }
            if (tab === 'subscriptions') renderSubs(content, data);
            if (tab === 'activity') renderActivity(content, data);
        }
    } catch (e) {
        content.innerHTML = `<div class="p-6 text-center text-red-500">Error loading data: ${e.message}</div>`;
    }
}

// Errors
async function refreshErrors() {
    try {
        const res = await fetch('/api/admin/errors');
        const data = await res.json();
        renderErrors(document.getElementById('content-area'), data);
    } catch (e) { console.error(e); }
}

async function resolveError(id) {
    await fetch(`/api/admin/errors/${id}/resolve`, { method: 'PUT' });
    refreshErrors();
}

async function deleteError(id) {
    if (!confirm('Delete this error log?')) return;
    await fetch(`/api/admin/errors/${id}`, { method: 'DELETE' });
    refreshErrors();
}

async function clearAllErrors() {
    if (!confirm('Clear ALL error logs?')) return;
    await fetch('/api/admin/errors/clear', { method: 'DELETE' });
    refreshErrors();
}

async function loadErrorCount() {
    try {
        const res = await fetch('/api/admin/errors');
        const data = await res.json();
        const unresolved = data.filter(e => !e.resolved).length;
        updateErrorBadge(unresolved);
    } catch (e) { }
}

function updateErrorBadge(count) {
    const badge = document.getElementById('error-badge');
    if (badge) {
        if (count > 0) {
            badge.innerText = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// Subscription Actions
async function syncSubscriptions() {
    const btn = document.getElementById('btn-sync-subs');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Syncing...';
    btn.disabled = true;
    try {
        const res = await fetch('/api/admin/subscriptions/sync', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            showToast(`Synced! Added: ${data.added}, Updated: ${data.updated}`, 'success');
            switchTab('subscriptions');
        } else {
            showToast('Sync failed: ' + data.error, 'error');
        }
    } catch (e) { showToast('Sync error', 'error'); }
    finally {
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
}

async function assignSubscription(subId) {
    const email = prompt("Enter the email address of the user to assign this subscription to:");
    if (!email) return;

    try {
        const res = await fetch(`/api/admin/subscriptions/${subId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
            showToast('Assigned successfully!', 'success');
            switchTab('subscriptions');
        } else {
            showToast(data.error || 'Failed to assign', 'error');
        }
    } catch (e) { showToast('Error assigning user', 'error'); }
}

async function updateSubscriptionUser(subId, currentEmail) {
    const email = prompt("Enter the new email address for this subscription:", currentEmail);
    if (!email || email === currentEmail) return;

    try {
        const res = await fetch(`/api/admin/subscriptions/${subId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
            showToast('User updated successfully!', 'success');
            switchTab('subscriptions');
        } else {
            showToast(data.error || 'Failed to update user', 'error');
        }
    } catch (e) { showToast('Error updating user', 'error'); }
}

// Modern Modal for Assign/Update User
function createUserModal(title, subId, currentEmail = '') {
    // Remove existing modal if any
    const existing = document.getElementById('user-assignment-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'user-assignment-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="closeUserModal()"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up">
            <button onclick="closeUserModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xl">
                <i class="fa-solid fa-times"></i>
            </button>
            
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <i class="fa-solid fa-user-plus text-white text-2xl"></i>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-white">${title}</h3>
                <p class="text-gray-500 dark:text-gray-400 mt-1">Enter the email address of the user</p>
            </div>
            
            <form onsubmit="submitUserAssignment(event, '${subId}')" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input type="email" id="user-email-input" value="${currentEmail}" required
                        class="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                        placeholder="user@example.com">
                </div>
                
                <div class="flex gap-3 pt-2">
                    <button type="button" onclick="closeUserModal()" 
                        class="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" 
                        class="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all">
                        ${currentEmail ? 'Update' : 'Assign'} User
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('user-email-input').focus();
}

function openAssignUserModal(subId) {
    createUserModal('Assign User', subId, '');
}

function openUpdateUserModal(subId, currentEmail) {
    createUserModal('Update User', subId, currentEmail);
}

function closeUserModal() {
    const modal = document.getElementById('user-assignment-modal');
    if (modal) modal.remove();
}

async function submitUserAssignment(event, subId) {
    event.preventDefault();
    const email = document.getElementById('user-email-input').value;
    if (!email) return;

    try {
        const res = await fetch(`/api/admin/subscriptions/${subId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
            closeUserModal();
            showToast('User assigned successfully!', 'success');
            switchTab('subscriptions');
        } else {
            showToast(data.error || 'Failed to assign user', 'error');
        }
    } catch (e) {
        showToast('Error assigning user', 'error');
    }
}


// Export Globals
window.init = init;
window.handleLogin = handleLogin;
window.logout = logout;
window.showDashboard = showDashboard;
window.loadStats = loadStats;
window.fetchCategories = fetchCategories;
window.switchTab = switchTab;
window.refreshErrors = refreshErrors;
window.resolveError = resolveError;
window.deleteError = deleteError;
window.clearAllErrors = clearAllErrors;
window.loadErrorCount = loadErrorCount;
window.updateErrorBadge = updateErrorBadge;
window.syncSubscriptions = syncSubscriptions;
window.assignSubscription = assignSubscription;
window.updateSubscriptionUser = updateSubscriptionUser;
window.openAssignUserModal = openAssignUserModal;
window.openUpdateUserModal = openUpdateUserModal;
window.closeUserModal = closeUserModal;
window.submitUserAssignment = submitUserAssignment;
// Variables
window.globalCategories = globalCategories;
window.globalPlans = globalPlans;
window.currentInvoiceItems = currentInvoiceItems;
// HSN codes not exported, used internally or we can attach to window if needed
window.hsnCodes = hsnCodes;
