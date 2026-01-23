import React, { createContext, useContext, useState, useEffect } from 'react';
import { Territory, TerritoryStatus, WorkRecord, WeeklyPlan, DailyAllocation, TerritoryGroup, CongregationMember, TrackingSession, ServiceReport, MonthlyPlan, WeeklySchedule, PlanSuggestion, ServiceRole, PlanTemplate } from '../types';
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
    getTrackingSessionDetails: (id: string) => Promise<TrackingSession>;
    /* Service Reports */
    serviceReports: ServiceReport[];
    saveServiceReport: (report: Omit<ServiceReport, 'id' | 'updatedAt'>) => Promise<void>;
    /* Monthly Planning */
    monthlyPlans: MonthlyPlan[];
    saveMonthlyPlan: (plan: Omit<MonthlyPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateMonthlyPlan: (id: string, updates: Partial<MonthlyPlan>) => Promise<void>;
    deleteMonthlyPlan: (id: string) => Promise<void>;
    getMonthlyPlan: (month: string) => MonthlyPlan | undefined;
    saveWeeklySchedule: (schedule: Omit<WeeklySchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    getPlanSuggestions: (targetHours: number, serviceRole: ServiceRole) => PlanSuggestion[];
    /* Plan Templates */
    planTemplates: PlanTemplate[];
    saveTemplate: (template: Omit<PlanTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
    deleteTemplate: (templateId: string) => Promise<void>;
    getPublicTemplates: () => PlanTemplate[];
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
    const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
    const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>([]);
    const [planTemplates, setPlanTemplates] = useState<PlanTemplate[]>([]);

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
                api.get('/weekly-plans'),
                api.get('/congregations/members'),
                api.get('/service-reports'),
                api.get('/monthly-plans'),
                api.get('/plan-templates')
            ]);

            const [tResult, hResult, gResult, pResult, mResult, rResult, mpResult, tpResult] = results;

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

            if (rResult.status === 'fulfilled') {
                setServiceReports(rResult.value);
            } else {
                console.error('Failed to load reports:', rResult.reason);
            }

            if (mpResult.status === 'fulfilled') {
                setMonthlyPlans(mpResult.value);
            } else {
                console.error('Failed to load monthly plans:', mpResult.reason);
            }

            if (tpResult.status === 'fulfilled') {
                setPlanTemplates(tpResult.value);
            } else {
                console.error('Failed to load templates:', tpResult.reason);
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

    const getTrackingSessionDetails = async (id: string) => {
        return await api.get(`/tracking/sessions/${id}`);
    };

    const saveServiceReport = async (reportData: Omit<ServiceReport, 'id' | 'updatedAt'>) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newReport: ServiceReport = {
            ...reportData,
            id,
            updatedAt: now
        };

        try {
            await api.post('/service-reports', newReport);
            // Update local state (replace if exists for same month, or add)
            setServiceReports(prev => {
                const filtered = prev.filter(r => r.month !== reportData.month);
                return [...filtered, newReport];
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    /* MONTHLY PLANNING FUNCTIONS */
    const saveMonthlyPlan = async (planData: Omit<MonthlyPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newPlan: MonthlyPlan = {
            ...planData,
            id,
            createdAt: now,
            updatedAt: now
        };

        try {
            await api.post('/monthly-plans', newPlan);
            setMonthlyPlans(prev => {
                const filtered = prev.filter(p => p.month !== planData.month);
                return [...filtered, newPlan];
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateMonthlyPlan = async (id: string, updates: Partial<MonthlyPlan>) => {
        try {
            const now = new Date().toISOString();
            await api.put(`/monthly-plans/${id}`, { ...updates, updatedAt: now });
            setMonthlyPlans(prev => prev.map(p =>
                p.id === id ? { ...p, ...updates, updatedAt: now } : p
            ));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteMonthlyPlan = async (id: string) => {
        try {
            await api.delete(`/monthly-plans/${id}`);
            setMonthlyPlans(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const getMonthlyPlan = (month: string) => {
        return monthlyPlans.find(p => p.month === month);
    };

    const saveWeeklySchedule = async (scheduleData: Omit<WeeklySchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newSchedule: WeeklySchedule = {
            ...scheduleData,
            id,
            createdAt: now,
            updatedAt: now
        };

        try {
            await api.post('/weekly-schedules', newSchedule);
            // Update the monthly plan with the new week
            const plan = monthlyPlans.find(p => p.id === scheduleData.planId);
            if (plan) {
                const updatedWeeks = [...plan.weeks.filter(w => w.weekNumber !== scheduleData.weekNumber), newSchedule];
                const totalPlannedHours = updatedWeeks.reduce((sum, w) => sum + w.totalPlannedHours, 0);
                const projectedCompletion = plan.targetHours > 0 ? (totalPlannedHours / plan.targetHours) * 100 : 0;

                await updateMonthlyPlan(plan.id, {
                    weeks: updatedWeeks,
                    totalPlannedHours,
                    projectedCompletion
                });
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const getPlanSuggestions = (targetHours: number, serviceRole: ServiceRole): PlanSuggestion[] => {
        const suggestions: PlanSuggestion[] = [];

        // Balanced - same hours every day
        const dailyHours = targetHours / 7;
        suggestions.push({
            type: 'balanced',
            name: 'Equilibrado',
            description: 'Mesma quantidade de horas todos os dias da semana',
            distribution: {
                monday: dailyHours,
                tuesday: dailyHours,
                wednesday: dailyHours,
                thursday: dailyHours,
                friday: dailyHours,
                saturday: dailyHours,
                sunday: dailyHours
            },
            totalHours: targetHours
        });

        // Weekends - more hours on Saturday and Sunday
        const weekdayHours = targetHours * 0.15;
        const weekendHours = targetHours * 0.275;
        suggestions.push({
            type: 'weekends',
            name: 'Fins de Semana',
            description: 'Mais horas nos sábados e domingos',
            distribution: {
                monday: weekdayHours,
                tuesday: weekdayHours,
                wednesday: weekdayHours,
                thursday: weekdayHours,
                friday: weekdayHours,
                saturday: weekendHours,
                sunday: weekendHours
            },
            totalHours: targetHours
        });

        // Weekdays - more hours Monday to Friday
        const weekdayHoursAlt = targetHours * 0.18;
        const weekendHoursAlt = targetHours * 0.1;
        suggestions.push({
            type: 'weekdays',
            name: 'Dias Úteis',
            description: 'Mais horas de segunda a sexta-feira',
            distribution: {
                monday: weekdayHoursAlt,
                tuesday: weekdayHoursAlt,
                wednesday: weekdayHoursAlt,
                thursday: weekdayHoursAlt,
                friday: weekdayHoursAlt,
                saturday: weekendHoursAlt,
                sunday: weekendHoursAlt
            },
            totalHours: targetHours
        });

        // Front-loaded - more hours at the beginning of the week
        suggestions.push({
            type: 'frontloaded',
            name: 'Intensivo Inicial',
            description: 'Mais horas no início da semana',
            distribution: {
                monday: targetHours * 0.25,
                tuesday: targetHours * 0.20,
                wednesday: targetHours * 0.18,
                thursday: targetHours * 0.15,
                friday: targetHours * 0.12,
                saturday: targetHours * 0.06,
                sunday: targetHours * 0.04
            },
            totalHours: targetHours
        });

        return suggestions;
    };

    /* TEMPLATE MANAGEMENT FUNCTIONS */
    const saveTemplate = async (templateData: Omit<PlanTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
        if (!user) return;

        const id = uuidv4();
        const now = new Date().toISOString();
        const newTemplate: PlanTemplate = {
            ...templateData,
            id,
            usageCount: 0,
            createdAt: now,
            updatedAt: now
        };

        try {
            await api.post('/plan-templates', newTemplate);
            setPlanTemplates(prev => [...prev, newTemplate]);
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const deleteTemplate = async (templateId: string) => {
        try {
            await api.delete(`/plan-templates/${templateId}`);
            setPlanTemplates(prev => prev.filter(t => t.id !== templateId));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const getPublicTemplates = () => {
        return planTemplates.filter(t => t.isPublic || t.userId === user?.uid);
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
            rejectReport,
            getTrackingSessionDetails,
            /* Service Reports */
            serviceReports,
            saveServiceReport,
            /* Monthly Planning */
            monthlyPlans,
            saveMonthlyPlan,
            updateMonthlyPlan,
            deleteMonthlyPlan,
            getMonthlyPlan,
            saveWeeklySchedule,
            getPlanSuggestions,
            /* Plan Templates */
            planTemplates,
            saveTemplate,
            deleteTemplate,
            getPublicTemplates
        }}>
            {children}
        </DataContext.Provider>
    );
};
