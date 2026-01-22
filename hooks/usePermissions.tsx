import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

interface RolePermissions {
    canAccessDashboard: boolean;
    canAccessTerritories: boolean;
    canAccessGroups: boolean;
    canAccessMap: boolean;
    canAccessPlanning: boolean;
    canAccessReports: boolean;
    canAccessProfile: boolean;
    canManageGroups: boolean; // For create/edit groups
    canAssignMembersToGroups: boolean;
    canAccessTracking: boolean;
    canAccessTrackingHistory: boolean;
    canAccessTrackingAdmin: boolean;
}

const rolePermissions: Record<Role, RolePermissions> = {
    publisher: {
        canAccessDashboard: true,
        canAccessTerritories: true,
        canAccessGroups: true,
        canAccessMap: true,
        canAccessPlanning: false,
        canAccessReports: false,
        canAccessProfile: true,
        canManageGroups: false,
        canAssignMembersToGroups: false,
        canAccessTracking: true,
        canAccessTrackingHistory: true, // Users see their own history
        canAccessTrackingAdmin: false,
    },
    territory_servant: {
        canAccessDashboard: false,
        canAccessTerritories: true,
        canAccessGroups: true,
        canAccessMap: true,
        canAccessPlanning: false,
        canAccessReports: false,
        canAccessProfile: true,
        canManageGroups: true,
        canAssignMembersToGroups: false,
        canAccessTracking: true,
        canAccessTrackingHistory: true,
        canAccessTrackingAdmin: false,
    },
    service_overseer: {
        canAccessDashboard: true,
        canAccessTerritories: true,
        canAccessGroups: true,
        canAccessMap: true,
        canAccessPlanning: true,
        canAccessReports: true,
        canAccessProfile: true,
        canManageGroups: true,
        canAssignMembersToGroups: true,
        canAccessTracking: true,
        canAccessTrackingHistory: true,
        canAccessTrackingAdmin: true, // Can approve reports
    },
    elder: {
        canAccessDashboard: true,
        canAccessTerritories: true,
        canAccessGroups: true,
        canAccessMap: true,
        canAccessPlanning: false,
        canAccessReports: true,
        canAccessProfile: true,
        canManageGroups: true,
        canAssignMembersToGroups: true,
        canAccessTracking: true,
        canAccessTrackingHistory: true,
        canAccessTrackingAdmin: true, // Can approve reports
    },
    admin: {
        canAccessDashboard: true,
        canAccessTerritories: true,
        canAccessGroups: true,
        canAccessMap: true,
        canAccessPlanning: true,
        canAccessReports: true,
        canAccessProfile: true,
        canManageGroups: true,
        canAssignMembersToGroups: true,
        canAccessTracking: true,
        canAccessTrackingHistory: true,
        canAccessTrackingAdmin: true,
    },
};

export const usePermissions = () => {
    const { user } = useAuth();
    const userRole = user?.role || 'publisher';

    const permissions = rolePermissions[userRole];

    const canAccess = (page: keyof RolePermissions): boolean => {
        return permissions[page];
    };

    const getDefaultRoute = (): string => {
        if (permissions.canAccessDashboard) return '/';
        if (permissions.canAccessGroups) return '/groups';
        if (permissions.canAccessMap) return '/map';
        return '/profile';
    };

    const getAllowedRoutes = () => {
        const routes: string[] = [];
        if (permissions.canAccessDashboard) routes.push('/');
        if (permissions.canAccessTerritories) routes.push('/territories');
        if (permissions.canAccessGroups) routes.push('/groups');
        if (permissions.canAccessMap) routes.push('/map');
        if (permissions.canAccessPlanning) routes.push('/planning');
        if (permissions.canAccessReports) routes.push('/reports');
        if (permissions.canAccessProfile) routes.push('/profile');
        if (permissions.canAccessTracking) routes.push('/tracking');
        if (permissions.canAccessTrackingHistory) routes.push('/tracking/history');
        if (permissions.canAccessTrackingAdmin) routes.push('/tracking/admin');
        return routes;
    };

    return {
        permissions,
        canAccess,
        getDefaultRoute,
        getAllowedRoutes,
    };
};
