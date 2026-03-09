import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

type SubScores = {
    identity_currency: number;
    device_currency: number;
    app_currency: number;
    security_posture: number;
    governance_readiness: number;
    integration_readiness: number;
};

type Props = { compositeScore: number; subScores: SubScores };

const subScoreConfig = [
    { key: 'integration_readiness', label: 'Integration', color: '#6366f1' },
    { key: 'governance_readiness', label: 'Governance', color: '#f59e0b' },
    { key: 'security_posture', label: 'Security', color: '#10b981' },
    { key: 'app_currency', label: 'App', color: '#06b6d4' },
    { key: 'device_currency', label: 'Device', color: '#8b5cf6' },
    { key: 'identity_currency', label: 'Identity', color: '#3b82f6' },
] as const;

function scoreColor(score: number): string {
    if (score >= 70) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
}

export default function ScoreGauge({ compositeScore, subScores }: Props) {
    const chartData = subScoreConfig.map((cfg) => ({
        name: cfg.label,
        value: subScores[cfg.key as keyof SubScores],
        fill: cfg.color,
    }));

    // Add composite as outermost ring
    chartData.push({
        name: 'Composite',
        value: compositeScore,
        fill: scoreColor(compositeScore),
    });

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-full" style={{ maxWidth: 280 }}>
                <ResponsiveContainer width="100%" height={180}>
                    <RadialBarChart
                        cx="50%"
                        cy="100%"
                        innerRadius="30%"
                        outerRadius="100%"
                        startAngle={180}
                        endAngle={0}
                        data={chartData}
                        barSize={8}
                    >
                        <RadialBar
                            dataKey="value"
                            cornerRadius={4}
                            background={{ fill: '#f1f5f9' }}
                        />
                    </RadialBarChart>
                </ResponsiveContainer>
                {/* Center score overlay */}
                <div className="absolute inset-x-0 bottom-0 text-center pb-1">
                    <span className="text-3xl font-bold" style={{ color: scoreColor(compositeScore) }}>
                        {compositeScore}
                    </span>
                    <p className="text-xs text-slate-400">Fleet Score</p>
                </div>
            </div>

            {/* Sub-score legend */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs w-full">
                {subScoreConfig.map((cfg) => (
                    <div key={cfg.key} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                        <span className="text-slate-500 truncate">{cfg.label}</span>
                        <span className="ml-auto font-semibold text-slate-700">
                            {subScores[cfg.key as keyof SubScores]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
