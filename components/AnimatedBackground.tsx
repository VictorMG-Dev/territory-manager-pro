import React from 'react';
import { MapPin, Navigation, Compass, Map as MapIcon, Locate } from 'lucide-react';

const AnimatedBackground = () => {
    return (
        <>
            {/* Multi-layer gradient background - Vibrant Purple/Cyan theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/40 via-transparent to-pink-950/30" />

            {/* Abstract Territory Polygons - Floating Overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />

                {/* Geometrical Territory Shapes */}
                <svg className="absolute inset-0 w-full h-full opacity-20">
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.2 }} />
                            <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.2 }} />
                        </linearGradient>
                    </defs>

                    {/* Floating Hexagons/Polygons representing territories */}
                    <path d="M100,200 L150,150 L250,150 L300,200 L250,250 L150,250 Z"
                        fill="url(#grad1)" className="animate-float" style={{ animationDuration: '15s' }} />
                    <path d="M800,500 L850,450 L950,450 L1000,500 L950,550 L850,550 Z"
                        fill="url(#grad1)" className="animate-float-delayed" style={{ animationDuration: '18s' }} />
                    <circle cx="80%" cy="20%" r="100" fill="none" stroke="#ec4899" strokeWidth="0.5" strokeDasharray="10 5" className="animate-spin-slow" style={{ animationDuration: '60s' }} />
                </svg>
            </div>

            {/* Glowing Map Routes Animation */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                {/* Route 1 - Pink */}
                <path d="M-10,300 Q150,300 300,100 T600,150 T900,100"
                    fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="1000"
                    className="animate-draw" />

                {/* Route 2 - Cyan */}
                <path d="M100,800 Q300,600 500,700 T900,500"
                    fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="1000"
                    className="animate-draw" style={{ animationDelay: '1s', animationDuration: '6s' }} />

                {/* Route 3 - Purple - Vertical */}
                <path d="M200,0 Q250,300 100,600 T300,900"
                    fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="1000"
                    className="animate-draw" style={{ animationDelay: '2s', animationDuration: '7s' }} />

                {/* Route connections (nodes) */}
                <circle cx="300" cy="100" r="4" fill="#ec4899" className="animate-pulse" />
                <circle cx="500" cy="700" r="4" fill="#06b6d4" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
                <circle cx="100" cy="600" r="4" fill="#8b5cf6" className="animate-pulse" style={{ animationDelay: '2.5s' }} />
            </svg>

            {/* Floating 3D Map Icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-[15%] opacity-20 animate-float text-cyan-400">
                    <Compass size={120} strokeWidth={1} />
                </div>
                <div className="absolute bottom-40 right-[10%] opacity-15 animate-float-delayed text-purple-400" style={{ animationDelay: '1s' }}>
                    <MapIcon size={180} strokeWidth={0.5} />
                </div>
                <div className="absolute top-1/2 right-[25%] opacity-20 animate-float text-pink-400" style={{ animationDelay: '2s' }}>
                    <Navigation size={80} strokeWidth={1.5} />
                </div>

                {/* Pulse Rings (Radar Effect) at key locations */}
                <div className="absolute top-32 left-[20%] w-24 h-24 border border-cyan-500/30 rounded-full animate-pulse-ring" />
                <div className="absolute bottom-1/3 right-[15%] w-32 h-32 border border-purple-500/30 rounded-full animate-pulse-ring" style={{ animationDelay: '1s' }} />
            </div>

            {/* Subtle Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-scan pointer-events-none" />
        </>
    );
};

export default AnimatedBackground;
