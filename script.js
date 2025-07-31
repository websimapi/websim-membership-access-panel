import { calculateMembershipData, getMembershipDurationString } from './utils.js';
import { WebsimSocket } from '@websim/websim-socket';
import SettingsSection from './components/SettingsSection.js';
import RoleManagementSection from './components/RoleManagementSection.js';

const { useState, useEffect, useMemo, useCallback } = React;
const { createRoot } = ReactDOM;

const room = new WebsimSocket();
const SETTINGS_COLLECTION = 'membership_settings_v1';
const ROLES_COLLECTION = 'membership_roles_v1';
const ASSIGNMENTS_COLLECTION = 'member_role_assignments_v1';

const App = () => {
    const [isCreator, setIsCreator] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [creator, setCreator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [settings, setSettings] = useState(null);
    const [roles, setRoles] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [tipComments, setTipComments] = useState([]);
    const [viewMode, setViewMode] = useState('admin');
    
    useEffect(() => {
        const initialize = async () => {
            try {
                const [creatorData, user, project] = await Promise.all([
                    window.websim.getCreator(),
                    window.websim.getCurrentUser(),
                    window.websim.getCurrentProject()
                ]);
                
                setCreator(creatorData);
                setCurrentUser(user);
                const isUserCreator = user?.id === creatorData?.id;
                setIsCreator(isUserCreator);
                if (!isUserCreator) {
                    setViewMode('member'); // Default for non-creators
                }

                // Fetch settings, roles, and assignments
                const creatorUsername = creatorData.username;
                const unsubscribers = [];

                unsubscribers.push(room.collection(SETTINGS_COLLECTION).filter({ username: creatorUsername }).subscribe(settingsRecords => {
                    const sortedSettings = settingsRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    setSettings(sortedSettings[0] || null);
                }));

                unsubscribers.push(room.collection(ROLES_COLLECTION).filter({ username: creatorUsername }).subscribe(setRoles));
                unsubscribers.push(room.collection(ASSIGNMENTS_COLLECTION).filter({ username: creatorUsername }).subscribe(setAssignments));

                
                // Fetch all tip comments for the project
                const response = await fetch(`/api/v1/projects/${project.id}/comments?only_tips=true&first=100`);
                if (!response.ok) throw new Error("Failed to fetch comments");
                const data = await response.json();
                const sortedComments = data.comments.data.map(c => c.comment).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                setTipComments(sortedComments);
                
                // Listen for new tips in real-time
                const commentUnsubscribe = window.websim.addEventListener('comment:created', (eventData) => {
                    const newComment = eventData.comment;
                    if (newComment.card_data && newComment.card_data.type === 'tip_comment') {
                        setTipComments(prevComments => 
                            [...prevComments, newComment]
                            .sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
                        );
                    }
                });
                unsubscribers.push(commentUnsubscribe);
                
                return () => unsubscribers.forEach(unsub => unsub());

            } catch (err) {
                console.error("Initialization failed:", err);
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        const unsubscribePromise = initialize();
        
        return () => {
            unsubscribePromise.then(unsubscribe => {
                if(unsubscribe) unsubscribe();
            });
        };

    }, []);

    const handleSaveSettings = useCallback(async (newSettings) => {
        try {
            const list = await room.collection(SETTINGS_COLLECTION).filter({ username: creator.username }).getList();
            const existingSettings = list[0];

            if (existingSettings) {
                 await room.collection(SETTINGS_COLLECTION).upsert({ ...existingSettings, ...newSettings });
            } else {
                 await room.collection(SETTINGS_COLLECTION).create(newSettings);
            }
        } catch (err) {
            console.error("Failed to save settings:", err);
            setError("Could not save settings.");
        }
    }, [creator]);

    const handleRoleAction = useCallback(async (action, payload) => {
        try {
            switch(action) {
                case 'create':
                    await room.collection(ROLES_COLLECTION).create(payload);
                    break;
                case 'delete':
                    await room.collection(ROLES_COLLECTION).delete(payload.id);
                    // Also unassign this role from any members
                    const assignmentsToDelete = assignments.filter(a => a.role_id === payload.id);
                    for (const assignment of assignmentsToDelete) {
                        await room.collection(ASSIGNMENTS_COLLECTION).delete(assignment.id);
                    }
                    break;
                case 'assign':
                    await room.collection(ASSIGNMENTS_COLLECTION).upsert({ id: payload.userId, role_id: payload.roleId });
                    break;
                case 'unassign':
                    await room.collection(ASSIGNMENTS_COLLECTION).delete(payload.userId);
                    break;
            }
        } catch(err) {
            console.error(`Role action '${action}' failed:`, err);
            setError(`Could not perform role action: ${action}.`);
        }
    }, [assignments]);

    const members = useMemo(() => {
        if (!settings || tipComments.length === 0) return [];
        const baseMembers = calculateMembershipData(tipComments, settings);
        return baseMembers.map(member => {
            const assignment = assignments.find(a => a.id === member.user.id);
            const role = assignment ? roles.find(r => r.id === assignment.role_id) : null;
            return { ...member, role };
        }).sort((a,b) => (b.membershipEndDate || 0) - (a.membershipEndDate || 0));
    }, [tipComments, settings, roles, assignments]);

    if (loading) {
        return (
            <div className="loading-container">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading Membership Panel...</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="error-container">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Error: {error}</p>
            </div>
        );
    }

    const UserView = () => {
        const currentUserMembership = useMemo(() => {
            if (isCreator && viewMode === 'unpaid') {
                return null;
            }
            const member = members.find(m => m.user.id === currentUser?.id);
            if (!member) return null;
            
            // For member view, if roles are enabled and no role is assigned, assign default role if it exists
            if (settings?.rolesEnabled && !member.role && settings.defaultRoleId) {
                const defaultRole = roles.find(r => r.id === settings.defaultRoleId);
                return { ...member, role: defaultRole };
            }
            return member;

        }, [members, currentUser, isCreator, viewMode, settings, roles]);

        if (currentUserMembership) {
            return <MemberDashboard member={currentUserMembership} settings={settings} />;
        }

        return <MembershipPromptSection settings={settings} />;
    };

    if (isCreator && viewMode === 'admin') {
        return (
            <div className="admin-panel">
                <header>
                    <h1><i className="fas fa-users-cog"></i> Membership Admin Panel</h1>
                    <div className="view-as-buttons">
                        <button className="btn btn-secondary view-toggle-btn" onClick={() => setViewMode('member')}>
                            <i className="fas fa-user-check"></i> View as Member
                        </button>
                        <button className="btn btn-secondary view-toggle-btn" onClick={() => setViewMode('unpaid')}>
                            <i className="fas fa-user"></i> View as Unpaid User
                        </button>
                    </div>
                </header>
                <main className="main-content">
                    <SettingsSection settings={settings} roles={roles} onSave={handleSaveSettings} />
                    {settings?.rolesEnabled && (
                        <RoleManagementSection roles={roles} onAction={handleRoleAction} />
                    )}
                    <MembersSection members={members} roles={roles} onRoleAction={handleRoleAction} rolesEnabled={settings?.rolesEnabled} />
                </main>
            </div>
        );
    }
    
    return (
        <div className="user-view-wrapper">
             {isCreator && (
                <div className="view-toggle-banner">
                    <p>
                        <i className="fas fa-info-circle"></i> 
                        {viewMode === 'member' 
                            ? 'You are viewing the page as a member.' 
                            : 'You are viewing as an unpaid user.'
                        }
                    </p>
                    <button className="btn btn-secondary" onClick={() => setViewMode('admin')}>
                        <i className="fas fa-user-shield"></i> Switch to Admin View
                    </button>
                </div>
            )}
            <UserView />
        </div>
    );
};

const MembershipPromptSection = ({ settings }) => {
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

const MembersSection = ({ members, roles, onRoleAction, rolesEnabled }) => {
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

const MemberDashboard = ({ member, settings }) => {
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

const root = createRoot(document.getElementById('root'));
root.render(<App />);