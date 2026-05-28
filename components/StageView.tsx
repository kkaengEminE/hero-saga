'use client';

import type { Stage, ChoiceId } from '@/core/types';

interface Props {
  stage: Stage;
  onChoose: (id: ChoiceId) => void;
  disabled?: boolean;
}

export default function StageView({ stage, onChoose, disabled }: Props) {
  return (
    <div>
      <p className="text-xs text-[var(--color-muted)] uppercase tracking-widest mb-2">
        {stage.number}단계 · {stage.name}
      </p>
      <p className="text-lg leading-relaxed mb-8 whitespace-pre-line">{stage.narrative}</p>
      <div className="space-y-3">
        {stage.choices.map((c) => (
          <button
            key={c.id}
            onClick={() => !disabled && onChoose(c.id)}
            disabled={disabled}
            className={[
              'block w-full text-left p-4 border rounded transition',
              disabled
                ? 'border-[var(--color-line)] text-[var(--color-muted)]'
                : 'border-[var(--color-line)] hover:border-[var(--color-shadow)] hover:bg-white',
            ].join(' ')}
          >
            {c.text}
          </button>
        ))}
      </div>
    </div>
  );
}
