import { WebsimSocket } from '@websim/websim-socket';

const room = new WebsimSocket();
const SETTINGS_COLLECTION = 'membership_settings_v1';
const ROLES_COLLECTION = 'membership_roles_v1';
const ASSIGNMENTS_COLLECTION = 'member_role_assignments_v1';

export async function getInitialData() {
    const [creator, user, project] = await Promise.all([
        window.websim.getCreator(),
        window.websim.getCurrentUser(),
        window.websim.getCurrentProject()
    ]);
    return { creator, user, project };
}

export function subscribeToSettings(creatorUsername, callback) {
    return room.collection(SETTINGS_COLLECTION).filter({ username: creatorUsername }).subscribe(settingsRecords => {
        const sortedSettings = settingsRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        callback(sortedSettings[0] || null);
    });
}

export function subscribeToRoles(creatorUsername, callback) {
    return room.collection(ROLES_COLLECTION).filter({ username: creatorUsername }).subscribe(callback);
}

export function subscribeToAssignments(creatorUsername, callback) {
    return room.collection(ASSIGNMENTS_COLLECTION).filter({ username: creatorUsername }).subscribe(callback);
}

export async function getTipComments(projectId, onNewComment) {
    const response = await fetch(`/api/v1/projects/${projectId}/comments?only_tips=true&first=100`);
    if (!response.ok) throw new Error("Failed to fetch comments");
    const data = await response.json();
    const sortedComments = data.comments.data.map(c => c.comment).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    const unsubscribe = window.websim.addEventListener('comment:created', (eventData) => {
        const newComment = eventData.comment;
        if (newComment.card_data && newComment.card_data.type === 'tip_comment') {
            onNewComment(newComment);
        }
    });

    return { initialComments: sortedComments, unsubscribe };
}

export async function saveSettings(creator, settings) {
    const list = await room.collection(SETTINGS_COLLECTION).filter({ username: creator.username }).getList();
    const existingSettings = list[0];
    try {
        if (existingSettings) {
            await room.collection(SETTINGS_COLLECTION).upsert({ ...existingSettings, ...settings });
        } else {
            await room.collection(SETTINGS_COLLECTION).create(settings);
        }
    } catch (err) {
        console.error("Failed to save settings:", err);
        // In a real app, you'd want to show this error to the user.
    }
}

export async function handleRoleAction(action, payload, assignments = []) {
     try {
        switch (action) {
            case 'create':
                return await room.collection(ROLES_COLLECTION).create(payload);
            case 'delete':
                await room.collection(ROLES_COLLECTION).delete(payload.id);
                const assignmentsToDelete = assignments.filter(a => a.role_id === payload.id);
                for (const assignment of assignmentsToDelete) {
                    await room.collection(ASSIGNMENTS_COLLECTION).delete(assignment.id);
                }
                return;
            case 'assign':
                return await room.collection(ASSIGNMENTS_COLLECTION).upsert({ id: payload.userId, role_id: payload.roleId });
            case 'unassign':
                return await room.collection(ASSIGNMENTS_COLLECTION).delete(payload.userId);
        }
    } catch(err) {
        console.error(`Role action '${action}' failed:`, err);
    }
}

export async function handleBecomeMember(settings) {
    if (!settings) return;
    const message = `Tipping ${settings.price} credits for membership!`;
    const result = await window.websim.postComment({ content: message });
    if (result.error) {
        console.error("Could not open comment dialog:", result.error);
    }
}