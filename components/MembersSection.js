const MemberRow = ({ member, roles, onRoleAction, rolesEnabled }) => {
    const { user, totalPaid, membershipEndDate, status, role } = member;
    
    const getStatusClass = () => {
        switch(status) {
            case 'Active': return 'status-active';
            case 'Lapsed': return 'status-lapsed';
            case 'Expiring Soon': return 'status-warning';
            default: return '';
        }
    };
    
    const endDateString = membershipEndDate ? membershipEndDate.toLocaleDateString() : 'N/A';
    
    const handleRoleChange = (e) => {
        const roleId = e.target.value;
        if (roleId) {
            onRoleAction('assign', { userId: user.id, roleId });
        } else {
            onRoleAction('unassign', { userId: user.id });
        }
    };
    
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
            {rolesEnabled && (
                <td>
                    <select className="role-select" value={role?.id || ''} onChange={handleRoleChange}>
                        <option value="">No Role</option>
                        {roles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </td>
            )}
            <td><span className={`status-badge ${getStatusClass()}`}>{status}</span></td>
        </tr>
    );
};

export const MembersSection = ({ members, roles, onRoleAction, rolesEnabled }) => {
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
                            {rolesEnabled && <th>Role</th>}
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map(member => <MemberRow key={member.user.id} member={member} roles={roles} onRoleAction={onRoleAction} rolesEnabled={rolesEnabled}/>)}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

