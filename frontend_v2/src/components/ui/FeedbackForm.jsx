import { useState, useEffect } from 'react'
import { feedbackApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function FeedbackForm({ productId, initial, onSubmitted }) {
  const { token } = useAuth()
  const [text, setText]       = useState(initial?.message || '')
  const [rating, setRating]   = useState(initial?.rating || 0)
  const [hover, setHover]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setText(initial?.message || '')
    setRating(initial?.rating || 0)
  }, [initial])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await feedbackApi.submit(token, { product_id: productId, message: text, rating })
      setSuccess('Feedback submitted!')
      onSubmitted?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
      {/* Star rating */}
      <div className="flex items-center gap-1">
        <span className="text-[0.78rem] font-semibold text-slate-500 mr-1">Rating:</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="text-[1.3rem] leading-none transition-transform hover:scale-110"
          >
            <span className={(hover || rating) >= n ? 'text-amber-400' : 'text-slate-200'}>★</span>
          </button>
        ))}
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your feedback..."
        rows={2}
        required
        className="resize-none border-slate-200 bg-slate-50 text-[0.82rem]
                   focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      />

      <Button
        type="submit"
        size="sm"
        disabled={loading || !rating || !text.trim()}
        className="self-start bg-indigo-600 hover:bg-indigo-700"
      >
        {loading ? 'Submitting...' : 'Submit Feedback'}
      </Button>

      {error   && <p className="text-[0.78rem] font-semibold text-red-500">{error}</p>}
      {success && <p className="text-[0.78rem] font-semibold text-emerald-600">{success}</p>}
    </form>
  )
}