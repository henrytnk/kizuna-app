import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink font-semibold active:brightness-90',
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
      className={`min-h-14 rounded-2xl px-5 text-lg transition disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}

export function IconButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm text-muted transition active:bg-surface-2 disabled:opacity-30 aria-pressed:bg-surface-2 aria-pressed:text-gold ${className}`}
      {...props}
    />
  )
}

/** Two linked rings: the Kizuna mark. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden="true">
      <circle cx="46" cy="40" r="26" fill="none" stroke="var(--color-accent)" strokeWidth="8" />
      <circle cx="74" cy="40" r="26" fill="none" stroke="var(--color-gold)" strokeWidth="8" />
    </svg>
  )
}
