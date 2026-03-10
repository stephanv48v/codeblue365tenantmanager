import { useEffect, useState } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type SecurityDashboardData = {
    findings_by_severity: Array<{ severity: string; count: number }>;
    findings_by_category: Array<{ category: string; count: number }>;
    score_distribution: Array<{
        tenant_id: string;
        customer_name: string;
        security_posture: number;
        composite_score: number;
    }>;
    gdap_coverage: { active: number; expired: number; unknown: number; total: number };
};

export type ScoreTrendPoint = {
    date: string;
    composite: number;
};

export function useSecurityData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [security, setSecurity] = useState<SecurityDashboardData | null>(null);
    const [scoreTrend, setScoreTrend] = useState<ScoreTrendPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [trendLoading, setTrendLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(buildUrl('/api/v1/dashboard/security'))
            .then((r) => r.json())
            .then((res) => {
                setSecurity(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => {
                setSecurity(null);
                setLoading(false);
            });
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setTrendLoading(true);
        fetch(buildUrl('/api/v1/security/posture/history'))
            .then((r) => r.json())
            .then((res) => {
                if (res.success && res.data.trend) {
                    setScoreTrend(res.data.trend.map((t: { date: string; composite: number }) => ({
                        date: t.date,
                        composite: t.composite,
                    })));
                }
                setTrendLoading(false);
            })
            .catch(() => {
                setScoreTrend([]);
                setTrendLoading(false);
            });
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { security, scoreTrend, loading, trendLoading };
}
