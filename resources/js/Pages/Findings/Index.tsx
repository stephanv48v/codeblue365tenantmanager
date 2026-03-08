import { useEffect, useState } from 'react';
import AppLayout from '../../Layouts/AppLayout';

type Finding = { category: string; severity: string; description: string; status?: string };

export default function FindingsIndex() {
  const [findings, setFindings] = useState<Finding[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/v1/findings');
      const payload = await response.json();
      setFindings(payload?.data?.items ?? []);
    }

    void load();
  }, []);

  return (
    <AppLayout title="Findings" userRoles={['security-admin']}>
      <div className="space-y-3">
        {findings.map((finding, index) => (
          <div key={`${finding.category}-${index}`} className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{finding.category}</h3>
              <span className="text-xs uppercase text-slate-500">{finding.severity}</span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{finding.description}</p>
            {finding.status && <p className="mt-1 text-xs text-slate-500">Status: {finding.status}</p>}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
