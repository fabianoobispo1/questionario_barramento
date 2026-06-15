'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FileJson, Loader2 } from 'lucide-react';

type QuestionarioDisponivel = {
  arquivo: string;
  slug: string;
  titulo: string;
};

export default function Home() {
  const [questionarios, setQuestionarios] = useState<QuestionarioDisponivel[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch('/api/questionarios')
      .then((res) => res.json())
      .then((data: { questionarios: QuestionarioDisponivel[] }) => {
        setQuestionarios(data.questionarios ?? []);
      })
      .finally(() => setCarregando(false));
  }, []);

  const vazio = useMemo(() => !carregando && questionarios.length === 0, [carregando, questionarios]);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-en-primary-light">
      <main className="max-w-4xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Central de Questionários
          </h1>
        </header>

        {carregando && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 flex items-center justify-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin text-en-primary" />
            Carregando questionários...
          </div>
        )}

        {vazio && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-800">
            Nenhum arquivo .json foi encontrado em public.
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {questionarios.map((q) => (
            <Link
              key={q.arquivo}
              href={`/questionario/${q.slug}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-en-primary-mid hover:shadow-md transition"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-en-primary-light text-en-primary flex items-center justify-center shrink-0">
                  <FileJson className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800 leading-snug">{q.titulo}</h2>
                  <p className="text-xs text-slate-500 mt-1">Arquivo: {q.arquivo}</p>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
