'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Dumbbell } from 'lucide-react'
import { SocialButtons } from '@/components/ui/social-buttons'
import { InfiniteSlider } from '@/components/ui/infinite-slider'

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Roadmap', href: '/roadmap' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Blog', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
    ],
  },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      {/* Newsletter CTA */}
      <motion.div
        className="border-b border-border/50 py-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="container">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h3 className="font-semibold text-foreground">Stay updated</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get the latest AI fitness tips and feature updates.
              </p>
            </div>
            <form className="flex w-full gap-2 sm:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="rounded-lg border border-border/60 bg-background/60 px-4 py-2 text-sm placeholder-muted-foreground/50 transition-colors focus:border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary/20"
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </motion.div>

      {/* Partners Infinite Slider */}
      <motion.div
        className="border-b border-border/50 py-12 overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h3 className="text-center text-sm font-semibold text-foreground mb-8 uppercase tracking-widest">
          ✨ Trusted by Leading Brands ✨
        </h3>
        <InfiniteSlider duration={20}>
          <div className="flex gap-8 whitespace-nowrap">
            {['Nike', 'Adidas', 'Apple Fitness', 'Peloton', 'Fitbit'].map((brand) => (
              <motion.div
                key={brand}
                whileHover={{ scale: 1.1 }}
                className="px-6 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg cursor-pointer transition-all hover:border-primary/40"
              >
                <span className="font-semibold text-foreground">{brand}</span>
              </motion.div>
            ))}
          </div>
        </InfiniteSlider>
      </motion.div>

      {/* Main footer */}
      <div className="py-16">
        <div className="container">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Link href="/" className="mb-4 inline-flex items-center gap-2 font-bold text-xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Dumbbell className="h-4 w-4 text-primary-foreground" />
                </div>
                FitAI
              </Link>
              <p className="max-w-xs text-sm text-muted-foreground">
                The AI-powered personal trainer that adapts to you. Real-time coaching, personalized
                programs, and smarter nutrition.
              </p>
              {/* Social links */}
              <div className="mt-8">
                <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                  Follow Us
                </p>
                <SocialButtons layout="row" />
              </div>
            </motion.div>

            {/* Link sections */}
            {FOOTER_SECTIONS.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <h4 className="mb-4 text-sm font-semibold text-foreground uppercase tracking-wide">
                  {section.title}
                </h4>
                <ul className="space-y-2.5">
                  {section.links.map((link, linkIdx) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 + linkIdx * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary hover:translate-x-1 inline-block"
                      >
                        {link.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Bottom */}
          <motion.div
            className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FitAI. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for athletes, by athletes.
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}
