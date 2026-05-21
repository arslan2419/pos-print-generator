import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
const MAX_SIZE = 2 * 1024 * 1024;

export default function LogoUploader({ logoDataUrl, onLogoChange, error }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');

  const processFile = (file) => {
    setLocalError('');
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError('Please upload a PNG, JPG, or SVG image');
      return;
    }
    if (file.size > MAX_SIZE) {
      setLocalError('File size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onLogoChange(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const displayError = error || localError;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-md p-8 cursor-pointer transition-colors ${
            dragOver
              ? 'border-[#3B82F6] bg-blue-50'
              : 'border-[#D1D5DB] hover:border-[#3B82F6]'
          }`}
        >
          <Upload className="w-8 h-8 text-[#9CA3AF]" />
          <p className="text-sm font-semibold text-[#1F2937]">Click to Upload</p>
          <p className="text-xs text-[#6B7280] text-center">
            or drag and drop PNG, JPG, SVG (max 2MB)
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={(e) => processFile(e.target.files?.[0])}
        />
        {logoDataUrl && (
          <button
            type="button"
            onClick={() => {
              onLogoChange(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="mt-3 text-sm text-[#EF4444] hover:text-red-700 font-medium"
          >
            Remove
          </button>
        )}
        {displayError && (
          <p className="mt-2 text-xs text-[#EF4444]">{displayError}</p>
        )}
      </div>

      <div className="flex flex-col items-center">
        <div className="w-full bg-[#F3F4F6] rounded-md flex items-center justify-center min-h-[140px] p-4">
          {logoDataUrl ? (
            <img
              src={logoDataUrl}
              alt="Logo preview"
              className="max-h-24 max-w-full object-contain"
            />
          ) : (
            <span className="text-sm text-[#9CA3AF]">No logo uploaded</span>
          )}
        </div>
        <p className="text-xs text-[#6B7280] mt-2">Logo Preview</p>
      </div>
    </div>
  );
}
