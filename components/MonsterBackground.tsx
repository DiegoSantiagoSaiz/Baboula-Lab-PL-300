import React from 'react';

export const MonsterBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-background">
            {/* Subtle Grid Texture */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] dark:opacity-[0.04]"></div>

            {/* Glowing professional ambient light fields */}
            <div className="absolute top-1/4 right-[10%] w-96 h-96 bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 left-[5%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/5 rounded-full blur-[100px]"></div>

            {/* Clean subtle radial fade overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,hsl(var(--background))_95%)] opacity-80" />
        </div>
    );
};
