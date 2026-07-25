import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { CategoryStat, AccuracyHistoryPoint } from '../types';
import { SimpleBarChart } from './SimpleBarChart';

interface ProgressChartProps {
  categoryData: { [key: string]: CategoryStat };
  historyData: AccuracyHistoryPoint[];
  theme: 'light' | 'dim' | 'dark';
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ categoryData, historyData, theme }) => {
    const [activeChart, setActiveChart] = useState<'category' | 'history'>('category');

    const renderLineChart = () => {
        if (!historyData || historyData.length < 2) {
            return (
                <div className="flex flex-col items-center justify-center h-[300px] text-center text-slate-500 dark:text-slate-400 p-8 space-y-4 font-display">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl">📉</div>
                    <p className="max-w-xs font-medium">Complete at least two quiz sessions to reveal your accuracy evolution.</p>
                </div>
            );
        }

        const colors = theme === 'light' ? {
            grid: 'rgba(0, 0, 0, 0.1)',
            axis: '#475569',
            tooltipBg: 'hsl(0, 0%, 100%)',
            tooltipBorder: 'hsl(214, 32%, 91%)',
            tooltipColor: '#0f172a',
            primary: 'hsl(262, 80%, 48%)',
            primaryLight: 'hsl(262, 80%, 48%)',
        } : theme === 'dim' ? {
            grid: 'rgba(255, 255, 255, 0.08)',
            axis: '#94a3b8',
            tooltipBg: 'hsl(215, 25%, 32%)',
            tooltipBorder: 'hsl(215, 25%, 40%)',
            tooltipColor: '#f8fafc',
            primary: 'hsl(262, 80%, 65%)',
            primaryLight: 'hsl(262, 80%, 70%)',
        } : {
            grid: 'rgba(255, 255, 255, 0.1)',
            axis: '#94a3b8',
            tooltipBg: 'hsl(215, 28%, 18%)',
            tooltipBorder: 'hsl(215, 28%, 28%)',
            tooltipColor: '#f8fafc',
            primary: 'hsl(262, 80%, 58%)',
            primaryLight: 'hsl(262, 80%, 65%)',
        };

        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={historyData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5, }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <XAxis dataKey="session" name="Session" stroke={colors.axis} />
                        <YAxis stroke={colors.axis} domain={[0, 100]} tickFormatter={(tick) => `${tick}%`}/>
                        <Tooltip
                            contentStyle={{ backgroundColor: colors.tooltipBg, borderColor: colors.tooltipBorder, color: colors.tooltipColor }}
                            cursor={{ stroke: colors.primary, strokeWidth: 1 }}
                            formatter={(value: number) => [`${value.toFixed(1)}%`, "Accuracy"]}
                        />
                        <Legend wrapperStyle={{ color: colors.axis }} />
                        <Line type="monotone" dataKey="accuracy" name="Accuracy Trend" stroke={colors.primaryLight} strokeWidth={2} dot={{ r: 4, fill: colors.primary }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const tabButtonStyle = "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95";
    const activeTabStyle = "bg-primary text-primary-foreground shadow-lg shadow-primary/20";
    const inactiveTabStyle = "text-slate-500 hover:text-primary";

    return (
        <div className="animate-fade-in font-display relative">
            {/* Monster eyes peeking from behind the chart */}
            <div className="absolute top-1/2 left-4 -translate-y-1/2 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none">
                <div className="flex gap-12">
                    <div className="w-16 h-16 bg-foreground rounded-full"></div>
                    <div className="w-16 h-16 bg-foreground rounded-full"></div>
                </div>
            </div>
            
            <div className="flex justify-center mb-8">
                <div className="p-1.5 bg-background/50 backdrop-blur-xl rounded-xl flex gap-1 border border-border shadow-inner">
                    <button onClick={() => setActiveChart('category')} className={`${tabButtonStyle} ${activeChart === 'category' ? activeTabStyle : inactiveTabStyle}`}>
                        By Category
                    </button>
                    <button onClick={() => setActiveChart('history')} className={`${tabButtonStyle} ${activeChart === 'history' ? activeTabStyle : inactiveTabStyle}`}>
                        Accuracy Trend
                    </button>
                </div>
            </div>
            {activeChart === 'category' ? <SimpleBarChart data={categoryData} theme={theme} /> : renderLineChart()}
        </div>
    );
};