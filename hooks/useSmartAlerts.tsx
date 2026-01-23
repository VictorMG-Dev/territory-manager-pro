import { useState, useEffect } from 'react';
import { MonthlyPlan } from '../types';

export interface Alert {
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    action?: string;
    onAction?: () => void;
}

export const useSmartAlerts = (
    monthlyPlan: MonthlyPlan | undefined,
    currentHours: number,
    monthlyGoal: number
) => {
    const [alerts, setAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        const newAlerts: Alert[] = [];
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysPassed = today.getDate();
        const daysRemaining = daysInMonth - daysPassed;

        // 1. Check if behind schedule (Pace Check)
        // Expected hours at this point in the month (linear progression)
        const expectedProgress = (daysPassed / daysInMonth) * monthlyGoal;

        // Allow a 10% tolerance below expected
        if (currentHours < expectedProgress * 0.9 && currentHours > 0) {
            const deficit = expectedProgress - currentHours;
            newAlerts.push({
                type: 'warning',
                title: 'Ritmo Abaixo do Esperado',
                message: `Pela data, você deveria ter ~${expectedProgress.toFixed(1)}h. Deficit de ${deficit.toFixed(1)}h.`,
                action: 'Ajustar Plano'
            });
        }

        // 2. Check for milestones
        if (monthlyGoal > 0) {
            const percentage = (currentHours / monthlyGoal) * 100;

            if (percentage >= 25 && percentage < 30) {
                newAlerts.push({
                    type: 'success',
                    title: '🎉 25% da Meta Atingida!',
                    message: 'Primeiro quarto do mês concluído. Continue assim!',
                });
            } else if (percentage >= 50 && percentage < 55) {
                newAlerts.push({
                    type: 'success',
                    title: '🔥 Metade do Caminho!',
                    message: '50% da meta atingida. Você está indo muito bem.',
                });
            } else if (percentage >= 90 && percentage < 100) {
                newAlerts.push({
                    type: 'info',
                    title: '🚀 Reta Final!',
                    message: `Faltam apenas ${(monthlyGoal - currentHours).toFixed(1)}h para bater a meta!`,
                });
            } else if (percentage >= 100) {
                newAlerts.push({
                    type: 'success',
                    title: '🏆 Meta Concluída!',
                    message: `Parabéns! Você atingiu sua meta de ${monthlyGoal}h este mês.`,
                });
            }
        }

        // 3. Suggest adjustment if daily average needed is too high
        if (daysRemaining > 0 && monthlyGoal > currentHours) {
            const remaining = monthlyGoal - currentHours;
            const avgNeeded = remaining / daysRemaining;

            // If user needs > 4h/day valid for Auxiliary Pioneer context or general high load
            if (avgNeeded > 4) {
                newAlerts.push({
                    type: 'info',
                    title: 'Desafio à Vista',
                    message: `Para atingir a meta, você precisa de ${avgNeeded.toFixed(1)}h/dia até o fim do mês.`,
                    action: 'Ver Sugestões'
                });
            }
        }

        setAlerts(newAlerts);
    }, [monthlyPlan, currentHours, monthlyGoal]);

    return alerts;
};
