import Link from 'next/link'

const LINKS = {
  Product: ['Features', 'How It Works', 'Pricing', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0a0a]">
      {/* Main content */}
      <div className="grid grid-cols-1 gap-12 border-b border-white/10 px-6 py-14 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-16">
        {/* Brand */}
        <div>
          <div className="mb-5 flex items-center gap-2">
            <span className="font-bebas text-3xl leading-none text-[#C8FF00]">FIT</span>
            <span className="font-bebas text-3xl leading-none text-white">AI</span>
          </div>
          <p className="font-barlow max-w-[180px] text-sm leading-relaxed text-zinc-600">
            AI-powered personal training for everyone.
          </p>
        </div>

        {/* Link groups */}
        {Object.entries(LINKS).map(([category, items]) => (
          <div key={category}>
            <div className="font-barlow mb-5 text-[9px] font-semibold uppercase tracking-[0.3em] text-zinc-700">
              {category}
            </div>
            <ul className="flex flex-col gap-3" role="list">
              {items.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="font-barlow cursor-pointer text-sm text-zinc-500 transition-colors duration-200 hover:text-white"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
        <p className="font-barlow text-[10px] uppercase tracking-widest text-zinc-700">
          © {new Date().getFullYear()} FitAI. All rights reserved.
        </p>
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C8FF00]"
            aria-hidden="true"
          />
          <span className="font-barlow text-[10px] uppercase tracking-widest text-zinc-700">
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  )
}
