import MemberRow from './MemberRow.js';

const MembersSection = ({ members, roles, onRoleAction, rolesEnabled }) => {
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

export default MembersSection;

