'use client';

import { Card } from '@/components/ui/card';
import { useEffect, useState, useRef } from 'react';

const features = [
  {
    icon: '🎨',
    title: '艺术品代币化',
    description: '将实体艺术品转化为可交易的数字份额代币，每件作品都有独特的 ERC-20 代币代表其所有权。',
  },
  {
    icon: '💰',
    title: '份额投资',
    description: '无需购买整件艺术品，以小额资金投资艺术市场。降低投资门槛，让艺术投资不再是富人专属。',
  },
  {
    icon: '🔗',
    title: '链上透明',
    description: '所有交易记录在 BNB Chain 上，完全透明可追溯。艺术品信息、证书永久存储在 IPFS 上。',
  },
  {
    icon: '🚀',
    title: '即时交易',
    description: '通过 PancakeSwap 等 DEX 实现 24/7 全球化交易，随时买入卖出，流动性由市场决定。',
  },
];

export function FeaturesSection() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div
          className="max-w-3xl mx-auto text-center mb-20"
          style={inView ? {
            animationName: 'fadeInUp',
            animationDuration: '0.8s',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            opacity: 1
          } : { opacity: 0 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            为什么选择我们？
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            结合区块链技术与艺术市场，打造全新的艺术品投资体验
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 bg-card/50 backdrop-blur-sm border-2 hover:border-primary/30"
              style={inView ? {
                animationName: 'fadeInUp',
                animationDuration: '0.8s',
                animationTimingFunction: 'ease-out',
                animationFillMode: 'forwards',
                animationDelay: `${0.2 + index * 0.1}s`,
                opacity: 1
              } : { opacity: 0 }}
            >
              {/* Icon with animated background */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-xl group-hover:blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
                <div className="relative text-5xl w-fit p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                  {feature.icon}
                </div>
              </div>

              <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Decorative element */}
              <div className="mt-6 h-1 w-12 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-500" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
