'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function HeroSection() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Geometric Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large circle - top right */}
        <div
          className="absolute -top-48 -right-48 w-96 h-96 rounded-full border-2 border-primary/10"
          style={mounted ? {
            animationName: 'scaleIn',
            animationDuration: '1.2s',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            animationDelay: '0.2s',
            opacity: 0
          } : { opacity: 0 }}
        />
        {/* Medium circle - bottom left */}
        <div
          className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-primary/5"
          style={mounted ? {
            animationName: 'scaleIn',
            animationDuration: '1.2s',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            animationDelay: '0.4s',
            opacity: 0
          } : { opacity: 0 }}
        />
        {/* Small accent - center right */}
        <div
          className="absolute top-1/3 right-24 w-32 h-32 rounded-full bg-secondary/10"
          style={mounted ? {
            animationName: 'scaleIn',
            animationDuration: '1s',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            animationDelay: '0.6s',
            opacity: 0
          } : { opacity: 0 }}
        />
        {/* Diagonal line accent */}
        <div
          className="absolute top-1/2 left-1/4 w-px h-64 bg-gradient-to-b from-transparent via-primary/20 to-transparent rotate-12"
          style={mounted ? {
            animationName: 'fadeIn',
            animationDuration: '1s',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            animationDelay: '0.8s',
            opacity: 0
          } : { opacity: 0 }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 backdrop-blur-sm text-primary text-sm font-medium mb-8 border border-primary/20"
            style={mounted ? {
              animationName: 'fadeInUp',
              animationDuration: '0.8s',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              animationDelay: '0.1s',
              opacity: 0
            } : { opacity: 0 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            基于 BNB Chain 的艺术品 RWA 平台
          </div>

          {/* Main Heading - Larger, bolder, more artistic */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 leading-[1.1]"
            style={mounted ? {
              animationName: 'fadeInUp',
              animationDuration: '0.8s',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              animationDelay: '0.3s',
              opacity: 0
            } : { opacity: 0 }}
          >
            让艺术
            <span className="block mt-2 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              触手可及
            </span>
          </h1>

          {/* Subheading */}
          <p
            className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl leading-relaxed"
            style={mounted ? {
              animationName: 'fadeInUp',
              animationDuration: '0.8s',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              animationDelay: '0.5s',
              opacity: 0
            } : { opacity: 0 }}
          >
            通过区块链技术将实体艺术品代币化，以更低的门槛投资艺术市场。
            <span className="block mt-2">让每个人都能拥有世界级艺术品的一部分。</span>
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-start gap-4 mb-20"
            style={mounted ? {
              animationName: 'fadeInUp',
              animationDuration: '0.8s',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              animationDelay: '0.7s',
              opacity: 0
            } : { opacity: 0 }}
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link href="/gallery">
                探索艺术品
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-xl hover:bg-primary/5 transition-all duration-300"
              asChild
            >
              <Link href="#how-it-works">
                了解更多
              </Link>
            </Button>
          </div>

          {/* Stats - More elegant layout */}
          <div
            className="grid grid-cols-3 gap-12 pt-12 border-t border-border/50"
            style={mounted ? {
              animationName: 'fadeIn',
              animationDuration: '0.8s',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              animationDelay: '0.9s',
              opacity: 0
            } : { opacity: 0 }}
          >
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                100<span className="text-3xl">+</span>
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">艺术品</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-br from-secondary to-secondary/70 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                $2M<span className="text-3xl">+</span>
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">总市值</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-br from-primary to-secondary bg-clip-text text-transparent transition-all duration-300 group-hover:scale-110">
                5K<span className="text-3xl">+</span>
              </div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">投资者</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
