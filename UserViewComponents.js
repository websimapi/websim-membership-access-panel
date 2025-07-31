import { getMembershipDurationString } from './utils.js';
const { useMemo } = React;

export const MembershipPromptSection = ({ settings }) => {
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

export const MemberDashboard = ({ member, settings }) => {
    const { user, totalPaid, membershipEndDate, status, role } = member;

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
                {role && (
                    <span className="role-tag" style={{ backgroundColor: role.color, marginLeft: '15px' }}>{role.name}</span>
                )}
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

