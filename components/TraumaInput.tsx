'use client';

import { useState } from 'react';

interface Props {
  onSubmit: (rawInput: string) => void;
  disabled?: boolean;
}

export default function TraumaInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('');
  const canSubmit = value.trim().length >= 8 && !disabled;

  return (
    <div className="mt-8">
      <label className="block text-sm text-[var(--color-muted)] uppercase tracking-widest mb-3">
        그 경험을 짧게 들려주세요
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        maxLength={2000}
        placeholder="구체적이지 않아도 됩니다. 몇 줄이면 충분합니다."
        className="w-full p-3 border border-[var(--color-line)] rounded bg-white focus:border-[var(--color-shadow)] outline-none"
      />
      <div className="mt-3 flex justify-between items-center">
        <span className="text-xs text-[var(--color-muted)]">{value.length} / 2000</span>
        <button
          onClick={() => canSubmit && onSubmit(value.trim())}
          disabled={!canSubmit}
          className={[
            'px-6 py-2 rounded border transition',
            canSubmit
              ? 'border-[var(--color-shadow)] bg-[var(--color-deep)] text-[var(--color-gold)] hover:opacity-90'
              : 'border-[var(--color-line)] text-[var(--color-muted)] cursor-not-allowed',
          ].join(' ')}
        >
          여정을 시작한다
        </button>
      </div>
    </div>
  );
}
