import React from 'react';

const AnimatedBackground = () => {
    return (
        <>
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />

            {/* Radial gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-900/50" />

            {/* Floating geometric shapes */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Large circle - top left */}
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDuration: '4s' }} />

                {/* Medium circle - bottom right */}
                <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
                    style={{ animationDuration: '5s', animationDelay: '1s' }} />

                {/* Small circle - top right */}
                <div className="absolute top-20 right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl animate-pulse"
                    style={{ animationDuration: '3s', animationDelay: '0.5s' }} />

                {/* Floating squares */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-blue-400/20 rounded-lg rotate-12 animate-float" />
                <div className="absolute bottom-1/3 right-1/3 w-24 h-24 border border-purple-400/20 rounded-lg -rotate-12 animate-float-delayed" />

                {/* Additional floating elements for depth */}
                <div className="absolute top-1/2 right-1/4 w-20 h-20 border border-cyan-400/15 rounded-lg rotate-45 animate-float"
                    style={{ animationDelay: '2s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-16 h-16 border border-blue-400/15 rounded-lg -rotate-6 animate-float-delayed"
                    style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent animate-scan" />

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
                }} />
        </>
    );
};

export default AnimatedBackground;

