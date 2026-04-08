'use client'

import { motion } from 'framer-motion'

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative min-h-screen w-full py-24 px-4 bg-background"
    >
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-4">
            <span className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-sm font-medium text-primary">Features</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6">
            Everything You Need<br />to Transform Your Fitness
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Cutting-edge technology meets personalized coaching
          </p>
        </motion.div>

        {/* Feature Details Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              number: '98%',
              label: 'Form Accuracy',
              description: 'AI-powered real-time form analysis',
            },
            {
              number: '24/7',
              label: 'AI Coaching',
              description: 'Always-on personalized guidance',
            },
            {
              number: '100%',
              label: 'Customizable',
              description: 'Tailored to your specific goals',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="text-center p-6 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 transition-colors"
            >
              <div className="text-4xl sm:text-5xl font-black text-primary mb-2">
                {item.number}
              </div>
              <h3 className="text-xl font-bold mb-2">{item.label}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
