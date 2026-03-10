import { useEffect, useRef, useState } from 'react';
import { ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline';

type BrandingSettings = {
    company_name: string;
    tagline: string;
    primary_color: string;
    logo_url: string | null;
    report_subtitle: string;
};

const presetColors = [
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Green', value: '#10b981' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Red', value: '#ef4444' },
    { label: 'Purple', value: '#8b5cf6' },
    { label: 'Cyan', value: '#06b6d4' },
];

export default function BrandingSection() {
    const [settings, setSettings] = useState<BrandingSettings>({
        company_name: 'CodeBlue 365',
        tagline: 'Tenant Manager',
        primary_color: '#3b82f6',
        logo_url: null,
        report_subtitle: 'Managed Services Platform',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/v1/settings/group/branding')
            .then((r) => r.json())
            .then((res) => {
                if (res.success) {
                    const items = res.data.items ?? [];
                    const get = (key: string, fallback: string | null = null) => {
                        const item = items.find((s: { key: string }) => s.key === key);
                        return item?.value ?? fallback;
                    };
                    setSettings({
                        company_name: get('branding.company_name', 'CodeBlue 365') as string,
                        tagline: get('branding.tagline', 'Tenant Manager') as string,
                        primary_color: get('branding.primary_color', '#3b82f6') as string,
                        logo_url: get('branding.logo_path') as string | null,
                        report_subtitle: get('branding.report_subtitle', 'Managed Services Platform') as string,
                    });
                }
                setLoading(false);
            });
    }, []);

    const save = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/v1/settings/group/branding', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    settings: [
                        { key: 'branding.company_name', value: settings.company_name },
                        { key: 'branding.tagline', value: settings.tagline },
                        { key: 'branding.primary_color', value: settings.primary_color },
                        { key: 'branding.report_subtitle', value: settings.report_subtitle },
                    ],
                }),
            }).then((r) => r.json());
            if (res.success) {
                setMessage({ type: 'success', text: 'Branding settings saved. Refresh the page to see changes in the sidebar.' });
            } else {
                setMessage({ type: 'error', text: res.error?.message ?? 'Failed to save.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogoUpload = async (file: File) => {
        setUploading(true);
        setMessage(null);
        try {
            const formData = new FormData();
            formData.append('logo', file);
            const res = await fetch('/api/v1/settings/branding/logo', {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData,
            }).then((r) => r.json());
            if (res.success) {
                setSettings((prev) => ({ ...prev, logo_url: res.data.path }));
                setMessage({ type: 'success', text: 'Logo uploaded successfully.' });
            } else {
                setMessage({ type: 'error', text: res.error?.message ?? 'Failed to upload logo.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to upload logo.' });
        } finally {
            setUploading(false);
        }
    };

    const handleLogoDelete = async () => {
        setMessage(null);
        try {
            const res = await fetch('/api/v1/settings/branding/logo', {
                method: 'DELETE',
                headers: { Accept: 'application/json' },
            }).then((r) => r.json());
            if (res.success) {
                setSettings((prev) => ({ ...prev, logo_url: null }));
                setMessage({ type: 'success', text: 'Logo removed.' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to remove logo.' });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleLogoUpload(file);
        }
    };

    const initials = settings.company_name
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2);

    if (loading) return <p className="text-slate-400">Loading...</p>;

    return (
        <div className="space-y-6">
            {message && (
                <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Logo Upload */}
            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b px-6 py-4">
                    <h3 className="text-base font-semibold text-slate-800">Company Logo</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Upload your company logo for PDF reports and the sidebar. PNG or JPG, max 2MB.</p>
                </div>
                <div className="p-6">
                    <div className="flex items-start gap-6">
                        {/* Current Logo / Placeholder */}
                        <div className="flex-shrink-0">
                            {settings.logo_url ? (
                                <div className="relative group">
                                    <img
                                        src={settings.logo_url}
                                        alt="Company logo"
                                        className="h-20 w-20 rounded-xl border border-slate-200 object-contain bg-white p-1"
                                    />
                                    <button
                                        onClick={handleLogoDelete}
                                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove logo"
                                    >
                                        <TrashIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className="flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-lg font-bold text-slate-400"
                                    style={{ backgroundColor: settings.primary_color + '15' }}
                                >
                                    {initials || '?'}
                                </div>
                            )}
                        </div>

                        {/* Drop Zone */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-6 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ArrowUpTrayIcon className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-sm font-medium text-slate-600">
                                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 2MB</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleLogoUpload(file);
                                    e.target.value = '';
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Company Details */}
            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b px-6 py-4">
                    <h3 className="text-base font-semibold text-slate-800">Company Details</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Customize the company name and tagline shown in the sidebar and PDF reports.</p>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                        <input
                            type="text"
                            value={settings.company_name}
                            onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                            placeholder="e.g. CodeBlue 365"
                            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tagline</label>
                        <p className="text-xs text-slate-400 mb-2">Displayed under the company name in the sidebar.</p>
                        <input
                            type="text"
                            value={settings.tagline}
                            onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                            placeholder="e.g. Tenant Manager"
                            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Report Subtitle</label>
                        <p className="text-xs text-slate-400 mb-2">Default subtitle used in exported PDF reports.</p>
                        <input
                            type="text"
                            value={settings.report_subtitle}
                            onChange={(e) => setSettings({ ...settings, report_subtitle: e.target.value })}
                            placeholder="e.g. Managed Services Platform"
                            className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Brand Color */}
            <div className="rounded-xl border border-slate-200 bg-white">
                <div className="border-b px-6 py-4">
                    <h3 className="text-base font-semibold text-slate-800">Brand Color</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Choose a primary accent color used in PDF headers, sidebar branding, and table headers.</p>
                </div>
                <div className="p-6 space-y-5">
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            value={settings.primary_color}
                            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                            className="h-10 w-14 cursor-pointer rounded border border-slate-300 p-0.5"
                        />
                        <input
                            type="text"
                            value={settings.primary_color}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                                    setSettings({ ...settings, primary_color: v });
                                }
                            }}
                            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="#3b82f6"
                        />
                    </div>

                    {/* Preset swatches */}
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">Presets</p>
                        <div className="flex gap-2">
                            {presetColors.map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => setSettings({ ...settings, primary_color: preset.value })}
                                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                                        settings.primary_color === preset.value ? 'border-slate-800 scale-110' : 'border-slate-200'
                                    }`}
                                    style={{ backgroundColor: preset.value }}
                                    title={preset.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-3">Preview</p>
                        <div className="flex gap-6">
                            {/* Sidebar Preview */}
                            <div className="rounded-lg bg-slate-900 p-4 w-56">
                                <div className="flex items-center gap-3">
                                    {settings.logo_url ? (
                                        <img src={settings.logo_url} alt="" className="h-8 w-8 rounded-lg object-contain" />
                                    ) : (
                                        <div
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                                            style={{ backgroundColor: settings.primary_color }}
                                        >
                                            {initials}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-bold text-white">{settings.company_name || 'Company'}</p>
                                        <p className="text-[10px] text-slate-500">{settings.tagline || 'Tagline'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* PDF Header Preview */}
                            <div className="rounded-lg border border-slate-200 bg-white p-4 flex-1 max-w-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {settings.logo_url && (
                                            <img src={settings.logo_url} alt="" className="h-5 w-5 object-contain" />
                                        )}
                                        <span className="text-sm font-bold" style={{ color: settings.primary_color }}>
                                            {settings.company_name || 'Company'}
                                        </span>
                                    </div>
                                    <span className="text-[9px] text-slate-400">Generated: Mar 10, 2026</span>
                                </div>
                                <p className="text-xs font-bold text-slate-800">Security Dashboard Report</p>
                                <p className="text-[9px] text-slate-500">{settings.report_subtitle}</p>
                                <div className="mt-1.5 h-0.5 rounded" style={{ backgroundColor: settings.primary_color }} />
                                <div className="mt-3">
                                    <div className="rounded text-[8px] overflow-hidden">
                                        <div className="px-2 py-1 text-white font-medium" style={{ backgroundColor: settings.primary_color }}>
                                            Table Header Example
                                        </div>
                                        <div className="px-2 py-1 bg-slate-50 text-slate-600 border-x border-b border-slate-200">
                                            Sample row data
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={save}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Branding'}
                </button>
            </div>
        </div>
    );
}
