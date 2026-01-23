import React from 'react';
import { Alert as AlertType } from '../hooks/useSmartAlerts';
import { Bell, CheckCircle2, AlertTriangle, Info, XCircle, ArrowRight } from 'lucide-react';

interface SmartAlertsProps {
    alerts: AlertType[];
}

const SmartAlerts: React.FC<SmartAlertsProps> = ({ alerts }) => {
    if (alerts.length === 0) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={24} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={24} />;
            case 'error': return <XCircle className="text-red-500" size={24} />;
            default: return <Info className="text-blue-500" size={24} />;
        }
    };

    const getStyles = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
            case 'warning':
                return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
            case 'error':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
            default:
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
        }
    };

    return (
        <div className="space-y-3 mb-6 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-2 mb-2">
                <Bell size={16} className="text-indigo-500" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Alertas Inteligentes
                </span>
            </div>

            {alerts.map((alert, index) => (
                <div
                    key={index}
                    className={`
                        p-4 rounded-2xl border-l-[6px] shadow-sm
                        flex items-start gap-4
                        ${getStyles(alert.type)}
                        transform transition-all duration-300 hover:scale-[1.01]
                    `}
                >
                    <div className="mt-0.5">
                        {getIcon(alert.type)}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                            {alert.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {alert.message}
                        </p>

                        {alert.action && (
                            <button
                                onClick={alert.onAction}
                                className="mt-3 text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity"
                                style={{
                                    color: alert.type === 'warning' ? '#d97706' :
                                        alert.type === 'error' ? '#dc2626' :
                                            alert.type === 'success' ? '#059669' : '#2563eb'
                                }}
                            >
                                {alert.action} <ArrowRight size={12} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SmartAlerts;
