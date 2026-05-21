const selectBase =
  'w-full h-11 border rounded-md px-3 text-sm text-[#111827] outline-none transition-shadow appearance-none bg-white';
const selectNormal =
  'border-[#D1D5DB] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]';

export default function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  error,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#1F2937] mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className={`${selectBase} ${error ? 'border-[#EF4444]' : selectNormal}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
          aria-hidden
        >
          ▾
        </span>
      </div>
      {error && (
        <p className="mt-1 text-xs text-[#EF4444]">{error}</p>
      )}
    </div>
  );
}
