import { useEffect, useState, useCallback } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type DlpPolicy = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    policy_name: string;
    status: string;
    mode: string;
    locations: string[];
    rule_count: number;
    matches_last_30d: number;
    overrides: number;
};

export type SensitivityLabel = {
    id: number;
    tenant_id: string;
    customer_name: string | null;
    label_name: string;
    parent_label: string | null;
    priority: number;
    is_active: boolean;
    auto_labeling_enabled: boolean;
    encryption_enabled: boolean;
    content_marking: string | null;
    files_labeled: number;
    emails_labeled: number;
    sites_labeled: number;
};

export type DlpSummary = {
    total_policies: number;
    active_policies: number;
    total_matches_30d: number;
    overrides: number;
    false_positives: number;
    total_labels: number;
    auto_labeling_enabled: number;
    encryption_enabled: number;
};

export type DlpData = {
    summary: DlpSummary;
    policies: DlpPolicy[];
    labels: SensitivityLabel[];
};

export function useDlpData() {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<DlpData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(() => {
        setLoading(true);
        setError(null);
        fetch(buildUrl('/api/v1/dlp/overview'))
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                if (!res.success) setError('Failed to load DLP data');
            })
            .catch(() => {
                setData(null);
                setError('Failed to load DLP data');
            })
            .finally(() => setLoading(false));
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
