'use client';

import type { LegacyCard as LegacyCardData } from '@/core/types';

interface Props {
  card: LegacyCardData;
  onRestart: () => void;
}

export default function LegacyCard({ card, onRestart }: Props) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="ornate-frame">
        <p className="font-ornate text-xs uppercase tracking-[0.3em] text-center opacity-70 mb-4">
          The Chronicle of Resilience
        </p>
        <h2 className="font-ornate text-3xl text-center italic mb-8">{card.title}</h2>

        <div className="border-t border-b border-[var(--color-gold)] py-6 my-6">
          <p className="font-ornate text-base leading-relaxed text-center whitespace-pre-line">
            {card.chronicleSummary}
          </p>
        </div>

        <blockquote className="font-ornate text-lg italic text-center my-8">
          {card.heroMonologue}
        </blockquote>

        <p className="font-ornate text-xs uppercase tracking-[0.3em] text-center opacity-50 mt-6">
          ❦ ❦ ❦
        </p>
      </div>

      <details className="mt-6 text-xs text-[var(--color-muted)]">
        <summary className="cursor-pointer">Visual prompt (이미지 생성용)</summary>
        <p className="mt-2 p-3 bg-white border border-[var(--color-line)] rounded whitespace-pre-line">
          {card.visualPrompt}
        </p>
      </details>

      <div className="mt-8 text-center">
        <button
          onClick={onRestart}
          className="text-sm underline text-[var(--color-muted)] hover:text-[var(--color-ink)]"
        >
          ↺ 처음부터 다시
        </button>
      </div>
    </div>
  );
}
