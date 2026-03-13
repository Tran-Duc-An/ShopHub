export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex animate-fade-up flex-col items-center justify-center
                    px-4 py-16 text-center">
      <span className="mb-3 text-5xl">{icon}</span>
      {title && <h3 className="mb-2 text-lg font-bold text-slate-800">{title}</h3>}
      {description && <p className="mb-5 text-slate-500">{description}</p>}
      {action}
    </div>
  )
}