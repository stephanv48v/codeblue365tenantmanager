import { useEffect, useState, useCallback } from 'react';

export type NotificationChannel = {
    id: number;
    name: string;
    type: string;
    enabled: boolean;
    last_sent_at: string | null;
};

export type NotificationRule = {
    id: number;
    event_type: string;
    severity_threshold: string;
    channel_name: string;
    enabled: boolean;
};

export type NotificationsData = {
    channels: NotificationChannel[];
    rules: NotificationRule[];
};

export function useNotificationsData() {
    const [data, setData] = useState<NotificationsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        setError(null);

        Promise.all([
            fetch('/api/v1/notifications/channels').then((r) => r.json()),
            fetch('/api/v1/notifications/rules').then((r) => r.json()),
        ])
            .then(([channelsRes, rulesRes]) => {
                if (channelsRes.success && rulesRes.success) {
                    setData({
                        channels: channelsRes.data.channels ?? channelsRes.data ?? [],
                        rules: rulesRes.data.rules ?? rulesRes.data ?? [],
                    });
                } else {
                    setData(null);
                    setError('Failed to load notification settings');
                }
            })
            .catch(() => {
                setData(null);
                setError('Failed to load notification settings');
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetchData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading, error, fetchData };
}
