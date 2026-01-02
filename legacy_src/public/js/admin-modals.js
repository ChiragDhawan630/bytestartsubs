// --- Admin Modals & Forms ---

let isEditingPlan = false;
let activeInvoiceTab = 'manual';
let currentApprovalInv = null;
let currentTemplates = [];

// Feature Editor Logic
function addFeatureRow(val = '') {
    const container = document.getElementById('features-container');
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-center animate-fade-in relative';

    // Extract Emoji
    let emoji = '👉';
    let text = val;
    const match = val.match(/^([\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}])/u);
    if (match) {
        emoji = match[1];
        text = val.substring(match[0].length).trim();
    }

    div.innerHTML = `
        <div class="relative group">
             <button type="button" class="w-10 h-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xl shadow-sm transition-all feature-emoji-btn" onclick="openFeatureEmojiPicker(this)">${emoji}</button>
             <input type="hidden" class="feature-emoji" value="${emoji}">
        </div>
        <input type="text" value="${text}" class="flex-grow border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm feature-input focus:ring-2 focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800 dark:text-white outline-none transition-all" placeholder="Feature description...">
        <button type="button" onclick="this.parentElement.remove()" class="text-gray-400 hover:text-red-500 px-2 transition-colors"><i class="fa-solid fa-times"></i></button>
    `;
    container.appendChild(div);
}

// Global Emoji Picker Logic
let activeEmojiBtn = null;
let activeEmojiInput = null;

function initGlobalEmojiPicker() {
    const popover = document.createElement('div');
    popover.id = 'global-emoji-popover';
    popover.className = 'fixed hidden z-[9999] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden w-80 h-96 max-w-[90vw] max-h-[50vh] flex flex-col';

    popover.innerHTML = `
        <div class="md:hidden flex justify-end p-2 bg-gray-50 border-b border-gray-100"><button type="button" class="text-gray-500" onclick="document.getElementById('global-emoji-popover').classList.add('hidden')"><i class="fa-solid fa-times"></i></button></div>
        <div class="flex-grow relative"><emoji-picker class="w-full h-full"></emoji-picker></div>
    `;
    document.body.appendChild(popover);

    const picker = popover.querySelector('emoji-picker');
    picker.addEventListener('emoji-click', event => {
        const emoji = event.detail.unicode;
        if (activeEmojiBtn && activeEmojiInput) {
            if (activeEmojiBtn.tagName !== 'INPUT') {
                activeEmojiBtn.innerText = emoji;
            }
            if (activeEmojiInput.value !== undefined) {
                activeEmojiInput.value = emoji;
            } else if (activeEmojiInput.tagName === 'INPUT') {
                activeEmojiInput.value = emoji;
            }
            if (activeEmojiBtn.value !== undefined && activeEmojiBtn.tagName === 'INPUT') {
                activeEmojiBtn.value = emoji;
            }
            popover.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!popover.classList.contains('hidden') && !popover.contains(e.target) && activeEmojiBtn && !activeEmojiBtn.contains(e.target)) {
            popover.classList.add('hidden');
        }
    });
}

function openFeatureEmojiPicker(btn) {
    activeEmojiBtn = btn;
    activeEmojiInput = btn.nextElementSibling;
    const popover = document.getElementById('global-emoji-popover');
    popover.classList.remove('hidden');

    const rect = btn.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const margin = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (viewportWidth < 640) {
        popover.style.top = '50%';
        popover.style.left = '50%';
        popover.style.transform = 'translate(-50%, -50%)';
        return;
    } else {
        popover.style.transform = 'none';
    }

    let top = rect.bottom + 5;
    let left = rect.left;

    if (top + popRect.height > viewportHeight - margin) {
        top = rect.top - popRect.height - 5;
    }
    if (left + popRect.width > viewportWidth - margin) {
        left = viewportWidth - popRect.width - margin;
    }
    if (left < margin) left = margin;

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
}

function toggleCatEmojiPicker(input) {
    activeEmojiInput = input;
    activeEmojiBtn = input;

    const popover = document.getElementById('global-emoji-popover');
    popover.classList.remove('hidden');

    const rect = input.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const margin = 10;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (viewportWidth < 640) {
        popover.style.top = '50%';
        popover.style.left = '50%';
        popover.style.transform = 'translate(-50%, -50%)';
    } else {
        popover.style.transform = 'none';
        let top = rect.bottom + 5;
        let left = rect.left;

        if (top + popRect.height > viewportHeight - margin) top = rect.top - popRect.height - 5;
        if (left + popRect.width > viewportWidth - margin) left = viewportWidth - popRect.width - margin;
        if (left < margin) left = margin;

        popover.style.top = `${top}px`;
        popover.style.left = `${left}px`;
    }
}

// Plan Modal Buttons
function generatePlanSlug(val) {
    if (isEditingPlan) return;
    const slug = generateSlug(val); // From utils
    document.getElementById('display-plan-id').value = slug;
}

function openPlanModal(idx = null) {
    const form = document.getElementById('admin-plan-form');
    const catSelect = document.getElementById('plan-category');
    const container = document.getElementById('features-container');

    // Populate Categories
    if (globalCategories.length === 0) {
        catSelect.innerHTML = '<option value="">No categories - please create one first</option>';
        if (idx === null) {
            alert('⚠️ No categories exist!\\n\\nPlease create at least one category first before adding plans.');
            return;
        }
    } else {
        catSelect.innerHTML = globalCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    container.innerHTML = '';
    form.reset();
    document.getElementById('plan-id').value = '';
    document.getElementById('display-plan-id').readOnly = false;
    document.getElementById('display-plan-id').classList.remove('bg-gray-100');

    if (idx !== null) {
        isEditingPlan = true;
        const p = globalPlans[idx];
        document.getElementById('plan-modal-title').innerText = 'Edit Plan';

        document.getElementById('plan-id').value = p.id;
        document.getElementById('display-plan-id').value = p.id;
        document.getElementById('display-plan-id').readOnly = true;
        document.getElementById('display-plan-id').classList.add('bg-gray-100');

        document.getElementById('plan-name').value = p.name;
        document.getElementById('plan-category').value = p.category;
        document.getElementById('plan-price-orig').value = p.price_original;
        document.getElementById('plan-price-disc').value = p.price_discounted;
        document.getElementById('plan-price-color').value = p.price_color || '#000000';
        document.getElementById('plan-order').value = p.display_order;
        document.getElementById('plan-rzp-id').value = p.razorpay_plan_id;
        document.getElementById('plan-active').checked = (p.is_active === 1 || p.is_active === true);

        // Parse Billing Cycle (e.g., "1 month", "3 months")
        const cycle = (p.billing_cycle || 'monthly').toLowerCase();
        let val = 1;
        let unit = 'month';

        const units = { day: 'day', week: 'week', month: 'month', year: 'year' };

        // Check for specific keywords first (legacy support)
        if (cycle === 'monthly') { val = 1; unit = 'month'; }
        else if (cycle === 'quarterly') { val = 3; unit = 'month'; }
        else if (cycle === 'yearly' || cycle === 'annual') { val = 1; unit = 'year'; }
        else if (cycle === 'lifetime') { val = 100; unit = 'year'; }
        else {
            // regex parsing "3 months"
            const match = cycle.match(/(\d+)\s*([a-z]+)/);
            if (match) {
                val = parseInt(match[1]);
                // normalize unit (remove 's')
                const rawUnit = match[2].replace(/s$/, '');
                if (units[rawUnit]) unit = rawUnit;
            }
        }

        document.getElementById('plan-period-value').value = val;
        document.getElementById('plan-period-unit').value = unit;

        try {
            const feats = JSON.parse(p.features);
            feats.forEach(f => addFeatureRow(f));
        } catch (e) { console.log("No features"); }

    } else {
        isEditingPlan = false;
        document.getElementById('plan-modal-title').innerText = 'Create New Plan';
        document.getElementById('plan-active').checked = true;
        document.getElementById('plan-period-value').value = 1;
        document.getElementById('plan-period-unit').value = 'month';
        document.getElementById('plan-price-color').value = '#000000';
        addFeatureRow('');
    }


    const modal = document.getElementById('plan-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function savePlan(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-plan');
    if (btn) btn.disabled = true;

    try {
        // Get Form Data
        const idInput = document.getElementById('plan-id');
        const displayIdInput = document.getElementById('display-plan-id');
        const id = (idInput ? idInput.value : '') || (displayIdInput ? displayIdInput.value : '');

        const name = document.getElementById('plan-name').value;
        const category = document.getElementById('plan-category').value;
        const priceOrig = document.getElementById('plan-price-orig').value;
        const priceDisc = document.getElementById('plan-price-disc').value;
        const priceColorInput = document.getElementById('plan-price-color');
        const priceColor = priceColorInput ? priceColorInput.value : '#000000';

        // Construct Billing Cycle String
        const periodVal = document.getElementById('plan-period-value').value;
        const periodUnit = document.getElementById('plan-period-unit').value;
        let billingCycle = `${periodVal} ${periodUnit}${periodVal > 1 ? 's' : ''}`;

        // Legacy mapping
        if (periodVal == 1 && periodUnit == 'month') billingCycle = 'monthly';
        if (periodVal == 3 && periodUnit == 'month') billingCycle = 'quarterly';
        if (periodVal == 1 && periodUnit == 'year') billingCycle = 'yearly';

        const razorpayId = document.getElementById('plan-rzp-id').value;
        const order = document.getElementById('plan-order').value;
        const isActive = document.getElementById('plan-active').checked;

        // Get Features
        const features = [];
        document.querySelectorAll('.feature-input').forEach((inp, idx) => {
            const val = inp.value.trim();
            const emojiInput = document.querySelectorAll('.feature-emoji')[idx];
            const emoji = emojiInput ? emojiInput.value : '✅';
            if (val) features.push(`${emoji} ${val}`);
        });

        const payload = {
            name, category, billing_cycle: billingCycle,
            price_original: priceOrig, price_discounted: priceDisc, price_color: priceColor,
            razorpay_plan_id: razorpayId, is_active: isActive, display_order: order,
            features: features
        };

        const url = isEditingPlan ? `/api/admin/plans/${id}` : '/api/admin/plans';
        const method = isEditingPlan ? 'PUT' : 'POST';

        if (!isEditingPlan) {
            if (!id) { throw new Error("Internal ID is required"); }
            payload.id = id;
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            showToast(isEditingPlan ? 'Plan updated successfully' : 'Plan created successfully', 'success');
            closeModal('plan-modal');
            if (typeof switchTab === 'function') switchTab('plans');
        } else {
            throw new Error(data.error || 'Server rejected request');
        }

    } catch (e) {
        console.error("Save Plan Error:", e);
        alert('Failed to save plan: ' + e.message);
    } finally {
        if (btn) btn.disabled = false;
    }
}

// Category Modal
function generateCategorySlug(val) {
    const slug = generateSlug(val);
    document.getElementById('cat-id').value = slug;
}

function openCategoryModal(id = null) {
    const modal = document.getElementById('category-modal');
    const form = document.getElementById('category-form');
    form.reset();

    if (id) {
        const c = globalCategories.find(c => c.id === id);
        if (c) {
            document.getElementById('cat-name').value = c.name;
            document.getElementById('cat-id').value = c.id;
            document.getElementById('cat-icon').value = c.icon || '';
            document.getElementById('cat-tagline').value = c.tagline || '';
            document.getElementById('cat-order').value = c.display_order;
            document.getElementById('cat-id').readOnly = true;
            document.getElementById('cat-id').classList.add('bg-gray-100');
        }
    } else {
        document.getElementById('cat-id').readOnly = false;
        document.getElementById('cat-id').classList.remove('bg-gray-100');
        document.getElementById('cat-id').value = '';
        document.getElementById('cat-order').value = globalCategories.length + 1;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function saveCategory(e) {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const payload = {
        name: document.getElementById('cat-name').value,
        icon: document.getElementById('cat-icon').value,
        tagline: document.getElementById('cat-tagline').value,
        display_order: parseInt(document.getElementById('cat-order').value) || 0
    };

    let url = '/api/admin/categories';
    let method = 'POST';

    const exists = globalCategories.find(c => c.id === id);
    if (exists) {
        url = `/api/admin/categories/${id}`;
        method = 'PUT';
    }

    const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, id })
    });

    if (res.ok) {
        closeModal('category-modal');
        switchTab('categories');
    } else {
        alert('Failed to save category');
    }
}

// Delete Logic
async function deletePlan(planId, planName) {
    if (!confirm(`⚠️ Delete Plan "${planName}"?\n\nThis will permanently remove this plan from your website.`)) return;
    if (!confirm(`🚨 FINAL CONFIRMATION 🚨\n\nAre you ABSOLUTELY SURE you want to delete "${planName}"?\n\nThis action CANNOT be undone!`)) return;

    const res = await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' });
    if (res.ok) {
        showToast('Plan deleted successfully', 'success');
        switchTab('plans');
    } else {
        showToast('Failed to delete plan', 'error');
    }
}

async function deleteCategory(catId, catName) {
    if (!confirm(`⚠️ Delete Category "${catName}"?\n\nPlans in this category will become uncategorized.`)) return;
    if (!confirm(`🚨 FINAL CONFIRMATION 🚨\n\nAre you ABSOLUTELY SURE you want to delete the category "${catName}"?\n\nThis action CANNOT be undone!`)) return;

    const res = await fetch(`/api/admin/categories/${catId}`, { method: 'DELETE' });
    if (res.ok) {
        showToast('Category deleted successfully', 'success');
        switchTab('categories');
    } else {
        showToast('Failed to delete category', 'error');
    }
}

async function deleteObject(type, id) {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/${type}/${id}`, { method: 'DELETE' });
    if (res.ok) switchTab(type);
}

// Razorpay & Mapping
function openRazorpayPlanModal() {
    const modal = document.getElementById('razorpay-plan-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function createRazorpayPlan(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Creating...';

    const payload = {
        name: form.name.value,
        amount: form.amount.value,
        currency: "INR",
        period: form.period.value,
        interval: form.interval.value,
        description: form.description.value
    };

    try {
        const res = await fetch('/api/admin/razorpay/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            showToast(`✅ Plan "${payload.name}" created successfully on Razorpay`, 'success');
            closeModal('razorpay-plan-modal');
            if (typeof switchTab === 'function') switchTab('razorpay-plans');
        } else {
            alert('Error: ' + data.error);
        }
    } catch (e) {
        console.error(e);
        alert('Failed to update Razorpay');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

async function importRazorpayPlan(razorpayPlanId, name, amountPaise, period) {
    if (!confirm(`📥 Import "${name}" as a new Website Plan?\n\nThis will create a new plan linked to Razorpay Plan ID: ${razorpayPlanId}`)) return;

    const priceRupees = Math.round(amountPaise / 100);
    const discountedPrice = Math.round(priceRupees * 0.9);

    const slug = generateSlug(name);
    let billingCycle = 'monthly';
    if (period === 'yearly' || period === 'annual') billingCycle = 'yearly';
    else if (period === 'quarterly') billingCycle = 'quarterly';
    else if (period === 'weekly') billingCycle = 'monthly';

    const planData = {
        id: slug,
        name: name,
        price_original: priceRupees,
        price_discounted: discountedPrice,
        billing_cycle: billingCycle,
        category_id: globalCategories.length > 0 ? globalCategories[0].id : null,
        razorpay_plan_id: razorpayPlanId,
        features: JSON.stringify(['Imported from Razorpay']),
        display_order: globalPlans.length + 1,
        active: 1
    };

    try {
        const res = await fetch('/api/admin/plans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planData)
        });

        if (res.ok) {
            showToast(`✅ Plan "${name}" imported successfully!`, 'success');
            if (confirm(`Plan "${name}" was created!\n\nWould you like to edit it now?`)) {
                await fetchCategories();
                const plansRes = await fetch('/api/admin/plans?t=' + Date.now());
                window.globalPlans = await plansRes.json();
                const newPlanIdx = window.globalPlans.findIndex(p => p.id === slug);
                switchTab('plans');
                if (newPlanIdx !== -1) setTimeout(() => openPlanModal(newPlanIdx), 500);
            } else {
                switchTab('razorpay-plans');
            }
        } else {
            const error = await res.json();
            showToast(`Failed to import: ${error.error || 'Unknown error'}`, 'error');
        }
    } catch (e) {
        showToast(`Import failed: ${e.message}`, 'error');
    }
}

function openMapPlanModal(razorpayPlanId, razorpayPlanName) {
    let modal = document.getElementById('map-plan-modal');
    if (!modal) {
        // Create modal once
        const modalHtml = `
            <div id="map-plan-modal" class="fixed inset-0 hidden items-center justify-center modal-overlay z-50 p-4">
                <div class="glass-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up border border-white/20">
                    <div class="px-6 py-5 border-b border-gray-200/50 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                            <i class="fa-solid fa-link text-white"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-xl text-gray-900">Map to Website Plan</h3>
                            <p class="text-sm text-gray-500" id="map-rzp-name">-</p>
                        </div>
                    </div>
                    <div class="p-6">
                        <p class="text-sm text-gray-600 mb-4">Select a website plan.</p>
                        <input type="hidden" id="map-rzp-id">
                        <div class="mb-4">
                            <label class="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Website Plan</label>
                            <select id="map-website-plan" class="input-premium w-full rounded-xl p-3">
                                <option value="">-- Select a plan --</option>
                            </select>
                        </div>
                        <div id="map-plan-preview" class="hidden bg-gray-50 rounded-xl p-4 mb-4">
                            <p class="text-sm text-gray-500 mb-1">Current Razorpay Plan ID:</p>
                            <code id="map-current-rzp-id" class="bg-red-100 text-red-700 px-2 py-1 rounded text-sm">-</code>
                            <p class="text-sm text-gray-500 mt-3 mb-1">Will be updated to:</p>
                            <code id="map-new-rzp-id" class="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">-</code>
                        </div>
                    </div>
                    <div class="p-5 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-slate-50 flex justify-end gap-3">
                        <button onclick="closeModal('map-plan-modal')" class="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 border border-gray-200 transition-all">Cancel</button>
                        <button onclick="executeMapPlan()" class="btn-primary px-6 py-2.5 rounded-xl text-white font-semibold">
                            <i class="fa-solid fa-link mr-2"></i>Map Plan
                        </button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById('map-plan-modal');

        document.getElementById('map-website-plan').addEventListener('change', function () {
            const selectedPlan = globalPlans.find(p => p.id === this.value);
            const preview = document.getElementById('map-plan-preview');
            if (selectedPlan) {
                preview.classList.remove('hidden');
                document.getElementById('map-current-rzp-id').textContent = selectedPlan.razorpay_plan_id || '(none)';
                document.getElementById('map-new-rzp-id').textContent = document.getElementById('map-rzp-id').value;
            } else {
                preview.classList.add('hidden');
            }
        });
    }

    document.getElementById('map-rzp-id').value = razorpayPlanId;
    document.getElementById('map-rzp-name').textContent = razorpayPlanName;
    document.getElementById('map-new-rzp-id').textContent = razorpayPlanId;

    const select = document.getElementById('map-website-plan');
    select.innerHTML = '<option value="">-- Select a plan --</option>' +
        globalPlans.map(p => `<option value="${p.id}">${p.name} (${p.billing_cycle})</option>`).join('');

    document.getElementById('map-plan-preview').classList.add('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function executeMapPlan() {
    const razorpayPlanId = document.getElementById('map-rzp-id').value;
    const websitePlanId = document.getElementById('map-website-plan').value;

    if (!websitePlanId) {
        alert('Please select a website plan to map.');
        return;
    }

    const selectedPlan = globalPlans.find(p => p.id === websitePlanId);
    if (!selectedPlan) return;

    if (!confirm(`⚠️ Update "${selectedPlan.name}"'s Razorpay Plan ID?\n\nOld ID: ${selectedPlan.razorpay_plan_id || '(none)'}\nNew ID: ${razorpayPlanId}\n\nThis will affect billing for new subscriptions.`)) return;

    try {
        const res = await fetch(`/api/admin/plans/${websitePlanId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ razorpay_plan_id: razorpayPlanId })
        });

        if (res.ok) {
            showToast(`✅ "${selectedPlan.name}" linked to ${razorpayPlanId}`, 'success');
            closeModal('map-plan-modal');
            switchTab('razorpay-plans');
        } else {
            const error = await res.json();
            showToast(`Failed: ${error.error || 'Unknown error'}`, 'error');
        }
    } catch (e) {
        showToast(`Mapping failed: ${e.message}`, 'error');
    }
}

// User Import
function importUserToCustomer(user) {
    if (confirm(`Create a customer record for ${user.name}?`)) {
        openCustomerModal({
            id: '',
            name: user.name,
            email: user.email,
            phone: user.phone || '',
        });
    }
}

// Customers & Invoices
function openCustomerModal(input = null) {
    const modal = document.getElementById('customer-modal');
    const form = document.getElementById('customer-form');
    form.reset();
    document.getElementById('cust-id').value = '';

    let c = input;
    if (typeof input === 'number' || typeof input === 'string') {
        if (window.globalCustomers) {
            c = window.globalCustomers.find(cust => cust.id == input);
        } else {
            console.error("Global customers not found");
            return;
        }
    }

    if (c) {
        document.getElementById('modal-cust-title').innerText = c.id ? 'Edit Customer' : 'New Customer (Imported)';
        document.getElementById('cust-id').value = c.id || '';
        document.getElementById('cust-name').value = c.name;
        document.getElementById('cust-email').value = c.email || '';
        document.getElementById('cust-phone').value = c.phone || '';
        document.getElementById('cust-gstin').value = c.gstin || '';
        document.getElementById('cust-address').value = c.address || '';
        document.getElementById('cust-city').value = c.city || '';
        document.getElementById('cust-state').value = c.state || '';
        document.getElementById('cust-pincode').value = c.pincode || '';
    } else {
        document.getElementById('modal-cust-title').innerText = 'New Customer';
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function saveCustomer(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const id = document.getElementById('cust-id').value;

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/admin/customers/${id}` : '/api/admin/customers';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            closeModal('customer-modal');
            switchTab('customers');
            showToast('Customer saved successfully', 'success');
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (error) {
        alert('Failed to save customer');
    }
}

// Invoice Modal Logic
async function openInvoiceModal(inv = null) {
    const modal = document.getElementById('invoice-modal');
    const form = document.getElementById('invoice-form');
    form.reset();
    document.getElementById('inv-id').value = '';
    currentInvoiceItems = [];

    // Populate customers
    const res = await fetch('/api/admin/customers');
    const customers = await res.json();
    const custSelect = document.getElementById('inv-customer');
    custSelect.innerHTML = '<option value="">Select Customer</option>' +
        customers.map(c => `<option value="${c.id}">${c.name} (${c.email || c.phone || 'No contact'})</option>`).join('');

    if (inv) {
        document.getElementById('modal-inv-title').innerText = 'Edit Invoice';
        document.getElementById('inv-id').value = inv.id;
        document.getElementById('inv-number').value = inv.invoice_number;
        document.getElementById('inv-date').value = inv.invoice_date;
        document.getElementById('inv-due-date').value = inv.due_date;
        document.getElementById('inv-customer').value = inv.customer_id;

        // Fetch items
        const itemsRes = await fetch(`/api/admin/invoices/${inv.id}`);
        const details = await itemsRes.json();
        currentInvoiceItems = details.items || [];
    } else {
        document.getElementById('modal-inv-title').innerText = 'New Invoice';
        document.getElementById('inv-date').valueAsDate = new Date();
        document.getElementById('inv-due-date').valueAsDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

        // Generate Number
        try {
            const numRes = await fetch('/api/admin/invoices/next-number');
            const numData = await numRes.json();
            if (!numRes.ok) throw new Error(numData.error);
            document.getElementById('inv-number').value = numData.nextNumber;
        } catch (e) {
            document.getElementById('inv-number').value = '';
        }
    }

    renderInvoiceItems();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function updateInvoiceTotals() {
    const subtotal = currentInvoiceItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    document.getElementById('inv-subtotal').innerText = '₹' + subtotal.toFixed(2);

    const cgstRate = parseFloat(document.getElementById('inv-cgst-rate').value) || 0;
    const sgstRate = parseFloat(document.getElementById('inv-sgst-rate').value) || 0;
    const igstRate = parseFloat(document.getElementById('inv-igst-rate').value) || 0;

    const taxAmount = (subtotal * (cgstRate + sgstRate + igstRate)) / 100;

    document.getElementById('inv-tax-amount').innerText = '₹' + taxAmount.toFixed(2);
    document.getElementById('inv-total').innerText = '₹' + (subtotal + taxAmount).toFixed(2);
}

function addItemRow() {
    currentInvoiceItems.push({ description: '', hsn_code: '', quantity: 1, rate: 0 });
    renderInvoiceItems();
}

function updateItem(idx, field, value) {
    if (field === 'quantity' || field === 'rate') {
        currentInvoiceItems[idx][field] = parseFloat(value) || 0;
    } else {
        currentInvoiceItems[idx][field] = value;
    }
    renderInvoiceItems();
}

function removeItem(idx) {
    currentInvoiceItems.splice(idx, 1);
    renderInvoiceItems();
}

async function saveInvoice(e) {
    e.preventDefault();
    const invId = document.getElementById('inv-id').value;
    const payload = {
        invoice_number: document.getElementById('inv-number').value,
        customer_id: document.getElementById('inv-customer').value,
        invoice_date: document.getElementById('inv-date').value,
        due_date: document.getElementById('inv-due-date').value,
        cgst_rate: document.getElementById('inv-cgst-rate').value,
        sgst_rate: document.getElementById('inv-sgst-rate').value,
        igst_rate: document.getElementById('inv-igst-rate').value,
        items: currentInvoiceItems
    };

    const method = invId ? 'PUT' : 'POST';
    const url = invId ? `/api/admin/invoices/${invId}` : '/api/admin/invoices';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            closeModal('invoice-modal');
            switchTab('invoices');
            showToast('Invoice saved successfully', 'success');
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (error) {
        alert('Failed to save invoice');
    }
}

async function markInvoicePaid(id) {
    if (!confirm('Mark this invoice as PAID?')) return;
    try {
        const res = await fetch(`/api/admin/invoices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'paid' })
        });
        if (res.ok) {
            switchTab('invoices');
            showToast('Invoice marked as paid', 'success');
        }
    } catch (e) { alert('Error updating status'); }
}

async function sendInvoice(id) {
    if (!confirm('📧 Send this invoice to the customer via email?')) return;
    showToast('Sending invoice...', 'info');
    try {
        const res = await fetch(`/api/admin/invoices/${id}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        if (res.ok) {
            showToast('Invoice sent successfully!', 'success');
            switchTab('invoices');
        } else {
            const data = await res.json();
            console.error('Send Error:', data);
            showToast('Failed to send: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (e) {
        console.error(e);
        showToast('Error sending invoice: ' + e.message, 'error');
    }
}

async function generateAutomatedInvoices() {
    if (!confirm('This will scan all active subscriptions and generate draft invoices for the current month if missing. Proceed?')) return;
    showToast('Generating invoices...', 'info');
    try {
        const res = await fetch('/api/admin/invoices/generate-automated', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
            showToast(data.message, 'success');
            switchTab('invoices');
        } else {
            showToast('Error: ' + data.error, 'error');
        }
    } catch (e) { showToast('Failed to generate', 'error'); }
}

function switchInvoiceTab(tab) {
    activeInvoiceTab = tab;
    renderInvoices(document.getElementById('content-area'), window.globalInvoices || []);
}

// Approval Modal
async function openApprovalModal(inv) {
    currentApprovalInv = inv;
    const modal = document.getElementById('approval-modal');
    document.getElementById('approval-inv-id').value = inv.id;
    document.getElementById('approval-customer').innerText = inv.customer_name || 'Unknown';
    document.getElementById('approval-amount').innerText = '₹' + inv.total.toLocaleString();
    document.getElementById('approval-iframe').src = `/api/admin/invoices/${inv.id}/pdf`;

    // Load templates if not loaded
    try {
        const res = await fetch('/api/admin/email-templates');
        currentTemplates = await res.json();

        const select = document.getElementById('approval-template-select');
        select.innerHTML = '<option value="">Select a template...</option>' +
            currentTemplates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

        // Default to invoice template if available
        const invoiceTemplate = currentTemplates.find(t => t.id === 'invoice');
        if (invoiceTemplate) {
            select.value = 'invoice';
            applyTemplate();
        } else {
            document.getElementById('approval-subject').value = `Invoice #${inv.invoice_number} from ByteStart Technologies`;
            document.getElementById('approval-body').value = `Hello ${inv.customer_name},\n\nPlease find attached invoice ${inv.invoice_number} for ₹${inv.total}.`;
        }
    } catch (e) {
        console.error('Error loading templates:', e);
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function applyTemplate() {
    const select = document.getElementById('approval-template-select');
    const templateId = select.value;
    if (!templateId) return;

    const template = currentTemplates.find(t => t.id === templateId);
    if (!template || !currentApprovalInv) return;

    let subject = template.subject;
    let body = template.body;

    const vars = {
        customer_name: currentApprovalInv.customer_name || 'Customer',
        invoice_number: currentApprovalInv.invoice_number,
        total: '₹' + currentApprovalInv.total.toLocaleString(),
        due_date: new Date(currentApprovalInv.due_date).toLocaleDateString()
    };

    for (const [key, val] of Object.entries(vars)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, val);
        body = body.replace(regex, val);
    }

    document.getElementById('approval-subject').value = subject;
    document.getElementById('approval-body').value = body;
}

async function approveAndSend() {
    const id = document.getElementById('approval-inv-id').value;
    const subject = document.getElementById('approval-subject').value;
    const body = document.getElementById('approval-body').value;

    const btn = document.querySelector('[onclick="approveAndSend()"]');
    const originalContent = btn ? btn.innerHTML : 'Approve & Send';
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
        btn.disabled = true;
    }

    try {
        const res = await fetch(`/api/admin/invoices/${id}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, body })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Invoice approved and sent!', 'success');
            closeModal('approval-modal');
            switchTab('invoices');
        } else {
            showToast('Failed to send: ' + (data.error || 'Server error'), 'error');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }
}

// User Management Modal Functions
async function openUserEditModal(idx) {
    const user = globalUsers[idx];
    if (!user) return;

    document.getElementById('user-modal-title').innerText = 'Edit User';
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-email').value = user.email || '';
    document.getElementById('edit-user-email').readOnly = true;
    document.getElementById('edit-user-email').classList.add('bg-gray-100', 'dark:bg-gray-600');
    document.getElementById('edit-user-name').value = user.name || '';
    document.getElementById('edit-user-phone').value = user.phone || '';
    document.getElementById('edit-user-gstin').value = user.gstin || '';
    document.getElementById('edit-user-address').value = user.address || '';
    document.getElementById('edit-user-city').value = user.city || '';
    document.getElementById('edit-user-state').value = user.state || '';
    document.getElementById('edit-user-pincode').value = user.pincode || '';

    const modal = document.getElementById('user-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function openCreateUserModal() {
    document.getElementById('user-modal-title').innerText = 'Create New User';
    document.getElementById('edit-user-id').value = '';
    document.getElementById('edit-user-email').value = '';
    document.getElementById('edit-user-email').readOnly = false;
    document.getElementById('edit-user-email').classList.remove('bg-gray-100', 'dark:bg-gray-600');
    document.getElementById('edit-user-name').value = '';
    document.getElementById('edit-user-phone').value = '';
    document.getElementById('edit-user-gstin').value = '';
    document.getElementById('edit-user-address').value = '';
    document.getElementById('edit-user-city').value = '';
    document.getElementById('edit-user-state').value = '';
    document.getElementById('edit-user-pincode').value = '';

    const modal = document.getElementById('user-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function saveUserDetails(e) {
    e.preventDefault();
    const id = document.getElementById('edit-user-id').value;
    const email = document.getElementById('edit-user-email').value;
    const name = document.getElementById('edit-user-name').value;
    const phone = document.getElementById('edit-user-phone').value;
    const gstin = document.getElementById('edit-user-gstin').value;
    const address = document.getElementById('edit-user-address').value;
    const city = document.getElementById('edit-user-city').value;
    const state = document.getElementById('edit-user-state').value;
    const pincode = document.getElementById('edit-user-pincode').value;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = 'Saving...';

    try {
        const isCreate = !id;
        const url = isCreate ? '/api/admin/users' : `/api/admin/users/${id}`;
        const method = 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, phone, gstin, address, city, state, pincode })
        });

        if (res.ok) {
            showToast(isCreate ? 'User created successfully' : 'User updated successfully', 'success');
            closeModal('user-modal');
            if (typeof switchTab === 'function') switchTab('users'); // Refresh user list
        } else {
            const data = await res.json();
            alert('Error: ' + data.error);
        }
    } catch (err) {
        console.error(err);
        alert('Failed to save user details');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Save Changes';
    }
}

window.openApprovalModal = openApprovalModal;
window.applyTemplate = applyTemplate;
window.approveAndSend = approveAndSend;
window.openUserEditModal = openUserEditModal;
window.openCreateUserModal = openCreateUserModal;
window.saveUserDetails = saveUserDetails;

