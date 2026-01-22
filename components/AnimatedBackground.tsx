import React, { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle system for AI effect
        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;
            color: string;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.2;
                this.color = Math.random() > 0.5 ? '#60a5fa' : '#3b82f6';
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.opacity;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // Map grid node
        class MapNode {
            x: number;
            y: number;
            radius: number;
            pulsePhase: number;
            pulseSpeed: number;

            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.radius = 3;
                this.pulsePhase = Math.random() * Math.PI * 2;
                this.pulseSpeed = 0.02 + Math.random() * 0.02;
            }

            update() {
                this.pulsePhase += this.pulseSpeed;
            }

            draw() {
                if (!ctx) return;
                const pulse = Math.sin(this.pulsePhase) * 0.5 + 0.5;
                const glowSize = this.radius + pulse * 4;

                // Outer glow
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
                gradient.addColorStop(0, `rgba(59, 130, 246, ${0.6 * pulse})`);
                gradient.addColorStop(0.5, `rgba(59, 130, 246, ${0.3 * pulse})`);
                gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
                ctx.fill();

                // Core node
                ctx.fillStyle = `rgba(96, 165, 250, ${0.8 + pulse * 0.2})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Create particles
        const particles: Particle[] = [];
        for (let i = 0; i < 100; i++) {
            particles.push(new Particle());
        }

        // Create map grid nodes
        const nodes: MapNode[] = [];
        const gridSpacing = 120;
        for (let x = gridSpacing; x < canvas.width; x += gridSpacing) {
            for (let y = gridSpacing; y < canvas.height; y += gridSpacing) {
                // Add some randomness to grid positions
                const offsetX = (Math.random() - 0.5) * 40;
                const offsetY = (Math.random() - 0.5) * 40;
                nodes.push(new MapNode(x + offsetX, y + offsetY));
            }
        }

        // Animation loop
        let animationId: number;
        const animate = () => {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw connections between nearby nodes
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
            ctx.lineWidth = 1;
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < gridSpacing * 1.5) {
                        ctx.globalAlpha = 1 - distance / (gridSpacing * 1.5);
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            }

            // Update and draw nodes
            nodes.forEach(node => {
                node.update();
                node.draw();
            });

            // Update and draw particles
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw connections between nearby particles
            ctx.strokeStyle = 'rgba(96, 165, 250, 0.15)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.globalAlpha = 1 - distance / 150;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            }

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <>
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" />

            {/* Animated canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 opacity-60"
            />

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
