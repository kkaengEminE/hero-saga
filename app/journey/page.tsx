'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProgressIndicator from '@/components/ProgressIndicator';
import StageView from '@/components/StageView';
import LegacyCard from '@/components/LegacyCard';
import SafetyEscalationCard from '@/components/SafetyEscalationCard';
import type {
  Category, ChoiceId, JourneyState, Stage,
  LegacyCard as LegacyCardData, AllegoryFrame,
} from '@/core/types';

const SESSION_KEY = 'hero-saga:bootstrap-input';

type View =
  | { kind: 'loading' }
  | { kind: 'stage'; state: JourneyState; busy: boolean }
  | { kind: 'card'; state: JourneyState }
  | { kind: 'safety' }
  | { kind: 'error'; message: string; retry: () => void };

export default function JourneyPage() {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: 'loading' });

  const restart = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    router.push('/');
  }, [router]);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      router.replace('/');
      return;
    }
    let parsed: { category: Category; rawInput: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      router.replace('/');
      return;
    }
    bootstrap(parsed.category, parsed.rawInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap(category: Category, rawInput: string) {
    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'bootstrap', category, rawInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'request failed');

      if ('safetyEscalation' in data && data.safetyEscalation === true) {
        sessionStorage.removeItem(SESSION_KEY);
        setView({ kind: 'safety' });
        return;
      }

      const allegory = data.allegory as AllegoryFrame;
      const stage = data.stage as Stage;
      const initialState: JourneyState = {
        category,
        allegory,
        history: [],
        currentStage: stage,
        legacyCard: null,
      };
      sessionStorage.removeItem(SESSION_KEY);
      setView({ kind: 'stage', state: initialState, busy: false });
    } catch (err) {
      setView({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
        retry: restart,
      });
    }
  }

  async function handleChoice(choiceId: ChoiceId) {
    if (view.kind !== 'stage' || view.busy) return;
    const state = view.state;
    const current = state.currentStage!;
    const newHistory = [
      ...state.history,
      {
        stage: current.number,
        chosenId: choiceId,
        chosenText: current.choices.find((c) => c.id === choiceId)?.text ?? '',
      },
    ];

    setView({ ...view, busy: true });

    try {
      const res = await fetch('/api/journey', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'advance',
          state: { ...state, history: newHistory },
          choiceId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'request failed');

      if ('legacyCard' in data) {
        const card = data.legacyCard as LegacyCardData;
        setView({
          kind: 'card',
          state: { ...state, history: newHistory, legacyCard: card, currentStage: null },
        });
      } else if ('stage' in data) {
        const next = data.stage as Stage;
        setView({
          kind: 'stage',
          state: { ...state, history: newHistory, currentStage: next },
          busy: false,
        });
      } else {
        throw new Error('unexpected response shape');
      }
    } catch (err) {
      setView({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
        retry: restart,
      });
    }
  }

  if (view.kind === 'loading') {
    return <p className="text-center text-[var(--color-muted)]">알레고리를 짓는 중…</p>;
  }
  if (view.kind === 'safety') {
    return <SafetyEscalationCard onRestart={restart} />;
  }
  if (view.kind === 'card') {
    return (
      <>
        <ProgressIndicator current={5} />
        <LegacyCard card={view.state.legacyCard!} onRestart={restart} />
      </>
    );
  }
  if (view.kind === 'error') {
    return (
      <div className="text-center">
        <p className="mb-4">문제가 발생했어요: {view.message}</p>
        <button onClick={view.retry} className="underline text-[var(--color-muted)]">
          처음으로
        </button>
      </div>
    );
  }
  return (
    <>
      <ProgressIndicator current={view.state.currentStage!.number} />
      {view.busy ? (
        <p className="text-center text-[var(--color-muted)]">다음 장면을 짓는 중…</p>
      ) : (
        <StageView
          stage={view.state.currentStage!}
          onChoose={handleChoice}
          disabled={false}
        />
      )}
    </>
  );
}
