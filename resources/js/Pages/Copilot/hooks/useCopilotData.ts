import { useEffect, useState } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type ReadinessCheck = {
    id: string;
    name: string;
    category: 'ai_governance' | 'data_exposure' | 'data_protection' | 'access_governance';
    status: 'pass' | 'fail' | 'warning';
    detail: string;
};

export type ActionItem = {
    id: string;
    name: string;
    category: 'ai_governance' | 'data_exposure' | 'data_protection' | 'access_governance';
    status: 'pass' | 'fail' | 'warning';
    priority: 'critical' | 'high' | 'medium' | 'low';
    impact_points: number;
    remediation: string;
    detail: string;
};

export type LicenseInsights = {
    licensed_users: number;
    active_users: number;
    inactive_licensed: number;
    estimated_monthly_waste: number;
    adoption_rate: number;
    power_users: number;
    casual_users: number;
    never_used: number;
    adoption_funnel: Array<{ stage: string; count: number }>;
};

export type TrendDataPoint = {
    date: string;
    overall: number;
    data_exposure: number;
    access_governance: number;
    data_protection: number;
    ai_governance: number;
};

export type TrendChange = {
    overall: number;
    data_exposure: number;
    access_governance: number;
    data_protection: number;
    ai_governance: number;
};

export type ReadinessByTenant = {
    id: number;
    tenant_id: string;
    customer_name: string;
    overall_score: number;
    data_exposure_score: number;
    access_governance_score: number;
    data_protection_score: number;
    ai_governance_score: number;
    copilot_licensed_users: number;
    copilot_active_users: number;
};

export type ReadinessData = {
    overall_score: number;
    data_exposure_score: number;
    access_governance_score: number;
    data_protection_score: number;
    ai_governance_score: number;
    copilot_licensed_users: number;
    copilot_active_users: number;
    adoption_rate: number;
    sites_with_everyone_access: number;
    public_sites_count: number;
    sites_with_external_sharing: number;
    sites_with_guest_access: number;
    sensitivity_labels_applied_pct: number;
    readiness_checks: ReadinessCheck[];
    readiness_by_tenant: ReadinessByTenant[];
    action_items: ActionItem[];
    license_insights: LicenseInsights;
};

export type CopilotData = {
    readiness: ReadinessData | null;
    trend: { trend: TrendDataPoint[]; change: TrendChange } | null;
    loading: boolean;
    trendLoading: boolean;
};

export function useCopilotData(): CopilotData {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [readiness, setReadiness] = useState<ReadinessData | null>(null);
    const [loading, setLoading] = useState(true);
    const [trend, setTrend] = useState<{ trend: TrendDataPoint[]; change: TrendChange } | null>(null);
    const [trendLoading, setTrendLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(buildUrl('/api/v1/copilot/readiness'))
            .then((r) => r.json())
            .then((res) => {
                setReadiness(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => {
                setReadiness(null);
                setLoading(false);
            });
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setTrendLoading(true);
        fetch(buildUrl('/api/v1/copilot/readiness/history'))
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

    return { readiness, trend, loading, trendLoading };
}
