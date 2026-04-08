'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import ScrollExpandMedia from '@/components/ui/scroll-expansion-hero'
import { JoinButton } from '@/components/ui/join-button'
import { SendMessageButton } from '@/components/ui/send-message-button'

export function CtaSection() {
  return (
    <section className="relative py-24 px-4 w-full bg-background overflow-hidden">

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-12 sm:p-20 backdrop-blur"
        >
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-6"
          >
            Ready to Transform Your Fitness Journey?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Join thousands of athletes and fitness enthusiasts using FitAI. Start your free 7-day trial today with no credit card required.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-10 flex-wrap"
          >
            <Link href="/sign-up">
              <JoinButton>Start Free Trial</JoinButton>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
            <SendMessageButton />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            No credit card required • 7-day free trial • Cancel anytime
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}
