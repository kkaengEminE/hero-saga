'use client';

interface Props {
  onRestart: () => void;
}

export default function SafetyEscalationCard({ onRestart }: Props) {
  return (
    <div className="max-w-md mx-auto text-center">
      <p className="text-sm text-[var(--color-muted)] uppercase tracking-widest mb-4">
        잠시 멈추기
      </p>
      <h2 className="text-2xl mb-6 leading-relaxed">
        지금은 게임보다,<br />누군가와 이야기하는 것이 필요할 수 있어요.
      </h2>
      <div className="border border-[var(--color-line)] rounded p-6 my-6 text-left">
        <p className="font-medium mb-2">자살예방상담전화</p>
        <a
          href="tel:1577-0199"
          className="text-2xl underline"
        >
          ☎ 1577-0199
        </a>
        <p className="text-xs text-[var(--color-muted)] mt-3">
          24시간 / 한국어 / 익명 가능
        </p>
      </div>
      <button
        onClick={onRestart}
        className="text-sm underline text-[var(--color-muted)] hover:text-[var(--color-ink)] mt-6"
      >
        ↺ 처음 화면으로 돌아가기
      </button>
    </div>
  );
}
