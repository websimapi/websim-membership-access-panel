import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { calculateMembershipData } from './utils.js';
import { membershipService } from './services/membershipService.js';
import { commentsService } from './services/commentsService.js';
import { VIEW_MODES } from './constants.js';
import MembershipPromptSection from './components/MembershipPromptSection.js';
import SettingsSection from './components/SettingsSection.js';
import RoleManagementSection from './components/RoleManagementSection.js';
import MembersSection from './components/MembersSection.js';
import MemberDashboard from './components/MemberDashboard.js';

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
    const [viewMode, setViewMode] = useState(VIEW_MODES.ADMIN);
    
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
                    setViewMode(VIEW_MODES.MEMBER); // Default for non-creators
                }

                // Set up subscriptions
                const unsubscribers = [];
                const creatorUsername = creatorData.username;

                unsubscribers.push(membershipService.subscribeToSettings(creatorUsername, setSettings));
                unsubscribers.push(membershipService.subscribeToRoles(creatorUsername, setRoles));
                unsubscribers.push(membershipService.subscribeToAssignments(creatorUsername, setAssignments));

                // Fetch tip comments
                const sortedComments = await commentsService.fetchTipComments(project.id);
                setTipComments(sortedComments);
                
                // Listen for new tips
                const commentUnsubscribe = commentsService.subscribeToNewTips((newComment) => {
                    setTipComments(prevComments => 
                        [...prevComments, newComment]
                        .sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
                    );
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
            await membershipService.saveSettings(creator, newSettings);
        } catch (err) {
            console.error("Failed to save settings:", err);
            setError("Could not save settings.");
        }
    }, [creator]);

    const handleRoleAction = useCallback(async (action, payload) => {
        try {
            await membershipService.performRoleAction(action, payload, assignments);
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
            if (isCreator && viewMode === VIEW_MODES.UNPAID) {
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

    if (isCreator && viewMode === VIEW_MODES.ADMIN) {
        return (
            <div className="admin-panel">
                <header>
                    <h1><i className="fas fa-users-cog"></i> Membership Admin Panel</h1>
                    <div className="view-as-buttons">
                        <button className="btn btn-secondary view-toggle-btn" onClick={() => setViewMode(VIEW_MODES.MEMBER)}>
                            <i className="fas fa-user-check"></i> View as Member
                        </button>
                        <button className="btn btn-secondary view-toggle-btn" onClick={() => setViewMode(VIEW_MODES.UNPAID)}>
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
                        {viewMode === VIEW_MODES.MEMBER 
                            ? 'You are viewing the page as a member.' 
                            : 'You are viewing as an unpaid user.'
                        }
                    </p>
                    <button className="btn btn-secondary" onClick={() => setViewMode(VIEW_MODES.ADMIN)}>
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