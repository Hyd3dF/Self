export interface Signal {
    id: string;
    user: string;
    pair: string;
    timeframe: string;
    direction: 'BUY' | 'SELL';
    entry_price: number;
    tp_price: number;
    sl_price: number;
    status: 'PENDING' | 'WON' | 'LOST';
    analysis_note: string;
    chart_image: string;
    created: string;
    updated: string;
    started_at?: string;
    ended_at?: string;
    collectionId?: string;
    collectionName?: string;
}

// Helper to get the chart image URL from PocketBase
export const getSignalImageUrl = (signal: Signal, pbUrl: string): string => {
    if (!signal.chart_image) return '';
    return `${pbUrl}/api/files/${signal.collectionId || 'signals'}/${signal.id}/${signal.chart_image}`;
};

// Helper to get relative time in Turkish
export const getTimeAgo = (dateString: string): string => {
    if (!dateString) return '';

    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
        return 'az önce';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} dakika`;
    } else if (diffHours < 24) {
        return `${diffHours} saat`;
    } else if (diffDays === 1) {
        return 'dün';
    } else {
        return `${diffDays} gün`;
    }
};

// Get signal time display text based on status
export const getSignalTimeText = (signal: Signal): string => {
    if (signal.status === 'PENDING') {
        // Show how long it's been live (use started_at or fallback to created)
        const startTime = signal.started_at || signal.created;
        if (startTime) {
            const timeAgo = getTimeAgo(startTime);
            return `${timeAgo}dır yayında`;
        }
        return 'Aktif';
    } else {
        // Show when it closed (WON/LOST)
        if (signal.ended_at) {
            return `${getTimeAgo(signal.ended_at)} önce kapandı`;
        }
        // Fallback to updated date for older records without ended_at
        if (signal.updated && signal.updated !== signal.created) {
            return `${getTimeAgo(signal.updated)} önce kapandı`;
        }
        return signal.status === 'WON' ? 'Kazandı' : 'Kaybetti';
    }
};
