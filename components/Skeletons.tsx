import React from 'react';
import { motion } from 'motion/react';

export const QuizSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse"></div>
        </div>
        <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
      </div>

      {/* Main Quiz Card Skeleton */}
      <div className="bg-card p-8 md:p-12 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden space-y-8">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/5 dark:bg-slate-800/5 rounded-full -mr-16 -mt-16"></div>

        {/* Metadata Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
        </div>

        {/* Case Study / Scenario Box Skeleton (Simulated context) */}
        <div className="p-6 bg-slate-200/10 dark:bg-slate-800/10 rounded-2xl border border-border/50 space-y-3">
          <div className="h-4 w-40 bg-slate-200/30 dark:bg-slate-800/30 rounded animate-pulse"></div>
          <div className="h-3 w-full bg-slate-200/20 dark:bg-slate-800/20 rounded animate-pulse"></div>
          <div className="h-3 w-11/12 bg-slate-200/20 dark:bg-slate-800/20 rounded animate-pulse"></div>
          <div className="h-3 w-9/12 bg-slate-200/20 dark:bg-slate-800/20 rounded animate-pulse"></div>
        </div>

        {/* Question Text Skeleton */}
        <div className="space-y-3">
          <div className="h-7 w-full bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
          <div className="h-7 w-4/5 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
        </div>

        {/* Options Selection Indicator */}
        <div className="flex justify-between items-center px-1">
          <div className="h-3.5 w-36 bg-slate-200/50 dark:bg-slate-800/50 rounded animate-pulse"></div>
          <div className="h-3.5 w-24 bg-slate-200/50 dark:bg-slate-800/50 rounded animate-pulse"></div>
        </div>

        {/* Options List Skeleton (Multiple choice/select style) */}
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full p-5 bg-slate-100/40 dark:bg-slate-800/20 border border-border/50 rounded-2xl flex items-center gap-4 animate-pulse"
            >
              {/* Radio/Checkbox circle indicator */}
              <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
              {/* Option Text Bar */}
              <div className="flex-1 space-y-2">
                <div className="h-4 w-11/12 bg-slate-200/60 dark:bg-slate-800/40 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button Skeleton */}
        <div className="h-14 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-screen-2xl mx-auto space-y-8 p-4 md:p-0 px-4 md:px-8">
      {/* Tab Navigation Skeleton */}
      <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto py-4">
        <div className="flex bg-slate-200/40 dark:bg-slate-800/30 p-2 rounded-[2.5rem] border border-border shadow-sm">
          <div className="h-16 w-44 bg-slate-200 dark:bg-slate-800 rounded-[2rem] animate-pulse"></div>
          <div className="h-16 w-44 bg-transparent rounded-[2rem]"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Hero Section Banner Skeleton */}
        <div className="lg:col-span-12 flex flex-col md:flex-row items-center gap-10 bg-slate-100/40 dark:bg-slate-800/20 p-8 md:p-12 rounded-[3.5rem] border-4 border-dashed border-border/60 shadow-inner">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <div className="h-12 w-80 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
              <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
            </div>
            <div className="h-6 w-11/12 bg-slate-200/50 dark:bg-slate-800/35 rounded-lg animate-pulse"></div>
            <div className="h-6 w-8/12 bg-slate-200/50 dark:bg-slate-800/35 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Pillars / Features Grid Skeleton */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-slate-100/30 dark:bg-slate-800/15 border border-border/60 p-6 rounded-2xl space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-3 w-full bg-slate-200/50 dark:bg-slate-800/30 rounded animate-pulse"></div>
                <div className="h-3 w-5/6 bg-slate-200/50 dark:bg-slate-800/30 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Left Side Settings Form Skeleton */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-card p-8 rounded-3xl shadow-xl border border-border space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 w-12 bg-slate-200/50 dark:bg-slate-800/50 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-slate-200/50 dark:bg-slate-800/50 rounded animate-pulse"></div>
                <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-slate-200/50 dark:bg-slate-800/50 rounded animate-pulse"></div>
                <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="h-4 w-20 bg-slate-200/50 dark:bg-slate-800/50 rounded animate-pulse"></div>
              <div className="h-12 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse"></div>
            </div>

            <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          </div>

          {/* Exam simulation start card skeleton */}
          <div className="bg-card p-8 rounded-3xl shadow-xl border border-border">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 space-y-2">
                <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded animate-pulse"></div>
              </div>
              <div className="h-16 w-40 bg-slate-200 dark:bg-slate-800 rounded-[2rem] animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Right Side Calendar/Widgets Skeleton */}
        <div className="lg:col-span-5 space-y-6">
          {/* Calendar Box Skeleton */}
          <div className="bg-card p-6 rounded-3xl border border-border space-y-4">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-slate-100/60 dark:bg-slate-800/40 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
          </div>

          {/* Bookmarks, Downloaders, and Streak Indicators */}
          <div className="space-y-4">
            <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
            <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
            <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
