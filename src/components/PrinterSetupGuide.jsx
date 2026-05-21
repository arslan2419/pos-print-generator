import { useState } from 'react';
import { Info } from 'lucide-react';

export default function PrinterSetupGuide() {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          Receipt: 58mm paper / POS58 driver (48mm print)
        </span>
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
        <div className="mt-3 p-3 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg leading-relaxed">
          <p className="font-semibold text-gray-700 mb-1">
            Printer Setup — SpeedX 400 / POS58ENG
          </p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>POS58 Advanced Options → Paper: 48mm × 3276mm (203dpi)</li>
            <li>Margins: 0mm on all sides</li>
            <li>Print Density: 7–8 (default 5 is too faint)</li>
            <li>Scaling: Actual size / 100% / noscale — not Fit to page</li>
          </ol>
        </div>
      )}
    </div>
  );
}
