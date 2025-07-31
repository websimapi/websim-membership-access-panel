import React from 'react';
import { getMembershipDurationString } from './utils.js';

const MemberDashboard = ({ member, settings }) => {
    const { user, totalPaid, membershipEndDate, status, role } = member;
    const getStatusClass = () => {
        switch (status) {
            case 'Active': return 'status-active';
            case 'Lapsed': return 'status-lapsed';
            case 'Expiring Soon': return 'status-warning';
            default: return '';
        }
    };
    const endDateString = membershipEndDate
        ? membershipEndDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';
    const handleExtendMembership = async () => {
        const message = `Tipping ${settings.price} credits to extend membership!`;
        const result = await window.websim.postComment({ content: message });
        if (result.error) {
            console.error('Could not open comment dialog:', result.error);
        }
    };
    const durationString = getMembershipDurationString(settings.pricingModel);

    return (
        <div className="member-dashboard">
            <header className="member-dashboard-header">
                <img
                    src={`https://images.websim.com/avatar/${user.username}`}
                    alt={user.username}
                />
                <h2>
                    <span>Welcome back,</span> @{user.username}!
                </h2>
                {role && (
                    <span
                        className="role-tag"
                        style={{ backgroundColor: role.color, marginLeft: '15px' }}
                    >
                        {role.name}
                    </span>
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
                            <p>
                                <span className={`status-badge ${getStatusClass()}`}>{status}</span>
                            </p>
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
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleExtendMembership}
                        >
                            <i className="fas fa-comment-dollar"></i> Extend Now
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default MemberDashboard;

