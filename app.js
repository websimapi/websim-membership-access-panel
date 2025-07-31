import * as api from './api.js';
import * as ui from './ui.js';
import { calculateMembershipData } from './utils.js';

class MembershipApp {
    constructor() {
        this.root = document.getElementById('root');
        this.state = {
            isCreator: false,
            currentUser: null,
            creator: null,
            loading: true,
            error: null,
            settings: null,
            roles: [],
            assignments: [],
            tipComments: [],
            members: [],
            viewMode: 'admin', // 'admin', 'member', 'unpaid'
        };
        this.unsubscribers = [];
    }

    setState(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        this.updateMembers();
        this.render();
    }

    updateMembers() {
        const { tipComments, settings, roles, assignments } = this.state;
        if (!settings || tipComments.length === 0) {
            this.state.members = [];
            return;
        }
        const baseMembers = calculateMembershipData(tipComments, settings);
        this.state.members = baseMembers.map(member => {
            const assignment = assignments.find(a => a.id === member.user.id);
            const role = assignment ? roles.find(r => r.id === assignment.role_id) : null;
            return { ...member, role };
        }).sort((a, b) => (b.membershipEndDate || 0) - (a.membershipEndDate || 0));
    }
    
    async init() {
        try {
            ui.renderLoading(this.root);
            const { creator, user, project } = await api.getInitialData();

            const isUserCreator = user?.id === creator?.id;
            const initialState = {
                creator,
                currentUser: user,
                isCreator: isUserCreator,
                viewMode: isUserCreator ? 'admin' : 'member',
            };

            this.unsubscribers.push(api.subscribeToSettings(creator.username, settings => this.setState({ settings })));
            this.unsubscribers.push(api.subscribeToRoles(creator.username, roles => this.setState({ roles })));
            this.unsubscribers.push(api.subscribeToAssignments(creator.username, assignments => this.setState({ assignments })));

            const { initialComments, unsubscribe: commentUnsubscribe } = await api.getTipComments(project.id, (newComment) => {
                const updatedComments = [...this.state.tipComments, newComment].sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                this.setState({ tipComments: updatedComments });
            });
            this.unsubscribers.push(commentUnsubscribe);

            this.setState({ ...initialState, tipComments: initialComments, loading: false });

        } catch (err) {
            console.error("Initialization failed:", err);
            this.setState({ error: err.message || "An unexpected error occurred.", loading: false });
        }
    }
    
    attachEventListeners() {
        this.root.addEventListener('click', async (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;

            switch (action) {
                case 'setViewMode':
                    this.setState({ viewMode: e.target.closest('[data-action]').dataset.mode });
                    break;
                case 'becomeMember':
                case 'extendMembership':
                    await api.handleBecomeMember(this.state.settings);
                    break;
                case 'deleteRole':
                    const roleId = e.target.closest('[data-role-id]').dataset.roleId;
                    await api.handleRoleAction('delete', { id: roleId }, this.state.assignments);
                    break;
            }
        });

        this.root.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const action = form.dataset.action;

            switch(action) {
                case 'saveSettings': {
                    const formData = new FormData(form);
                    const newSettings = {
                        price: parseInt(formData.get('price'), 10),
                        pricingModel: formData.get('pricingModel'),
                        rolesEnabled: formData.get('rolesEnabled') === 'on',
                        defaultRoleId: formData.get('defaultRoleId') || '',
                    };
                    await api.saveSettings(this.state.creator, newSettings);
                    break;
                }
                case 'createRole': {
                    const formData = new FormData(form);
                    const name = formData.get('roleName').trim();
                    const color = formData.get('roleColor');
                    if(name) {
                        await api.handleRoleAction('create', { name, color });
                        form.reset();
                    }
                    break;
                }
            }
        });

        this.root.addEventListener('change', async (e) => {
             if (e.target.matches('.role-select')) {
                const userId = e.target.dataset.userId;
                const roleId = e.target.value;
                const action = roleId ? 'assign' : 'unassign';
                await api.handleRoleAction(action, { userId, roleId });
             }
        });
    }

    render() {
        ui.renderApp(this.root, this.state);
    }

    destroy() {
        this.unsubscribers.forEach(unsub => unsub());
    }
}

const app = new MembershipApp();
app.init();
app.attachEventListeners();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    app.destroy();
});