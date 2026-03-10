'use client';

import { useEffect, useState, useCallback } from 'react';
import { Questionario, Respostas, Secao } from '@/types/questionario';
import CampoFormulario from '@/components/CampoFormulario';

type Erros = Record<string, string>;

export default function Home() {
  const [questionario, setQuestionario] = useState<Questionario | null>(null);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [erros, setErros] = useState<Erros>({});
  const [secaoAtiva, setSecaoAtiva] = useState(0);
  const [exportando, setExportando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    fetch('/questionario.json')
      .then((r) => r.json())
      .then((data: Questionario) => setQuestionario(data));
  }, []);

  const handleChange = useCallback((id: string, valor: string | string[]) => {
    setRespostas((prev) => ({ ...prev, [id]: valor }));
    setErros((prev) => {
      const novo = { ...prev };
      delete novo[id];
      return novo;
    });
  }, []);

  const validarSecao = (secao: Secao): Erros => {
    const novosErros: Erros = {};
    for (const pergunta of secao.perguntas) {
      if (!pergunta.obrigatorio) continue;
      const val = respostas[pergunta.id];
      const vazio =
        !val || (Array.isArray(val) ? val.length === 0 : val.trim() === '');
      if (vazio) {
        novosErros[pergunta.id] = 'Campo obrigatório';
      }
    }
    return novosErros;
  };

  const avancar = () => {
    if (!questionario) return;
    const secao = questionario.secoes[secaoAtiva];
    const novosErros = validarSecao(secao);
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }
    setSecaoAtiva((i) => i + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const voltar = () => {
    setSecaoAtiva((i) => i - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportar = async (formato: 'tsv' | 'xlsx') => {
    if (!questionario) return;

    const todosErros: Erros = {};
    for (const secao of questionario.secoes) {
      Object.assign(todosErros, validarSecao(secao));
    }
    if (Object.keys(todosErros).length > 0) {
      setErros(todosErros);
      alert('Há campos obrigatórios não preenchidos. Revise as seções antes de exportar.');
      return;
    }

    setExportando(true);
    try {
      const res = await fetch('/api/exportar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respostas, formato, questionario }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `onboarding-barramento.${formato}`;
      a.click();
      URL.revokeObjectURL(url);
      setEnviado(true);
    } finally {
      setExportando(false);
    }
  };

  if (!questionario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const totalSecoes = questionario.secoes.length;
  const secao = questionario.secoes[secaoAtiva];
  const progresso = Math.round(((secaoAtiva + 1) / totalSecoes) * 100);
  const ultimaSecao = secaoAtiva === totalSecoes - 1;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-blue-600" />
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              {questionario.titulo}
            </h1>
            <p className="text-xs text-slate-500">
              Seção {secaoAtiva + 1} de {totalSecoes}
            </p>
          </div>
        </div>
        <div className="h-1 bg-slate-100">
          <div
            className="h-1 bg-blue-600 transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Navegação de seções */}
        <nav className="mb-6 flex flex-wrap gap-2">
          {questionario.secoes.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setSecaoAtiva(i)}
              className={`text-xs px-3 py-1 rounded-full border transition font-medium ${
                i === secaoAtiva
                  ? 'bg-blue-600 text-white border-blue-600'
                  : i < secaoAtiva
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {i + 1}. {s.titulo.replace(/^\d+[\.\d]*\.\s*/, '')}
            </button>
          ))}
        </nav>

        {/* Card da seção */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-linear-to-r from-blue-800 to-blue-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">{secao.titulo}</h2>
            {secao.descricao && (
              <p className="text-blue-100 text-sm mt-1">{secao.descricao}</p>
            )}
          </div>

          <div className="p-6 space-y-6">
            {secao.perguntas.map((pergunta) => (
              <div key={pergunta.id}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {pergunta.label}
                  {pergunta.obrigatorio && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>
                <CampoFormulario
                  pergunta={pergunta}
                  respostas={respostas}
                  onChange={handleChange}
                  erro={erros[pergunta.id]}
                />
              </div>
            ))}
          </div>

          <div className="px-6 pb-6 flex items-center justify-between gap-3">
            <button
              onClick={voltar}
              disabled={secaoAtiva === 0}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ← Voltar
            </button>

            <div className="flex items-center gap-2">
              {ultimaSecao ? (
                <>
                  <button
                    onClick={() => exportar('tsv')}
                    disabled={exportando}
                    className="px-4 py-2 rounded-lg border border-blue-300 bg-blue-50 text-sm text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition font-medium"
                  >
                    ↓ Exportar TSV
                  </button>
                  <button
                    onClick={() => exportar('xlsx')}
                    disabled={exportando}
                    className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition"
                  >
                    {exportando ? 'Gerando...' : '↓ Exportar Excel'}
                  </button>
                </>
              ) : (
                <button
                  onClick={avancar}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Próximo →
                </button>
              )}
            </div>
          </div>
        </div>

        {enviado && (
          <div className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium text-center">
            ✓ Arquivo exportado com sucesso! Você pode exportar novamente a qualquer momento.
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          Campos marcados com <span className="text-red-400">*</span> são obrigatórios
        </p>
      </main>
    </div>
  );
}
