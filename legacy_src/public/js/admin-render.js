// --- Admin Rennders ---

function renderUsers(container, data) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <i class="fa-solid fa-users-cog text-white"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-900 dark:text-white text-lg">Platform Users</h3>
                    <p class="text-sm text-gray-500">${data.length} registered users</p>
                </div>
            </div>
            <button onclick="openCreateUserModal()" class="btn-primary px-5 py-2.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <i class="fa-solid fa-user-plus mr-2"></i>Create User
            </button>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table class="table-premium w-full text-left">
                <thead class="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                    <tr><th class="px-6 py-4">User Details</th><th class="px-6 py-4">GSTIN</th><th class="px-6 py-4">Auth Provider</th><th class="px-6 py-4">Joined</th><th class="px-6 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    ${data.map((u, idx) => `
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/40 group transition-colors text-gray-600 dark:text-gray-300">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-200">
                                        ${u.name ? u.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <div class="font-bold text-gray-900 dark:text-white text-sm">${u.name || 'Unknown'}</div>
                                        <div class="text-xs text-gray-500">${u.email}</div>
                                        ${u.phone ? `<div class="text-[10px] text-gray-400"><i class="fa-solid fa-phone mr-1"></i>${u.phone}</div>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 font-mono text-xs">${u.gstin || '-'}</td>
                            <td class="px-6 py-4">
                                ${u.google_id ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 shadow-sm"><i class="fab fa-google text-red-500"></i> Google</span>'
            : '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"><i class="fa-solid fa-envelope"></i> Email</span>'}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">${new Date(u.created_at).toLocaleDateString()}</td>
                            <td class="px-6 py-4 text-right space-x-2">
                                <button onclick="openUserEditModal(${idx})" class="text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                    <i class="fa-solid fa-user-edit mr-1"></i> Edit
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderSubs(container, data) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
                 <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    <i class="fa-solid fa-credit-card text-white"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-900 dark:text-white text-lg">Subscriptions</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${data.length} subscriptions found</p>
                </div>
            </div>
            <button onclick="syncSubscriptions()" id="btn-sync-subs" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl shadow-lg font-semibold flex items-center gap-2 transition-all hover:shadow-xl">
                 <i class="fa-solid fa-rotate"></i> Sync from Razorpay
            </button>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table class="table-premium w-full text-left">
                <thead class="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                    <tr>
                        <th class="px-6 py-4">Customer</th>
                        <th class="px-6 py-4">Plan</th>
                        <th class="px-6 py-4">Amount</th>
                        <th class="px-6 py-4">Status</th>
                        <th class="px-6 py-4">Renewal</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    ${data.map(s => {
        const startDate = new Date(s.start_date);
        let renewalDate;
        if (s.renewal_date) {
            renewalDate = new Date(s.renewal_date);
        } else {
            renewalDate = new Date(startDate);
            if (s.billing_cycle === 'yearly') renewalDate.setFullYear(renewalDate.getFullYear() + 1);
            else renewalDate.setMonth(renewalDate.getMonth() + 1); // Default monthly
        }

        const isOverdue = new Date() > renewalDate && s.status === 'active';

        return `
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                            <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                ${s.user_name ? s.user_name :
                `<span class="text-orange-500 dark:text-orange-400 italic flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation"></i> Unknown User</span>`}
                                ${s.user_email ? `<div class="text-xs text-gray-400 dark:text-gray-500">${s.user_email}</div>` : ''}
                            </td>
                            <td class="px-6 py-4 capitalize text-gray-800 dark:text-gray-200">
                                <span class="font-semibold">${s.plan_name || s.plan_id}</span>
                                <div class="text-xs text-gray-400 dark:text-gray-500 font-mono">${s.razorpay_sub_id}</div>
                            </td>
                            <td class="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">
                                ${s.amount ? '₹' + s.amount.toLocaleString() : '-'}
                            </td>
                            <td class="px-6 py-4">
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold ${s.status === 'active' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400' :
                s.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }">${s.status}</span>
                            </td>
                            <td class="px-6 py-4 text-sm">
                                <div class="${isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400'}">${renewalDate.toLocaleDateString()}</div>
                                ${isOverdue ? '<div class="text-xs text-red-500 dark:text-red-400">Overdue</div>' : ''}
                            </td>
                            <td class="px-6 py-4 text-right flex justify-end gap-2">
                                <button onclick='viewSubscriptionDetails(${JSON.stringify(s).replace(/'/g, "&#39;")})' class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium border border-gray-300 dark:border-gray-600">
                                    Details
                                </button>
                                ${!s.user_id ? `
                                    <button onclick="openAssignUserModal('${s.id}')" class="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors font-medium border border-blue-300 dark:border-blue-700">Assign User</button>
                                ` : `
                                    <button onclick="openUpdateUserModal('${s.id}', '${s.user_email || ''}')" class="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors font-medium border border-purple-300 dark:border-purple-700">Update User</button>
                                `}
                            </td>
                        </tr>
                    `}).join('')}
                </tbody>
            </table>
        </div>`;
}

function viewSubscriptionDetails(sub) {
    const content = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div><label class="block text-gray-500">Subscription ID</label><div class="font-mono bg-gray-50 p-1 rounded">${sub.razorpay_sub_id}</div></div>
                <div><label class="block text-gray-500">Status</label><div class="font-bold uppercase">${sub.status}</div></div>
                <div><label class="block text-gray-500">Plan</label><div>${sub.plan_name || sub.plan_id}</div></div>
                <div><label class="block text-gray-500">Billing Cycle</label><div class="capitalize">${sub.billing_cycle || 'Monthly'}</div></div>
                
                <div><label class="block text-gray-500">Start Date</label><div>${new Date(sub.start_date).toLocaleString()}</div></div>
                <div><label class="block text-gray-500">Renewal Date</label><div class="font-bold text-indigo-600">${sub.renewal_date ? new Date(sub.renewal_date).toLocaleDateString() : 'N/A'}</div></div>
                <div><label class="block text-gray-500">User</label><div>${sub.user_name || 'Unassigned'} <span class="text-gray-400 text-xs">(${sub.user_email || 'No Email'})</span></div></div>
            </div>
            <div class="pt-4 border-t border-gray-100">
                <h4 class="font-bold text-gray-700 mb-2">Raw Data</h4>
                <pre class="bg-gray-900 text-green-400 p-3 rounded-lg text-xs overflow-auto h-32">${JSON.stringify(sub, null, 2)}</pre>
            </div>
        </div>
    `;
    // Create a temporary modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 class="font-bold text-lg text-gray-900">Subscription Details</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fa-solid fa-times text-xl"></i>
                </button>
            </div>
            <div class="p-6">
                ${content}
            </div>
            <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button onclick="this.closest('.fixed').remove()" class="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function renderActivity(container, data) {
    container.innerHTML = `
        <div class="space-y-4">
            ${data.map(a => `
                <div class="bg-white p-4 rounded-xl border border-gray-200 flex items-start gap-4">
                    <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <i class="fa-solid fa-bolt text-gray-500"></i>
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-start">
                            <h4 class="font-semibold text-gray-900">${a.action.replace('_', ' ')}</h4>
                            <span class="text-xs text-gray-400">${new Date(a.timestamp).toLocaleString()}</span>
                        </div>
                        <p class="text-sm text-gray-600 mt-1">${a.details}</p>
                        <p class="text-xs text-gray-400 mt-1">User: ${a.user_name || 'System'}</p>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

function renderPlans(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                    <i class="fa-solid fa-box-open text-white"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-900 text-lg">Website Plans</h3>
                    <p class="text-sm text-gray-500">${globalPlans.length} plans configured</p>
                </div>
            </div>
            <div class="flex gap-2">
                 <button onclick="openRazorpayPlanModal()" class="px-5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold flex items-center gap-2 hover:bg-blue-100 transition-colors">
                    <i class="fa-solid fa-credit-card"></i> Razorpay Plan
                </button>
                <button onclick="openPlanModal()" class="btn-primary text-white px-5 py-2.5 rounded-xl shadow-lg font-semibold flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> New Plan
                </button>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${globalPlans.map((p, idx) => `
                <div class="card-premium p-6 relative group border border-gray-100 dark:border-gray-800">
                    <div class="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onclick="openPlanModal(${idx})" class="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <i class="fa-solid fa-pen text-sm"></i>
                        </button>
                        <button onclick="deletePlan('${p.id.replace(/'/g, "\\'")}', '${p.name.replace(/'/g, "\\'")}')" class="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <i class="fa-solid fa-trash text-sm"></i>
                        </button>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-2 mb-3">
                        <span class="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 dark:bg-primary-900/40 px-2 py-1 rounded-full">${getCategoryName(p.category)}</span>
                        ${p.is_active ? '<span class="flex items-center gap-1 text-xs text-green-600 font-medium"><span class="h-2 w-2 rounded-full bg-green-500"></span> Active</span>' : '<span class="flex items-center gap-1 text-xs text-gray-400 font-medium"><span class="h-2 w-2 rounded-full bg-gray-300"></span> Inactive</span>'}
                    </div>
                    
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${p.name}</h3>
                    <div class="text-3xl font-bold text-gray-900 dark:text-white mb-1">₹${(p.price_discounted || 0).toLocaleString()}</div>
                    <div class="text-sm text-gray-400 mb-4">
                        <span class="line-through">₹${(p.price_original || 0).toLocaleString()}</span>
                        <span class="text-green-600 ml-2">${p.price_original ? Math.round((1 - (p.price_discounted || 0) / p.price_original) * 100) : 0}% off</span>
                    </div>
                    
                    <div class="text-xs font-mono text-gray-500 bg-gray-50 p-2 rounded-lg truncate mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-building-columns text-indigo-400"></i>
                        <span class="truncate">${p.razorpay_plan_id || 'No Razorpay ID'}</span>
                    </div>
                    
                    <div class="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <button onclick="openPlanModal(${idx})" class="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 transition-all flex items-center justify-center gap-2">
                            <i class="fa-solid fa-pen text-xs"></i> ✏️ Edit Details
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        ${globalPlans.length === 0 ? `
            <div class="card-premium p-12 text-center">
                <div class="text-5xl mb-4">📦</div>
                <h3 class="font-bold text-gray-800 text-xl mb-2">No Plans Yet</h3>
                <p class="text-gray-500 mb-6">Create your first subscription plan</p>
                <button onclick="openPlanModal()" class="btn-primary text-white px-6 py-3 rounded-xl font-medium">
                    <i class="fa-solid fa-plus mr-2"></i> Create First Plan
                </button>
            </div>
        ` : ''}
    `;
}

function renderCategories(container) {
    container.innerHTML = `
        <div class="card-premium overflow-hidden">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                        <i class="fa-solid fa-tags text-gray-700 dark:text-gray-300"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white text-lg">All Categories</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${globalCategories.length} categories configured</p>
                    </div>
                </div>
                <button onclick="openCategoryModal()" class="btn-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> Add Category
                </button>
            </div>
            <table class="table-premium w-full text-left">
                <thead class="text-xs text-gray-500 uppercase font-semibold">
                    <tr>
                        <th class="px-6 py-4">Display Name</th>
                        <th class="px-6 py-4">Slug ID</th>
                        <th class="px-6 py-4">Tagline</th>
                        <th class="px-6 py-4 text-center">Order</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    ${globalCategories.map(c => `
                        <tr class="hover:bg-primary-50/30 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <span class="text-2xl">${c.icon || '📁'}</span>
                                    <span class="font-semibold text-gray-900">${c.name}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <code class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">${c.id}</code>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500">${c.tagline || '-'}</td>
                            <td class="px-6 py-4 text-center">
                                <span class="bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full text-xs font-bold">${c.display_order}</span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex justify-end gap-2">
                                    <button onclick="openCategoryModal('${c.id}')" 
                                        class="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1.5">
                                        <i class="fa-solid fa-pen-to-square text-xs"></i> Edit
                                    </button>
                                    <button onclick="deleteCategory('${c.id}', '${c.name.replace(/'/g, "\\'")}')" 
                                        class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5">
                                        <i class="fa-solid fa-trash text-xs"></i> Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${globalCategories.length === 0 ? `
                <div class="p-12 text-center">
                    <div class="text-5xl mb-4">📁</div>
                    <h3 class="font-bold text-gray-800 text-xl mb-2">No Categories Yet</h3>
                    <p class="text-gray-500 mb-6">Create categories to organize your plans</p>
                    <button onclick="openCategoryModal()" class="btn-primary text-white px-6 py-3 rounded-xl font-medium">
                        <i class="fa-solid fa-plus mr-2"></i> Create First Category
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Errors
function renderErrors(container, errors) {
    const unresolvedCount = errors.filter(e => !e.resolved).length;
    updateErrorBadge(unresolvedCount);

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
                <span class="text-3xl">🚨</span>
                <div>
                    <h3 class="font-bold text-gray-900 text-lg">Error Logs</h3>
                    <p class="text-sm text-gray-500">${errors.length} total, ${unresolvedCount} unresolved</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="refreshErrors()" class="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50">
                    🔄 Refresh
                </button>
                <button onclick="clearAllErrors()" class="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100">
                    🗑️ Clear All
                </button>
            </div>
        </div>
        
        ${errors.length === 0 ? `
            <div class="card-premium p-12 text-center">
                <div class="text-5xl mb-4">✅</div>
                <h3 class="font-bold text-gray-800 text-xl mb-2">No Errors</h3>
                <p class="text-gray-500">Your system is running smoothly!</p>
            </div>
        ` : `
            <div class="space-y-3">
                ${errors.map(err => `
                    <div class="card-premium p-4 ${err.resolved ? 'opacity-60' : ''} hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start gap-4">
                            <div class="flex-grow">
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getErrorTypeColor(err.error_type)}">${err.error_type}</span>
                                    ${err.resolved ? '<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Resolved</span>' : ''}
                                    <span class="text-xs text-gray-400">${formatTimeAgo(err.created_at)}</span>
                                </div>
                                <p class="text-sm font-medium text-gray-900 mb-1">${escapeHtml(err.message)}</p>
                                ${err.stack ? `
                                    <details class="mt-2">
                                        <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Stack Trace</summary>
                                        <pre class="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 overflow-x-auto max-h-32">${escapeHtml(err.stack)}</pre>
                                    </details>
                                ` : ''}
                                ${err.context && err.context !== '{}' ? `
                                    <details class="mt-2">
                                        <summary class="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Context</summary>
                                        <pre class="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 overflow-x-auto">${escapeHtml(err.context)}</pre>
                                    </details>
                                ` : ''}
                            </div>
                            <div class="flex gap-1">
                                ${!err.resolved ? `
                                    <button onclick="resolveError(${err.id})" class="p-2 rounded-lg text-green-600 hover:bg-green-50" title="Mark Resolved">✓</button>
                                ` : ''}
                                <button onclick="deleteError(${err.id})" class="p-2 rounded-lg text-red-500 hover:bg-red-50" title="Delete">✕</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `}
    `;
}

// Customers & Invoices
function renderCustomers(container, customers) {
    window.globalCustomers = customers;
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center">
                    <i class="fa-solid fa-address-book text-white"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-900 text-lg">Customers</h3>
                    <p class="text-sm text-gray-500">${customers.length} records</p>
                </div>
            </div>
            <button onclick="openCustomerModal()" class="btn-primary text-white px-5 py-2.5 rounded-xl shadow-lg font-semibold flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> New Customer
            </button>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table class="table-premium w-full text-left">
                <thead class="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                    <tr>
                        <th class="px-6 py-4">Name / Company</th>
                        <th class="px-6 py-4">Contact</th>
                        <th class="px-6 py-4">Location</th>
                        <th class="px-6 py-4">GSTIN</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    ${customers.map(c => `
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/40 group transition-colors">
                            <td class="px-6 py-4 font-bold text-gray-900">${c.name}</td>
                            <td class="px-6 py-4">
                                <div class="text-sm">${c.email || '-'}</div>
                                <div class="text-xs text-gray-400">${c.phone || '-'}</div>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600">
                                ${c.city || ''} ${c.state ? ', ' + c.state : ''}
                            </td>
                            <td class="px-6 py-4">
                                ${c.gstin ? `<span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono font-bold">${c.gstin}</span>` : '<span class="text-gray-400 text-xs">-</span>'}
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onclick='openCustomerModal(${c.id})' class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button onclick="deleteObject('customers', ${c.id})" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                    ${customers.length === 0 ? '<tr><td colspan="5" class="px-6 py-12 text-center text-gray-500">No customers found. Create one to get started.</td></tr>' : ''}
                </tbody>
            </table>
        </div>
    `;
}

function renderInvoices(container, invoices) {
    const filteredInvoices = invoices.filter(inv =>
        activeInvoiceTab === 'manual' ? (inv.type !== 'automated') : (inv.type === 'automated')
    );

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <i class="fa-solid fa-file-invoice-dollar text-white"></i>
                </div>
                <div>
                    <h3 class="font-bold text-gray-900 text-lg">Invoices</h3>
                    <p class="text-sm text-gray-500">${filteredInvoices.length} invoices found</p>
                </div>
            </div>
            ${activeInvoiceTab === 'manual' ? `
                <button onclick="openInvoiceModal()" class="btn-primary text-white px-5 py-2.5 rounded-xl shadow-lg font-semibold flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i> New Invoice
                </button>
            ` : `
                <button onclick="generateAutomatedInvoices()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg font-semibold flex items-center gap-2">
                    <i class="fa-solid fa-robot"></i> Generate Drafts
                </button>
            `}
        </div>
        
        <!-- Tabs -->
        <div class="flex border-b border-gray-200 mb-6">
            <button onclick="switchInvoiceTab('manual')" class="px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeInvoiceTab === 'manual' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}">
                Normal Invoices
            </button>
            <button onclick="switchInvoiceTab('automated')" class="px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeInvoiceTab === 'automated' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}">
                Automated Invoices
            </button>
        </div>
        
        <div class="grid gap-4">
            ${filteredInvoices.map(inv => `
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 transition-all group">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <div class="flex items-center gap-3 mb-1">
                                <h4 class="font-bold text-gray-900 text-lg">${inv.invoice_number}</h4>
                                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${inv.status === 'paid' ? 'bg-green-100 text-green-700' :
            inv.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                inv.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
        }">${inv.status}</span>
                                ${inv.type === 'automated' ? '<span class="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded border border-indigo-100">Auto</span>' : ''}
                            </div>
                            <p class="text-sm text-gray-500">To: <span class="font-medium text-gray-900">${inv.customer_name || 'Unknown'}</span></p>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-gray-900">₹${inv.total.toLocaleString()}</div>
                            <p class="text-xs text-gray-500">Due: ${new Date(inv.due_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div class="text-xs text-gray-500">
                            Created: ${new Date(inv.created_at).toLocaleDateString()}
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.open('/api/admin/invoices/${inv.id}/pdf', '_blank')" class="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2">
                                <i class="fa-solid fa-download text-gray-400"></i> PDF
                            </button>
                            
                            ${inv.status === 'draft' ? `
                                <button onclick='openApprovalModal(${JSON.stringify(inv).replace(/'/g, "&#39;")})' class="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2">
                                    <i class="fa-solid fa-check-double"></i> Approve & Send
                                </button>
                                ${activeInvoiceTab === 'manual' ? `
                                    <button onclick='openInvoiceModal(${JSON.stringify(inv).replace(/'/g, "&#39;")})' class="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                                        Edit
                                    </button>
                                ` : ''}
                            ` : ''}
                            ${inv.status === 'sent' ? `
                                <button onclick="markInvoicePaid('${inv.id}')" class="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                                    Mark Paid
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
            ${filteredInvoices.length === 0 ? '<div class="text-center p-12 text-gray-400">No invoices found</div>' : ''}
        </div>
    `;
}

function renderInvoiceItems() {
    const container = document.getElementById('invoice-items-container');
    container.innerHTML = currentInvoiceItems.map((item, idx) => `
        <div class="grid grid-cols-12 gap-2 items-center mb-2">
            <div class="col-span-4">
                <input type="text" class="w-full border rounded p-1 text-sm" placeholder="Description" value="${item.description}" 
                    onchange="updateItem(${idx}, 'description', this.value)">
            </div>
            <div class="col-span-2">
                <input type="text" list="hsn-codes" class="w-full border rounded p-1 text-sm font-mono" placeholder="HSN" value="${item.hsn_code || ''}" 
                    onchange="updateItem(${idx}, 'hsn_code', this.value)">
            </div>
            <div class="col-span-2">
                <input type="number" class="w-full border rounded p-1 text-sm" placeholder="Qty" value="${item.quantity}" 
                    onchange="updateItem(${idx}, 'quantity', this.value)">
            </div>
            <div class="col-span-2">
                <input type="number" class="w-full border rounded p-1 text-sm" placeholder="Rate" value="${item.rate}" 
                    onchange="updateItem(${idx}, 'rate', this.value)">
            </div>
            <div class="col-span-1 text-right font-mono text-sm">
                ₹${(item.quantity * item.rate).toFixed(0)}
            </div>
            <div class="col-span-1 text-right">
                <button type="button" onclick="removeItem(${idx})" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-times"></i></button>
            </div>
        </div>
    `).join('');

    updateInvoiceTotals();
}

async function renderSettings(container) {
    container.innerHTML = '<div class="text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-3xl text-primary-500"></i><p class="mt-2 text-gray-500 dark:text-gray-400">Loading settings...</p></div>';

    try {
        // Fetch both settings and env data in parallel
        const [settingsRes, envRes] = await Promise.all([
            fetch('/api/admin/settings'),
            fetch('/api/admin/env')
        ]);

        const settings = await settingsRes.json();
        const env = envRes.ok ? await envRes.json() : {};

        container.innerHTML = `
            <div class="max-w-4xl mx-auto space-y-6">
                <!-- Branding -->
                <div class="card-premium p-8 dark:bg-gray-800 dark:border-gray-700">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg"><i class="fa-solid fa-palette"></i></div>
                        Branding & Contact
                    </h3>
                    <form onsubmit="saveSettings(event)" class="space-y-4">
                        <input type="hidden" name="category" value="branding">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                                <input type="text" name="company_name" value="${settings.company_name || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Email</label>
                                <input type="email" name="support_email" value="${settings.support_email || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Phone (WhatsApp & Call)</label>
                                <input type="text" name="support_phone" value="${settings.support_phone || ''}" placeholder="918076354446" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <p class="text-xs text-gray-400 mt-1">Format: Country code + number (e.g., 918076354446). Used for both WhatsApp chat and Call button.</p>
                            </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL (Footer/General)</label>
                                <input type="text" name="logo_url" value="${settings.logo_url || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Navbar Icon URL</label>
                                <input type="text" name="navbar_icon" value="${settings.navbar_icon || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Favicon URL</label>
                                <input type="text" name="favicon_url" value="${settings.favicon_url || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            </div>
                        </div>
                        <div class="flex justify-end pt-4">
                            <button type="submit" class="btn-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">Save Branding</button>
                        </div>
                    </form>
                </div>

                <!-- Homepage Content -->
                <div class="card-premium p-8 dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-blue-400">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center text-white shadow-lg"><i class="fa-solid fa-house"></i></div>
                        Homepage Content
                    </h3>
                    <form onsubmit="saveSettings(event)" class="space-y-4">
                        <input type="hidden" name="category" value="homepage">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sale Banner Text</label>
                                <input type="text" name="sale_banner_text" value="${settings.sale_banner_text || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <p class="text-[10px] text-gray-400 mt-1">Example: 🔥 ByteStart Services Sale - Limited Time Offer!</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section Title (supports **bold** for gradient)</label>
                                <input type="text" name="homepage_title" value="${settings.homepage_title || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <p class="text-[10px] text-gray-400 mt-1">Example: Plans for **Growth & Scale** 📈</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section Subtitle</label>
                                <textarea name="homepage_subtitle" rows="2" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">${settings.homepage_subtitle || ''}</textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disclaimer Text</label>
                                <textarea name="disclaimer_text" rows="2" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white">${settings.disclaimer_text || 'Disclaimer: All websites are subscription based only. Prices and plans are subject to change.'}</textarea>
                            </div>
                        </div>
                        <div class="flex justify-end pt-4">
                            <button type="submit" class="btn-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">Save Content</button>
                        </div>
                    </form>
                </div>
                
                <!-- Invoice Settings -->
                <div class="card-premium p-8 dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-emerald-400">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg"><i class="fa-solid fa-file-invoice"></i></div>
                        Invoice Settings
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">These details will appear on your PDF invoices. Fields marked with <span class="text-red-500">*</span> are required for valid invoices.</p>
                    <form onsubmit="saveSettings(event)" class="space-y-4">
                        <input type="hidden" name="category" value="invoice">
                        
                        <!-- Company Address -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col-span-2">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Address</label>
                                <input type="text" name="company_address" value="${settings.company_address || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="123 Business Street, Suite 100">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                <input type="text" name="company_city" value="${settings.company_city || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Mumbai">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                                <input type="text" name="company_state" value="${settings.company_state || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Maharashtra">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                                <input type="text" name="company_pincode" value="${settings.company_pincode || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="400001">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Phone</label>
                                <input type="text" name="company_phone" value="${settings.company_phone || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="+91 9876543210">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Email</label>
                                <input type="email" name="company_email" value="${settings.company_email || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="billing@company.com">
                            </div>
                        </div>
                        
                        <!-- Tax Registration -->
                        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">Tax Registration Details</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GSTIN <span class="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                    <input type="text" name="company_gstin" value="${settings.company_gstin || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono uppercase" placeholder="22AAAAA0000A1Z5" maxlength="15" pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$">
                                    <p class="text-[10px] text-gray-400 mt-1">Format: 22AAAAA0000A1Z5 (15 characters)</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PAN Number <span class="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                    <input type="text" name="company_pan" value="${settings.company_pan || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono uppercase" placeholder="AAAAA0000A" maxlength="10" pattern="^[A-Z]{5}[0-9]{4}[A-Z]{1}$">
                                    <p class="text-[10px] text-gray-400 mt-1">Format: AAAAA0000A (10 characters)</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State Code <span class="text-gray-400 text-xs font-normal">(For GST)</span></label>
                                    <input type="text" name="company_state_code" value="${settings.company_state_code || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono" placeholder="27" maxlength="2">
                                    <p class="text-[10px] text-gray-400 mt-1">e.g., 27 for Maharashtra, 07 for Delhi</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CIN/LLPIN <span class="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                    <input type="text" name="company_cin" value="${settings.company_cin || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono uppercase" placeholder="U72200MH2020PTC123456">
                                    <p class="text-[10px] text-gray-400 mt-1">Company Identification Number (for Pvt Ltd/LLP)</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Invoice Configuration -->
                        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">Invoice Configuration</h4>
                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Prefix <span class="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                    <input type="text" name="invoice_prefix" value="${settings.invoice_prefix || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono" placeholder="INV-" maxlength="10">
                                    <p class="text-[10px] text-gray-400 mt-1">e.g., INV-, BS-, 2024/</p>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency Symbol</label>
                                    <input type="text" name="invoice_currency" value="${settings.invoice_currency || '₹'}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-center text-xl" placeholder="₹" maxlength="4">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Due Days</label>
                                    <input type="number" name="invoice_due_days" value="${settings.invoice_due_days || '15'}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="15" min="0" max="365">
                                    <p class="text-[10px] text-gray-400 mt-1">Days from invoice date</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Default Tax Rates -->
                        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">Default Tax Rates <span class="text-gray-400 text-xs font-normal">(% - can be overridden per invoice)</span></h4>
                            <div class="grid grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CGST Rate (%)</label>
                                    <input type="number" name="default_cgst_rate" value="${settings.default_cgst_rate || '9'}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="9" min="0" max="50" step="0.1">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SGST Rate (%)</label>
                                    <input type="number" name="default_sgst_rate" value="${settings.default_sgst_rate || '9'}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="9" min="0" max="50" step="0.1">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IGST Rate (%)</label>
                                    <input type="number" name="default_igst_rate" value="${settings.default_igst_rate || '18'}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="18" min="0" max="50" step="0.1">
                                    <p class="text-[10px] text-gray-400 mt-1">Used for inter-state</p>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
                                <i class="fa-solid fa-info-circle mr-1 text-blue-500"></i>
                                CGST + SGST are applied for intra-state (same state) sales. IGST is applied for inter-state sales.
                            </p>
                        </div>
                        
                        <!-- Bank Details -->
                        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">Bank Details (for Invoice Footer)</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
                                    <input type="text" name="company_bank_name" value="${settings.company_bank_name || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="HDFC Bank">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
                                    <input type="text" name="company_bank_account" value="${settings.company_bank_account || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono" placeholder="50100123456789">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
                                    <input type="text" name="company_bank_ifsc" value="${settings.company_bank_ifsc || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono uppercase" placeholder="HDFC0001234" maxlength="11">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                                    <input type="text" name="company_bank_branch" value="${settings.company_bank_branch || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="Mumbai Main Branch">
                                </div>
                                <div class="col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UPI ID <span class="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                    <input type="text" name="company_upi_id" value="${settings.company_upi_id || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono" placeholder="company@upi">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Invoice Notes/Terms -->
                        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">Invoice Footer Notes <span class="text-gray-400 text-xs font-normal">(Optional)</span></h4>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Terms & Conditions / Notes</label>
                                <textarea name="invoice_terms" rows="3" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm" placeholder="Payment due within 15 days. Late payments may incur interest at 18% p.a.">${settings.invoice_terms || ''}</textarea>
                                <p class="text-[10px] text-gray-400 mt-1">This will appear at the bottom of every invoice</p>
                            </div>
                            <div class="mt-4">
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authorized Signature Image URL <span class="text-gray-400 text-xs font-normal">(Optional)</span></label>
                                <input type="url" name="invoice_signature_url" value="${settings.invoice_signature_url || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white" placeholder="https://example.com/signature.png">
                                <p class="text-[10px] text-gray-400 mt-1">Recommended size: 150x50px PNG with transparent background</p>
                            </div>
                        </div>
                        
                        <div class="flex justify-end pt-4">
                            <button type="submit" class="btn-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all bg-emerald-600 border-emerald-600">Save Invoice Settings</button>
                        </div>
                    </form>
                </div>
                
                <!-- Policy Editors -->
                <div class="card-premium p-8 border-l-4 border-l-green-400 dark:bg-gray-800 dark:border-gray-700 dark:border-l-green-500">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-lg"><i class="fa-solid fa-file-contract"></i></div>
                        Legal Policies (HTML)
                    </h3>
                    <form onsubmit="saveSettings(event)" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Privacy Policy</label>
                            <textarea name="privacy_policy" rows="8" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm" placeholder="Enter Privacy Policy HTML...">${settings.privacy_policy || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Terms & Conditions</label>
                            <textarea name="terms_policy" rows="8" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm" placeholder="Enter Terms & Conditions HTML...">${settings.terms_policy || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Refund Policy</label>
                            <textarea name="refund_policy" rows="8" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm" placeholder="Enter Refund Policy HTML...">${settings.refund_policy || ''}</textarea>
                        </div>
                        <div class="flex justify-end pt-4">
                            <button type="submit" class="btn-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all bg-green-600 border-green-600">Save Policies</button>
                        </div>
                    </form>
                </div>
                
                <!-- API Keys (Env) -->
                <div class="card-premium p-8 border-l-4 border-l-yellow-400 dark:bg-gray-800 dark:border-gray-700 dark:border-l-yellow-500">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white shadow-lg"><i class="fa-solid fa-key"></i></div>
                        API Configurations (.env)
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-100 dark:border-yellow-800"><i class="fa-solid fa-triangle-exclamation mr-2"></i>Warning: Updating these values will modify .env and may require server restart!</p>
                    
                    <form onsubmit="saveEnvConfig(event)" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razorpay Key ID</label>
                                <input type="text" name="RAZORPAY_KEY_ID" value="${env.RAZORPAY_KEY_ID || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razorpay Key Secret</label>
                                <input type="text" name="RAZORPAY_KEY_SECRET" value="${env.RAZORPAY_KEY_SECRET || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm">
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                             <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Client ID</label>
                                <input type="text" name="GOOGLE_CLIENT_ID" value="${env.GOOGLE_CLIENT_ID || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm">
                            </div>
                             <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Google Client Secret</label>
                                <input type="text" name="GOOGLE_CLIENT_SECRET" value="${env.GOOGLE_CLIENT_SECRET || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm">
                            </div>
                        </div>

                        <!-- SMTP -->
                        <div class="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <h4 class="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider">SMTP Email Settings</h4>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
                                    <input type="text" name="SMTP_HOST" value="${env.SMTP_HOST || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm">
                                </div>
                                 <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Port</label>
                                    <input type="text" name="SMTP_PORT" value="${env.SMTP_PORT || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm">
                                </div>
                                 <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP User</label>
                                    <input type="text" name="SMTP_USER" value="${env.SMTP_USER || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm">
                                </div>
                                 <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Password</label>
                                    <input type="text" name="SMTP_PASS" value="${env.SMTP_PASS || ''}" class="input-premium w-full p-3 rounded-xl border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white font-mono text-sm">
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-between items-center pt-4">
                            <button type="button" onclick="testSmtpEnv()" class="text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-sm"><i class="fa-solid fa-paper-plane mr-1"></i> Send Test Email</button>
                            <button type="submit" class="btn-primary text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all bg-gray-900 border-gray-900">Update .env Config</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="p-8 text-center text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">Error loading settings: ${e.message}</div>`;
    }
}


async function renderRazorpayPlans(container, forceRefresh = false) {
    container.innerHTML = '<div class="flex justify-center py-16"><div class="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>';

    try {
        let plans = razorpayPlansCache;
        if (!plans || forceRefresh) {
            const res = await fetch('/api/admin/razorpay/plans?refresh=' + forceRefresh);

            // Check if response is JSON
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await res.text();
                throw new Error(`Invalid response from server. Expected JSON but received: ${text.substring(0, 100)}...`);
            }

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            if (!data.connected) {
                throw new Error("Razorpay not connected. Please check your API keys in Site Settings.");
            }

            plans = data.plans || [];
            razorpayPlansCache = plans;
        }

        let plansGrid = '';
        if (plans.length > 0) {
            plansGrid = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${plans.map(plan => {
                const amount = (plan.item.amount / 100).toLocaleString();
                return `
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all relative group">
                        <div class="absolute top-4 right-4 flex gap-2">
                             <button onclick="importRazorpayPlan('${plan.id}', '${plan.item.name}', ${plan.item.amount}, '${plan.period}')" 
                                class="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1" title="Import as Website Plan">
                                <i class="fa-solid fa-download"></i> Import
                            </button>
                            <button onclick="openMapPlanModal('${plan.id}', '${plan.item.name}')" 
                                class="bg-purple-50 text-purple-600 hover:bg-purple-100 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1" title="Map to Existing Plan">
                                <i class="fa-solid fa-link"></i> Map
                            </button>
                        </div>
                        
                        <div class="mb-4">
                            <span class="inline-block px-2 py-1 rounded-md bg-gray-100 text-xs font-mono text-gray-500 mb-2">${plan.id}</span>
                            <h3 class="font-bold text-gray-900 text-lg line-clamp-1" title="${plan.item.name}">${plan.item.name}</h3>
                        </div>
                        
                        <div class="flex items-baseline gap-1 mb-4">
                            <span class="text-3xl font-bold text-gray-900">₹${amount}</span>
                            <span class="text-gray-500 text-sm">/${plan.period === 'weekly' ? 'week' : plan.period === 'monthly' ? 'mo' : 'yr'}</span>
                        </div>
                        
                        <div class="pt-4 border-t border-gray-100">
                            <div class="text-xs text-gray-500 mb-1">Description</div>
                            <p class="text-sm text-gray-700 line-clamp-2">${plan.item.description || 'No description'}</p>
                        </div>
                        <div class="flex justify-between items-center pt-1">
                            <a href="https://dashboard.razorpay.com/app/subscriptions/plans/${plan.id}" target="_blank" 
                                class="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1">
                                <i class="fa-solid fa-external-link-alt"></i> View in Razorpay
                            </a>
                            <button onclick="copyToClipboard('${plan.id}')" class="text-gray-400 hover:text-gray-600 text-xs" title="Copy Plan ID">
                                <i class="fa-solid fa-copy"></i> Copy ID
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
                </div>
            `;
        } else {
            plansGrid = `
                <div class="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
                    <div class="text-5xl mb-4">📦</div>
                    <h3 class="font-bold text-gray-800 text-xl mb-2">No Plans Found</h3>
                    <p class="text-gray-500 mb-6">You haven't created any subscription plans in Razorpay yet.</p>
                    <a href="https://dashboard.razorpay.com/app/subscriptions/plans" target="_blank" 
                        class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors">
                        <i class="fa-solid fa-external-link-alt"></i> Create Plan in Razorpay
                    </a>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="max-w-6xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900">Razorpay Subscription Plans</h2>
                        <p class="text-gray-500 text-sm">Plans synced directly from your Razorpay account</p>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="openRazorpayPlanModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2">
                            <i class="fa-solid fa-plus"></i> Create Plan
                        </button>
                        <button onclick="renderRazorpayPlans(document.getElementById('content-area'), true)" class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                            <i class="fa-solid fa-rotate-right"></i> Refresh
                        </button>
                        <a href="https://dashboard.razorpay.com/app/subscriptions/plans" target="_blank" 
                            class="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                            <i class="fa-solid fa-external-link-alt"></i> Dashboard
                        </a>
                    </div>
                </div>
                ${plansGrid}
            </div>
        `;
    } catch (error) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                <div class="text-5xl mb-4">❌</div>
                <h3 class="font-bold text-red-800 text-xl mb-2">Failed to Load Razorpay Plans</h3>
                <p class="text-red-600 mb-6">${error.message}</p>
                <button onclick="switchTab('razorpay-plans')" class="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium transition-colors">
                    <i class="fa-solid fa-rotate-right mr-2"></i>Retry
                </button>
            </div>
        `;
    }
}
async function saveSettings(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) showToast('Branding settings saved!', 'success');
        else showToast('Failed to save settings', 'error');
    } catch (e) {
        showToast('Error saving settings', 'error');
    }
}

async function saveEnvConfig(e) {
    e.preventDefault();
    if (!confirm("⚠️ CAUTION: Updating API keys will force a server restart.\n\nThe application may be unavailable for a few seconds. Continue?")) return;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch('/api/admin/env', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast('Configuration updated! Server restarting...', 'success');
            setTimeout(() => window.location.reload(), 5000);
        } else {
            showToast('Failed to update configuration', 'error');
        }
    } catch (e) {
        showToast('Error updating configuration', 'error');
    }
}

async function testSmtpEnv() {
    // Collect specific smtp fields from the form
    const form = document.querySelector('form[onsubmit="saveEnvConfig(event)"]');
    const data = {
        host: form.querySelector('[name="SMTP_HOST"]').value,
        port: form.querySelector('[name="SMTP_PORT"]').value,
        user: form.querySelector('[name="SMTP_USER"]').value,
        pass: form.querySelector('[name="SMTP_PASS"]').value,
    };

    if (!data.host || !data.user || !data.pass) {
        alert("Please fill in SMTP Host, User and Password to test.");
        return;
    }

    // Prompt for recipient email
    const recipientEmail = prompt("Enter the email address to send test email to:", data.user);
    if (!recipientEmail) {
        return; // User cancelled
    }
    data.recipient = recipientEmail;

    const btn = event.target;
    // Loading state
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/admin/test-smtp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (res.ok) {
            showToast('✅ Test email sent to ' + result.recipient, 'success');
        } else {
            showToast('❌ SMTP Error: ' + (result.error || 'Unknown error'), 'error');
        }
    } catch (e) {
        showToast('❌ Failed to test SMTP: ' + e.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function renderEmailTemplates(container) {
    try {
        const res = await fetch('/api/admin/email-templates');
        const templates = await res.json();

        container.innerHTML = `
            <div class="max-w-6xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Email Templates</h2>
                        <p class="text-sm text-gray-500 mt-1">Manage email templates for invoices and subscriptions. Use variables like {{customer_name}}, {{invoice_number}}, {{total}}, {{due_date}} for dynamic content.</p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    ${templates.map(t => `
                        <div class="glass-card p-6 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
                                    <i class="fa-solid fa-envelope-open-text"></i>
                                </div>
                                <h3 class="font-bold text-gray-800 dark:text-white uppercase text-xs tracking-wider">${t.name} Template</h3>
                            </div>
                            
                            <form onsubmit="handleTemplateUpdate(event, '${t.id}')" class="space-y-4">
                                <div>
                                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subject Line</label>
                                    <input type="text" name="subject" value="${t.subject}" 
                                        class="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email Body (Text/HTML)</label>
                                    <textarea name="body" rows="12" 
                                        class="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none overflow-y-auto" required>${t.body}</textarea>
                                </div>
                                <div class="flex justify-end items-center pt-2">
                                    <button type="submit" class="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg">
                                        <i class="fa-solid fa-save mr-1"></i> Save Template
                                    </button>
                                </div>
                            </form>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="p-6 text-center text-red-500">Error loading templates: ${e.message}</div>`;
    }
}

async function handleTemplateUpdate(e, id) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const res = await fetch(`/api/admin/email-templates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            showToast('Template updated successfully!', 'success');
        } else {
            showToast('Failed to update template', 'error');
        }
    } catch (e) {
        showToast('Error: ' + e.message, 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

// Global scope attachment for renderers
window.renderPlans = renderPlans;
window.renderCategories = renderCategories;
window.renderUsers = renderUsers;
window.renderSubs = renderSubs;
window.renderActivity = renderActivity;
window.renderErrors = renderErrors;
window.renderCustomers = renderCustomers;
window.renderInvoices = renderInvoices;
window.renderInvoiceItems = renderInvoiceItems;
window.renderSettings = renderSettings;
window.renderRazorpayPlans = renderRazorpayPlans;
window.renderEmailTemplates = renderEmailTemplates;
window.handleTemplateUpdate = handleTemplateUpdate;
window.saveSettings = saveSettings;
window.saveEnvConfig = saveEnvConfig;
window.testSmtpEnv = testSmtpEnv;
