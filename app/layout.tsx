import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hero Saga',
  description: '당신의 트라우마를 5단계 영웅 서사로 변환합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <main className="max-w-2xl mx-auto px-6 py-16">{children}</main>
        <footer className="max-w-2xl mx-auto px-6 pb-10 text-xs text-[var(--color-muted)] text-center">
          이 도구는 치료를 대체하지 않습니다. 도움이 필요하시면 자살예방상담전화 ☎ 1577-0199
        </footer>
      </body>
    </html>
  );
}
