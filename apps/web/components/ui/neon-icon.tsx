interface NeonIconProps {
  type: 'flame' | 'heart' | 'lightning' | 'zap' | 'trophy' | 'star' | 'droplet' | 'activity' | 'clock' | 'target' | 'fire-ring'
  color?: 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'yellow'
  size?: number
}

const COLORS = {
  blue: { glow: '#3b82f6', stroke: '#60a5fa' },
  red: { glow: '#ef4444', stroke: '#f87171' },
  orange: { glow: '#f97316', stroke: '#fb923c' },
  green: { glow: '#22c55e', stroke: '#4ade80' },
  purple: { glow: '#a855f7', stroke: '#d8b4fe' },
  yellow: { glow: '#eab308', stroke: '#facc15' },
}

export function NeonIcon({ type, color = 'blue', size = 24 }: NeonIconProps) {
  const c = COLORS[color]
  const s = size

  if (type === 'flame') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-flame" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M12 2C12 2 8 8 8 12C8 14.2 9.8 16 12 16C14.2 16 16 14.2 16 12C16 8 12 2 12 2Z"
          stroke={c.stroke}
          strokeWidth="1.5"
          fill="none"
          filter="url(#glow-flame)"
        />
        <circle cx="12" cy="12" r="3" fill={c.glow} opacity="0.3" />
      </svg>
    )
  }

  if (type === 'heart') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-heart" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          stroke={c.stroke}
          strokeWidth="1.5"
          fill="none"
          filter="url(#glow-heart)"
        />
        <circle cx="12" cy="12" r="2.5" fill={c.glow} opacity="0.4" />
      </svg>
    )
  }

  if (type === 'lightning') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-lightning" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          stroke={c.stroke}
          strokeWidth="1.5"
          fill="none"
          filter="url(#glow-lightning)"
        />
        <circle cx="12" cy="10" r="2" fill={c.glow} opacity="0.5" />
      </svg>
    )
  }

  if (type === 'zap') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-zap" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
          stroke={c.stroke}
          strokeWidth="1.5"
          fill="none"
          filter="url(#glow-zap)"
        />
        <circle cx="12" cy="12" r="1.5" fill={c.glow} opacity="0.6" />
      </svg>
    )
  }

  if (type === 'trophy') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-trophy" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M6 9c0-1 1-2 2-2h8c1 0 2 1 2 2v3h2c1 0 2 1 2 2v1H4v-1c0-1 1-2 2-2h2V9z"
          stroke={c.stroke}
          strokeWidth="1.5"
          fill="none"
          filter="url(#glow-trophy)"
        />
        <line x1="12" y1="14" x2="12" y2="20" stroke={c.stroke} strokeWidth="1.5" filter="url(#glow-trophy)" />
        <circle cx="12" cy="8" r="2.5" fill={c.glow} opacity="0.3" />
      </svg>
    )
  }

  if (type === 'star') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-star" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke={c.stroke}
          strokeWidth="1.5"
          fill="none"
          filter="url(#glow-star)"
        />
        <circle cx="12" cy="11" r="2" fill={c.glow} opacity="0.4" />
      </svg>
    )
  }

  if (type === 'droplet') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-droplet" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M12 2.69l5.66 5.66a8 8 0 1 1-11.32 0z"
          stroke={c.stroke}
          strokeWidth="1.5"
          fill="none"
          filter="url(#glow-droplet)"
        />
        <circle cx="12" cy="12" r="2" fill={c.glow} opacity="0.5" />
      </svg>
    )
  }

  if (type === 'activity') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-activity" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke={c.stroke} strokeWidth="1.5" fill="none" filter="url(#glow-activity)" />
        <circle cx="12" cy="12" r="1.5" fill={c.glow} opacity="0.6" />
      </svg>
    )
  }

  if (type === 'clock') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-clock" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="12" cy="12" r="10" stroke={c.stroke} strokeWidth="1.5" fill="none" filter="url(#glow-clock)" />
        <line x1="12" y1="6" x2="12" y2="12" stroke={c.stroke} strokeWidth="1.5" filter="url(#glow-clock)" />
        <line x1="12" y1="12" x2="15" y2="15" stroke={c.stroke} strokeWidth="1.5" filter="url(#glow-clock)" />
        <circle cx="12" cy="12" r="1" fill={c.glow} opacity="0.7" />
      </svg>
    )
  }

  if (type === 'target') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-target" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="12" cy="12" r="10" stroke={c.stroke} strokeWidth="1.5" fill="none" filter="url(#glow-target)" />
        <circle cx="12" cy="12" r="6" stroke={c.stroke} strokeWidth="1.5" fill="none" filter="url(#glow-target)" />
        <circle cx="12" cy="12" r="2" fill={c.glow} filter="url(#glow-target)" />
      </svg>
    )
  }

  if (type === 'fire-ring') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow-fire-ring" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="12" cy="12" r="9" stroke={c.stroke} strokeWidth="2" fill="none" filter="url(#glow-fire-ring)" opacity="0.8" />
        <circle cx="12" cy="12" r="6" stroke={c.stroke} strokeWidth="1.5" fill="none" filter="url(#glow-fire-ring)" opacity="0.6" />
        <circle cx="12" cy="12" r="3" fill={c.glow} opacity="0.5" filter="url(#glow-fire-ring)" />
      </svg>
    )
  }

  return null
}
