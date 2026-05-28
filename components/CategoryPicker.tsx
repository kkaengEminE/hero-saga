'use client';

import { CATEGORIES, CATEGORY_LABEL_KO } from '@/core/types';
import type { Category } from '@/core/types';

interface Props {
  selected: Category | null;
  onSelect: (c: Category) => void;
}

export default function CategoryPicker({ selected, onSelect }: Props) {
  return (
    <div>
      <p className="text-sm text-[var(--color-muted)] uppercase tracking-widest mb-3">
        이 여정의 시작
      </p>
      <h2 className="text-2xl mb-6">먼저 그 감정에 이름을 붙입니다.</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={[
              'px-4 py-3 border rounded text-left transition',
              selected === c
                ? 'border-[var(--color-shadow)] bg-[var(--color-line)]'
                : 'border-[var(--color-line)] hover:border-[var(--color-shadow)]',
            ].join(' ')}
          >
            {CATEGORY_LABEL_KO[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
