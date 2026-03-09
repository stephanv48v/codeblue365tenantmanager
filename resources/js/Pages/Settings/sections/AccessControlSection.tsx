import { useEffect, useState } from 'react';

type Mapping = { entra_group_id: string; role_slug: string };
type Role = { id: number; slug: string; name: string; description: string };
type User = { id: number; name: string; email: string; last_login_at: string | null; role_names: string | null; role_slugs: string | null };

export default function AccessControlSection() {
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'mappings' | 'users'>('mappings');

    useEffect(() => {
        Promise.all([
            fetch('/api/v1/settings/group-role-mappings').then((r) => r.json()),
            fetch('/api/v1/admin/users').then((r) => r.json()),
        ]).then(([mapRes, usersRes]) => {
            if (mapRes.success) {
                setMappings(mapRes.data.mappings ?? []);
                setRoles(mapRes.data.roles ?? []);
            }
            if (usersRes.success) setUsers(usersRes.data.items ?? []);
            setLoading(false);
        });
    }, []);

    const addRow = () => setMappings([...mappings, { entra_group_id: '', role_slug: '' }]);

    const removeRow = (idx: number) => setMappings(mappings.filter((_, i) => i !== idx));

    const updateRow = (idx: number, field: keyof Mapping, value: string) => {
        setMappings(mappings.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
    };

    const saveMappings = async () => {
        setSaving(true);
        setMessage(null);
        const valid = mappings.filter((m) => m.entra_group_id && m.role_slug);
        try {
            const res = await fetch('/api/v1/settings/group-role-mappings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ mappings: valid }),
            }).then((r) => r.json());
            if (res.success) {
                setMessage({ type: 'success', text: 'Group role mappings saved.' });
            } else {
                setMessage({ type: 'error', text: res.error?.message ?? 'Failed to save.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setSaving(false);
        }
    };

    const updateUserRole = async (userId: number, roleSlug: string) => {
        try {
            await fetch(`/api/v1/admin/users/${userId}/roles`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ role_slug: roleSlug }),
            });
            const res = await fetch('/api/v1/admin/users').then((r) => r.json());
            if (res.success) setUsers(res.data.items ?? []);
        } catch { /* ignore */ }
    };

    if (loading) return <p className="text-slate-400">Loading...</p>;

    return (
        <div className="space-y-6">
            {/* Tab switcher */}
            <div className="flex gap-2">
                <button
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'mappings' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    onClick={() => setActiveTab('mappings')}
                >
                    Entra Group Mapping
                </button>
                <button
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users ({users.length})
                </button>
            </div>

            {message && (
                <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Entra Group Mapping */}
            {activeTab === 'mappings' && (
                <div className="rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <div>
                            <h3 className="text-base font-semibold text-slate-800">Entra Group → Role Mapping</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Map Microsoft Entra (Azure AD) group IDs to application roles for automatic role assignment.
                            </p>
                        </div>
                        <button
                            onClick={addRow}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            + Add Mapping
                        </button>
                    </div>
                    <div className="p-6 space-y-3">
                        {mappings.length === 0 && (
                            <p className="text-sm text-slate-400 py-4 text-center">
                                No group mappings configured. Click "Add Mapping" to create one.
                            </p>
                        )}
                        {mappings.map((m, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={m.entra_group_id}
                                    onChange={(e) => updateRow(idx, 'entra_group_id', e.target.value)}
                                    placeholder="Entra Group ID"
                                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                                <select
                                    value={m.role_slug}
                                    onChange={(e) => updateRow(idx, 'role_slug', e.target.value)}
                                    className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Select role...</option>
                                    {roles.map((r) => (
                                        <option key={r.slug} value={r.slug}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => removeRow(idx)}
                                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        {mappings.length > 0 && (
                            <div className="pt-3">
                                <button
                                    onClick={saveMappings}
                                    disabled={saving}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Mappings'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Users */}
            {activeTab === 'users' && (
                <div className="rounded-xl border border-slate-200 bg-white">
                    <div className="border-b px-6 py-4">
                        <h3 className="text-base font-semibold text-slate-800">Users</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Manage user role assignments.</p>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-slate-50 text-left text-xs text-slate-500">
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                                <th className="px-6 py-3">Last Login</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b last:border-0">
                                    <td className="px-6 py-3 font-medium text-slate-800">{user.name}</td>
                                    <td className="px-6 py-3 text-slate-500">{user.email}</td>
                                    <td className="px-6 py-3">
                                        <select
                                            value={user.role_slugs?.split(',')[0] ?? ''}
                                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                                            className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                                        >
                                            <option value="">No role</option>
                                            {roles.map((r) => (
                                                <option key={r.slug} value={r.slug}>
                                                    {r.name}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-slate-400">
                                        {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">No users found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
