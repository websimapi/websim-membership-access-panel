import React, { useState, useEffect } from 'react';

const SettingsSection = ({ settings, roles, onSave }) => {
    const [price, setPrice] = useState(100);
    const [model, setModel] = useState('monthly');
    const [rolesEnabled, setRolesEnabled] = useState(false);
    const [defaultRoleId, setDefaultRoleId] = useState('');

    useEffect(() => {
        if (settings) {
            setPrice(settings.price || 100);
            setModel(settings.pricingModel || 'monthly');
            setRolesEnabled(settings.rolesEnabled || false);
            setDefaultRoleId(settings.defaultRoleId || '');
        }
    }, [settings]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            price: parseInt(price, 10),
            pricingModel: model,
            rolesEnabled,
            defaultRoleId,
        });
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
                <div className="form-group form-group-toggle">
                    <label htmlFor="rolesEnabled">Enable Roles</label>
                    <label className="switch">
                        <input type="checkbox" id="rolesEnabled" checked={rolesEnabled} onChange={e => setRolesEnabled(e.target.checked)} />
                        <span className="slider round"></span>
                    </label>
                </div>
                {rolesEnabled && (
                     <div className="form-group">
                        <label htmlFor="defaultRole">Default Role for New Members</label>
                        <select id="defaultRole" value={defaultRoleId} onChange={e => setDefaultRoleId(e.target.value)}>
                            <option value="">None</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <button type="submit" className="btn btn-primary"><i className="fas fa-save"></i> Save Settings</button>
            </form>
        </section>
    );
};

export default SettingsSection;