async function loadProfile() {
    try {
        // 1. Get User
        const userRes = await fetch('/api/user');
        const userData = await userRes.json();

        if (!userData.loggedIn) {
            window.location.href = '/';
            return;
        }

        const u = userData.user;
        document.getElementById('user-name-display').innerText = u.name;
        document.getElementById('user-email-display').innerText = u.email;
        if (u.avatar_url) document.getElementById('user-avatar').src = u.avatar_url;

        // Fill Form
        document.getElementById('input-name').value = u.name || '';
        document.getElementById('input-phone').value = u.phone || '';
        document.getElementById('input-alt-phone').value = u.alternate_phone || '';
        document.getElementById('input-gstin').value = u.gstin || '';

        // Apply Theme from user profile
        if (u.theme) {
            applyTheme(u.theme);
        } else {
            const savedTheme = localStorage.getItem('theme') || 'light';
            applyTheme(savedTheme);
        }

        // 2. Sync & Get Subscriptions
        await syncUserSubscriptions();
        const subRes = await fetch('/api/my-subscriptions');
        const subs = await subRes.json();
        renderSubscriptions(subs);

    } catch (e) { console.error(e); }
}

function renderSubscriptions(subs) {
    const list = document.getElementById('subs-list');
    const validSubs = subs.filter(s => ['active', 'cancelled'].includes(s.status));

    if (validSubs.length === 0) {
        list.innerHTML = '<div class="p-6 bg-white rounded-xl text-gray-500 border border-gray-200">No active or cancelled subscriptions found.</div>';
        return;
    }

    const durationMap = {
        'quarterly': 3, 'semi-annual': 6, 'annual': 12, 'superfast': 12, 'professional': 12
    };

    list.innerHTML = validSubs.map(sub => {
        const startDate = new Date(sub.start_date);
        const months = durationMap[sub.plan_id] || 1;

        // Use server provided renewal date, or fallback to calculation
        let endDate;
        if (sub.renewal_date) {
            endDate = new Date(sub.renewal_date);
        } else {
            endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + months);
        }

        const now = new Date();
        const totalTime = endDate - startDate;
        const elapsedTime = now - startDate;
        let progress = (elapsedTime / totalTime) * 100;
        if (progress > 100) progress = 100;
        if (progress < 0) progress = 0;

        const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        const isCancelled = sub.status === 'cancelled';

        return `
            <div class="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-bold text-lg capitalize mb-1">${(sub.plan_name || sub.plan_id).replace(/-/g, ' ')} Plan</h3>
                        <p class="text-xs text-gray-500">Ref: ${sub.razorpay_sub_id}</p>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}">
                            ${sub.status === 'cancelled' ? 'Cancelled (Active until expiry)' : sub.status}
                        </span>
                        ${isCancelled ? `
                            <button onclick="resubscribe('${sub.razorpay_sub_id}')" class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
                                Start Again
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Progress -->
                <div class="mb-2">
                    <div class="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Started: ${startDate.toLocaleDateString()}</span>
                        <span>${daysLeft > 0 ? daysLeft + ' days remaining' : 'Expired'}</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
                    </div>
                    <div class="text-right text-xs text-gray-400 mt-1">Renews/Expires: ${endDate.toLocaleDateString()}</div>
                </div>
            </div>
        `;
    }).join('');
}

async function resubscribe(subId) {
    if (!confirm("Do you want to start this subscription again?")) return;
    const btn = document.querySelector(`button[onclick="resubscribe('${subId}')"]`);
    if (btn) btn.innerText = "Processing...";

    try {
        const res = await fetch('/api/subscription/resubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription_id: subId })
        });
        const data = await res.json();

        if (data.success) {
            const options = {
                "key": data.key_id,
                "subscription_id": data.subscription_id,
                "name": "ByteStart Technologies",
                "description": "Renew Subscription",
                "handler": function (response) {
                    alert("Subscription Renewed Successfully!");
                    window.location.reload();
                },
                "modal": {
                    "ondismiss": function () {
                        alert('Payment cancelled');
                        window.location.reload();
                    }
                }
            };
            const rzp1 = new Razorpay(options);
            rzp1.open();

        } else {
            alert('Error: ' + data.error);
            if (btn) btn.innerText = "Start Again";
        }
    } catch (e) {
        console.error(e);
        alert('Failed to resubscribe');
        if (btn) btn.innerText = "Start Again";
    }
}

async function updateProfile(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const msg = document.getElementById('save-msg');

    const name = document.getElementById('input-name').value;
    const phone = document.getElementById('input-phone').value;
    const altPhone = document.getElementById('input-alt-phone').value;
    const gstin = document.getElementById('input-gstin').value;

    btn.disabled = true;
    btn.innerText = 'Saving...';

    try {
        const res = await fetch('/api/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, alternate_phone: altPhone, gstin })
        });

        if (res.ok) {
            msg.classList.remove('hidden');
            setTimeout(() => msg.classList.add('hidden'), 3000);
            document.getElementById('user-name-display').innerText = name;
        } else {
            alert('Failed to save.');
        }
    } catch (err) {
        console.error(err);
        alert('Error saving profile');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Save Changes';
    }
}

// Theme Functions
function applyTheme(theme) {
    const toggle = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        toggle.checked = true;
    } else {
        document.documentElement.classList.remove('dark');
        toggle.checked = false;
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const toggle = document.getElementById('theme-toggle');
    const newTheme = toggle.checked ? 'dark' : 'light';
    applyTheme(newTheme);

    // Sync to server
    fetch('/api/user/update-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme })
    }).catch(e => console.warn('Theme sync failed:', e));
}

// Apply theme immediately on page load (prevent flash)
(function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    }
})();


async function syncUserSubscriptions() {
    try {
        const btn = document.getElementById('btn-refresh-subs'); // Optional if we add a button later
        if (btn) btn.classList.add('animate-spin');

        await fetch('/api/subscription/sync-my-subs', { method: 'POST' });

        if (btn) btn.classList.remove('animate-spin');
    } catch (e) { console.error("Sync failed", e); }
}

// Global Export
window.loadProfile = loadProfile;
window.updateProfile = updateProfile;
window.resubscribe = resubscribe;
window.toggleTheme = toggleTheme;
window.syncUserSubscriptions = syncUserSubscriptions;

loadProfile();
