export default function SectionCard({ icon, title, subtitle, children }) {
  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="mb-5 flex items-start gap-3 border-b border-gray-100 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}