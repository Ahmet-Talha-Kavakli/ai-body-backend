'use client'

import { motion } from 'framer-motion'
import { ContainerScroll } from '@/components/ui/container-scroll-animation'
import { SectionAnimations } from '@/components/landing/section-animations'

const steps = [
  {
    number: '01',
    title: 'Onboard in minutes',
    description: 'Tell us your goals, fitness level, and available equipment. No gym required.',
    icon: '→',
  },
  {
    number: '02',
    title: 'Get your AI program',
    description:
      'Your personalized workout and nutrition plan is ready in seconds. Fully explained, fully yours.',
    icon: '⚡',
  },
  {
    number: '03',
    title: 'Track & improve',
    description:
      'Log sessions, measure progress, and watch your AI coach adapt the plan as you grow stronger.',
    icon: '↑',
  },
]

export function HowItWorksSection() {
  return (
    <SectionAnimations>
      <section id="how-it-works" className="py-24 lg:py-32 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ContainerScroll
          titleComponent={
            <div className="mb-16 text-center">
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-primary text-sm font-medium uppercase tracking-widest mb-3"
              >
                How It Works
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-4xl lg:text-5xl font-black text-white"
              >
                From zero to training
                <br />
                <span className="text-primary">in three steps</span>
              </motion.h2>
            </div>
          }
        >
          <div className="bg-zinc-900 rounded-2xl p-8 lg:p-12 w-full h-full flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0 relative w-full">
              {/* Connecting line (desktop only) */}
              <div className="hidden lg:block absolute top-10 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />

              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative flex flex-col items-center text-center px-4"
                  data-animate="true"
                >
                  <div className="relative z-10 w-20 h-20 rounded-full bg-[#080808] border-2 border-primary/50 flex items-center justify-center mb-6">
                    <span className="text-2xl font-black text-primary">{step.icon}</span>
                  </div>
                  <span className="text-xs text-zinc-600 font-mono mb-2">{step.number}</span>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </ContainerScroll>
        </div>
      </section>
    </SectionAnimations>
  )
}
