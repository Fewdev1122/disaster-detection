export default function SectionCard({ icon, title, subtitle, children }) {
  return (
    <div className="border border-slate-200 bg-white">
      <div className="mb-4 flex items-start gap-3 border-b border-slate-200 px-4 py-4">
        <div className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="space-y-4 px-4 pb-4">{children}</div>
    </div>
  );
}