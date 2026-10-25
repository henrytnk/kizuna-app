import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink font-extrabold active:brightness-90',
  secondary: 'bg-surface-2 text-ink border border-line active:bg-surface',
  ghost: 'text-muted active:text-ink',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`min-h-14 rounded-2xl px-5 font-display text-lg font-bold transition disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

export function IconButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm text-muted transition active:bg-surface-2 disabled:opacity-30 aria-pressed:bg-surface-2 aria-pressed:text-sky ${className}`}
      {...props}
    />
  )
}

/** The Kizuna Quiz mark: two cards turned toward each other, a blue K and a pink !. Same drawing as public/logo.svg. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 440 330" className={className} aria-hidden="true">
      <path d="M0 0 230 43V247L0 290Z" fill="var(--color-brand-blue)" />
      <path d="M208 85 438 40V330L208 285Z" fill="var(--color-brand-pink)" />
      <path
        d="M68 92V198M68 152 146 92M104 124 150 198"
        fill="none"
        stroke="#fff"
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M336 120 322 190" fill="none" stroke="#fff" strokeWidth="36" strokeLinecap="round" />
      <circle cx="314" cy="236" r="20" fill="#fff" />
    </svg>
  )
}
