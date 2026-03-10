import { useEffect, useMemo, useRef, useState } from 'react';

type Role = { id: number; slug: string; name: string; description: string; user_count?: number; permissions?: string[] };
type UserItem = { id: number; name: string; email: string; last_login_at: string | null; role_names: string | null; role_slugs: string | null; status: 'active' | 'inactive' | 'never' };
type Mapping = { entra_group_id: string; role_slug: string };
type Pagination = { total: number; per_page: number; current_page: number; last_page: number };
type RolePermissionData = { roles: Array<Role & { permissions: string[] }>; permissions: string[] };

function timeAgo(date: string | null): string {
    if (!date) return 'Never';
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
}

const ROLE_COLOR_MAP: Record<string, { bg: string; text: string }> = {
    'platform-super-admin': { bg: 'bg-red-100', text: 'text-red-700' },
    'security-admin': { bg: 'bg-purple-100', text: 'text-purple-700' },
    'integration-admin': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    engineer: { bg: 'bg-blue-100', text: 'text-blue-700' },
    'senior-engineer': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'read-only-analyst': { bg: 'bg-slate-100', text: 'text-slate-600' },
    'msp-operations-manager': { bg: 'bg-amber-100', text: 'text-amber-700' },
    'service-desk': { bg: 'bg-slate-100', text: 'text-slate-600' },
    'account-manager': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    auditor: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

function roleBadgeClasses(slug: string): string {
    const c = ROLE_COLOR_MAP[slug] ?? { bg: 'bg-slate-100', text: 'text-slate-600' };
    return `${c.bg} ${c.text}`;
}

const STATUS_STYLES: Record<string, string> = { active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-amber-100 text-amber-700', never: 'bg-slate-100 text-slate-500' };
const STATUS_LABELS: Record<string, string> = { active: 'Active', inactive: 'Inactive', never: 'Never' };

function initialsFor(name: string): string {
    return name.split(' ').map((w) => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['bg-blue-500','bg-emerald-500','bg-purple-500','bg-amber-500','bg-cyan-500','bg-rose-500','bg-indigo-500','bg-teal-500'];
function avatarColor(id: number): string { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

function PencilIcon({ className }: { className?: string }) {
    return (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>);
}
function TrashIcon({ className }: { className?: string }) {
    return (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
}
function CheckIcon({ className }: { className?: string }) {
    return (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>);
}
function XMarkIcon({ className }: { className?: string }) {
    return (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
}
function PlusIcon({ className }: { className?: string }) {
    return (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
}
function SearchIcon({ className }: { className?: string }) {
    return (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>);
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="fixed inset-0 bg-black/50" onClick={onClose} /><div className="relative z-10 w-full max-w-lg mx-4 rounded-xl bg-white shadow-xl">{children}</div></div>);
}

type Tab = 'users' | 'roles' | 'entra';

export default function UserManagementSection() {
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t); }, [message]);

    return (
        <div className="space-y-6">
            <div className="flex gap-2">
                {([{ key: 'users' as Tab, label: 'Users' }, { key: 'roles' as Tab, label: 'Roles & Permissions' }, { key: 'entra' as Tab, label: 'Entra Group Mapping' }]).map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{tab.label}</button>
                ))}
            </div>
            {message && (
                <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-3 flex-shrink-0"><XMarkIcon className="h-4 w-4" /></button>
                </div>
            )}
            {activeTab === 'users' && <UsersTab onMessage={setMessage} />}
            {activeTab === 'roles' && <RolesPermissionsTab />}
            {activeTab === 'entra' && <EntraGroupMappingTab onMessage={setMessage} />}
        </div>
    );
}

function UsersTab({ onMessage }: { onMessage: (msg: { type: 'success' | 'error'; text: string }) => void }) {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ total: 0, per_page: 25, current_page: 1, last_page: 1 });
    const [roles, setRoles] = useState<Role[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [editUser, setEditUser] = useState<UserItem | null>(null);
    const [deleteUser, setDeleteUser] = useState<UserItem | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetch('/api/v1/admin/roles', { headers: { Accept: 'application/json' } })
            .then((r) => r.json()).then((res) => { if (res.success) setRoles(res.data.items ?? []); }).catch(() => {});
    }, []);

    const fetchUsers = (page: number, q: string) => {
        setLoading(true);
        const params = new URLSearchParams({ search: q, per_page: '25', page: String(page) });
        fetch(`/api/v1/admin/users?${params}`, { headers: { Accept: 'application/json' } })
            .then((r) => r.json()).then((res) => {
                if (res.success) { setUsers(res.data.items ?? []); setPagination(res.data.pagination ?? { total: 0, per_page: 25, current_page: 1, last_page: 1 }); }
            }).catch(() => onMessage({ type: 'error', text: 'Failed to load users.' })).finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(1, ''); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchUsers(1, value), 350);
    };

    const goToPage = (page: number) => { if (page < 1 || page > pagination.last_page) return; fetchUsers(page, search); };
    const parseRoleSlugs = (slugs: string | null): string[] => slugs ? slugs.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const parseRoleNames = (names: string | null): string[] => names ? names.split(',').map((s) => s.trim()).filter(Boolean) : [];

    const handleAddUser = async (name: string, email: string, selectedSlugs: string[]) => {
        try {
            const res = await fetch('/api/v1/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ name, email, role_slugs: selectedSlugs }) }).then((r) => r.json());
            if (res.success) { onMessage({ type: 'success', text: `User "${name}" created successfully.` }); setShowAddModal(false); fetchUsers(pagination.current_page, search); }
            else { onMessage({ type: 'error', text: res.error?.message ?? 'Failed to create user.' }); }
        } catch { onMessage({ type: 'error', text: 'Network error while creating user.' }); }
    };

    const handleEditRoles = async (userId: number, selectedSlugs: string[]) => {
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}/roles`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ role_slugs: selectedSlugs }) }).then((r) => r.json());
            if (res.success) { onMessage({ type: 'success', text: 'User roles updated.' }); setEditUser(null); fetchUsers(pagination.current_page, search); }
            else { onMessage({ type: 'error', text: res.error?.message ?? 'Failed to update roles.' }); }
        } catch { onMessage({ type: 'error', text: 'Network error while updating roles.' }); }
    };

    const handleDeleteUser = async (userId: number) => {
        try {
            const res = await fetch(`/api/v1/admin/users/${userId}`, { method: 'DELETE', headers: { Accept: 'application/json' } }).then((r) => r.json());
            if (res.success) { onMessage({ type: 'success', text: 'User removed.' }); setDeleteUser(null); fetchUsers(pagination.current_page, search); }
            else { onMessage({ type: 'error', text: res.error?.message ?? 'Failed to delete user.' }); }
        } catch { onMessage({ type: 'error', text: 'Network error while deleting user.' }); }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search users..." className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"><PlusIcon className="h-4 w-4" />Add User</button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead><tr className="border-b bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500"><th className="px-6 py-3">User</th><th className="px-6 py-3">Roles</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Last Login</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
                        <tbody>
                            {loading ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading users...</td></tr>
                            ) : users.length === 0 ? (<tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No users found.</td></tr>
                            ) : users.map((user) => {
                                const slugs = parseRoleSlugs(user.role_slugs);
                                const names = parseRoleNames(user.role_names);
                                return (
                                    <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3"><div className="flex items-center gap-3"><div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(user.id)}`}>{initialsFor(user.name)}</div><div className="min-w-0"><p className="truncate font-medium text-slate-800">{user.name}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div></div></td>
                                        <td className="px-6 py-3"><div className="flex flex-wrap gap-1">{slugs.length > 0 ? slugs.map((slug, i) => (<span key={slug} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClasses(slug)}`}>{names[i] ?? slug}</span>)) : <span className="text-xs text-slate-400 italic">No roles</span>}</div></td>
                                        <td className="px-6 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[user.status] ?? STATUS_STYLES.never}`}>{STATUS_LABELS[user.status] ?? 'Unknown'}</span></td>
                                        <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">{timeAgo(user.last_login_at)}</td>
                                        <td className="px-6 py-3"><div className="flex items-center justify-end gap-1"><button onClick={() => setEditUser(user)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Edit roles"><PencilIcon className="h-4 w-4" /></button><button onClick={() => setDeleteUser(user)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete user"><TrashIcon className="h-4 w-4" /></button></div></td>
                                    </tr>);
                            })}
                        </tbody>
                    </table>
                </div>
                {pagination.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-6 py-3">
                        <p className="text-xs text-slate-500">Showing {(pagination.current_page - 1) * pagination.per_page + 1}&ndash;{Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} users</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => goToPage(pagination.current_page - 1)} disabled={pagination.current_page <= 1} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                            <span className="text-xs text-slate-500">Page {pagination.current_page} of {pagination.last_page}</span>
                            <button onClick={() => goToPage(pagination.current_page + 1)} disabled={pagination.current_page >= pagination.last_page} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                        </div>
                    </div>
                )}
            </div>
            <AddUserModal open={showAddModal} roles={roles} onClose={() => setShowAddModal(false)} onSubmit={handleAddUser} />
            <EditUserModal user={editUser} roles={roles} onClose={() => setEditUser(null)} onSubmit={handleEditRoles} />
            <DeleteUserModal user={deleteUser} onClose={() => setDeleteUser(null)} onConfirm={handleDeleteUser} />
        </>
    );
}

function AddUserModal({ open, roles, onClose, onSubmit }: { open: boolean; roles: Role[]; onClose: () => void; onSubmit: (name: string, email: string, roleSlugs: string[]) => Promise<void> }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => { if (open) { setName(''); setEmail(''); setSelectedSlugs(new Set()); } }, [open]);
    const toggleSlug = (slug: string) => { setSelectedSlugs((prev) => { const next = new Set(prev); if (next.has(slug)) next.delete(slug); else next.add(slug); return next; }); };
    const handleSubmit = async () => { if (!name.trim() || !email.trim()) return; setSubmitting(true); await onSubmit(name.trim(), email.trim(), Array.from(selectedSlugs)); setSubmitting(false); };

    return (
        <Modal open={open} onClose={onClose}>
            <div className="px-6 py-5 border-b border-slate-200"><h3 className="text-lg font-semibold text-slate-800">Add New User</h3><p className="text-xs text-slate-500 mt-0.5">Create a new user and assign roles.</p></div>
            <div className="px-6 py-5 space-y-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-2">Roles</label>
                    <div className="max-h-52 overflow-y-auto space-y-2 rounded-lg border border-slate-200 p-3">
                        {roles.map((role) => (<label key={role.slug} className="flex items-start gap-3 cursor-pointer group"><input type="checkbox" checked={selectedSlugs.has(role.slug)} onChange={() => toggleSlug(role.slug)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><div className="min-w-0"><p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{role.name}</p>{role.description && <p className="text-xs text-slate-400">{role.description}</p>}</div></label>))}
                        {roles.length === 0 && <p className="text-xs text-slate-400 py-2 text-center">No roles available.</p>}
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleSubmit} disabled={submitting || !name.trim() || !email.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">{submitting ? 'Creating...' : 'Create User'}</button>
            </div>
        </Modal>
    );
}

function EditUserModal({ user, roles, onClose, onSubmit }: { user: UserItem | null; roles: Role[]; onClose: () => void; onSubmit: (userId: number, roleSlugs: string[]) => Promise<void> }) {
    const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => { if (user) { const slugs = user.role_slugs ? user.role_slugs.split(',').map((s) => s.trim()).filter(Boolean) : []; setSelectedSlugs(new Set(slugs)); } }, [user]);
    const toggleSlug = (slug: string) => { setSelectedSlugs((prev) => { const next = new Set(prev); if (next.has(slug)) next.delete(slug); else next.add(slug); return next; }); };
    const handleSubmit = async () => { if (!user) return; setSubmitting(true); await onSubmit(user.id, Array.from(selectedSlugs)); setSubmitting(false); };

    return (
        <Modal open={!!user} onClose={onClose}>
            {user && (<>
                <div className="px-6 py-5 border-b border-slate-200"><h3 className="text-lg font-semibold text-slate-800">Edit User Roles</h3><p className="text-xs text-slate-500 mt-0.5">Update role assignments for this user.</p></div>
                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(user.id)}`}>{initialsFor(user.name)}</div>
                        <div className="min-w-0"><p className="text-sm font-medium text-slate-800">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-2">Roles</label>
                        <div className="max-h-52 overflow-y-auto space-y-2 rounded-lg border border-slate-200 p-3">
                            {roles.map((role) => (<label key={role.slug} className="flex items-start gap-3 cursor-pointer group"><input type="checkbox" checked={selectedSlugs.has(role.slug)} onChange={() => toggleSlug(role.slug)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><div className="min-w-0"><p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{role.name}</p>{role.description && <p className="text-xs text-slate-400">{role.description}</p>}</div></label>))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">{submitting ? 'Saving...' : 'Save Changes'}</button>
                </div>
            </>)}
        </Modal>
    );
}

function DeleteUserModal({ user, onClose, onConfirm }: { user: UserItem | null; onClose: () => void; onConfirm: (userId: number) => Promise<void> }) {
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async () => { if (!user) return; setDeleting(true); await onConfirm(user.id); setDeleting(false); };
    return (
        <Modal open={!!user} onClose={onClose}>
            {user && (<>
                <div className="px-6 py-5 border-b border-slate-200"><h3 className="text-lg font-semibold text-slate-800">Remove User</h3></div>
                <div className="px-6 py-5"><p className="text-sm text-slate-600">Are you sure you want to remove <span className="font-semibold text-slate-800">{user.name}</span>? This action cannot be undone.</p></div>
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                    <button onClick={handleDelete} disabled={deleting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">{deleting ? 'Removing...' : 'Delete User'}</button>
                </div>
            </>)}
        </Modal>
    );
}

function RolesPermissionsTab() {
    const [data, setData] = useState<RolePermissionData | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        fetch('/api/v1/admin/role-permissions', { headers: { Accept: 'application/json' } })
            .then((r) => r.json()).then((res) => { if (res.success) setData(res.data); }).catch(() => {}).finally(() => setLoading(false));
    }, []);
    const PERM_COLORS = useMemo(() => ['bg-blue-100 text-blue-700','bg-emerald-100 text-emerald-700','bg-purple-100 text-purple-700','bg-amber-100 text-amber-700','bg-cyan-100 text-cyan-700','bg-rose-100 text-rose-700','bg-indigo-100 text-indigo-700','bg-teal-100 text-teal-700'], []);
    const permColorMap = useMemo(() => { if (!data) return new Map<string, string>(); const map = new Map<string, string>(); data.permissions.forEach((p, i) => { map.set(p, PERM_COLORS[i % PERM_COLORS.length]); }); return map; }, [data, PERM_COLORS]);

    if (loading) return <p className="text-slate-400 py-8 text-center">Loading roles and permissions...</p>;
    if (!data) return <p className="text-slate-400 py-8 text-center">Failed to load roles and permissions.</p>;

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-base font-semibold text-slate-800 mb-4">Roles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.roles.map((role) => (
                        <div key={role.id} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div><h4 className="text-sm font-semibold text-slate-800">{role.name}</h4><p className="text-xs text-slate-500 mt-0.5">{role.description}</p></div>
                                {role.user_count !== undefined && <span className="flex-shrink-0 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{role.user_count} {role.user_count === 1 ? 'user' : 'users'}</span>}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {role.permissions.map((perm) => (<span key={perm} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${permColorMap.get(perm) ?? 'bg-slate-100 text-slate-600'}`}>{perm}</span>))}
                                {role.permissions.length === 0 && <span className="text-xs text-slate-400 italic">No permissions</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-base font-semibold text-slate-800 mb-4">Permission Matrix</h3>
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50 border-b">
                                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 min-w-[200px] border-r border-slate-200">Permission</th>
                                {data.roles.map((role) => (<th key={role.id} className="px-3 py-3 text-center text-xs font-medium text-slate-500 min-w-[100px] whitespace-nowrap"><span className="block truncate max-w-[90px] mx-auto" title={role.name}>{role.name}</span></th>))}
                            </tr></thead>
                            <tbody>
                                {data.permissions.map((perm, idx) => (
                                    <tr key={perm} className={`border-b last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                        <td className="sticky left-0 z-10 bg-inherit px-4 py-2.5 text-xs font-medium text-slate-700 border-r border-slate-200">{perm}</td>
                                        {data.roles.map((role) => {
                                            const has = role.permissions.includes(perm);
                                            return (<td key={role.id} className="px-3 py-2.5 text-center">{has ? (<span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100"><CheckIcon className="h-3.5 w-3.5 text-emerald-600" /></span>) : <span className="inline-block h-5 w-5" />}</td>);
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function EntraGroupMappingTab({ onMessage }: { onMessage: (msg: { type: 'success' | 'error'; text: string }) => void }) {
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/v1/settings/group-role-mappings', { headers: { Accept: 'application/json' } })
            .then((r) => r.json()).then((res) => { if (res.success) { setMappings(res.data.mappings ?? []); setRoles(res.data.roles ?? []); } })
            .catch(() => onMessage({ type: 'error', text: 'Failed to load group mappings.' })).finally(() => setLoading(false));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const addRow = () => setMappings([...mappings, { entra_group_id: '', role_slug: '' }]);
    const removeRow = (idx: number) => setMappings(mappings.filter((_, i) => i !== idx));
    const updateRow = (idx: number, field: keyof Mapping, value: string) => { setMappings(mappings.map((m, i) => (i === idx ? { ...m, [field]: value } : m))); };

    const saveMappings = async () => {
        setSaving(true);
        const valid = mappings.filter((m) => m.entra_group_id.trim() && m.role_slug);
        try {
            const res = await fetch('/api/v1/settings/group-role-mappings', { method: 'PUT', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ mappings: valid }) }).then((r) => r.json());
            if (res.success) { onMessage({ type: 'success', text: 'Group role mappings saved successfully.' }); setMappings(valid); }
            else { onMessage({ type: 'error', text: res.error?.message ?? 'Failed to save mappings.' }); }
        } catch { onMessage({ type: 'error', text: 'Network error while saving mappings.' }); }
        finally { setSaving(false); }
    };

    if (loading) return <p className="text-slate-400 py-8 text-center">Loading group mappings...</p>;

    return (
        <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                    <h3 className="text-base font-semibold text-slate-800">Entra Group &rarr; Role Mapping</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Map Microsoft Entra (Azure AD) group Object IDs to application roles for automatic role assignment.</p>
                </div>
                <button onClick={addRow} className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"><PlusIcon className="h-3.5 w-3.5" />Add Mapping</button>
            </div>
            <div className="p-6 space-y-3">
                {mappings.length === 0 && <p className="text-sm text-slate-400 py-8 text-center">No group mappings configured. Click &ldquo;Add Mapping&rdquo; to create one.</p>}
                {mappings.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <input type="text" value={m.entra_group_id} onChange={(e) => updateRow(idx, 'entra_group_id', e.target.value)} placeholder="Entra Group Object ID (GUID)" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                        <select value={m.role_slug} onChange={(e) => updateRow(idx, 'role_slug', e.target.value)} className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                            <option value="">Select role...</option>
                            {roles.map((r) => <option key={r.slug} value={r.slug}>{r.name}</option>)}
                        </select>
                        <button onClick={() => removeRow(idx)} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Remove</button>
                    </div>
                ))}
                {mappings.length > 0 && (<div className="pt-4"><button onClick={saveMappings} disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Saving...' : 'Save Mappings'}</button></div>)}
            </div>
            <div className="border-t border-slate-200 px-6 py-4">
                <div className="rounded-lg bg-blue-50 px-4 py-3">
                    <h4 className="text-xs font-semibold text-blue-800 mb-1">How Entra Group Sync Works</h4>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                        <li>When a user logs in via Microsoft Entra SSO, their group memberships are checked.</li>
                        <li>If any of their Entra groups match a mapping above, the corresponding application role is automatically assigned.</li>
                        <li>Roles are synced on every login, so changes in Entra group membership are reflected immediately.</li>
                        <li>Users can still have manually-assigned roles in addition to mapped roles.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
