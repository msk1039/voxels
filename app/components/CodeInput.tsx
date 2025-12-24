"use client";

import { useState, useCallback } from "react";
import { COLORS, DEFAULT_EQUATION } from "./constants";

interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
}

export function CodeInput({ value, onChange }: CodeInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const handleApply = useCallback(() => {
    try {
      const func = new Function("x", "y", "z", localValue);
      func(0, 0, 0);
      setError(null);
      onChange(localValue);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code");
    }
  }, [localValue, onChange]);

  const handleReset = useCallback(() => {
    setLocalValue(DEFAULT_EQUATION);
    setError(null);
    onChange(DEFAULT_EQUATION);
  }, [onChange]);

  return (
    <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-200 w-80">
      <div className="text-gray-700 font-medium text-sm mb-2">f(x, y, z)</div>
      <textarea
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full h-40 bg-gray-50 text-gray-800 font-mono text-xs p-3 rounded border border-gray-300 focus:border-blue-500 focus:outline-none resize-none"
        spellCheck={false}
        placeholder="Write your code here..."
      />
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded font-medium transition-colors"
        >
          Apply
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded font-medium transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {Object.entries(COLORS).map(([num, hex]) => (
          <div
            key={num}
            className="flex items-center gap-0.5 text-xs text-gray-500"
          >
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: hex }}
            />
            <span>{num}</span>
          </div>
        ))}
      </div>
      <p className="text-gray-400 text-xs mt-2">
        true → default • 1-10 → color • else → skip
      </p>
    </div>
  );
}
