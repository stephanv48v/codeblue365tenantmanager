import { useEffect, useState } from 'react';
import { useTenantScope } from '../../../hooks/useTenantScope';

export type AuditCheck = {
    id: string;
    name: string;
    status: 'pass' | 'warning' | 'fail';
    detail: string;
    value: string;
    target: string;
    remediation: string;
};

export type AuditCategory = {
    key: string;
    name: string;
    checks_pass: number;
    checks_warn: number;
    checks_fail: number;
    score_pct: number;
    checks: AuditCheck[];
};

export type AuditSummary = {
    overall_pct: number;
    total_checks: number;
    total_pass: number;
    total_warn: number;
    total_fail: number;
};

export type AuditAction = {
    id: string;
    name: string;
    status: 'pass' | 'warning' | 'fail';
    category: string;
    detail: string;
    remediation: string;
};

export type CopilotAuditData = {
    summary: AuditSummary;
    categories: AuditCategory[];
    top_actions: AuditAction[];
};

export function useCopilotAudit(): {
    data: CopilotAuditData | null;
    loading: boolean;
} {
    const { selectedTenantId, buildUrl } = useTenantScope();
    const [data, setData] = useState<CopilotAuditData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(buildUrl('/api/v1/copilot/audit'))
            .then((r) => r.json())
            .then((res) => {
                setData(res.success ? res.data : null);
                setLoading(false);
            })
            .catch(() => {
                setData(null);
                setLoading(false);
            });
    }, [selectedTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, loading };
}
