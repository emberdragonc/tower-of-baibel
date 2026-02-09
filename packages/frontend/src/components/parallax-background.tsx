"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ParallaxBackground() {
  const { scrollYProgress } = useScroll();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parallax transforms for different layers
  const farY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, -400]);
  const nearY = useTransform(scrollYProgress, [0, 1], [0, -600]);

  // Floating embers/particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle system
    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      color: string;
      canvasWidth: number;
      canvasHeight: number;

      constructor(width: number, height: number) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = -Math.random() * 0.5 - 0.1;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = Math.random() > 0.5 ? "#f59e0b" : "#ea580c";
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        // Reset when off screen
        if (this.y < -10) {
          this.y = this.canvasHeight + 10;
          this.x = Math.random() * this.canvasWidth;
        }
        if (this.x < -10) this.x = this.canvasWidth + 10;
        if (this.x > this.canvasWidth + 10) this.x = -10;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow effect
        ctx.globalAlpha = this.opacity * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Create particles
    const particles: Particle[] = [];
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas.width, canvas.height));
    }

    // Animation loop
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Gradient background layers */}
      <motion.div
        style={{ y: farY }}
        className="absolute inset-0 parallax-far"
      >
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </motion.div>

      <motion.div
        style={{ y: midY }}
        className="absolute inset-0 parallax-mid"
      >
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-primary/3 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-amber-500/3 rounded-full blur-2xl" />
      </motion.div>

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background/80" />
    </div>
  );
}
