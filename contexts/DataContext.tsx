import React, { createContext, useContext, useState, useEffect } from 'react';
import { Territory, TerritoryStatus, WorkRecord, WeeklyPlan, DailyAllocation, TerritoryGroup, CongregationMember, TrackingSession } from '../types';
import { calculateStatus } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface DataContextType {
    territories: Territory[];
    addTerritory: (territory: Omit<Territory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateTerritory: (id: string, updates: Partial<Territory>) => Promise<void>;
    deleteTerritory: (id: string) => Promise<void>;
    getTerritory: (id: string) => Territory | undefined;
    registerWork: (record: Omit<WorkRecord, 'id' | 'createdAt'>) => Promise<void>;
    getHistory: (territoryId: string) => WorkRecord[];
    allWorkHistory: WorkRecord[];
    weeklyPlans: WeeklyPlan[];
    currentWeeklyPlan: WeeklyPlan | undefined;
    saveWeeklyPlan: (groupId: string, days: DailyAllocation) => Promise<void>;
    groups: TerritoryGroup[];
    addGroup: (group: Omit<TerritoryGroup, 'id' | 'createdAt'>) => Promise<void>;
    updateGroup: (id: string, updates: Partial<TerritoryGroup>) => Promise<void>;
    deleteGroup: (id: string) => Promise<void>;
    members: CongregationMember[];
    /* Tracking */
    registerTrackingSession: (session: Omit<TrackingSession, 'id' | 'createdAt' | 'status'>) => Promise<void>;
    getTrackingHistory: () => Promise<TrackingSession[]>;
    getPendingReports: () => Promise<TrackingSession[]>;
    approveReport: (id: string) => Promise<void>;
    rejectReport: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [territories, setTerritories] = useState<Territory[]>([]);
    const [workHistory, setWorkHistory] = useState<WorkRecord[]>([]);
    const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
    const [groups, setGroups] = useState<TerritoryGroup[]>([]);
    const [members, setMembers] = useState<CongregationMember[]>([]);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        try {
            const results = await Promise.allSettled([
                api.get('/territories'),
                api.get('/work-history'),
                api.get('/groups'),
                api.get('/weekly-plans'),
                api.get('/congregations/members')
            ]);

            const [tResult, hResult, gResult, pResult, mResult] = results;

            if (tResult.status === 'fulfilled') {
                setTerritories(tResult.value);
            } else {
                console.error('Failed to load territories:', tResult.reason);
                // toast.error('Erro ao carregar territórios');
            }

            if (hResult.status === 'fulfilled') {
                setWorkHistory(hResult.value);
            } else {
                console.error('Failed to load history:', hResult.reason);
            }

            if (gResult.status === 'fulfilled') {
                setGroups(gResult.value);
            } else {
                console.error('Failed to load groups:', gResult.reason);
            }

            if (pResult.status === 'fulfilled') {
                setWeeklyPlans(pResult.value);
            } else {
                console.error('Failed to load plans:', pResult.reason);
            }

            if (mResult.status === 'fulfilled') {
                setMembers(mResult.value);
            } else {
                console.error('Failed to load members:', mResult.reason);
            }

        } catch (error) {
            console.error('Erro crítico ao carregar dados:', error);
        }
    };

    const addTerritory = async (territoryData: Omit<Territory, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!user) {
            throw new Error('User must be authenticated to add territory');
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        const newTerritory: Territory = {
            ...territoryData,
            id,
            userId: user.uid,
            // Initialize images array if not provided
            images: territoryData.images || [],
            // Initialize geolocation with empty data if not provided
            geolocation: territoryData.geolocation || {
                type: 'Polygon',
                coordinates: [],
                area: 0,
                center: { lat: 0, lng: 0 }
            },
            // Initialize work tracking fields
            lastWorkedDate: territoryData.lastWorkedDate || null,
            lastWorkedBy: territoryData.lastWorkedBy || '',
            daysSinceWork: territoryData.daysSinceWork || 999,
            createdAt: now,
            updatedAt: now,
        };

        try {
            await api.post('/territories', newTerritory);
            setTerritories([...territories, newTerritory]);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateTerritory = async (id: string, updates: Partial<Territory>) => {
        try {
            await api.put(`/territories/${id}`, updates);
            setTerritories(territories.map(t =>
                t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
            ));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteTerritory = async (id: string) => {
        try {
            // Placeholder: need backend endpoint
            // await api.delete(`/territories/${id}`);
            setTerritories(territories.filter(t => t.id !== id));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const getTerritory = (id: string) => {
        return territories.find(t => t.id === id);
    }

    const registerWork = async (recordData: Omit<WorkRecord, 'id' | 'createdAt'>) => {
        const id = uuidv4();
        const newRecord: WorkRecord = {
            ...recordData,
            id,
            createdAt: new Date().toISOString(),
        };

        try {
            await api.post('/work-records', newRecord);
            setWorkHistory([newRecord, ...workHistory]);

            // Update territory status
            const territory = territories.find(t => t.id === recordData.territoryId);
            if (territory) {
                const { status, days } = calculateStatus(new Date(recordData.date));
                await updateTerritory(territory.id, {
                    lastWorkedDate: recordData.date,
                    lastWorkedBy: recordData.publisherName,
                    status: status,
                    daysSinceWork: days
                });
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const getHistory = (territoryId: string) => {
        return workHistory.filter(h => h.territoryId === territoryId);
    }

    const saveWeeklyPlan = async (groupId: string, days: DailyAllocation) => {
        const id = uuidv4();
        const today = new Date();
        const newPlan: WeeklyPlan = {
            id,
            groupId,
            startDate: today.toISOString(),
            days,
            createdAt: today.toISOString()
        };

        try {
            await api.post('/weekly-plans', newPlan);
            setWeeklyPlans([newPlan, ...weeklyPlans.filter(p => p.groupId !== groupId)]);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const addGroup = async (groupData: Omit<TerritoryGroup, 'id' | 'createdAt'>) => {
        const id = uuidv4();
        const newGroup: TerritoryGroup = {
            ...groupData,
            id,
            createdAt: new Date().toISOString()
        };
        try {
            await api.post('/groups', newGroup);
            setGroups([...groups, newGroup]);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateGroup = async (id: string, updates: Partial<TerritoryGroup>) => {
        try {
            // Placeholder: need backend endpoint
            setGroups(groups.map(g => g.id === id ? { ...g, ...updates } : g));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteGroup = async (id: string) => {
        try {
            // Placeholder: need backend endpoint
            setGroups(groups.filter(g => g.id !== id));
            setWeeklyPlans(weeklyPlans.filter(p => p.groupId !== id));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const currentWeeklyPlan = weeklyPlans.length > 0 ? weeklyPlans[0] : undefined;

    /* TRACKING FUNCTIONS */
    const registerTrackingSession = async (session: Omit<TrackingSession, 'id' | 'createdAt' | 'status'>) => {
        await api.post('/tracking/sessions', session);
    };

    const getTrackingHistory = async () => {
        return await api.get('/tracking/history');
    };

    const getPendingReports = async () => {
        return await api.get('/tracking/pending');
    };

    const approveReport = async (id: string) => {
        await api.put(`/tracking/sessions/${id}/approve`, {});
    };

    const rejectReport = async (id: string) => {
        await api.put(`/tracking/sessions/${id}/reject`, {});
    };

    return (
        <DataContext.Provider value={{
            territories,
            addTerritory,
            updateTerritory,
            deleteTerritory,
            getTerritory,
            registerWork,
            getHistory,
            allWorkHistory: workHistory,
            weeklyPlans,
            currentWeeklyPlan,
            saveWeeklyPlan,
            groups,
            addGroup,
            updateGroup,
            deleteGroup,
            members,
            /* Tracking */
            registerTrackingSession,
            getTrackingHistory,
            getPendingReports,
            approveReport,
            rejectReport
        }}>
            {children}
        </DataContext.Provider>
    );
};
