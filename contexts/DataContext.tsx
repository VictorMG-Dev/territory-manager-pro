import React, { createContext, useContext, useState, useEffect } from 'react';
import { Territory, TerritoryStatus, WorkRecord, WeeklyPlan, DailyAllocation, TerritoryGroup } from '../types';
import { calculateStatus } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

interface DataContextType {
    territories: Territory[];
    addTerritory: (territory: Omit<Territory, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateTerritory: (id: string, updates: Partial<Territory>) => void;
    deleteTerritory: (id: string) => void;
    getTerritory: (id: string) => Territory | undefined;
    registerWork: (record: Omit<WorkRecord, 'id' | 'createdAt'>) => void;
    getHistory: (territoryId: string) => WorkRecord[];
    allWorkHistory: WorkRecord[];
    weeklyPlans: WeeklyPlan[];
    currentWeeklyPlan: WeeklyPlan | undefined;
    saveWeeklyPlan: (groupId: string, days: DailyAllocation) => void;
    groups: TerritoryGroup[];
    addGroup: (group: Omit<TerritoryGroup, 'id' | 'createdAt'>) => void;
    updateGroup: (id: string, updates: Partial<TerritoryGroup>) => void;
    deleteGroup: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

// Mock initial data
const initialTerritories: Territory[] = [
    {
        id: '1',
        userId: '123',
        code: 'T-01',
        name: 'Centro Comercial',
        address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
        observations: 'Território com muitos prédios comerciais e escritórios.',
        status: TerritoryStatus.GREEN,
        lastWorkedDate: new Date(2024, 4, 15).toISOString(),
        lastWorkedBy: 'Carlos Silva',
        daysSinceWork: 15,
        geolocation: { type: 'Polygon', coordinates: [], area: 1250, center: { lat: -23.561684, lng: -46.655981 } },
        images: [{ url: 'https://picsum.photos/seed/t1_1/800/600', name: 'Foto 1', isPrimary: true, uploadedAt: new Date().toISOString() }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: '2',
        userId: '123',
        code: 'T-02',
        name: 'Bairro Alto',
        address: 'Rua das Flores, 50',
        observations: 'Muitas ladeiras.',
        status: TerritoryStatus.YELLOW,
        lastWorkedDate: new Date(2024, 3, 20).toISOString(),
        lastWorkedBy: 'Ana Paula',
        daysSinceWork: 45,
        geolocation: { type: 'Polygon', coordinates: [], area: 850, center: { lat: -23.551684, lng: -46.645981 } },
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [territories, setTerritories] = useState<Territory[]>(() => {
        const saved = localStorage.getItem('territories');
        return saved ? JSON.parse(saved) : initialTerritories;
    });

    const [workHistory, setWorkHistory] = useState<WorkRecord[]>(() => {
        const saved = localStorage.getItem('workHistory');
        return saved ? JSON.parse(saved) : [];
    });

    const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>(() => {
        const saved = localStorage.getItem('weeklyPlans');
        return saved ? JSON.parse(saved) : [];
    });

    const [groups, setGroups] = useState<TerritoryGroup[]>(() => {
        const saved = localStorage.getItem('territoryGroups');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('territories', JSON.stringify(territories));
    }, [territories]);

    useEffect(() => {
        localStorage.setItem('workHistory', JSON.stringify(workHistory));
    }, [workHistory]);

    useEffect(() => {
        localStorage.setItem('weeklyPlans', JSON.stringify(weeklyPlans));
    }, [weeklyPlans]);

    useEffect(() => {
        localStorage.setItem('territoryGroups', JSON.stringify(groups));
    }, [groups]);

    const addTerritory = (territoryData: Omit<Territory, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newTerritory: Territory = {
            ...territoryData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setTerritories([...territories, newTerritory]);
    };

    const updateTerritory = (id: string, updates: Partial<Territory>) => {
        setTerritories(territories.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ));
    };

    const deleteTerritory = (id: string) => {
        setTerritories(territories.filter(t => t.id !== id));
    };

    const getTerritory = (id: string) => {
        return territories.find(t => t.id === id);
    }

    const registerWork = (recordData: Omit<WorkRecord, 'id' | 'createdAt'>) => {
        const newRecord: WorkRecord = {
            ...recordData,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
        };

        setWorkHistory([newRecord, ...workHistory]);

        // Update territory status
        const territory = territories.find(t => t.id === recordData.territoryId);
        if (territory) {
            const { status, days } = calculateStatus(new Date(recordData.date));
            updateTerritory(territory.id, {
                lastWorkedDate: recordData.date,
                lastWorkedBy: recordData.publisherName,
                status: status,
                daysSinceWork: days
            });
        }
    };

    const getHistory = (territoryId: string) => {
        return workHistory.filter(h => h.territoryId === territoryId);
    }

    const saveWeeklyPlan = (groupId: string, days: DailyAllocation) => {
        const today = new Date();
        const newPlan: WeeklyPlan = {
            id: uuidv4(),
            groupId,
            startDate: today.toISOString(),
            days,
            createdAt: today.toISOString()
        };
        // Remove old plans for this group to keep it clean (optional, but good for weekly focus)
        setWeeklyPlans([newPlan, ...weeklyPlans.filter(p => p.groupId !== groupId)]);
    };

    const addGroup = (groupData: Omit<TerritoryGroup, 'id' | 'createdAt'>) => {
        const newGroup: TerritoryGroup = {
            ...groupData,
            id: uuidv4(),
            createdAt: new Date().toISOString()
        };
        setGroups([...groups, newGroup]);
    };

    const updateGroup = (id: string, updates: Partial<TerritoryGroup>) => {
        setGroups(groups.map(g => g.id === id ? { ...g, ...updates } : g));
    };

    const deleteGroup = (id: string) => {
        setGroups(groups.filter(g => g.id !== id));
        // Also cleanup plans for this group
        setWeeklyPlans(weeklyPlans.filter(p => p.groupId !== id));
    };

    const currentWeeklyPlan = weeklyPlans.length > 0 ? weeklyPlans[0] : undefined;

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
            deleteGroup
        }}>
            {children}
        </DataContext.Provider>
    );
};
