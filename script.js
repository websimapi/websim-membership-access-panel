import { calculateMembershipData, getMembershipDurationString } from './utils.js';
import { WebsimSocket } from '@websim/websim-socket';
import { MembershipPromptSection, MemberDashboard } from './UserViewComponents.js';
import { SettingsSection, RoleManagementSection, MembersSection } from './AdminComponents.js';

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

const root = createRoot(document.getElementById('root'));
root.render(<App />);