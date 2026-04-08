'use client'

import { motion } from 'framer-motion'
import { HeroParallax } from '@/components/ui/hero-parallax'
import { ImageTrail } from '@/components/ui/image-trail'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const PARALLAX_PRODUCTS = [
  {
    title: 'Product 1',
    link: '#',
    thumbnail: 'https://images.unsplash.com/photo-1606269574886-eea99c9d6c1a?w=500&auto=format&fit=crop&q=60',
  },
  {
    title: 'Product 2',
    link: '#',
    thumbnail: 'https://images.unsplash.com/photo-1517836357463-d25ddfcbf042?w=500&auto=format&fit=crop&q=60',
  },
  {
    title: 'Product 3',
    link: '#',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=60',
  },
  {
    title: 'Product 4',
    link: '#',
    thumbnail: 'https://images.unsplash.com/photo-1566886387580-e4f08f78d7f9?w=500&auto=format&fit=crop&q=60',
  },
  {
    title: 'Product 5',
    link: '#',
    thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&auto=format&fit=crop&q=60',
  },
  {
    title: 'Product 6',
    link: '#',
    thumbnail: 'https://images.unsplash.com/photo-1516321314726-8acf3b289635?w=500&auto=format&fit=crop&q=60',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/30">
        <Link href="/" className="text-2xl font-black">
          FitAI
        </Link>
        <div className="flex gap-4">
          <Link href="/">
            <Button variant="ghost">Home</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>

      {/* Hero Section with Parallax */}
      <div className="pt-24 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 px-4"
        >
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6">
            About FitAI
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Revolutionizing fitness through artificial intelligence and cutting-edge
            technology
          </p>
        </motion.div>

        <HeroParallax products={PARALLAX_PRODUCTS} />
      </div>

      {/* Mission Section */}
      <section className="relative py-24 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-6">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              At FitAI, we believe that everyone deserves access to world-class fitness
              coaching. Our mission is to democratize personal training through artificial
              intelligence, making it affordable, accessible, and effective for all.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We combine cutting-edge computer vision technology with personalized AI
              coaching to provide real-time form analysis, instant feedback, and adaptive
              workout programs tailored to each individual's goals and abilities.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="relative py-24 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-6">Our Vision</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              We envision a world where artificial intelligence empowers every person to
              achieve their fitness goals efficiently and safely. Where technology
              enhances human potential without replacing human connection and motivation.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              {[
                {
                  title: 'Innovation',
                  description:
                    'Leveraging the latest AI and computer vision technology to revolutionize fitness',
                },
                {
                  title: 'Accessibility',
                  description:
                    'Making personalized coaching affordable and available to everyone',
                },
                {
                  title: 'Community',
                  description:
                    'Building a supportive community of fitness enthusiasts and athletes',
                },
              ].map((value, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-xl bg-background border border-border/30"
                >
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Image Trail Section */}
      <section className="relative py-24 px-4 bg-background overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Move your mouse around
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience our interactive image trail effect
            </p>
          </motion.div>

          <ImageTrail>
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/50 rounded-lg" />
          </ImageTrail>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-24 px-4 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-6">Our Team</h2>
            <p className="text-lg text-muted-foreground mb-12">
              Built by AI researchers, fitness enthusiasts, and product visionaries
            </p>

            <div className="grid md:grid-cols-4 gap-6 mb-12">
              {[
                { name: 'Alex Chen', role: 'Founder & CEO', emoji: '👨‍💼' },
                { name: 'Sarah Johnson', role: 'CTO', emoji: '👩‍💻' },
                { name: 'Mike Smith', role: 'Head of Fitness', emoji: '💪' },
                { name: 'Emma Lee', role: 'Product Lead', emoji: '👩‍🔬' },
              ].map((member, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-6 rounded-xl bg-background border border-border/30 hover:border-primary/20 transition-colors"
                >
                  <div className="text-5xl mb-3">{member.emoji}</div>
                  <h3 className="font-bold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Join the Fitness Revolution
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Start your free trial today and experience the future of fitness
            </p>
            <Link href="/sign-up">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} FitAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
