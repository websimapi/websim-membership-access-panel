import { WebsimSocket } from '@websim/websim-socket';

const room = new WebsimSocket();

export const COLLECTIONS = {
    SETTINGS: 'membership_settings_v1',
    ROLES: 'membership_roles_v1',
    ASSIGNMENTS: 'member_role_assignments_v1'
};

export const DatabaseService = {
    // Settings operations
    async saveSettings(creator, newSettings) {
        const list = await room.collection(COLLECTIONS.SETTINGS).filter({ username: creator.username }).getList();
        const existingSettings = list[0];

        if (existingSettings) {
            return await room.collection(COLLECTIONS.SETTINGS).upsert({ ...existingSettings, ...newSettings });
        } else {
            return await room.collection(COLLECTIONS.SETTINGS).create(newSettings);
        }
    },

    subscribeToSettings(creatorUsername, callback) {
        return room.collection(COLLECTIONS.SETTINGS).filter({ username: creatorUsername }).subscribe(settingsRecords => {
            const sortedSettings = settingsRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            callback(sortedSettings[0] || null);
        });
    },

    // Role operations
    async createRole(roleData) {
        return await room.collection(COLLECTIONS.ROLES).create(roleData);
    },

    async deleteRole(roleId) {
        return await room.collection(COLLECTIONS.ROLES).delete(roleId);
    },

    subscribeToRoles(creatorUsername, callback) {
        return room.collection(COLLECTIONS.ROLES).filter({ username: creatorUsername }).subscribe(callback);
    },

    // Assignment operations
    async assignRole(userId, roleId) {
        return await room.collection(COLLECTIONS.ASSIGNMENTS).upsert({ id: userId, role_id: roleId });
    },

    async unassignRole(userId) {
        return await room.collection(COLLECTIONS.ASSIGNMENTS).delete(userId);
    },

    async deleteRoleAssignments(roleId, assignments) {
        const assignmentsToDelete = assignments.filter(a => a.role_id === roleId);
        for (const assignment of assignmentsToDelete) {
            await room.collection(COLLECTIONS.ASSIGNMENTS).delete(assignment.id);
        }
    },

    subscribeToAssignments(creatorUsername, callback) {
        return room.collection(COLLECTIONS.ASSIGNMENTS).filter({ username: creatorUsername }).subscribe(callback);
    }
};