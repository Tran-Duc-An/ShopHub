import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGiftProfiles } from '@/hooks/useGiftProfiles'
import { useToast } from '@/hooks/use-toast'
import { RELATIONSHIPS, RELATIONSHIP_EMOJIS, SUGGESTED_INTERESTS, ALL_CATEGORIES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Loader from '@/components/ui/Loader'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

const EMPTY_FORM = {
  name: '', relationship: 'girlfriend', birthday: '',
  interests: [], preferred_categories: [],
  price_range_min: 0, price_range_max: 500, notes: '',
}

function ChipSelector({ label, all, selected, onChange, customAllowed = false }) {
  const [custom, setCustom] = useState('')

  const toggle = (item) =>
    onChange(selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item])

  const addCustom = () => {
    const val = custom.trim()
    if (val && !selected.includes(val)) onChange([...selected, val])
    setCustom('')
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-[0.78rem] font-semibold text-slate-600">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {all.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={cn(
              `rounded-full border px-3 py-1 text-[0.72rem] font-semibold transition-all`,
              selected.includes(item)
                ? 'border-indigo-500 bg-indigo-600 text-white'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
            )}
          >
            {item}
          </button>
        ))}
      </div>
      {customAllowed && (
        <div className="flex gap-2 mt-1">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
            placeholder="Add custom..."
            className="h-8 border-slate-200 bg-slate-50 text-[0.8rem]"
          />
          <Button type="button" size="sm" variant="outline" onClick={addCustom} className="h-8 text-[0.75rem]">
            Add
          </Button>
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5
                         text-[0.7rem] font-semibold text-indigo-700"
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(selected.filter((x) => x !== s))}
                className="text-indigo-400 hover:text-indigo-700 ml-0.5"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GiftProfilesPage() {
  const { profiles, loading, create, update, remove } = useGiftProfiles()
  const { toast } = useToast()
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [open, setOpen]         = useState(false)

  const set = (field) => (val) =>
    setForm((prev) => ({ ...prev, [field]: val }))
  const setField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setOpen(true)
  }

  const openEdit = (p) => {
    setForm({
      name: p.name,
      relationship: p.relationship,
      birthday: p.birthday ? new Date(p.birthday).toISOString().split('T')[0] : '',
      interests: p.interests || [],
      preferred_categories: p.preferred_categories || [],
      price_range_min: p.price_range_min || 0,
      price_range_max: p.price_range_max || 500,
      notes: p.notes || '',
    })
    setEditingId(p.profile_id)
    setOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const body = { ...form, birthday: form.birthday || undefined }
      if (editingId) await update(editingId, body)
      else await create(body)
      toast({ title: editingId ? 'Profile updated!' : 'Profile created!' })
      setOpen(false)
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this gift profile?')) return
    try {
      await remove(id)
      toast({ title: 'Profile deleted' })
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' })
    }
  }

  if (loading) return <Loader text="Loading profiles..." />

  return (
    <div className="animate-fade-up max-w-[1100px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-[1.75rem] font-extrabold tracking-tight text-slate-900 md:text-[1.25rem]">
            🎁 Gift Profiles
          </h2>
          <p className="text-[0.88rem] text-slate-400 mt-0.5">
            Create profiles for loved ones and get AI-powered gift suggestions
          </p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700">
          + New Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          icon="🎁"
          title="No gift profiles yet"
          description="Create a profile for someone special to get personalised gift suggestions"
          action={<Button onClick={openCreate}>Create Your First Profile</Button>}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-2 md:grid-cols-1">
          {profiles.map((p) => (
            <div
              key={p.profile_id}
              className="flex flex-col rounded-card2 border border-slate-200 bg-white
                         p-5 transition-all hover:-translate-y-0.5 hover:shadow-card"
            >
              {/* Card header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[2rem]">{RELATIONSHIP_EMOJIS[p.relationship] || '🎁'}</span>
                <div>
                  <h3 className="text-[1rem] font-bold text-slate-900">{p.name}</h3>
                  <span className="text-[0.75rem] font-semibold capitalize text-slate-400">
                    {p.relationship}
                  </span>
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-col gap-1.5 mb-4 text-[0.82rem] text-slate-500">
                {p.birthday && (
                  <span>🎂 {new Date(p.birthday).toLocaleDateString()}</span>
                )}
                {p.interests?.length > 0 && (
                  <span className="line-clamp-2">💡 {p.interests.join(', ')}</span>
                )}
                <span>💰 ${p.price_range_min} – ${p.price_range_max}</span>
                {p.gift_history?.length > 0 && (
                  <span>📦 {p.gift_history.length} gift{p.gift_history.length > 1 ? 's' : ''} given</span>
                )}
              </div>

              {/* Actions */}
              <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                <Link to={`/ai-assistant?profile=${p.profile_id}`}>
                  <Button size="sm" className="bg-indigo-600 text-[0.75rem] hover:bg-indigo-700">
                    🤖 Get Suggestions
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}
                  className="text-[0.75rem]">
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(p.profile_id)}
                  className="border-red-200 text-[0.75rem] text-red-500 hover:bg-red-50">
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog form */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Profile' : 'Create New Profile'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[0.78rem] font-semibold text-slate-600">Name *</Label>
                <Input value={form.name} onChange={setField('name')} required
                  placeholder="e.g. Sarah"
                  className="border-slate-200 bg-slate-50 text-[0.87rem]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[0.78rem] font-semibold text-slate-600">Relationship *</Label>
                <select
                  value={form.relationship}
                  onChange={setField('relationship')}
                  className="rounded-lg border-[1.5px] border-slate-200 bg-slate-50 px-3
                             py-2 text-[0.87rem] outline-none focus:border-indigo-400"
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {RELATIONSHIP_EMOJIS[r]} {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[0.78rem] font-semibold text-slate-600">Birthday</Label>
              <Input type="date" value={form.birthday} onChange={setField('birthday')}
                className="border-slate-200 bg-slate-50 text-[0.87rem]" />
            </div>

            <ChipSelector
              label="Interests"
              all={SUGGESTED_INTERESTS}
              selected={form.interests}
              onChange={set('interests')}
              customAllowed
            />

            <ChipSelector
              label="Preferred Categories"
              all={ALL_CATEGORIES}
              selected={form.preferred_categories}
              onChange={set('preferred_categories')}
            />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[0.78rem] font-semibold text-slate-600">Min Budget ($)</Label>
                <Input type="number" value={form.price_range_min}
                  onChange={(e) => setForm((p) => ({ ...p, price_range_min: Number(e.target.value) }))}
                  min="0" className="border-slate-200 bg-slate-50 text-[0.87rem]" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[0.78rem] font-semibold text-slate-600">Max Budget ($)</Label>
                <Input type="number" value={form.price_range_max}
                  onChange={(e) => setForm((p) => ({ ...p, price_range_max: Number(e.target.value) }))}
                  min="0" className="border-slate-200 bg-slate-50 text-[0.87rem]" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[0.78rem] font-semibold text-slate-600">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={setField('notes')}
                placeholder="Any additional details..."
                rows={3}
                className="resize-none border-slate-200 bg-slate-50 text-[0.87rem]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingId ? 'Update' : 'Create'} Profile
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}