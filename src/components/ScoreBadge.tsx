import { scoreLabel } from '../i18n/sv'

const styles: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-amber-100 text-amber-800',
  4: 'bg-lime-100 text-lime-800',
  5: 'bg-emerald-100 text-emerald-700',
}

export function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  return (
    <span
      title={`AI-bedömning: ${scoreLabel[score]}`}
      className={`inline-flex shrink-0 items-center rounded font-semibold ${styles[score]} ${
        large ? 'px-2 py-1 text-sm' : 'px-1.5 py-0.5 text-[11px] leading-none'
      }`}
    >
      {score}/5
    </span>
  )
}
