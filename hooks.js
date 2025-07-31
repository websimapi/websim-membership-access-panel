import React from 'react';
import { MembershipService } from './services.js';
import { calculateMembershipData } from './utils.js';

export function useMembershipData() {
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
                const { creatorData, user, project } = await MembershipService.getInitialData();
                
                setCreator(creatorData);
                setCurrentUser(user);
                const isUserCreator = user?.id === creatorData?.id;
                setIsCreator(isUserCreator);
                if (!isUserCreator) {
                    setViewMode('member');
                }

                const creatorUsername = creatorData.username;
                const unsubscribers = [];

                // Subscribe to data changes
                unsubscribers.push(MembershipService.subscribeToSettings(creatorUsername, setSettings));
                unsubscribers.push(MembershipService.subscribeToRoles(creatorUsername, setRoles));
                unsubscribers.push(MembershipService.subscribeToAssignments(creatorUsername, setAssignments));

                // Fetch tip comments
                const comments = await MembershipService.fetchTipComments(project.id);
                setTipComments(comments);

                // Listen for new tips
                const newTipHandler = (newComment) => {
                    setTipComments(prevComments => 
                        [...prevComments, newComment]
                        .sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
                    );
                };
                unsubscribers.push(MembershipService.subscribeToNewTips(newTipHandler));
                
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

    const members = useMemo(() => {
        if (!settings || tipComments.length === 0) return [];
        const baseMembers = calculateMembershipData(tipComments, settings);
        return baseMembers.map(member => {
            const assignment = assignments.find(a => a.id === member.user.id);
            const role = assignment ? roles.find(r => r.id === assignment.role_id) : null;
            return { ...member, role };
        }).sort((a,b) => (b.membershipEndDate || 0) - (a.membershipEndDate || 0));
    }, [tipComments, settings, roles, assignments]);

    const currentUserMembership = useMemo(() => {
        if (isCreator && viewMode === 'unpaid') {
            return null;
        }
        const member = members.find(m => m.user.id === currentUser?.id);
        if (!member) return null;
        
        if (settings?.rolesEnabled && !member.role && settings.defaultRoleId) {
            const defaultRole = roles.find(r => r.id === settings.defaultRoleId);
            return { ...member, role: defaultRole };
        }
        return member;
    }, [members, currentUser, isCreator, viewMode, settings, roles]);

    return {
        isCreator,
        currentUser,
        creator,
        loading,
        error,
        settings,
        roles,
        assignments,
        tipComments,
        members,
        currentUserMembership,
        viewMode,
        setViewMode,
        setError
    };
}

export function useSettingsActions(creator) {
    const handleSaveSettings = useCallback(async (newSettings) => {
        try {
            await MembershipService.saveSettings(creator.username, newSettings);
        } catch (err) {
            console.error("Failed to save settings:", err);
            throw new Error("Could not save settings.");
        }
    }, [creator]);

    return { handleSaveSettings };
}

export function useRoleActions(assignments) {
    const handleRoleAction = useCallback(async (action, payload) => {
        try {
            switch(action) {
                case 'create':
                    await MembershipService.createRole(payload);
                    break;
                case 'delete':
                    await MembershipService.deleteRole(payload.id, assignments);
                    break;
                case 'assign':
                    await MembershipService.assignRole(payload.userId, payload.roleId);
                    break;
                case 'unassign':
                    await MembershipService.unassignRole(payload.userId);
                    break;
            }
        } catch(err) {
            console.error(`Role action '${action}' failed:`, err);
            throw new Error(`Could not perform role action: ${action}.`);
        }
    }, [assignments]);

    return { handleRoleAction };
}