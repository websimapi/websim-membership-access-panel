import { calculateMembershipData } from './utils.js';
import * as api from './api.js';
import { renderLoading, renderError, renderAdminView, renderUserViewWrapper } from './ui.js';

const root = document.getElementById('root');

// --- Global State ---
const state = {
    isCreator: false,
    currentUser: null,
    creator: null,
    loading: true,
    error: null,
    settings: null,
    roles: [],
    assignments: [],
    tipComments: [],
    viewMode: 'admin',
    get members() {
        if (!this.settings || this.tipComments.length === 0) return [];
        const baseMembers = calculateMembershipData(this.tipComments, this.settings);
        return baseMembers.map(member => {
            const assignment = this.assignments.find(a => a.id === member.user.id);
            const role = assignment ? this.roles.find(r => r.id === assignment.role_id) : null;
            return { ...member, role };
        }).sort((a,b) => (b.membershipEndDate || 0) - (a.membershipEndDate || 0));
    }
};

// --- State Management ---
function setState(newState) {
    Object.assign(state, newState);
    render();
}

// --- Event Handlers ---
async function handleSaveSettings(newSettings) {
    try {
        await api.saveSettings(state.creator, newSettings);
    } catch (err) {
        console.error("Failed to save settings:", err);
        setState({ error: "Could not save settings." });
    }
}

async function handleRoleAction(action, payload) {
    try {
        await api.handleRoleAction(action, payload, state.assignments);
    } catch (err) {
        console.error(`Role action '${action}' failed:`, err);
        setState({ error: `Could not perform role action: ${action}.` });
    }
}

function handleViewModeChange(newMode) {
    setState({ viewMode: newMode });
}

// --- Rendering ---
function render() {
    root.innerHTML = '';

    if (state.loading) {
        root.appendChild(renderLoading());
        return;
    }

    if (state.error) {
        root.appendChild(renderError(state.error));
        return;
    }

    if (state.isCreator && state.viewMode === 'admin') {
        root.appendChild(renderAdminView(state, handleViewModeChange, handleSaveSettings, handleRoleAction));
    } else {
        root.appendChild(renderUserViewWrapper(state, handleViewModeChange));
    }
}

// --- Initialization ---
async function main() {
    render(); // Initial render for loading state

    const dataCallbacks = {
        onUserAndCreator: ({ user, creator, isCreator }) => {
            const initialState = { currentUser: user, creator, isCreator };
            if (!isCreator) {
                initialState.viewMode = 'member';
            }
            setState(initialState);
        },
        onSettings: settings => setState({ settings }),
        onRoles: roles => setState({ roles }),
        onAssignments: assignments => setState({ assignments }),
        onTipComments: comments => setState({ tipComments: comments }),
        onNewTipComment: newComment => {
             setState({
                tipComments: [...state.tipComments, newComment]
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
            });
        },
        onError: error => setState({ error: error.message || "An unexpected error occurred." }),
        onFinally: () => setState({ loading: false }),
    };

    try {
        await api.initialize(dataCallbacks);
    } catch(err) {
        setState({ error: err.message || "Initialization failed.", loading: false });
    }
}

main();