import { WebsimSocket } from '@websim/websim-socket';
import { COLLECTIONS } from '../constants.js';

const room = new WebsimSocket();

export const membershipService = {
    async saveSettings(creator, newSettings) {
        const list = await room.collection(COLLECTIONS.SETTINGS).filter({ username: creator.username }).getList();
        const existingSettings = list[0];

        if (existingSettings) {
            return await room.collection(COLLECTIONS.SETTINGS).upsert({ ...existingSettings, ...newSettings });
        } else {
            return await room.collection(COLLECTIONS.SETTINGS).create(newSettings);
        }
    },

    async performRoleAction(action, payload, assignments) {
        switch(action) {
            case 'create':
                return await room.collection(COLLECTIONS.ROLES).create(payload);
            case 'delete':
                await room.collection(COLLECTIONS.ROLES).delete(payload.id);
                // Also unassign this role from any members
                const assignmentsToDelete = assignments.filter(a => a.role_id === payload.id);
                for (const assignment of assignmentsToDelete) {
                    await room.collection(COLLECTIONS.ASSIGNMENTS).delete(assignment.id);
                }
                break;
            case 'assign':
                return await room.collection(COLLECTIONS.ASSIGNMENTS).upsert({ 
                    id: payload.userId, 
                    role_id: payload.roleId 
                });
            case 'unassign':
                return await room.collection(COLLECTIONS.ASSIGNMENTS).delete(payload.userId);
        }
    },

    subscribeToSettings(creatorUsername, callback) {
        return room.collection(COLLECTIONS.SETTINGS)
            .filter({ username: creatorUsername })
            .subscribe(settingsRecords => {
                const sortedSettings = settingsRecords.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                callback(sortedSettings[0] || null);
            });
    },

    subscribeToRoles(creatorUsername, callback) {
        return room.collection(COLLECTIONS.ROLES)
            .filter({ username: creatorUsername })
            .subscribe(callback);
    },

    subscribeToAssignments(creatorUsername, callback) {
        return room.collection(COLLECTIONS.ASSIGNMENTS)
            .filter({ username: creatorUsername })
            .subscribe(callback);
    }
};