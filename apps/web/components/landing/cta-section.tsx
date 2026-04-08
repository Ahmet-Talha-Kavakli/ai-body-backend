'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function CtaSection() {
  return (
    <section className="relative py-24 px-4 w-full bg-background">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 p-12 sm:p-20"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground mb-6">
            Ready to Transform Your Fitness Journey?
          </h2>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join thousands of athletes and fitness enthusiasts using FitAI. Start your free 7-day trial today with no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/sign-up">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="#pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            No credit card required • 7-day free trial • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  )
}
