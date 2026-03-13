import { cn } from '@/lib/utils'

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const pages = getPageNumbers()

  const btnBase = `min-w-[38px] rounded-lg border-[1.5px] border-slate-200 bg-white
                   px-[0.85rem] py-[0.45rem] text-[0.82rem] font-semibold text-slate-600
                   transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600
                   disabled:cursor-not-allowed disabled:opacity-40`

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 py-4">
      <button className={btnBase} onClick={() => onChange(page - 1)} disabled={page <= 1}>
        ‹ Prev
      </button>

      {pages[0] > 1 && (
        <>
          <button className={btnBase} onClick={() => onChange(1)}>1</button>
          {pages[0] > 2 && <span className="px-1 text-slate-400">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(btnBase, p === page && 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700')}
        >
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
          <button className={btnBase} onClick={() => onChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button className={btnBase} onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next ›
      </button>
    </div>
  )
}