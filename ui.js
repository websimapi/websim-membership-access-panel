import { getMembershipDurationString } from './utils.js';

function renderAdminView(state) {
    const { settings, roles, members } = state;
    return `
        <div class="admin-panel">
            <header>
                <h1><i class="fas fa-users-cog"></i> Membership Admin Panel</h1>
                <div class="view-as-buttons">
                    <button class="btn btn-secondary view-toggle-btn" data-action="setViewMode" data-mode="member">
                        <i class="fas fa-user-check"></i> View as Member
                    </button>
                    <button class="btn btn-secondary view-toggle-btn" data-action="setViewMode" data-mode="unpaid">
                        <i class="fas fa-user"></i> View as Unpaid User
                    </button>
                </div>
            </header>
            <main class="main-content">
                ${renderSettingsSection(settings, roles)}
                ${settings?.rolesEnabled ? renderRoleManagementSection(roles) : ''}
                ${renderMembersSection(members, roles, settings?.rolesEnabled)}
            </main>
        </div>
    `;
}

function renderUserView(state) {
    const { isCreator, viewMode, members, currentUser, settings, roles } = state;
    
    let currentUserMembership = null;
    if (!(isCreator && viewMode === 'unpaid')) {
        const member = members.find(m => m.user.id === currentUser?.id);
        if (member) {
            if (settings?.rolesEnabled && !member.role && settings.defaultRoleId) {
                const defaultRole = roles.find(r => r.id === settings.defaultRoleId);
                currentUserMembership = { ...member, role: defaultRole };
            } else {
                currentUserMembership = member;
            }
        }
    }

    const content = currentUserMembership 
        ? renderMemberDashboard(currentUserMembership, settings)
        : renderMembershipPromptSection(settings);

    return `
        <div class="user-view-wrapper">
            ${isCreator ? `
                <div class="view-toggle-banner">
                    <p>
                        <i class="fas fa-info-circle"></i> 
                        ${viewMode === 'member' 
                            ? 'You are viewing the page as a member.' 
                            : 'You are viewing as an unpaid user.'
                        }
                    </p>
                    <button class="btn btn-secondary" data-action="setViewMode" data-mode="admin">
                        <i class="fas fa-user-shield"></i> Switch to Admin View
                    </button>
                </div>` : ''
            }
            ${content}
        </div>
    `;
}

function renderSettingsSection(settings, roles) {
    const price = settings?.price || 100;
    const model = settings?.pricingModel || 'monthly';
    const rolesEnabled = settings?.rolesEnabled || false;
    const defaultRoleId = settings?.defaultRoleId || '';

    return `
        <section class="settings-section">
            <h2><i class="fas fa-cogs"></i> Membership Settings</h2>
            <form data-action="saveSettings" class="settings-form">
                <div class="form-group">
                    <label for="pricingModel">Pricing Model</label>
                    <select id="pricingModel" name="pricingModel">
                        <option value="daily" ${model === 'daily' ? 'selected' : ''}>Daily</option>
                        <option value="weekly" ${model === 'weekly' ? 'selected' : ''}>Weekly</option>
                        <option value="bi-weekly" ${model === 'bi-weekly' ? 'selected' : ''}>Bi-Weekly</option>
                        <option value="monthly" ${model === 'monthly' ? 'selected' : ''}>Monthly</option>
                        <option value="one-day" ${model === 'one-day' ? 'selected' : ''}>One-Day Pass</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="price">Price (Credits)</label>
                    <input type="number" id="price" name="price" value="${price}" min="1" />
                </div>
                <div class="form-group form-group-toggle">
                    <label for="rolesEnabled">Enable Roles</label>
                    <label class="switch">
                        <input type="checkbox" id="rolesEnabled" name="rolesEnabled" ${rolesEnabled ? 'checked' : ''} />
                        <span class="slider round"></span>
                    </label>
                </div>
                ${rolesEnabled ? `
                     <div class="form-group">
                        <label for="defaultRole">Default Role for New Members</label>
                        <select id="defaultRole" name="defaultRoleId">
                            <option value="">None</option>
                            ${roles.map(role => `<option value="${role.id}" ${defaultRoleId === role.id ? 'selected' : ''}>${role.name}</option>`).join('')}
                        </select>
                    </div>` : ''
                }
                <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Settings</button>
            </form>
        </section>
    `;
}

function renderRoleManagementSection(roles) {
    return `
        <section class="role-management-section">
            <h2><i class="fas fa-user-tag"></i> Manage Roles</h2>
            <form data-action="createRole" class="role-form">
                 <input type="text" name="roleName" placeholder="New role name (e.g., VIP)" required />
                 <input type="color" name="roleColor" value="#cccccc" title="Select role color" />
                 <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Create Role</button>
            </form>
            <div class="role-list">
                ${roles.length > 0 ? roles.map(role => `
                    <div class="role-item" data-role-id="${role.id}">
                        <span class="role-tag" style="background-color: ${role.color};">${role.name}</span>
                        <button class="btn-delete-role" data-action="deleteRole">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>`).join('') : '<p>No roles created yet.</p>'}
            </div>
        </section>
    `;
}

function renderMembersSection(members, roles, rolesEnabled) {
    if (members.length === 0) {
        return '<p>No members yet. Share your project and ask for tips to get started!</p>';
    }
    return `
        <section class="members-section">
            <h2><i class="fas fa-users"></i> Current Members</h2>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Total Paid (Credits)</th>
                            <th>Membership Ends</th>
                            ${rolesEnabled ? '<th>Role</th>' : ''}
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.map(member => renderMemberRow(member, roles, rolesEnabled)).join('')}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

function renderMemberRow(member, roles, rolesEnabled) {
    const { user, totalPaid, membershipEndDate, status, role } = member;
    const getStatusClass = (s) => (s === 'Active' ? 'status-active' : s === 'Lapsed' ? 'status-lapsed' : s === 'Expiring Soon' ? 'status-warning' : '');
    const endDateString = membershipEndDate ? membershipEndDate.toLocaleDateString() : 'N/A';
    
    return `
        <tr>
            <td>
                <div class="member-info">
                    <img src="https://images.websim.com/avatar/${user.username}" alt="${user.username}" />
                    <a href="https://websim.com/@${user.username}" target="_blank" rel="noopener noreferrer">@${user.username}</a>
                </div>
            </td>
            <td class="credits-cell">${totalPaid}</td>
            <td>${endDateString}</td>
            ${rolesEnabled ? `
                <td>
                    <select class="role-select" data-user-id="${user.id}">
                        <option value="">No Role</option>
                        ${roles.map(r => `<option value="${r.id}" ${role?.id === r.id ? 'selected' : ''}>${r.name}</option>`).join('')}
                    </select>
                </td>` : ''
            }
            <td><span class="status-badge ${getStatusClass(status)}">${status}</span></td>
        </tr>
    `;
}

function renderMemberDashboard(member, settings) {
    const { user, totalPaid, membershipEndDate, status, role } = member;
    const getStatusClass = (s) => (s === 'Active' ? 'status-active' : s === 'Lapsed' ? 'status-lapsed' : s === 'Expiring Soon' ? 'status-warning' : '');
    const endDateString = membershipEndDate ? membershipEndDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const durationString = settings ? getMembershipDurationString(settings.pricingModel) : '';

    return `
        <div class="member-dashboard">
            <header class="member-dashboard-header">
                <img src="https://images.websim.com/avatar/${user.username}" alt="${user.username}" />
                <h2><span>Welcome back,</span> @${user.username}!</h2>
                ${role ? `<span class="role-tag" style="background-color: ${role.color}; margin-left: 15px;">${role.name}</span>` : ''}
            </header>
            <main class="main-content">
                 <div class="member-stats">
                    <div class="stat-card"><i class="fas fa-coins icon"></i><div class="stat-card-info"><h4>Total Paid</h4><p>${totalPaid} credits</p></div></div>
                    <div class="stat-card"><i class="fas fa-calendar-check icon"></i><div class="stat-card-info"><h4>Membership Ends</h4><p>${endDateString}</p></div></div>
                    <div class="stat-card"><i class="fas fa-info-circle icon"></i><div class="stat-card-info"><h4>Status</h4><p><span class="status-badge ${getStatusClass(status)}">${status}</span></p></div></div>
                </div>
                ${settings ? `
                    <div class="extend-membership-section">
                        <h3>Extend Your Membership</h3>
                        <p>Continue supporting the creator and keep your benefits.</p>
                        <div class="offer">Tip <strong>${settings.price} credits</strong> ${durationString}.</div>
                        <div><button class="btn btn-primary btn-lg" data-action="extendMembership"><i class="fas fa-comment-dollar"></i> Extend Now</button></div>
                    </div>` : ''
                }
            </main>
        </div>
    `;
}

function renderMembershipPromptSection(settings) {
    if (!settings) {
        return `
            <div class="membership-prompt-section">
                <i class="fas fa-info-circle icon"></i><h3>Membership Not Available</h3>
                <p>The creator has not set up memberships for this project yet. Check back later!</p>
            </div>`;
    }
    const { price, pricingModel } = settings;
    const durationString = getMembershipDurationString(pricingModel);
    return `
        <div class="membership-prompt-section">
            <i class="fas fa-star icon"></i><h3>Become a Member!</h3>
            <p>Support the creator by becoming a member.</p>
            <div class="offer">Tip <strong>${price} credits</strong> ${durationString}.</div>
            <button class="btn btn-primary btn-lg" data-action="becomeMember"><i class="fas fa-comment-dollar"></i> Become a Member</button>
        </div>
    `;
}

export function renderLoading(root) {
    root.innerHTML = `
        <div class="loading-container">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading Membership Panel...</p>
        </div>`;
}

function renderError(root, error) {
    root.innerHTML = `
        <div class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error: ${error}</p>
        </div>`;
}

export function renderApp(root, state) {
    if (state.loading) {
        renderLoading(root);
        return;
    }
    if (state.error) {
        renderError(root, state.error);
        return;
    }

    if (state.isCreator && state.viewMode === 'admin') {
        root.innerHTML = renderAdminView(state);
    } else {
        root.innerHTML = renderUserView(state);
    }
}

