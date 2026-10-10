export function PageLoader({
  label = "",
  invert = false,
}: {
  label?: string;
  invert?: boolean;
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3 py-20" role="status">
      <div
        className={`h-9 w-9 rounded-full border-4 animate-spin ${
          invert ? "border-slate-600 border-t-slate-200" : "border-[#62381d]/15 border-t-[#62381d]"
        }`}
      />
      {label ? (
        <p className={`text-sm ${invert ? "text-slate-300" : "text-[#62381d]/70"}`}>{label}</p>
      ) : null}
    </div>
  );
}

export default PageLoader;