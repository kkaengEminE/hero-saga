import { STAGE_NAME_KO } from '@/core/types';
import type { StageNumber } from '@/core/types';

interface Props {
  current: StageNumber | null;
}

const STAGES: StageNumber[] = [1, 2, 3, 4, 5];

export default function ProgressIndicator({ current }: Props) {
  return (
    <div className="flex justify-center gap-6 text-xs text-[var(--color-muted)] uppercase tracking-widest mb-12">
      {STAGES.map((s) => (
        <span
          key={s}
          className={current === s ? 'text-[var(--color-ink)] font-medium' : ''}
        >
          {s}. {STAGE_NAME_KO[s]}
        </span>
      ))}
    </div>
  );
}
