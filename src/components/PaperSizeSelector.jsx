import { useState } from 'react';
import { Info } from 'lucide-react';

const OPTIONS = [
  { value: 58, label: '58mm (SpeedX / small thermal)' },
  { value: 80, label: '80mm (standard thermal)' },
];

export default function PaperSizeSelector({ value, onChange }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium text-gray-700">
          Receipt Paper Size
        </label>
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600"
          aria-label="Printer setup help"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          onFocus={() => setShowTip(true)}
          onBlur={() => setShowTip(false)}
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {showTip && (
        <div className="mb-3 p-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg leading-relaxed">
          If text is still getting cut off after selecting 58mm:
          <ol className="list-decimal list-inside mt-1 space-y-0.5">
            <li>Open Settings → Devices → Printers</li>
            <li>Click &quot;SpeedX 400&quot; → Manage → Printing Preferences</li>
            <li>Set Paper Size to &quot;58 x 210mm&quot; or &quot;58mm Receipt&quot;</li>
            <li>Set Margins to 0 on all sides</li>
            <li>Click Apply</li>
          </ol>
          <p className="mt-2">
            When printing, use <strong>Actual size / No scale</strong> (not Fit to
            page).
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map((option) => {
          const selected = Number(value) === option.value;
          return (
            <label
              key={option.value}
              className={`h-[40px] flex items-center justify-center px-3 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                selected
                  ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white'
                  : 'bg-white border-[#D1D5DB] text-gray-800 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="paperSize"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}
