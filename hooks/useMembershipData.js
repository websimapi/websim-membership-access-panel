import { useState, useEffect, useMemo, useCallback } from 'react';
import { WebsimSocket } from '@websim/websim-socket';
import { calculateMembershipData } from '../utils.js';
import { SETTINGS_COLLECTION, ROLES_COLLECTION, ASSIGNMENTS_COLLECTION } from '../constants.js';

const room = new WebsimSocket();

export const useMembershipData = () => {
    const [isCreator, setIsCreator] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [creator, setCreator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [settings, setSettings] = useState(null);
    const [roles, setRoles] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [tipComments, setTipComments] = useState([]);

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
                setIsCreator(user?.id === creatorData?.id);

                const creatorUsername = creatorData.username;
                const unsubscribers = [];

                unsubscribers.push(room.collection(SETTINGS_COLLECTION).filter({ username: creatorUsername }).subscribe(settingsRecords => {
                    const sortedSettings = settingsRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    setSettings(sortedSettings[0] || null);
                }));

                unsubscribers.push(room.collection(ROLES_COLLECTION).filter({ username: creatorUsername }).subscribe(setRoles));
                unsubscribers.push(room.collection(ASSIGNMENTS_COLLECTION).filter({ username: creatorUsername }).subscribe(setAssignments));

                const response = await fetch(`/api/v1/projects/${project.id}/comments?only_tips=true&first=100`);
                if (!response.ok) throw new Error("Failed to fetch comments");
                const data = await response.json();
                const sortedComments = data.comments.data.map(c => c.comment).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                setTipComments(sortedComments);
                
                const commentUnsubscribe = window.websim.addEventListener('comment:created', (eventData) => {
                    const newComment = eventData.comment;
                    if (newComment.card_data?.type === 'tip_comment') {
                        setTipComments(prevComments => 
                            [...prevComments, newComment]
                            .sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
                        );
                    }
                });
                unsubscribers.push(() => window.websim.removeEventListener('comment:created', commentUnsubscribe));
                
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
        if (!creator) return;
        try {
            const list = await room.collection(SETTINGS_COLLECTION).filter({ username: creator.username }).getList();
            const existingSettings = list[0];
            const record = { ...newSettings };

            if (existingSettings) {
                record.id = existingSettings.id;
                await room.collection(SETTINGS_COLLECTION).upsert(record);
            } else {
                await room.collection(SETTINGS_COLLECTION).create(record);
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

    return {
        loading,
        error,
        isCreator,
        currentUser,
        settings,
        roles,
        assignments,
        members,
        handleSaveSettings,
        handleRoleAction
    };
};