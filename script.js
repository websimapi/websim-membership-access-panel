import { calculateMembershipData } from './utils.js';

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

                if (user?.id === creator?.id) {
                    // Fetch settings for creator
                    room.collection(SETTINGS_COLLECTION).subscribe(settingsRecords => {
                        if (settingsRecords && settingsRecords.length > 0) {
                            // Find the most recent setting by the creator
                            const creatorSettings = settingsRecords
                                .filter(s => s.username === creator.username)
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                            setSettings(creatorSettings[0] || null);
                        } else {
                            setSettings(null);
                        }
                    });

                    // Fetch tip comments
                    const response = await fetch(`/api/v1/projects/${project.id}/comments?only_tips=true&first=100`);
                    if (!response.ok) throw new Error("Failed to fetch comments");
                    const data = await response.json();
                    setTipComments(data.comments.data.map(c => c.comment).sort((a,b) => new Date(a.created_at) - new Date(b.created_at)));
                    
                     // Listen for new tips
                    window.websim.addEventListener('comment:created', (data) => {
                        const newComment = data.comment;
                        if (newComment.card_data && newComment.card_data.type === 'tip_comment') {
                            setTipComments(prevComments => [...prevComments, newComment].sort((a,b) => new Date(a.created_at) - new Date(b.created_at)));
                        }
                    });

                }
            } catch (err) {
                console.error("Initialization failed:", err);
                setError(err.message || "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        initialize();
        
        return () => {
            // Unsubscribe when component unmounts if needed
            // room.collection(SETTINGS_COLLECTION).subscribe returns an unsub function
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

    if (!isCreator) {
        return (
            <div className="error-container">
                <i className="fas fa-lock"></i>
                <p>Access Denied. Only the project creator can view this page.</p>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            <header>
                <h1><i className="fas fa-users-cog"></i> Membership Admin Panel</h1>
            </header>
            <main className="main-content">
                <SettingsSection settings={settings} onSave={handleSaveSettings} />
                <MembersSection members={members} />
            </main>
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

const root = createRoot(document.getElementById('root'));
root.render(<App />);

