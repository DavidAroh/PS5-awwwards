'use client';

import { useScroll, useTransform, motion, MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const FRAME_COUNT = 40;
const IMAGES_DIR = '/ps5-pad/';
const IMAGE_NAME_TEMPLATE = (index: number) => `ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;

export default function ScrollImageSequence() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Scroll progress for the entire container
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    // Map scroll progress (0-1) to frame index (0-39)
    const frameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);

    // Preload images
    useEffect(() => {
        let loadedCount = 0;
        const loadedImages: HTMLImageElement[] = [];

        const onLoad = () => {
            loadedCount++;
            if (loadedCount === FRAME_COUNT) {
                setImages(loadedImages);
                setIsLoading(false);
            }
        };

        for (let i = 1; i <= FRAME_COUNT; i++) {
            const img = new Image();
            img.src = `${IMAGES_DIR}${IMAGE_NAME_TEMPLATE(i)}`;
            img.onload = onLoad;
            loadedImages.push(img);
        }
    }, []);

    // Draw to canvas
    useEffect(() => {
        if (!canvasRef.current || images.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // High, consistent aspect ratio logic could go here
        // For now, we'll fit object-contain style logic in render

        const render = (index: number) => {
            if (!images[index]) return;

            const img = images[index];

            // Handle Scaling / Centering (Contain)
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };

        // Initial render
        render(0);

        // Subscribe to scroll changes
        const unsubscribe = frameIndex.on('change', (latest) => {
            const index = Math.round(latest);
            requestAnimationFrame(() => render(index));
        });

        return () => unsubscribe();
    }, [images, frameIndex]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current && images.length > 0) {
                // Trigger a re-render or just let the next frame handle it
                // Ideally we re-draw immediately but for simplicity rely on scroll or next refresh
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [images]);


    return (
        <div ref={containerRef} className="relative h-[400vh] bg-[#050505]">

            {/* Loading State */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] text-white">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                        <p className="text-sm uppercase tracking-widest text-white/40">Loading Assets</p>
                    </div>
                </div>
            )}

            {/* Sticky Canvas */}
            <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
                <canvas ref={canvasRef} className="block" />
            </div>

            {/* Scroll Sections / Text Overlays */}
            {/* These are absolutely positioned over the scroll track or handled via multiple sections */}

            {/* 
          We can place text elements at absolute positions within the tall container 
          so they scroll "past" or fade in/out based on scrollYProgress.
       */}

            <OverlaySection scrollYProgress={scrollYProgress} start={0} end={0.2} align="center">
                <h1 className="text-6xl font-bold tracking-tighter text-white sm:text-8xl">PlayStation 5</h1>
                <p className="mt-4 text-xl tracking-tight text-white/60">DualSense Wireless Controller</p>
            </OverlaySection>

            <OverlaySection scrollYProgress={scrollYProgress} start={0.25} end={0.45} align="left">
                <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Haptic Feedback</h2>
                <p className="mt-4 max-w-md text-lg text-white/60">
                    Feel physically responsive feedback to your in-game actions with dual actuators which replace traditional rumble motors.
                </p>
            </OverlaySection>

            <OverlaySection scrollYProgress={scrollYProgress} start={0.55} end={0.75} align="right">
                <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Adaptive Triggers</h2>
                <p className="mt-4 max-w-md text-lg text-white/60">
                    Experience varying levels of force and tension as you interact with your in-game gear and environments.
                </p>
            </OverlaySection>

            <OverlaySection scrollYProgress={scrollYProgress} start={0.85} end={1.0} align="center">
                <h2 className="text-5xl font-bold tracking-tighter text-white sm:text-7xl">Play Has No Limits</h2>
                <button className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-bold tracking-wide text-black transition hover:bg-white/90">
                    Buy Now
                </button>
            </OverlaySection>

        </div>
    );
}

function OverlaySection({
    scrollYProgress,
    start,
    end,
    align,
    children
}: {
    scrollYProgress: MotionValue<number>,
    start: number,
    end: number,
    align: 'left' | 'center' | 'right',
    children: React.ReactNode
}) {
    const opacity = useTransform(scrollYProgress,
        [start, start + 0.05, end - 0.05, end],
        [0, 1, 1, 0]
    );

    const y = useTransform(scrollYProgress,
        [start, end],
        [50, -50]
    );

    const pointerEvents = useTransform(scrollYProgress, (v) => (v >= start && v <= end ? 'auto' : 'none'));

    const alignmentClasses = {
        left: 'items-start text-left pl-10 md:pl-32',
        center: 'items-center text-center',
        right: 'items-end text-right pr-10 md:pr-32',
    };

    return (
        <motion.div
            style={{ opacity, y, pointerEvents }}
            className={`fixed inset-0 top-0 flex flex-col justify-center ${alignmentClasses[align]} pointer-events-none p-8`}
        >
            {children}
        </motion.div>
    );
}
