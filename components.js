import React, { useState, useEffect } from 'react';
import { getMembershipDurationString } from './utils.js';

export const MembershipPromptSection = ({ settings }) => {
    const handleBecomeMember = async () => {
        const message = `Tipping ${settings.price} credits for membership!`;
        const result = await window.websim.postComment({ content: message });
        if (result.error) {
            console.error("Could not open comment dialog:", result.error);
            // Optionally, show an error to the user
        }
    };
    
    if (!settings) {
        return (
            <div className="membership-prompt-section">
                <i className="fas fa-info-circle icon"></i>
                <h3>Membership Not Available</h3>
                <p>The creator has not set up memberships for this project yet. Check back later!</p>
            </div>
        );
    }

    const { price, pricingModel } = settings;
    const durationString = getMembershipDurationString(pricingModel);

    return (
        <div className="membership-prompt-section">
            <i className="fas fa-star icon"></i>
            <h3>Become a Member!</h3>
            <p>Support the creator by becoming a member.</p>
            <div className="offer">
                Tip <strong>{price} credits</strong> {durationString}.
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleBecomeMember}>
                <i className="fas fa-comment-dollar"></i> Become a Member
            </button>
        </div>
    );
};

export const SettingsSection = ({ settings, roles, onSave }) => {
    const [price, setPrice] = useState(100);
    const [model, setModel] = useState('monthly');
    const [rolesEnabled, setRolesEnabled] = useState(false);
    const [defaultRoleId, setDefaultRoleId] = useState('');

    useEffect(() => {
        if (settings) {
            setPrice(settings.price || 100);
            setModel(settings.pricingModel || 'monthly');
            setRolesEnabled(settings.rolesEnabled || false);
            setDefaultRoleId(settings.defaultRoleId || '');
        }
    }, [settings]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            price: parseInt(price, 10),
            pricingModel: model,
            rolesEnabled,
            defaultRoleId,
        });
    };

    return (
        <section className="settings-section">
            <h2><i className="fas fa-cogs"></i> Membership Settings</h2>
            <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                    <label htmlFor="pricingModel">Pricing Model</label>
                    <select id="pricingModel" value={model} onChange={e => setModel(e.target.value)}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="one-day">One-Day Pass</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="price">Price (Credits)</label>
                    <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} min="1" />
                </div>
                <div className="form-group form-group-toggle">
                    <label htmlFor="rolesEnabled">Enable Roles</label>
                    <label className="switch">
                        <input type="checkbox" id="rolesEnabled" checked={rolesEnabled} onChange={e => setRolesEnabled(e.target.checked)} />
                        <span className="slider round"></span>
                    </label>
                </div>
                {rolesEnabled && (
                     <div className="form-group">
                        <label htmlFor="defaultRole">Default Role for New Members</label>
                        <select id="defaultRole" value={defaultRoleId} onChange={e => setDefaultRoleId(e.target.value)}>
                            <option value="">None</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Save Settings</button>
            </form>
        </section>
    );
};

export const RoleManagementSection = ({ roles, onAction }) => {
    const [roleName, setRoleName] = useState('');
    const [roleColor, setRoleColor] = useState('#cccccc');

    const handleCreateRole = (e) => {
        e.preventDefault();
        if (roleName.trim()) {
            onAction('create', { name: roleName.trim(), color: roleColor });
            setRoleName('');
            setRoleColor('#cccccc');
        }
    };

    return (
        <section className="role-management-section">
            <h2><i className="fas fa-user-tag"></i> Manage Roles</h2>
            <form onSubmit={handleCreateRole} className="role-form">
                 <input 
                    type="text" 
                    value={roleName} 
                    onChange={e => setRoleName(e.target.value)} 
                    placeholder="New role name (e.g., VIP)" 
                    required 
                />
                <input 
                    type="color" 
                    value={roleColor} 
                    onChange={e => setRoleColor(e.target.value)}
                    title="Select role color"
                />
                <button type="submit" className="btn btn-primary"><i className="fas fa-plus"></i> Create Role</button>
            </form>
            <div className="role-list">
                {roles.length > 0 ? roles.map(role => (
                    <div key={role.id} className="role-item">
                        <span className="role-tag" style={{ backgroundColor: role.color }}>{role.name}</span>
                        <button onClick={() => onAction('delete', { id: role.id })} className="btn-delete-role">
                            <i className="fas fa-trash-alt"></i>
                        </button>
                    </div>
                )) : <p>No roles created yet.</p>}
            </div>
        </section>
    );
};

const MemberRow = ({ member, roles, onRoleAction, rolesEnabled }) => {
    const { user, totalPaid, membershipEndDate, status, role } = member;
    
    const getStatusClass = () => {
        switch(status) {
            case 'Active': return 'status-active';
            case 'Lapsed': return 'status-lapsed';
            case 'Expiring Soon': return 'status-warning';
            default: return '';
        }
    };
    
    const endDateString = membershipEndDate ? membershipEndDate.toLocaleDateString() : 'N/A';
    
    const handleRoleChange = (e) => {
        const roleId = e.target.value;
        if (roleId) {
            onRoleAction('assign', { userId: user.id, roleId });
        } else {
            onRoleAction('unassign', { userId: user.id });
        }
    };
    
    return (
        <tr>
            <td>
                <div className="member-info">
                    <img src={`https://images.websim.com/avatar/${user.username}`} alt={user.username} />
                    <a href={`https://websim.com/@${user.username}`} target="_blank" rel="noopener noreferrer">
                        @{user.username}
                    </a>
                </div>
            </td>
            <td className="credits-cell">{totalPaid}</td>
            <td>{endDateString}</td>
            {rolesEnabled && (
                <td>
                    <select className="role-select" value={role?.id || ''} onChange={handleRoleChange}>
                        <option value="">No Role</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </td>
            )}
            <td><span className={`status-badge ${getStatusClass()}`}>{status}</span></td>
        </tr>
    );
};


export const MembersSection = ({ members, roles, onRoleAction, rolesEnabled }) => {
    if (members.length === 0) {
        return <p>No members yet. Share your project and ask for tips to get started!</p>;
    }
    
    return (
        <section className="members-section">
            <h2><i className="fas fa-users"></i> Current Members</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Total Paid (Credits)</th>
                            <th>Membership Ends</th>
                            {rolesEnabled && <th>Role</th>}
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(member => <MemberRow key={member.user.id} member={member} roles={roles} onRoleAction={onRoleAction} rolesEnabled={rolesEnabled}/>)}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export const MemberDashboard = ({ member, settings }) => {
    const { user, totalPaid, membershipEndDate, status, role } = member;

    const getStatusClass = () => {
        switch(status) {
            case 'Active': return 'status-active';
            case 'Lapsed': return 'status-lapsed';
            case 'Expiring Soon': return 'status-warning';
            default: return '';
        }
    };
    
    const endDateString = membershipEndDate ? membershipEndDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    
    const handleExtendMembership = async () => {
        const message = `Tipping ${settings.price} credits to extend membership!`;
        const result = await window.websim.postComment({ content: message });
        if (result.error) {
            console.error("Could not open comment dialog:", result.error);
        }
    };
    
    const durationString = settings ? getMembershipDurationString(settings.pricingModel) : '';

    return (
        <div className="member-dashboard">
            <header className="member-dashboard-header">
                <img src={`https://images.websim.com/avatar/${user.username}`} alt={user.username} />
                <h2><span>Welcome back,</span> @{user.username}!</h2>
                {role && (
                    <span className="role-tag" style={{ backgroundColor: role.color, marginLeft: '15px' }}>{role.name}</span>
                )}
            </header>
            <main className="main-content">
                 <div className="member-stats">
                    <div className="stat-card">
                        <i className="fas fa-coins icon"></i>
                        <div className="stat-card-info">
                            <h4>Total Paid</h4>
                            <p>{totalPaid} credits</p>
                        </div>
                    </div>
                    <div className="stat-card">
                         <i className="fas fa-calendar-check icon"></i>
                        <div className="stat-card-info">
                            <h4>Membership Ends</h4>
                            <p>{endDateString}</p>
                        </div>
                    </div>
                     <div className="stat-card">
                         <i className="fas fa-info-circle icon"></i>
                        <div className="stat-card-info">
                            <h4>Status</h4>
                            <p><span className={`status-badge ${getStatusClass()}`}>{status}</span></p>
                        </div>
                    </div>
                </div>

                {settings && (
                    <div className="extend-membership-section">
                        <h3>Extend Your Membership</h3>
                         <p>Continue supporting the creator and keep your benefits.</p>
                        <div className="offer">
                            Tip <strong>{settings.price} credits</strong> {durationString}.
                        </div>
                        <div>
                            <button className="btn btn-primary btn-lg" onClick={handleExtendMembership}>
                               <i className="fas fa-comment-dollar"></i> Extend Now
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};