'use client';

import { useEffect, useState, useRef } from 'react';

const steps = [
  {
    number: '01',
    title: '艺术家提交',
    description: '艺术家连接钱包，上传艺术品信息、高清图片和真品证书，设置代币名称、符号和总供应量。',
    icon: '📝',
  },
  {
    number: '02',
    title: '平台审核',
    description: '管理员团队审核艺术品真实性和价值，通过后自动部署 ERC-20 代币合约，并将代币分配给艺术家和平台。',
    icon: '✅',
  },
  {
    number: '03',
    title: '自由交易',
    description: '代币发行后，投资者可以在 PancakeSwap 等 DEX 上购买和交易艺术品份额，享受 24/7 全球流动性。',
    icon: '💱',
  },
];

export function HowItWorksSection() {
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
    <section ref={sectionRef} id="how-it-works" className="py-32 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background" />

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
            如何运作？
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            三个简单步骤，让艺术品从实体走向链上
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 relative">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative"
                style={inView ? {
                  animationName: 'fadeInUp',
                  animationDuration: '0.8s',
                  animationTimingFunction: 'ease-out',
                  animationFillMode: 'forwards',
                  animationDelay: `${0.2 + index * 0.15}s`,
                  opacity: 1
                } : { opacity: 0 }}
              >
                {/* Connector Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute top-20 left-[60%] w-[80%] h-px"
                    style={{
                      background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, transparent 100%)',
                      opacity: 0.3
                    }}
                  />
                )}

                {/* Step Card */}
                <div className="group relative bg-card/80 backdrop-blur-sm border-2 border-border/50 rounded-2xl p-8 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2">
                  {/* Number Badge */}
                  <div className="absolute -top-6 -left-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    {step.number}
                  </div>

                  {/* Icon with background */}
                  <div className="relative mt-8 mb-6">
                    <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
                    <div className="relative text-6xl w-fit p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl group-hover:scale-110 transition-transform duration-500">
                      {step.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-base leading-relaxed">
                    {step.description}
                  </p>

                  {/* Decorative bottom bar */}
                  <div className="mt-8 h-1.5 w-16 bg-gradient-to-r from-primary to-secondary rounded-full group-hover:w-full transition-all duration-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
