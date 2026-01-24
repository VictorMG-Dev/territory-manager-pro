{
    announcements.filter(a => {
        if (user?.role === 'admin' || user?.role === 'elder') return true;
        const now = new Date();
        const isExpired = a.expirationDate && new Date(a.expirationDate) < now;
        const isScheduled = a.scheduledFor && new Date(a.scheduledFor) > now;
        return !isExpired && !isScheduled;
    }).length === 0 ? (
    <div className="text-center py-6 text-amber-800/60 dark:text-amber-200/60 text-sm">
        Nenhum anúncio no momento.
    </div>
) : (
    announcements
        .filter(a => {
            if (user?.role === 'admin' || user?.role === 'elder') return true;
            const now = new Date();
            const isExpired = a.expirationDate && new Date(a.expirationDate) < now;
            const isScheduled = a.scheduledFor && new Date(a.scheduledFor) > now;
            return !isExpired && !isScheduled;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map((announcement) => {
            const isExpired = announcement.expirationDate && new Date(announcement.expirationDate) < new Date();
            const isScheduled = announcement.scheduledFor && new Date(announcement.scheduledFor) > new Date();

            return (
                <div key={announcement.id} className={`bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20 shadow-sm flex gap-4 ${isExpired || isScheduled ? 'opacity-75' : ''}`}>
                    <div className={`w-1 rounded-full h-full shrink-0 ${announcement.priority === 'high' ? 'bg-red-500' : announcement.priority === 'low' ? 'bg-blue-500' : 'bg-amber-500'
                        }`}></div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{announcement.title}</h4>
                                {isScheduled && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">Agendado</span>}
                                {isExpired && <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">Expirado</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${announcement.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                    announcement.priority === 'low' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {announcement.priority === 'normal' ? 'Normal' : announcement.priority === 'high' ? 'Importante' : 'Info'}
                                </span>
                                {(user?.role === 'admin' || user?.role === 'elder') && (
                                    <button
                                        onClick={() => handleDeleteAnnouncement(announcement.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Excluir Anúncio"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{announcement.content}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400">
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                                <span>Criado: {new Date(announcement.date).toLocaleDateString()}</span>
                                {announcement.scheduledFor && <span>Agendado: {new Date(announcement.scheduledFor).toLocaleString()}</span>}
                                {announcement.expirationDate && <span>Expira: {new Date(announcement.expirationDate).toLocaleString()}</span>}
                            </div>
                            <span>Por: {announcement.authorName}</span>
                        </div>
                    </div>
                </div>
            );
        })
)
}
