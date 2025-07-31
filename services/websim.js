export const WebsimService = {
    async initialize() {
        const [creatorData, user, project] = await Promise.all([
            window.websim.getCreator(),
            window.websim.getCurrentUser(),
            window.websim.getCurrentProject()
        ]);
        
        return { creatorData, user, project };
    },

    async fetchTipComments(projectId) {
        const response = await fetch(`/api/v1/projects/${projectId}/comments?only_tips=true&first=100`);
        if (!response.ok) throw new Error("Failed to fetch comments");
        const data = await response.json();
        return data.comments.data.map(c => c.comment).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
    },

    subscribeToNewTips(callback) {
        return window.websim.addEventListener('comment:created', (eventData) => {
            const newComment = eventData.comment;
            if (newComment.card_data && newComment.card_data.type === 'tip_comment') {
                callback(newComment);
            }
        });
    }
};