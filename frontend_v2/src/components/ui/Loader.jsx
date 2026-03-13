export default function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px]
                      border-slate-200 border-t-indigo-500" />
      <span className="text-sm">{text}</span>
    </div>
  )
}