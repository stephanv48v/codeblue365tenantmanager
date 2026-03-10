import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type CompliancePolicy = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    policy_name: string;
    platform: string;
    assigned_count: number;
    compliant_count: number;
    non_compliant_count: number;
    error_count: number;
    compliance_rate: number;
};

export type PlatformBreakdown = {
    platform: string;
    compliant: number;
    non_compliant: number;
    error: number;
};

export type CompliancePoliciesSummary = {
    total_policies: number;
    overall_compliance_rate: number;
    non_compliant_devices: number;
};

export type CompliancePoliciesData = {
    summary: CompliancePoliciesSummary;
    policies: CompliancePolicy[];
    platform_breakdown: PlatformBreakdown[];
};

export function useCompliancePoliciesData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<CompliancePoliciesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        setError(null);
        fetch(buildUrl('/api/v1/devices/compliance-policies'))
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                if (!res.success) setError('Failed to load compliance policies');
            })
            .catch(() => {
                setData(null);
                setError('Failed to load compliance policies');
            })
            .finally(() => setLoading(false));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
