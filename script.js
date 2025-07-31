import { calculateMembershipData, getMembershipDurationString } from './utils.js';

const { useState, useEffect, useMemo, useCallback } = React;
const { createRoot } = ReactDOM;

const room = new WebsimSocket();
const SETTINGS_COLLECTION = 'membership_settings_v1';

const App = () => {
    const [isCreator, setIsCreator] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [settings, setSettings] = useState(null);
    const [tipComments, setTipComments] = useState([]);
    const [viewAsUser, setViewAsUser] = useState(false);
    
    useEffect(() => {
        const initialize = async () => {
            try {
                const [creator, user, project] = await Promise.all([
                    window.websim.getCreator(),
                    window.websim.getCurrentUser(),
                    window.websim.getCurrentProject()
                ]);

                setCurrentUser(user);
                setIsCreator(user?.id === creator?.id);

                // Fetch settings for everyone.
                room.collection(SETTINGS_COLLECTION).subscribe(settingsRecords => {
                    if (settingsRecords && settingsRecords.length > 0) {
                        const creatorSettings = settingsRecords
                            .filter(s => s.username === creator.username)
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        setSettings(creatorSettings[0] || null);
                    } else {
                        setSettings(null);
                    }
                });
                
                // Fetch all tip comments for the project
                const response = await fetch(`/api/v1/projects/${project.id}/comments?only_tips=true&first=100`);
                if (!response.ok) throw new Error("Failed to fetch comments");
                const data = await response.json();
                const sortedComments = data.comments.data.map(c => c.comment).sort((a,b) => new Date(a.created_at) - new Date(b.created_at));
                setTipComments(sortedComments);
                
                // Listen for new tips in real-time
                const unsubscribe = window.websim.addEventListener('comment:created', (eventData) => {
                    const newComment = eventData.comment;
                    if (newComment.card_data && newComment.card_data.type === 'tip_comment') {
                        setTipComments(prevComments => 
                            [...prevComments, newComment]
                            .sort((a,b) => new Date(a.created_at) - new Date(b.created_at))
                        );
                    }
                });
                
                return unsubscribe;

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

    const handleSaveSettings = useCallback(async (newPrice, newModel) => {
        try {
            const creator = await window.websim.getCreator();
            const payload = {
                price: parseInt(newPrice, 10),
                pricingModel: newModel,
            };
            
            const existingSettings = room.collection(SETTINGS_COLLECTION)
                .filter({ username: creator.username })
                .getList();

            if (existingSettings.length > 0) {
                 await room.collection(SETTINGS_COLLECTION).update(existingSettings[0].id, payload);
            } else {
                 await room.collection(SETTINGS_COLLECTION).create(payload);
            }
        } catch (err) {
            console.error("Failed to save settings:", err);
            setError("Could not save settings.");
        }
    }, []);

    const members = useMemo(() => {
        if (!settings || tipComments.length === 0) return [];
        return calculateMembershipData(tipComments, settings);
    }, [tipComments, settings]);

    if (loading) {
        return (
            <div className="loading-container">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Loading Membership Panel...</p>
            </div>
        );
    }
    
    if (error) {
         return (
            <div className="error-container">
                <i className="fas fa-exclamation-triangle"></i>
                <p>Error: {error}</p>
            </div>
        );
    }

    const UserView = () => {
        const currentUserMembership = useMemo(() => {
            return members.find(m => m.user.id === currentUser?.id);
        }, [members, currentUser]);

        if (currentUserMembership) {
            return <MemberDashboard member={currentUserMembership} settings={settings} />;
        }

        return <MembershipPromptSection settings={settings} />;
    };

    if (isCreator && !viewAsUser) {
        return (
            <div className="admin-panel">
                <header>
                    <h1><i className="fas fa-users-cog"></i> Membership Admin Panel</h1>
                    <button className="btn btn-secondary view-toggle-btn" onClick={() => setViewAsUser(true)}>
                        <i className="fas fa-eye"></i> View as User
                    </button>
                </header>
                <main className="main-content">
                    <SettingsSection settings={settings} onSave={handleSaveSettings} />
                    <MembersSection members={members} />
                </main>
            </div>
        );
    }
    
    return (
        <div className="user-view-wrapper">
             {isCreator && (
                <div className="view-toggle-banner">
                    <p><i className="fas fa-info-circle"></i> You are viewing the page as a regular user.</p>
                    <button className="btn btn-secondary" onClick={() => setViewAsUser(false)}>
                        <i className="fas fa-user-shield"></i> Switch to Admin View
                    </button>
                </div>
            )}
            <UserView />
        </div>
    );
};

const MembershipPromptSection = ({ settings }) => {
    const handleBecomeMember = async () => {
        const message = `Tipping ${settings.price} credits for membership!`;
        const result = await window.websim.postComment({ content: message });
        if (result.error) {
            console.error("Could not open comment dialog:", result.error);
            // Optionally, show an error to the user
        }
    };
    
    if (!settings) {
        return (
            <div className="membership-prompt-section">
                <i className="fas fa-info-circle icon"></i>
                <h3>Membership Not Available</h3>
                <p>The creator has not set up memberships for this project yet. Check back later!</p>
            </div>
        );
    }

    const { price, pricingModel } = settings;
    const durationString = getMembershipDurationString(pricingModel);

    return (
        <div className="membership-prompt-section">
            <i className="fas fa-star icon"></i>
            <h3>Become a Member!</h3>
            <p>Support the creator by becoming a member.</p>
            <div className="offer">
                Tip <strong>{price} credits</strong> {durationString}.
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleBecomeMember}>
                <i className="fas fa-comment-dollar"></i> Become a Member
            </button>
        </div>
    );
};

const SettingsSection = ({ settings, onSave }) => {
    const [price, setPrice] = useState(100);
    const [model, setModel] = useState('monthly');

    useEffect(() => {
        if (settings) {
            setPrice(settings.price);
            setModel(settings.pricingModel);
        }
    }, [settings]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(price, model);
    };

    return (
        <section className="settings-section">
            <h2><i className="fas fa-cogs"></i> Membership Settings</h2>
            <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                    <label htmlFor="pricingModel">Pricing Model</label>
                    <select id="pricingModel" value={model} onChange={e => setModel(e.target.value)}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="one-day">One-Day Pass</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="price">Price (Credits)</label>
                    <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} min="1" />
                </div>
                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Save Settings</button>
            </form>
        </section>
    );
};

const MembersSection = ({ members }) => {
    if (members.length === 0) {
        return <p>No members yet. Share your project and ask for tips to get started!</p>;
    }
    
    return (
        <section className="members-section">
            <h2><i className="fas fa-users"></i> Current Members</h2>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Total Paid (Credits)</th>
                            <th>Membership Ends</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(member => <MemberRow key={member.user.id} member={member} />)}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

const MemberRow = ({ member }) => {
    const { user, totalPaid, membershipEndDate, status } = member;
    
    const getStatusClass = () => {
        switch(status) {
            case 'Active': return 'status-active';
            case 'Lapsed': return 'status-lapsed';
            case 'Expiring Soon': return 'status-warning';
            default: return '';
        }
    };
    
    const endDateString = membershipEndDate ? membershipEndDate.toLocaleDateString() : 'N/A';
    
    return (
        <tr>
            <td>
                <div className="member-info">
                    <img src={`https://images.websim.com/avatar/${user.username}`} alt={user.username} />
                    <a href={`https://websim.com/@${user.username}`} target="_blank" rel="noopener noreferrer">
                        @{user.username}
                    </a>
                </div>
            </td>
            <td className="credits-cell">{totalPaid}</td>
            <td>{endDateString}</td>
            <td><span className={`status-badge ${getStatusClass()}`}>{status}</span></td>
        </tr>
    );
};

const MemberDashboard = ({ member, settings }) => {
    const { user, totalPaid, membershipEndDate, status } = member;

    const getStatusClass = () => {
        switch(status) {
            case 'Active': return 'status-active';
            case 'Lapsed': return 'status-lapsed';
            case 'Expiring Soon': return 'status-warning';
            default: return '';
        }
    };
    
    const endDateString = membershipEndDate ? membershipEndDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    
    const handleExtendMembership = async () => {
        const message = `Tipping ${settings.price} credits to extend membership!`;
        const result = await window.websim.postComment({ content: message });
        if (result.error) {
            console.error("Could not open comment dialog:", result.error);
        }
    };
    
    const durationString = settings ? getMembershipDurationString(settings.pricingModel) : '';

    return (
        <div className="member-dashboard">
            <header className="member-dashboard-header">
                <img src={`https://images.websim.com/avatar/${user.username}`} alt={user.username} />
                <h2><span>Welcome back,</span> @{user.username}!</h2>
            </header>
            <main className="main-content">
                 <div className="member-stats">
                    <div className="stat-card">
                        <i className="fas fa-coins icon"></i>
                        <div className="stat-card-info">
                            <h4>Total Paid</h4>
                            <p>{totalPaid} credits</p>
                        </div>
                    </div>
                    <div className="stat-card">
                         <i className="fas fa-calendar-check icon"></i>
                        <div className="stat-card-info">
                            <h4>Membership Ends</h4>
                            <p>{endDateString}</p>
                        </div>
                    </div>
                     <div className="stat-card">
                         <i className="fas fa-info-circle icon"></i>
                        <div className="stat-card-info">
                            <h4>Status</h4>
                            <p><span className={`status-badge ${getStatusClass()}`}>{status}</span></p>
                        </div>
                    </div>
                </div>

                {settings && (
                    <div className="extend-membership-section">
                        <h3>Extend Your Membership</h3>
                         <p>Continue supporting the creator and keep your benefits.</p>
                        <div className="offer">
                            Tip <strong>{settings.price} credits</strong> {durationString}.
                        </div>
                        <div>
                            <button className="btn btn-primary btn-lg" onClick={handleExtendMembership}>
                               <i className="fas fa-comment-dollar"></i> Extend Now
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);