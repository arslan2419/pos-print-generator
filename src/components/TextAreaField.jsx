const textareaBase =
  'w-full min-h-[80px] resize-y border rounded-md px-3 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] outline-none transition-shadow';
const textareaNormal =
  'border-[#D1D5DB] focus:border-[#3B82F6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]';

export default function TextAreaField({
  label,
  id,
  value,
  onChange,
  placeholder,
  error,
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
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${textareaBase} ${error ? 'border-[#EF4444]' : textareaNormal}`}
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
