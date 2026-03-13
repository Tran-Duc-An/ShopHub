import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SORT_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * ProductFilters
 *
 * Props:
 *   filters       — current filter values
 *   onSearch      — called with new filters when Search is clicked
 *   onClear       — called when Clear is clicked
 *   showSearch    — show the text search input (default true)
 *   showSort      — show the sort dropdown (default true)
 */
export default function ProductFilters({
  filters = {},
  onSearch,
  onClear,
  showSearch = true,
  showSort = true,
}) {
  const [local, setLocal] = useState(filters)
  const [open, setOpen] = useState(false)

  const set = (field) => (e) => setLocal((prev) => ({ ...prev, [field]: e.target.value }))

  const hasActive = Object.values(filters).some((v) => v !== '' && v !== undefined)

  const inputCls = `border-[1.5px] border-slate-200 bg-slate-50 text-[0.82rem]
                    focus:border-indigo-400 focus:bg-white min-w-[120px] flex-1`

  return (
    <div className="mb-6 mt-4">
      {/* Mobile toggle */}
      <div className="mb-2 flex items-center justify-between md:flex">
        <button
          className={cn(
            `hidden md:flex items-center gap-1.5 rounded-lg border-[1.5px] border-slate-200
             bg-white px-3 py-1.5 text-[0.82rem] font-semibold text-slate-600
             hover:bg-slate-50 relative`,
          )}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? '✕ Close' : '⚙ Filters'}
          {hasActive && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {/* Filter bar — always visible desktop, toggle on mobile */}
      <div
        className={cn(
          `flex flex-wrap gap-2 rounded-[14px] border border-slate-200 bg-white
           px-4 py-[0.85rem]`,
          // Mobile: hidden unless open
          `md:flex-col`,
          open ? 'md:flex' : 'md:hidden',
        )}
      >
        {showSearch && (
          <Input
            placeholder="Search products..."
            value={local.q || ''}
            onChange={set('q')}
            className={inputCls}
          />
        )}
        <Input
          placeholder="Brand"
          value={local.brand || ''}
          onChange={set('brand')}
          className={inputCls}
        />
        <Input
          type="number"
          placeholder="Min $"
          value={local.minPrice || ''}
          onChange={set('minPrice')}
          className={cn(inputCls, 'min-w-[80px]')}
        />
        <Input
          type="number"
          placeholder="Max $"
          value={local.maxPrice || ''}
          onChange={set('maxPrice')}
          className={cn(inputCls, 'min-w-[80px]')}
        />
        <select
          value={local.rating || ''}
          onChange={set('rating')}
          className={cn(inputCls, 'rounded-lg px-3 py-2 outline-none')}
        >
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
          <option value="2">2+ Stars</option>
        </select>
        {showSort && (
          <select
            value={local.sort || ''}
            onChange={set('sort')}
            className={cn(inputCls, 'rounded-lg px-3 py-2 outline-none')}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
        <div className="flex gap-2 md:flex-col">
          <Button size="sm" onClick={() => onSearch?.(local)}>
            Search
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setLocal({})
              onClear?.()
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  )
}