import { useEffect, useState } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type PillarScore = {
    key: string;
    label: string;
    score: number;
    weight: number;
};

export type TenantPosture = {
    tenant_id: string;
    customer_name: string;
    composite_score: number;
    identity: number;
    device: number;
    app: number;
    security: number;
    governance: number;
    integration: number;
};

export type PostureData = {
    overall_score: number;
    pillars: PillarScore[];
    tenants: TenantPosture[];
};

export type PostureTrendPoint = {
    date: string;
    composite: number;
    identity: number;
    device: number;
    app: number;
    security: number;
    governance: number;
    integration: number;
};

export type PostureTrendChange = {
    composite: number;
    identity: number;
    device: number;
    app: number;
    security: number;
    governance: number;
    integration: number;
};

export type PostureTrendData = {
    trend: PostureTrendPoint[];
    change: PostureTrendChange;
};

export function usePostureData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [posture, setPosture] = useState<PostureData | null>(null);
    const [trend, setTrend] = useState<PostureTrendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [trendLoading, setTrendLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(buildUrl('/api/v1/security/posture'))
            .then((r) => r.json())
            .then((res) => {
                setPosture(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => {
                setPosture(null);
                setLoading(false);
            });
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setTrendLoading(true);
        fetch(buildUrl('/api/v1/security/posture/history'))
            .then((r) => r.json())
            .then((res) => {
                setTrend(res.success ? res.data : null);
                setTrendLoading(false);
            })
            .catch(() => {
                setTrend(null);
                setTrendLoading(false);
            });
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { posture, trend, loading, trendLoading };
}
