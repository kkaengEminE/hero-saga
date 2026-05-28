'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategoryPicker from '@/components/CategoryPicker';
import TraumaInput from '@/components/TraumaInput';
import type { Category } from '@/core/types';

const SESSION_KEY = 'hero-saga:bootstrap-input';

export default function HomePage() {
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);

  function handleSubmit(rawInput: string) {
    if (!category) return;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ category, rawInput }));
    router.push('/journey');
  }

  return (
    <div>
      <p className="text-xs text-[var(--color-muted)] uppercase tracking-[0.3em] mb-2">
        Hero Saga
      </p>
      <h1 className="font-ornate text-4xl italic mb-12">
        당신의 그림자를,<br />당신의 진주로.
      </h1>

      <CategoryPicker selected={category} onSelect={setCategory} />

      {category && <TraumaInput onSubmit={handleSubmit} />}
    </div>
  );
}
