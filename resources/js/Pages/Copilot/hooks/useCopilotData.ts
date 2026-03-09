import { useEffect, useState } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type ReadinessCheck = {
    id: string;
    name: string;
    category: 'ai_governance' | 'data_exposure' | 'data_protection' | 'access_governance';
    status: 'pass' | 'fail' | 'warning';
    detail: string;
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
};

export type CopilotData = {
    readiness: ReadinessData | null;
    loading: boolean;
};

export function useCopilotData(): CopilotData {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<CopilotData>({ readiness: null, loading: true });

    useEffect(() => {
        setData((prev) => ({ ...prev, loading: true }));
        fetch(buildUrl('/api/v1/copilot/readiness'))
            .then((r) => r.json())
            .then((res) => {
                setData({
                    readiness: res.success ? res.data : null,
                    loading: false,
                });
            })
            .catch(() => setData({ readiness: null, loading: false }));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return data;
}
