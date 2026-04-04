'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section className="py-24">
      <div className="container">
        <motion.div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-neon-blue/10 p-12 text-center md:p-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Background decorations */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-neon-blue/10 blur-[80px]" />
          </div>

          <div className="relative z-10">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
              Ready to train smarter?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
              Join thousands of athletes who have transformed their training with AI. Start free —
              no credit card required.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="group h-12 gap-2 px-10 text-base" asChild>
                <Link href="/sign-up">
                  Start Training Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">No credit card required</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
