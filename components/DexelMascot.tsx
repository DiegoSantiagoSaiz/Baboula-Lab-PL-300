import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ghost, Sparkles } from 'lucide-react';

export type MascotMood = 'neutral' | 'happy' | 'sad' | 'thinking' | 'warning' | 'cheering';

interface DexelMascotProps {
    className?: string;
    showBubble?: boolean;
    message?: string;
    mood?: MascotMood;
    bubblePosition?: 'top' | 'left' | 'right' | 'bottom';
    onClick?: () => void;
}

export const DexelMascot: React.FC<DexelMascotProps> = ({ 
    className, 
    showBubble = false, 
    message,
    mood = 'neutral',
    bubblePosition = 'top',
    onClick
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [mascotStyle, setMascotStyle] = useState<'vector' | '3d'>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('dexel_mascot_style') as 'vector' | '3d') || '3d';
        }
        return '3d';
    });

    // Map moods to glowing background portal colors
    const moodColors: Record<MascotMood, string> = {
        neutral: 'from-cyan-400/30 to-purple-500/30',
        happy: 'from-emerald-400/40 to-lime-500/40',
        sad: 'from-blue-500/30 to-slate-500/30',
        thinking: 'from-amber-400/30 to-pink-500/30',
        warning: 'from-red-500/40 to-orange-500/40',
        cheering: 'from-pink-400/40 to-yellow-400/40',
    };

    // Animation variants for mascot container
    const mascotVariants = {
        neutral: { y: [0, -8, 0], scale: 1 },
        happy: { y: [0, -18, 0], scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] },
        sad: { y: [0, 6, 0], scale: 0.96 },
        thinking: { rotate: [0, -4, 4, 0], scale: 1.02 },
        warning: { x: [-3, 3, -3, 3, 0], scale: 1.04 },
        cheering: { y: [0, -25, 0], scale: [1, 1.15, 1], rotate: [0, 8, -8, 8, 0] },
    };

    const handleClick = () => {
        // Dispatch CustomEvent to open the tutor chat
        window.dispatchEvent(new CustomEvent('open-baboulas-chat'));
        if (onClick) {
            onClick();
        }
    };

    // Style map for speech bubble placement around the mascot
    const bubblePositions = {
        top: 'absolute bottom-full mb-4 left-1/2 -translate-x-1/2 min-w-[220px] max-w-[280px]',
        left: 'absolute right-full mr-4 top-1/2 -translate-y-1/2 min-w-[220px] max-w-[280px]',
        right: 'absolute left-full ml-4 top-1/2 -translate-y-1/2 min-w-[220px] max-w-[280px]',
        bottom: 'absolute top-full mt-4 left-1/2 -translate-x-1/2 min-w-[220px] max-w-[280px]',
    };

    // Style map for bubble arrow directions
    const bubbleArrowPositions = {
        top: 'absolute left-1/2 -bottom-[14px] -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-white dark:border-t-card',
        left: 'absolute top-1/2 -right-[14px] -translate-y-1/2 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[14px] border-l-white dark:border-l-card',
        right: 'absolute top-1/2 -left-[14px] -translate-y-1/2 w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-r-[14px] border-r-white dark:border-r-card',
        bottom: 'absolute left-1/2 -top-[14px] -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[14px] border-b-white dark:border-b-card',
    };

    return (
        <div 
            className={`relative flex flex-col items-center justify-center ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                className="relative w-full h-full flex items-center justify-center"
            >
                <motion.div
                    animate={mascotVariants[mood]}
                    transition={{ 
                        duration: mood === 'neutral' ? 3.5 : 0.6, 
                        repeat: mood === 'neutral' ? Infinity : 0,
                        ease: "easeInOut"
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative z-10 w-full h-full flex items-center justify-center cursor-pointer group"
                >
                    <div className="relative w-full h-full p-2">
                        {/* Monster Portal Soft Ambient Glow behind the transparent character */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${moodColors[mood]} rounded-full blur-3xl opacity-40 transition-all duration-750`}></div>
                        


                        {/* Transparent Cutout Container */}
                        <div className="absolute inset-0 flex items-center justify-center overflow-visible">
                            {/* Principal Mascot Handler - scaled larger, completely unclipped and floating on layout */}
                            <div className="w-full h-full relative z-10 flex items-center justify-center p-2 overflow-visible">
                                <MascotMedia 
                                    mood={mood} 
                                    mascotStyle={mascotStyle} 
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
 
            {/* Speech bubble */}
            <AnimatePresence>
                {(showBubble || isHovered) && message && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: bubblePosition === 'bottom' ? -10 : 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", damping: 15, stiffness: 300 }}
                        className={`${bubblePositions[bubblePosition]} bg-gradient-to-br from-primary to-primary/90 p-4 rounded-[1.5rem] shadow-2xl border-4 border-white/95 z-[9999] cursor-pointer`}
                    >
                        <p className="text-xs md:text-sm font-black text-white text-center leading-snug uppercase tracking-wide drop-shadow-sm select-none">
                            {message}
                        </p>
                        <div className={bubbleArrowPositions[bubblePosition]}></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Internal Helper for Mascot Media: Gorgeous default graphics under brand license
const MascotMedia: React.FC<{ 
    mood: MascotMood; 
    mascotStyle: 'vector' | '3d';
}> = ({ mood, mascotStyle }) => {
    // Default options based on mascotStyle selector
    if (mascotStyle === '3d') {
        const moodColors: Record<MascotMood, string> = {
            neutral: 'drop-shadow-[0_0_25px_rgba(56,189,248,0.55)]',
            happy: 'drop-shadow-[0_0_25px_rgba(52,211,153,0.55)]',
            sad: 'drop-shadow-[0_0_25px_rgba(59,130,246,0.35)]',
            thinking: 'drop-shadow-[0_0_25px_rgba(251,191,36,0.55)]',
            warning: 'drop-shadow-[0_0_25px_rgba(239,68,68,0.55)]',
            cheering: 'drop-shadow-[0_0_25px_rgba(244,63,94,0.55)]',
        };
        return (
            <img 
                src="/Dexel.jpg"
                alt="Dexel 3D Mascot"
                className={`w-full h-full object-contain filter ${moodColors[mood] || 'drop-shadow-[0_0_25px_rgba(var(--primary),0.5)]'} relative z-10 select-none transition-all duration-300 hover:scale-[1.04]`}
                referrerPolicy="no-referrer"
            />
        );
    }

    // Default to the gorgeous dynamic SVG Vector Mascot (highly polished flat style)
    return <DexelVectorMascot mood={mood} />;
};

// Premium Animated SVG vector representation for Dexel (Cute fluffy light blue monster)
// Formats face & body landmarks to dynamically suit any specified state of mind.
export const DexelVectorMascot: React.FC<{ mood: MascotMood }> = ({ mood }) => {
    // Dynamic face expressions
    const getFaceAnatomy = (m: MascotMood) => {
        switch (m) {
            case 'happy':
                return {
                    leftEye: (
                        <path d="M60 90 Q70 78 80 90" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                    ),
                    rightEye: (
                        <path d="M120 90 Q130 78 140 90" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                    ),
                    blushing: true,
                    mouth: (
                        <path d="M72 135 Q100 175 128 135" fill="#f87171" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
                    )
                };
            case 'sad':
                return {
                    leftEye: (
                        <path d="M60 88 Q70 100 80 88" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" fill="none" />
                    ),
                    rightEye: (
                        <path d="M120 88 Q130 100 140 88" stroke="#0284c7" strokeWidth="5" strokeLinecap="round" fill="none" />
                    ),
                    blushing: false,
                    mouth: (
                        <path d="M80 145 Q100 120 120 145" fill="none" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
                    )
                };
            case 'thinking':
                return {
                    leftEye: (
                        <>
                            <ellipse cx="70" cy="85" rx="9" ry="12" fill="#1e293b" />
                            <circle cx="72" cy="81" r="3.5" fill="white" />
                        </>
                    ),
                    rightEye: (
                        <>
                            <ellipse cx="130" cy="85" rx="9" ry="12" fill="#1e293b" />
                            <circle cx="132" cy="81" r="3.5" fill="white" />
                        </>
                    ),
                    blushing: true,
                    mouth: (
                        <ellipse cx="100" cy="138" rx="8" ry="12" fill="#94a3b8" stroke="#1e293b" strokeWidth="4" />
                    )
                };
            case 'warning':
                return {
                    leftEye: (
                        <>
                            <circle cx="70" cy="88" r="14" fill="#ef4444" opacity="0.15" />
                            <circle cx="70" cy="88" r="7" fill="#1e293b" />
                            <circle cx="73" cy="84" r="2.5" fill="white" />
                        </>
                    ),
                    rightEye: (
                        <>
                            <circle cx="130" cy="88" r="14" fill="#ef4444" opacity="0.15" />
                            <circle cx="130" cy="88" r="7" fill="#1e293b" />
                            <circle cx="133" cy="84" r="2.5" fill="white" />
                        </>
                    ),
                    blushing: false,
                    mouth: (
                        <rect x="82" y="132" width="36" height="10" rx="4" fill="#ffffff" stroke="#e11d48" strokeWidth="4.5" />
                    )
                };
            case 'cheering':
                return {
                    leftEye: (
                        <>
                            <path d="M 55 90 L 72 75 L 68 98 Z" fill="#eab308" />
                            <circle cx="70" cy="88" r="8" fill="#1e293b" />
                            <circle cx="73" cy="84" r="3" fill="white" />
                        </>
                    ),
                    rightEye: (
                        <>
                            <path d="M 145 90 L 128 75 L 132 98 Z" fill="#eab308" />
                            <circle cx="130" cy="88" r="8" fill="#1e293b" />
                            <circle cx="133" cy="84" r="3" fill="white" />
                        </>
                    ),
                    blushing: true,
                    mouth: (
                        <path d="M65 125 Q100 178 135 125 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="4" />
                    )
                };
            case 'neutral':
            default:
                return {
                    leftEye: (
                        <>
                            <circle cx="70" cy="88" r="9" fill="#1e293b" />
                            <circle cx="73" cy="83" r="3.5" fill="white" />
                        </>
                    ),
                    rightEye: (
                        <>
                            <circle cx="130" cy="88" r="9" fill="#1e293b" />
                            <circle cx="133" cy="83" r="3.5" fill="white" />
                        </>
                    ),
                    blushing: true,
                    mouth: (
                        <path d="M82 135 Q100 152 118 135" fill="none" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
                    )
                };
        }
    };

    const face = getFaceAnatomy(mood);

    return (
        <svg 
            viewBox="0 0 200 220" 
            className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,100,100,0.4)]"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                {/* Fluffy Teal Monster fur gradient */}
                <radialGradient id="dexelFur" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#38bdf8" /> {/* Sky-400 */}
                    <stop offset="85%" stopColor="#0284c7" /> {/* Sky-700 */}
                    <stop offset="100%" stopColor="#0369a1" /> {/* Sky-800 */}
                </radialGradient>
                {/* Soft Lavender horns */}
                <linearGradient id="hornGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f472b6" /> {/* Pink 400 */}
                    <stop offset="100%" stopColor="#c084fc" /> {/* Purple 400 */}
                </linearGradient>
                {/* Deep purple cape */}
                <linearGradient id="capeGrad" x1="0%" y1="0%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#a855f7" /> {/* Purple-500 */}
                    <stop offset="100%" stopColor="#6b21a8" /> {/* Purple-800 */}
                </linearGradient>
            </defs>

            {/* Background Cape (Flowing behind) */}
            <path 
                d="M30 140 C10 180, 20 230, 60 215 C100 200, 100 200, 140 215 C180 230, 190 180, 170 140 Z" 
                fill="url(#capeGrad)" 
                stroke="#4c1d95" 
                strokeWidth="2.5"
            />

            {/* Horns */}
            {/* Left curved horn */}
            <path d="M50 62 C30 45, 20 20, 32 10 C42 0, 50 35, 60 50 Z" fill="url(#hornGrad)" stroke="#701a75" strokeWidth="2.5" />
            {/* Right curved horn */}
            <path d="M150 62 C170 45, 180 20, 168 10 C158 0, 150 35, 140 50 Z" fill="url(#hornGrad)" stroke="#701a75" strokeWidth="2.5" />

            {/* Mascot Main Fluffy Body Capsule */}
            <rect x="42" y="45" width="116" height="125" rx="55" fill="url(#dexelFur)" stroke="#0369a1" strokeWidth="4" />

            {/* Cute Purple/Lavender spots on the sides of the body */}
            <circle cx="53" cy="115" r="10" fill="#c084fc" opacity="0.75" />
            <circle cx="50" cy="135" r="7" fill="#c084fc" opacity="0.6" />
            <circle cx="147" cy="118" r="9" fill="#c084fc" opacity="0.75" />
            <circle cx="149" cy="134" r="6" fill="#c084fc" opacity="0.6" />

            {/* Blush spots */}
            {face.blushing && (
                <>
                    <circle cx="58" cy="112" r="10" fill="#f43f5e" opacity="0.25" filter="blur(1px)" />
                    <circle cx="142" cy="112" r="10" fill="#f43f5e" opacity="0.25" filter="blur(1px)" />
                </>
            )}

            {/* Mascot eyes (custom responsive per mood) */}
            {face.leftEye}
            {face.rightEye}

            {/* Thin round black glasses */}
            {/* Left rim */}
            <circle cx="70" cy="88" r="22" fill="none" stroke="#1e293b" strokeWidth="4.5" />
            {/* Right rim */}
            <circle cx="130" cy="88" r="22" fill="none" stroke="#1e293b" strokeWidth="4.5" />
            {/* Glasses single bridge connector */}
            <path d="M92 88 L108 88" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
            {/* Glasses left/right temples connector */}
            <path d="M26 82 C34 83, 42 85, 48 88" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
            <path d="M174 82 C166 83, 158 85, 152 88" fill="none" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

            {/* Mascot Mouth */}
            {face.mouth}

            {/* Red Bow Tie on the throat */}
            <g transform="translate(100, 168)">
                {/* Left bow wing */}
                <polygon points="0,0 -22,-14 -22,14" fill="#ef4444" stroke="#991b1b" strokeWidth="2.5" />
                {/* Right bow wing */}
                <polygon points="0,0 22,-14 22,14" fill="#ef4444" stroke="#991b1b" strokeWidth="2.5" />
                {/* Bow knot center */}
                <circle cx="0" cy="0" r="7.5" fill="#facc15" stroke="#854d0e" strokeWidth="2.5" />
            </g>

            {/* Cute front teeth (Only if happy or cheering) */}
            {(mood === 'happy' || mood === 'cheering') && (
                <g>
                    {/* Left white tooth */}
                    <rect x="88" y="128" width="10" height="7" rx="2.5" fill="#ffffff" />
                    {/* Right white tooth */}
                    <rect x="102" y="128" width="10" height="7" rx="2.5" fill="#ffffff" />
                </g>
            )}

            {/* Small dynamic Warning Indicator overhead */}
            {mood === 'warning' && (
                <g transform="translate(100,26)">
                    <polygon points="0,-18 16,14 -16,14" fill="#f59e0b" stroke="#1e293b" strokeWidth="3" />
                    <text x="0" y="10" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="910">!</text>
                </g>
            )}

            {/* Thinking details (Floating lightbulb) */}
            {mood === 'thinking' && (
                <g transform="translate(142,30) scale(0.8)">
                    <circle cx="0" cy="0" r="12" fill="#eab308" filter="drop-shadow(0 0 4px yellow)" />
                    <polygon points="-7,6 7,6 4,14 -4,14" fill="#94a3b8" />
                </g>
            )}
        </svg>
    );
};

