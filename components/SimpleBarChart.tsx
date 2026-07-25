import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CategoryStat } from '../types';

interface SimpleBarChartProps {
    data: { [key: string]: CategoryStat };
    theme: 'light' | 'dim' | 'dark';
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, theme }) => {
    const chartData = Object.entries(data).map(([name, stats]) => {
        const s = stats as CategoryStat;
        return {
            name: name.split(' ')[0], // Shorten name for chart
            Correct: s.correct,
            Incorrect: s.total - s.correct,
        };
    });
    
    if (chartData.length === 0) {
        return (
             <div className="flex items-center justify-center h-[300px] text-center text-slate-500 dark:text-slate-400 p-4">
                <p>Not enough data to display this chart.</p>
            </div>
        )
    }

    const colors = theme === 'light' ? {
        grid: 'rgba(0, 0, 0, 0.1)',
        axis: '#475569',
        tooltipBg: 'hsl(0, 0%, 100%)',
        tooltipBorder: 'hsl(214, 32%, 91%)',
        tooltipColor: '#0f172a',
        cursorFill: 'rgba(0, 0, 0, 0.1)'
    } : theme === 'dim' ? {
        grid: 'rgba(255, 255, 255, 0.08)',
        axis: '#94a3b8',
        tooltipBg: 'hsl(215, 25%, 32%)',
        tooltipBorder: 'hsl(215, 25%, 40%)',
        tooltipColor: '#f8fafc',
        cursorFill: 'rgba(255, 255, 255, 0.05)'
    } : {
        grid: 'rgba(255, 255, 255, 0.1)',
        axis: '#94a3b8',
        tooltipBg: 'hsl(215, 28%, 18%)',
        tooltipBorder: 'hsl(215, 28%, 28%)',
        tooltipColor: '#f8fafc',
        cursorFill: 'rgba(255, 255, 255, 0.1)'
    };

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 5, }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                    <XAxis dataKey="name" stroke={colors.axis} />
                    <YAxis stroke={colors.axis} allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, color: colors.tooltipColor }}
                        cursor={{ fill: colors.cursorFill }}
                    />
                    <Legend wrapperStyle={{ color: colors.axis }} />
                    <Bar dataKey="Correct" stackId="a" fill="#22c55e" />
                    <Bar dataKey="Incorrect" stackId="a" fill="#ef4444" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};