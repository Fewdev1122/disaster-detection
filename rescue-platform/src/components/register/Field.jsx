export default function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold tracking-wide text-slate-600">
        {label}
      </label>

      {children}
    </div>
  );
}