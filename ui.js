import { getMembershipDurationString } from './utils.js';
import { handleBecomeMember, handleExtendMembership } from './api.js';

function h(tag, props = {}, ...children) {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
        if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.substring(2).toLowerCase(), value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else {
            el[key] = value;
        }
    });
    children.flat().forEach(child => {
        if (typeof child === 'string' || typeof child === 'number') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    });
    return el;
}

export function renderLoading() {
    return h('div', { className: 'loading-container' },
        h('i', { className: 'fas fa-spinner fa-spin' }),
        h('p', {}, 'Loading Membership Panel...')
    );
}

export function renderError(error) {
    return h('div', { className: 'error-container' },
        h('i', { className: 'fas fa-exclamation-triangle' }),
        h('p', {}, `Error: ${error}`)
    );
}

function renderSettingsSection(settings, roles, onSave) {
    const currentPrice = settings?.price || 100;
    const currentModel = settings?.pricingModel || 'monthly';
    const rolesEnabled = settings?.rolesEnabled || false;
    const defaultRoleId = settings?.defaultRoleId || '';

    const form = h('form', { className: 'settings-form' });
    
    const pricingModelSelect = h('select', { id: 'pricingModel', value: currentModel },
        h('option', { value: 'daily' }, 'Daily'),
        h('option', { value: 'weekly' }, 'Weekly'),
        h('option', { value: 'bi-weekly' }, 'Bi-Weekly'),
        h('option', { value: 'monthly' }, 'Monthly'),
        h('option', { value: 'one-day' }, 'One-Day Pass')
    );
    const priceInput = h('input', { type: 'number', id: 'price', value: currentPrice, min: 1 });
    const rolesEnabledCheckbox = h('input', { type: 'checkbox', id: 'rolesEnabled', checked: rolesEnabled });
    const defaultRoleSelect = h('select', { id: 'defaultRole', value: defaultRoleId },
        h('option', { value: '' }, 'None'),
        ...roles.map(role => h('option', { value: role.id }, role.name))
    );

    const rolesEnabledGroup = h('div', { className: 'form-group' },
        h('label', { htmlFor: 'defaultRole' }, 'Default Role for New Members'),
        defaultRoleSelect
    );
    rolesEnabledGroup.style.display = rolesEnabled ? 'flex' : 'none';

    rolesEnabledCheckbox.addEventListener('change', (e) => {
        rolesEnabledGroup.style.display = e.target.checked ? 'flex' : 'none';
    });

    form.onsubmit = (e) => {
        e.preventDefault();
        onSave({
            price: parseInt(priceInput.value, 10),
            pricingModel: pricingModelSelect.value,
            rolesEnabled: rolesEnabledCheckbox.checked,
            defaultRoleId: defaultRoleSelect.value,
        });
    };

    form.append(
        h('div', { className: 'form-group' }, h('label', { htmlFor: 'pricingModel' }, 'Pricing Model'), pricingModelSelect),
        h('div', { className: 'form-group' }, h('label', { htmlFor: 'price' }, 'Price (Credits)'), priceInput),
        h('div', { className: 'form-group form-group-toggle' },
            h('label', { htmlFor: 'rolesEnabled' }, 'Enable Roles'),
            h('label', { className: 'switch' }, rolesEnabledCheckbox, h('span', { className: 'slider round' }))
        ),
        rolesEnabledGroup,
        h('button', { type: 'submit', className: 'btn btn-primary' }, h('i', { className: 'fas fa-save' }), ' Save Settings')
    );

    return h('section', { className: 'settings-section' },
        h('h2', {}, h('i', { className: 'fas fa-cogs' }), ' Membership Settings'),
        form
    );
}

function renderRoleManagementSection(roles, onAction) {
    const roleNameInput = h('input', { type: 'text', placeholder: 'New role name (e.g., VIP)', required: true });
    const roleColorInput = h('input', { type: 'color', value: '#cccccc', title: 'Select role color' });

    const form = h('form', { className: 'role-form' },
        roleNameInput,
        roleColorInput,
        h('button', { type: 'submit', className: 'btn btn-primary' }, h('i', { className: 'fas fa-plus' }), ' Create Role')
    );

    form.onsubmit = (e) => {
        e.preventDefault();
        if (roleNameInput.value.trim()) {
            onAction('create', { name: roleNameInput.value.trim(), color: roleColorInput.value });
            roleNameInput.value = '';
            roleColorInput.value = '#cccccc';
        }
    };
    
    const roleList = h('div', { className: 'role-list' },
        roles.length > 0
            ? roles.map(role => h('div', { className: 'role-item', key: role.id },
                h('span', { className: 'role-tag', style: { backgroundColor: role.color } }, role.name),
                h('button', {
                    className: 'btn-delete-role',
                    onclick: () => onAction('delete', { id: role.id })
                }, h('i', { className: 'fas fa-trash-alt' }))
            ))
            : h('p', {}, 'No roles created yet.')
    );

    return h('section', { className: 'role-management-section' },
        h('h2', {}, h('i', { className: 'fas fa-user-tag' }), ' Manage Roles'),
        form,
        roleList
    );
}

function renderMembersSection(members, roles, onRoleAction, rolesEnabled) {
    if (members.length === 0) {
        return h('p', {}, 'No members yet. Share your project and ask for tips to get started!');
    }
    const getStatusClass = (status) => {
        switch(status) {
            case 'Active': return 'status-active';
            case 'Lapsed': return 'status-lapsed';
            case 'Expiring Soon': return 'status-warning';
            default: return '';
        }
    };

    const tableBody = h('tbody', {}, ...members.map(member => {
        const { user, totalPaid, membershipEndDate, status, role } = member;
        
        const roleSelect = h('select', { 
            className: 'role-select', 
            value: role?.id || '',
            onchange: (e) => {
                const roleId = e.target.value;
                if (roleId) {
                    onRoleAction('assign', { userId: user.id, roleId });
                } else {
                    onRoleAction('unassign', { userId: user.id });
                }
            }
        },
            h('option', { value: '' }, 'No Role'),
            ...roles.map(r => h('option', { value: r.id }, r.name))
        );

        return h('tr', { key: user.id },
            h('td', {}, h('div', { className: 'member-info' },
                h('img', { src: `https://images.websim.com/avatar/${user.username}`, alt: user.username }),
                h('a', { href: `https://websim.com/@${user.username}`, target: '_blank', rel: 'noopener noreferrer' }, `@${user.username}`)
            )),
            h('td', { className: 'credits-cell' }, totalPaid),
            h('td', {}, membershipEndDate ? membershipEndDate.toLocaleDateString() : 'N/A'),
            rolesEnabled && h('td', {}, roleSelect),
            h('td', {}, h('span', { className: `status-badge ${getStatusClass(status)}` }, status))
        );
    }));

    return h('section', { className: 'members-section' },
        h('h2', {}, h('i', { className: 'fas fa-users' }), ' Current Members'),
        h('div', { className: 'table-container' },
            h('table', {},
                h('thead', {}, h('tr', {},
                    h('th', {}, 'Member'),
                    h('th', {}, 'Total Paid (Credits)'),
                    h('th', {}, 'Membership Ends'),
                    rolesEnabled && h('th', {}, 'Role'),
                    h('th', {}, 'Status')
                )),
                tableBody
            )
        )
    );
}

export function renderAdminView(state, onToggleView, onSaveSettings, onRoleAction) {
    const { settings, roles, members } = state;
    return h('div', { className: 'admin-panel' },
        h('header', {},
            h('h1', {}, h('i', { className: 'fas fa-users-cog' }), ' Membership Admin Panel'),
            h('div', { className: 'view-as-buttons' },
                h('button', { className: 'btn btn-secondary view-toggle-btn', onclick: () => onToggleView('member') },
                    h('i', { className: 'fas fa-user-check' }), ' View as Member'
                ),
                h('button', { className: 'btn btn-secondary view-toggle-btn', onclick: () => onToggleView('unpaid') },
                    h('i', { className: 'fas fa-user' }), ' View as Unpaid User'
                )
            )
        ),
        h('main', { className: 'main-content' },
            renderSettingsSection(settings, roles, onSaveSettings),
            settings?.rolesEnabled && renderRoleManagementSection(roles, onRoleAction),
            renderMembersSection(members, roles, onRoleAction, settings?.rolesEnabled)
        )
    );
}

function renderMemberDashboard(member, settings) {
    const { user, totalPaid, membershipEndDate, status, role } = member;
    const getStatusClass = (s) => (s === 'Active' ? 'status-active' : s === 'Lapsed' ? 'status-lapsed' : 'status-warning');
    
    return h('div', { className: 'member-dashboard' },
        h('header', { className: 'member-dashboard-header' },
            h('img', { src: `https://images.websim.com/avatar/${user.username}`, alt: user.username }),
            h('h2', {}, h('span', {}, 'Welcome back, '), `@${user.username}!`),
            role && h('span', { className: 'role-tag', style: { backgroundColor: role.color, marginLeft: '15px' } }, role.name)
        ),
        h('main', { className: 'main-content' },
            h('div', { className: 'member-stats' },
                h('div', { className: 'stat-card' }, h('i', { className: 'fas fa-coins icon' }), h('div', { className: 'stat-card-info' }, h('h4', {}, 'Total Paid'), h('p', {}, `${totalPaid} credits`))),
                h('div', { className: 'stat-card' }, h('i', { className: 'fas fa-calendar-check icon' }), h('div', { className: 'stat-card-info' }, h('h4', {}, 'Membership Ends'), h('p', {}, membershipEndDate ? membershipEndDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'))),
                h('div', { className: 'stat-card' }, h('i', { className: 'fas fa-info-circle icon' }), h('div', { className: 'stat-card-info' }, h('h4', {}, 'Status'), h('p', {}, h('span', { className: `status-badge ${getStatusClass(status)}` }, status))))
            ),
            settings && h('div', { className: 'extend-membership-section' },
                h('h3', {}, 'Extend Your Membership'),
                h('p', {}, 'Continue supporting the creator and keep your benefits.'),
                h('div', { className: 'offer' },
                    'Tip ', h('strong', {}, `${settings.price} credits`), ` ${getMembershipDurationString(settings.pricingModel)}.`
                ),
                h('div', {}, h('button', { className: 'btn btn-primary btn-lg', onclick: () => handleExtendMembership(settings) }, h('i', { className: 'fas fa-comment-dollar' }), ' Extend Now'))
            )
        )
    );
}

function renderMembershipPromptSection(settings) {
    if (!settings) {
        return h('div', { className: 'membership-prompt-section' },
            h('i', { className: 'fas fa-info-circle icon' }),
            h('h3', {}, 'Membership Not Available'),
            h('p', {}, 'The creator has not set up memberships for this project yet. Check back later!')
        );
    }
    const { price, pricingModel } = settings;
    return h('div', { className: 'membership-prompt-section' },
        h('i', { className: 'fas fa-star icon' }),
        h('h3', {}, 'Become a Member!'),
        h('p', {}, 'Support the creator by becoming a member.'),
        h('div', { className: 'offer' },
            'Tip ', h('strong', {}, price), ' credits ', getMembershipDurationString(pricingModel), '.'
        ),
        h('button', { className: 'btn btn-primary btn-lg', onclick: () => handleBecomeMember(settings) },
            h('i', { className: 'fas fa-comment-dollar' }), ' Become a Member'
        )
    );
}

export function renderUserViewWrapper(state, onToggleView) {
    const { isCreator, viewMode, currentUser, members, settings, roles } = state;

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
    
    const userView = currentUserMembership
        ? renderMemberDashboard(currentUserMembership, settings)
        : renderMembershipPromptSection(settings);

    return h('div', { className: 'user-view-wrapper' },
        isCreator && h('div', { className: 'view-toggle-banner' },
            h('p', {}, 
                h('i', { className: 'fas fa-info-circle' }),
                viewMode === 'member' 
                    ? ' You are viewing the page as a member.' 
                    : ' You are viewing as an unpaid user.'
            ),
            h('button', { className: 'btn btn-secondary', onclick: () => onToggleView('admin') },
                h('i', { className: 'fas fa-user-shield' }), ' Switch to Admin View'
            )
        ),
        userView
    );
}