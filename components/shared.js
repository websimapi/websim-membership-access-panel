const { useState } = React;

export const LoadingContainer = () => (
    <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading Membership Panel...</p>
    </div>
);

export const ErrorContainer = ({ error }) => (
    <div className="error-container">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Error: {error}</p>
    </div>
);

export const ViewToggleBanner = ({ viewMode, onSwitchToAdmin }) => (
    <div className="view-toggle-banner">
        <p>
            <i className="fas fa-info-circle"></i> 
            {viewMode === 'member' 
                ? 'You are viewing the page as a member.' 
                : 'You are viewing as an unpaid user.'
            }
        </p>
        <button className="btn btn-secondary" onClick={onSwitchToAdmin}>
            <i className="fas fa-user-shield"></i> Switch to Admin View
        </button>
    </div>
);

export const StatusBadge = ({ status }) => {
    const getStatusClass = () => {
        switch(status) {
            case 'Active': return 'status-active';
            case 'Lapsed': return 'status-lapsed';
            case 'Expiring Soon': return 'status-warning';
            default: return '';
        }
    };
    
    return <span className={`status-badge ${getStatusClass()}`}>{status}</span>;
};

export const RoleTag = ({ role }) => (
    <span className="role-tag" style={{ backgroundColor: role.color }}>
        {role.name}
    </span>
);

