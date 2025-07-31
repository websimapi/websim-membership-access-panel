let WebsimSocket;

// Import WebsimSocket from global scope or dynamically
const initWebsimSocket = async () => {
    if (window.WebsimSocket) {
        WebsimSocket = window.WebsimSocket;
    } else {
        // Try to import dynamically if needed
        const module = await import('https://esm.websim.com/@websim/websim-socket');
        WebsimSocket = module.WebsimSocket;
    }
    return new WebsimSocket();
};

let room;
const SETTINGS_COLLECTION = 'membership_settings_v1';
const ROLES_COLLECTION = 'membership_roles_v1';
const ASSIGNMENTS_COLLECTION = 'member_role_assignments_v1';

const getRoomInstance = async () => {
    if (!room) {
        room = await initWebsimSocket();
    }
    return room;
};

export class MembershipService {
    static async getInitialData() {
        const [creatorData, user, project] = await Promise.all([
            window.websim.getCreator(),
            window.websim.getCurrentUser(),
            window.websim.getCurrentProject()
        ]);
        
        return { creatorData, user, project };
    }

    static async fetchTipComments(projectId) {
        const response = await fetch(`/api/v1/projects/${projectId}/comments?only_tips=true&first=100`);
        if (!response.ok) throw new Error("Failed to fetch comments");
        const data = await response.json();
        return data.comments.data.map(c => c.comment).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    }

    static subscribeToSettings(creatorUsername, callback) {
        return getRoomInstance().then(roomInstance => 
            roomInstance.collection(SETTINGS_COLLECTION)
                .filter({ username: creatorUsername })
                .subscribe(settingsRecords => {
                    const sortedSettings = settingsRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    callback(sortedSettings[0] || null);
                })
        );
    }

    static subscribeToRoles(creatorUsername, callback) {
        return getRoomInstance().then(roomInstance =>
            roomInstance.collection(ROLES_COLLECTION)
                .filter({ username: creatorUsername })
                .subscribe(callback)
        );
    }

    static subscribeToAssignments(creatorUsername, callback) {
        return getRoomInstance().then(roomInstance =>
            roomInstance.collection(ASSIGNMENTS_COLLECTION)
                .filter({ username: creatorUsername })
                .subscribe(callback)
        );
    }

    static subscribeToNewTips(callback) {
        return window.websim.addEventListener('comment:created', (eventData) => {
            const newComment = eventData.comment;
            if (newComment.card_data && newComment.card_data.type === 'tip_comment') {
                callback(newComment);
            }
        });
    }

    static async saveSettings(creatorUsername, newSettings) {
        const roomInstance = await getRoomInstance();
        const list = await roomInstance.collection(SETTINGS_COLLECTION)
            .filter({ username: creatorUsername })
            .getList();
        const existingSettings = list[0];

        if (existingSettings) {
            return await roomInstance.collection(SETTINGS_COLLECTION)
                .upsert({ ...existingSettings, ...newSettings });
        } else {
            return await roomInstance.collection(SETTINGS_COLLECTION)
                .create(newSettings);
        }
    }

    static async createRole(payload) {
        const roomInstance = await getRoomInstance();
        return await roomInstance.collection(ROLES_COLLECTION).create(payload);
    }

    static async deleteRole(roleId, assignments) {
        const roomInstance = await getRoomInstance();
        await roomInstance.collection(ROLES_COLLECTION).delete(roleId);
        // Also unassign this role from any members
        const assignmentsToDelete = assignments.filter(a => a.role_id === roleId);
        for (const assignment of assignmentsToDelete) {
            await roomInstance.collection(ASSIGNMENTS_COLLECTION).delete(assignment.id);
        }
    }

    static async assignRole(userId, roleId) {
        const roomInstance = await getRoomInstance();
        return await roomInstance.collection(ASSIGNMENTS_COLLECTION)
            .upsert({ id: userId, role_id: roleId });
    }

    static async unassignRole(userId) {
        const roomInstance = await getRoomInstance();
        return await roomInstance.collection(ASSIGNMENTS_COLLECTION).delete(userId);
    }

    static async postMembershipComment(price) {
        const message = `Tipping ${price} credits for membership!`;
        return await window.websim.postComment({ content: message });
    }

    static async postExtendComment(price) {
        const message = `Tipping ${price} credits to extend membership!`;
        return await window.websim.postComment({ content: message });
    }
}