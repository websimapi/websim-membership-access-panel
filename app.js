import { useMembershipData, useSettingsActions, useRoleActions } from './hooks.js';
import { LoadingContainer, ErrorContainer, ViewToggleBanner } from './components/shared.js';
import { AdminHeader, SettingsSection, RoleManagementSection, MembersSection } from './components/admin.js';
import { MembershipPromptSection, MemberDashboard } from './components/member.js';

export const App = () => {
    const {
        isCreator,
        currentUser,
        creator,
        loading,
        error,
        settings,
        roles,
        assignments,
        members,
        currentUserMembership,
        viewMode,
        setViewMode,
        setError
    } = useMembershipData();

    const { handleSaveSettings } = useSettingsActions(creator);
    const { handleRoleAction } = useRoleActions(assignments);

    const wrappedSaveSettings = async (newSettings) => {
        try {
            await handleSaveSettings(newSettings);
        } catch (err) {
            setError(err.message);
        }
    };

    const wrappedRoleAction = async (action, payload) => {
        try {
            await handleRoleAction(action, payload);
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <LoadingContainer />;
    if (error) return <ErrorContainer error={error} />;

    const UserView = () => {
        if (currentUserMembership) {
            return <MemberDashboard member={currentUserMembership} settings={settings} />;
        }
        return <MembershipPromptSection settings={settings} />;
    };

    if (isCreator && viewMode === 'admin') {
        return (
            <div className="admin-panel">
                <AdminHeader onViewModeChange={setViewMode} />
                <main className="main-content">
                    <SettingsSection settings={settings} roles={roles} onSave={wrappedSaveSettings} />
                    {settings?.rolesEnabled && (
                        <RoleManagementSection roles={roles} onAction={wrappedRoleAction} />
                    )}
                    <MembersSection 
                        members={members} 
                        roles={roles} 
                        onRoleAction={wrappedRoleAction} 
                        rolesEnabled={settings?.rolesEnabled} 
                    />
                </main>
            </div>
        );
    }
    
    return (
        <div className="user-view-wrapper">
             {isCreator && (
                <ViewToggleBanner 
                    viewMode={viewMode} 
                    onSwitchToAdmin={() => setViewMode('admin')} 
                />
            )}
            <UserView />
        </div>
    );
};

