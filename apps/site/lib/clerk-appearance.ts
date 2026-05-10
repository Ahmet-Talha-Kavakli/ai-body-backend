import type { Appearance } from '@clerk/types'

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#30D158',
    colorBackground: '#0A0A0F',
    colorInputBackground: 'rgba(255,255,255,0.05)',
    colorInputText: '#F5F5F7',
    colorText: '#F5F5F7',
    colorTextSecondary: '#A1A1AA',
    colorNeutral: '#A1A1AA',
    colorDanger: '#F87171',
    colorSuccess: '#30D158',
    fontFamily: 'var(--font-sora), system-ui, sans-serif',
    fontSize: '14px',
    borderRadius: '12px',
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-[#12121A] border border-white/10 shadow-none',
    headerTitle: 'text-[24px] tracking-tight font-bold text-[#F5F5F7]',
    headerSubtitle: 'text-[14px] text-[#A1A1AA]',
    socialButtonsBlockButton:
      'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-[#F5F5F7] transition-all',
    formButtonPrimary:
      'bg-[#30D158] hover:bg-[#5DE87E] text-[#0A0A0F] font-medium normal-case shadow-[0_8px_24px_-8px_rgba(48,209,88,0.4)]',
    formFieldInput:
      'bg-white/5 border border-white/10 text-[#F5F5F7] focus:border-white/20 focus:bg-white/10',
    formFieldLabel: 'text-[#A1A1AA] text-[13px] font-medium',
    footerActionLink: 'text-[#30D158] hover:text-[#5DE87E]',
    identityPreviewEditButton: 'text-[#30D158]',
    dividerLine: 'bg-white/10',
    dividerText: 'text-[#71717A]',
  },
}
