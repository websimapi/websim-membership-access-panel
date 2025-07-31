import { WebsimSocket } from '@websim/websim-socket';

const room = new WebsimSocket();
const SETTINGS_COLLECTION = 'membership_settings_v1';
const ROLES_COLLECTION = 'membership_roles_v1';
const ASSIGNMENTS_COLLECTION = 'member_role_assignments_v1';

export async function initialize(callbacks) {
    const { 
        onUserAndCreator, onSettings, onRoles, onAssignments, 
        onTipComments, onNewTipComment, onError, onFinally 
    } = callbacks;

    try {
        const [creatorData, user, project] = await Promise.all([
            window.websim.getCreator(),
            window.websim.getCurrentUser(),
            window.websim.getCurrentProject()
        ]);

        const isCreator = user?.id === creatorData?.id;
        onUserAndCreator({ user, creator: creatorData, isCreator });

        const creatorUsername = creatorData.username;
        const unsubscribers = [];

        unsubscribers.push(room.collection(SETTINGS_COLLECTION).filter({ username: creatorUsername }).subscribe(settingsRecords => {
            const sortedSettings = settingsRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            onSettings(sortedSettings[0] || null);
        }));

        unsubscribers.push(room.collection(ROLES_COLLECTION).filter({ username: creatorUsername }).subscribe(onRoles));
        unsubscribers.push(room.collection(ASSIGNMENTS_COLLECTION).filter({ username: creatorUsername }).subscribe(onAssignments));

        const response = await fetch(`/api/v1/projects/${project.id}/comments?only_tips=true&first=100`);
        if (!response.ok) throw new Error("Failed to fetch comments");
        const data = await response.json();
        const sortedComments = data.comments.data.map(c => c.comment).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        onTipComments(sortedComments);

        const commentUnsubscribe = window.websim.addEventListener('comment:created', (eventData) => {
            const newComment = eventData.comment;
            if (newComment.card_data && newComment.card_data.type === 'tip_comment') {
                onNewTipComment(newComment);
            }
        });
        unsubscribers.push(commentUnsubscribe);

        // This pattern for unsubscribing might not be ideal in a non-React context
        // as there's no component lifecycle to tie it to. 
        // For a long-lived page, this is generally fine.

    } catch (err) {
        console.error("Initialization failed:", err);
        onError(err);
    } finally {
        onFinally();
    }
}

export async function saveSettings(creator, newSettings) {
    const list = await room.collection(SETTINGS_COLLECTION).filter({ username: creator.username }).getList();
    const existingSettings = list[0];

    if (existingSettings) {
        return room.collection(SETTINGS_COLLECTION).upsert({ ...existingSettings, ...newSettings });
    } else {
        return room.collection(SETTINGS_COLLECTION).create(newSettings);
    }
}

export async function handleRoleAction(action, payload, assignments) {
    switch (action) {
        case 'create':
            return room.collection(ROLES_COLLECTION).create(payload);
        case 'delete':
            await room.collection(ROLES_COLLECTION).delete(payload.id);
            const assignmentsToDelete = assignments.filter(a => a.role_id === payload.id);
            for (const assignment of assignmentsToDelete) {
                await room.collection(ASSIGNMENTS_COLLECTION).delete(assignment.id);
            }
            return;
        case 'assign':
            return room.collection(ASSIGNMENTS_COLLECTION).upsert({ id: payload.userId, role_id: payload.roleId });
        case 'unassign':
            return room.collection(ASSIGNMENTS_COLLECTION).delete(payload.userId);
        default:
            throw new Error(`Unknown role action: ${action}`);
    }
}

export async function handleBecomeMember(settings) {
    const message = `Tipping ${settings.price} credits for membership!`;
    const result = await window.websim.postComment({ content: message });
    if (result.error) {
        console.error("Could not open comment dialog:", result.error);
    }
}

export async function handleExtendMembership(settings) {
    const message = `Tipping ${settings.price} credits to extend membership!`;
    const result = await window.websim.postComment({ content: message });
    if (result.error) {
        console.error("Could not open comment dialog:", result.error);
    }
}