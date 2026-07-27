import { cn } from '@/shared/lib/cn'

interface ChipButtonProps {
  value: number
  selected: boolean
  disabled?: boolean
  onSelect: (value: number) => void
}

export function ChipButton({ value, selected, disabled, onSelect }: ChipButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'min-w-[3.5rem] rounded-full border-2 border-gold/35 px-3 py-2.5 font-bold text-gray-800',
        '[background:radial-gradient(circle_at_30%_30%,var(--color-gold-soft),var(--color-gold-deep))]',
        selected && 'outline outline-[3px] outline-offset-2 outline-gold',
      )}
      disabled={disabled}
      onClick={() => onSelect(value)}
    >
      ${value}
    </button>
  )
}
