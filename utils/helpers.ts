
import { differenceInDays } from 'date-fns';
import { TerritoryStatus } from '../types';

export const calculateStatus = (lastDate: Date | null): { status: TerritoryStatus, days: number } => {
  if (!lastDate) return { status: TerritoryStatus.RED, days: 999 };

  const days = differenceInDays(new Date(), lastDate);

  if (days <= 10) return { status: TerritoryStatus.GREEN, days };
  if (days <= 25) return { status: TerritoryStatus.YELLOW, days };
  return { status: TerritoryStatus.RED, days };
};

export const getStatusColor = (status: TerritoryStatus) => {
  switch (status) {
    case TerritoryStatus.GREEN: return 'bg-emerald-500';
    case TerritoryStatus.YELLOW: return 'bg-amber-500';
    case TerritoryStatus.RED: return 'bg-rose-500';
    default: return 'bg-gray-500';
  }
};

export const getStatusText = (status: TerritoryStatus) => {
  switch (status) {
    case TerritoryStatus.GREEN: return 'Em dia';
    case TerritoryStatus.YELLOW: return 'Atenção';
    case TerritoryStatus.RED: return 'Atrasado';
    default: return 'Desconhecido';
  }
};

export const getSizeText = (size: string) => {
  switch (size) {
    case 'small': return 'Pequeno';
    case 'medium': return 'Médio';
    case 'large': return 'Grande';
    default: return 'Médio';
  }
};
