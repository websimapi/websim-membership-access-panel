const { useState } = React;

const RoleManagementSection = ({ roles, onAction }) => {
    const [roleName, setRoleName] = useState('');
    const [roleColor, setRoleColor] = useState('#cccccc');

    const handleCreateRole = (e) => {
        e.preventDefault();
        if (roleName.trim()) {
            onAction('create', { name: roleName.trim(), color: roleColor });
            setRoleName('');
            setRoleColor('#cccccc');
        }
    };

    return (
        <section className="role-management-section">
            <h2><i className="fas fa-user-tag"></i> Manage Roles</h2>
            <form onSubmit={handleCreateRole} className="role-form">
                 <input 
                    type="text" 
                    value={roleName} 
                    onChange={e => setRoleName(e.target.value)} 
                    placeholder="New role name (e.g., VIP)" 
                    required 
                />
                <input 
                    type="color" 
                    value={roleColor} 
                    onChange={e => setRoleColor(e.target.value)}
                    title="Select role color"
                />
                <button type="submit" className="btn btn-primary"><i className="fas fa-plus"></i> Create Role</button>
            </form>
            <div className="role-list">
                {roles.length > 0 ? roles.map(role => (
                    <div key={role.id} className="role-item">
                        <span className="role-tag" style={{ backgroundColor: role.color }}>{role.name}</span>
                        <button onClick={() => onAction('delete', { id: role.id })} className="btn-delete-role">
                            <i className="fas fa-trash-alt"></i>
                        </button>
                    </div>
                )) : <p>No roles created yet.</p>}
            </div>
        </section>
    );
};

export default RoleManagementSection;

