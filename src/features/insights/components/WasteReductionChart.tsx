import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { MonthlyWaste } from '../hooks/useUsageStats';

interface WasteReductionChartProps {
  data: MonthlyWaste[];
}

export function WasteReductionChart({ data }: WasteReductionChartProps) {
  const hasData = data.length > 0 && data.some((d) => d.kgWasted > 0);

  if (!hasData) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg bg-muted px-4 text-center">
        <p className="text-sm text-muted-foreground">
          No waste logged yet — trash items during an update to track waste
        </p>
      </div>
    );
  }

  // Compute trend summary if at least 2 months have data
  let trendLine: { text: string; positive: boolean } | null = null;
  const lastTwo = data.slice(-2);
  if (lastTwo.length === 2 && lastTwo[0].kgWasted > 0) {
    const prev = lastTwo[0].kgWasted;
    const curr = lastTwo[1].kgWasted;
    const pct = Math.round(Math.abs((curr - prev) / prev) * 100);
    if (curr <= prev) {
      trendLine = { text: `Waste down ${pct}% vs last month`, positive: true };
    } else {
      trendLine = { text: `Waste up ${pct}% vs last month`, positive: false };
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            unit=" kg"
          />
          <Tooltip
            formatter={(value) => {
              const kg = typeof value === 'number' ? value : 0;
              return [`${kg} kg`, 'Wasted'] as [string, string];
            }}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              fontSize: '13px',
            }}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey="kgWasted" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.kgWasted > 0 ? '#22c55e' : '#d1fae5'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {trendLine && (
        <div
          className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
            trendLine.positive
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {trendLine.positive ? '↓ ' : '↑ '}
          {trendLine.text}
        </div>
      )}
    </div>
  );
}
