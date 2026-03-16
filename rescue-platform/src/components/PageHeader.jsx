export default function PageHeader({ title, subtitle, icon }) {
  return (
    <div className="border border-slate-200 bg-white px-5 py-5">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50 text-slate-700">
            {icon}
          </div>
        )}

        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 leading-6">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}