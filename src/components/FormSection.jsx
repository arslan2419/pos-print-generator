export default function FormSection({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="bg-white border border-[#E5E7EB] rounded-lg p-6">
      <div className="flex items-start gap-2 mb-5">
        {Icon && (
          <Icon className="w-5 h-5 text-[#3B82F6] mt-0.5 shrink-0" aria-hidden />
        )}
        <div>
          <h2 className="text-base font-bold text-[#1F2937]">{title}</h2>
          {subtitle && (
            <p className="text-[13px] font-normal text-[#6B7280] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
