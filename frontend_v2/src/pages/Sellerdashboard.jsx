import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { productsApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import Loader from '@/components/ui/Loader'
import EmptyState from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

const EMPTY_FORM = {
  product_name: '', description: '', brand: '',
  initial_price: '', final_price: '', currency: 'USD',
  image_url: '', stock_quantity: '100',
}

const inputCls = `border-[1.5px] border-slate-200 bg-slate-50 text-[0.87rem]
                  focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100`
const labelCls = `text-[0.78rem] font-semibold text-slate-600`

export default function SellerDashboard() {
  const { token } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef(null)

  const [products, setProducts]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [uploading, setUploading]   = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getMyProducts(token)
      setProducts(data.data || [])
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchProducts() }, [])

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
  }

  const uploadImage = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const data = await productsApi.uploadImage(token, file)
      setForm((prev) => ({ ...prev, image_url: data.url }))
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file?.type.startsWith('image/')) uploadImage(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await productsApi.update(token, editingId, form)
        toast({ title: 'Product updated!' })
      } else {
        await productsApi.create(token, form)
        toast({ title: 'Product created!' })
      }
      resetForm()
      fetchProducts()
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (p) => {
    setForm({
      product_name: p.product_name || '',
      description: p.description || '',
      brand: p.brand || '',
      initial_price: p.initial_price || '',
      final_price: p.final_price || '',
      currency: p.currency || 'USD',
      image_url: p.image_url || '',
      stock_quantity: p.stock_quantity || '100',
    })
    setEditingId(p.product_id)
    setShowForm(true)
  }

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await productsApi.delete(token, id)
      toast({ title: 'Product deleted' })
      fetchProducts()
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' })
    }
  }

  if (loading) return <Loader text="Loading your products..." />

  return (
    <div className="animate-fade-up max-w-[1100px] mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-[1.75rem] font-extrabold tracking-tight text-slate-900 md:text-[1.25rem]">
            Seller Dashboard
          </h2>
          <p className="text-[0.82rem] text-slate-400 mt-0.5">
            {products.length} product{products.length !== 1 ? 's' : ''} listed
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowForm((s) => !s) }}
          className={showForm
            ? 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            : 'bg-indigo-600 hover:bg-indigo-700'}
          variant={showForm ? 'outline' : 'default'}
        >
          {showForm ? '✕ Cancel' : '+ New Product'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 rounded-card2 border border-slate-200 bg-white p-7 shadow-auth">
          <h3 className="mb-5 text-[1.1rem] font-bold text-slate-900">
            {editingId ? 'Edit Product' : 'New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <Label className={labelCls}>Product Name *</Label>
                <Input value={form.product_name} onChange={set('product_name')} required className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className={labelCls}>Brand</Label>
                <Input value={form.brand} onChange={set('brand')} className={inputCls} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={labelCls}>Description</Label>
              <Textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                className={cn(inputCls, 'resize-none')}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 sm:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <Label className={labelCls}>Initial Price</Label>
                <Input type="number" step="0.01" value={form.initial_price} onChange={set('initial_price')} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className={labelCls}>Final Price *</Label>
                <Input type="number" step="0.01" value={form.final_price} onChange={set('final_price')} required className={inputCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className={labelCls}>Stock Qty</Label>
                <Input type="number" value={form.stock_quantity} onChange={set('stock_quantity')} className={inputCls} />
              </div>
            </div>

            {/* Image dropzone */}
            <div className="flex flex-col gap-1.5">
              <Label className={labelCls}>Product Image</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                className={cn(
                  `flex h-[130px] cursor-pointer items-center justify-center rounded-[14px]
                   border-2 border-dashed transition-all`,
                  dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => uploadImage(e.target.files?.[0])}
                />
                {uploading ? (
                  <p className="text-[0.82rem] text-slate-400">Uploading…</p>
                ) : form.image_url ? (
                  <div className="flex flex-col items-center gap-1">
                    <img src={form.image_url} alt="Preview" className="max-h-[80px] max-w-[120px] object-contain rounded" />
                    <p className="text-[0.7rem] text-slate-400">Click to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <span className="text-3xl">📷</span>
                    <p className="text-[0.82rem]">Drag & drop or click to browse</p>
                    <p className="text-[0.7rem]">JPEG, PNG, GIF, WebP · max 5 MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={labelCls}>…or paste Image URL</Label>
              <Input value={form.image_url} onChange={set('image_url')} placeholder="https://..." className={inputCls} />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="self-start bg-indigo-600 px-8 hover:bg-indigo-700"
            >
              {submitting ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </Button>
          </form>
        </div>
      )}

      {/* Products table */}
      {products.length === 0 && !showForm ? (
        <EmptyState icon="📦" title="No products yet" description="Create your first listing above." />
      ) : products.length > 0 ? (
        <div className="overflow-x-auto rounded-card border border-slate-200 bg-white">
          <table className="w-full text-[0.82rem]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Product', 'Brand', 'Price', 'Stock', 'Rating', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[0.72rem] font-bold
                                         uppercase tracking-wide text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt=""
                          className="h-9 w-9 rounded-lg object-contain bg-slate-100"
                        />
                      )}
                      <span className="font-medium text-slate-800 max-w-[200px] truncate">
                        {p.product_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.brand || '—'}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">${p.final_price}</td>
                  <td className="px-4 py-3 text-slate-500">{p.stock_quantity}</td>
                  <td className="px-4 py-3 text-amber-500">
                    {p.rating ? `${p.rating} ★` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(p)}
                        className="h-7 text-[0.72rem]">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => deleteProduct(p.product_id)}
                        className="h-7 border-red-200 text-[0.72rem] text-red-500 hover:bg-red-50">
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}