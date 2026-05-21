const inputBase =
  'w-full h-11 border rounded-md px-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-shadow';
const inputNormal =
  'border-[#D1D5DB] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]';
const inputError = 'border-[#EF4444]';
const inputDisabled =
  'bg-[#F9FAFB] text-[#6B7280] cursor-not-allowed border-[#D1D5DB]';

export default function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#1F2937] mb-1.5"
      >
        {label}
        {required && <span className="text-[#EF4444] ml-0.5">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputBase} ${disabled ? inputDisabled : error ? inputError : inputNormal}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  );
}
