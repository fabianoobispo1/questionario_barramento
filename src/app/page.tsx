'use client';

import { useEffect, useState, useCallback } from 'react';
import { Questionario, Respostas, Secao } from '@/types/questionario';
import CampoFormulario from '@/components/CampoFormulario';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Zap,
} from 'lucide-react';

type Erros = Record<string, string>;

export default function Home() {
  const [questionario, setQuestionario] = useState<Questionario | null>(null);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [erros, setErros] = useState<Erros>({});
  const [secaoAtiva, setSecaoAtiva] = useState(0);
  const [exportando, setExportando] = useState(false);

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

  const gerarMarkdown = (): string => {
    if (!questionario) return '';

    const formatarValor = (valor: string | string[] | undefined): string => {
      if (!valor) return ' ';
      if (Array.isArray(valor)) return valor.join(' / ');
      // Substitui quebras de linha por <br> para funcionar em tabelas MD
      return valor.replace(/\n/g, ' <br> ');
    };

    const getMainNum = (titulo: string): string => {
      const m = titulo.match(/^(\d+)[\.\d]/);
      return m ? m[1] : '';
    };

    const isSubsecao = (titulo: string): boolean => /^\d+\.\d+/.test(titulo);

    const lines: string[] = [];
    let ultimoMainNum = '';

    for (const secao of questionario.secoes) {
      const mainNum = getMainNum(secao.titulo);

      // Separador e cabeçalho de seção principal ao mudar de número
      if (mainNum && mainNum !== ultimoMainNum) {
        if (ultimoMainNum !== '') lines.push('\n---\n');
        if (!isSubsecao(secao.titulo)) {
          lines.push(`## ${secao.titulo}\n`);
        }
        ultimoMainNum = mainNum;
      }

      if (isSubsecao(secao.titulo)) {
        lines.push(`### ${secao.titulo}\n`);
      } else if (!mainNum || ultimoMainNum !== mainNum) {
        lines.push(`## ${secao.titulo}\n`);
      }

      if (secao.descricao) {
        lines.push(`> ${secao.descricao}\n`);
      }

      // Tabela
      const isIdentificacao = secao.perguntas.some(
        (p) => p.id === 'nome_projeto' || p.id === 'area_time'
      );
      const colLabel = isIdentificacao ? 'Campo' : 'Pergunta';
      lines.push(`| ${colLabel} | Resposta |`);
      lines.push('|---|---|');
      for (const pergunta of secao.perguntas) {
        const label = pergunta.label.replace(/\*\*/g, '');
        const resposta = formatarValor(respostas[pergunta.id]);
        lines.push(`| ${label} | ${resposta} |`);
      }
      lines.push('');
    }

    // Checklist final
    lines.push('---\n');
    lines.push('## Checklist de Entrega\n');
    lines.push('Antes de enviar, confirme que você preencheu:\n');
    lines.push('- [ ] Tipo de origem e destino');
    lines.push('- [ ] Lista de tabelas/views com volumetria diária em **Bytes**');
    lines.push('- [ ] Presença (ou ausência) de PK / Unique Index em cada tabela');
    lines.push('- [ ] Indicação clara se há transformação e onde ela ocorre');
    lines.push('- [ ] Volume de carga inicial (se houver)');
    lines.push('- [ ] Fator multiplicador por empresas');
    lines.push('- [ ] Horários de pico identificados');
    lines.push('');
    lines.push('---\n');
    lines.push('*Dúvidas? Entre em contato com a equipe Infra aplicações.*');

    return lines.join('\n');
  };

  const exportarMd = () => {
    if (!questionario) return;

    const todosErros: Erros = {};
    for (const secao of questionario.secoes) {
      Object.assign(todosErros, validarSecao(secao));
    }
    if (Object.keys(todosErros).length > 0) {
      setErros(todosErros);
      toast.error('Campos obrigatórios não preenchidos', {
        description: 'Revise as seções antes de exportar.',
      });
      return;
    }

    const conteudo = gerarMarkdown();
    const blob = new Blob([conteudo], { type: 'text/markdown; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'onboarding-barramento.md';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Markdown exportado com sucesso!');
  };

  const exportar = async (formato: 'tsv' | 'xlsx') => {
    if (!questionario) return;

    const todosErros: Erros = {};
    for (const secao of questionario.secoes) {
      Object.assign(todosErros, validarSecao(secao));
    }
    if (Object.keys(todosErros).length > 0) {
      setErros(todosErros);
      toast.error('Campos obrigatórios não preenchidos', {
        description: 'Revise as seções antes de exportar.',
      });
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
      toast.success(`${formato.toUpperCase()} exportado com sucesso!`);
    } finally {
      setExportando(false);
    }
  };

  if (!questionario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-en-primary" />
      </div>
    );
  }

  const totalSecoes = questionario.secoes.length;
  const secao = questionario.secoes[secaoAtiva];
  const progresso = Math.round(((secaoAtiva + 1) / totalSecoes) * 100);
  const ultimaSecao = secaoAtiva === totalSecoes - 1;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-en-primary-light">
      {/* Cabeçalho */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="h-8 w-1 rounded-full bg-en-primary" />
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
            className="h-1 bg-en-secondary transition-all duration-500"
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
              className={`text-xs px-3 py-1 rounded-full border transition font-medium flex items-center gap-1 ${
                i === secaoAtiva
                  ? 'bg-en-primary text-white border-en-primary font-bold'
                  : i < secaoAtiva
                  ? 'bg-en-primary-light text-en-primary border-en-primary-mid hover:bg-en-primary-mid hover:text-white'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {i < secaoAtiva && <CheckCircle2 className="h-3 w-3 shrink-0" />}
              {s.titulo}
            </button>
          ))}
        </nav>

        {/* Card da seção */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-linear-to-r from-en-primary to-en-primary-hover px-6 py-4">
            <h2 className="text-lg font-semibold text-white">{secao.titulo}</h2>
            {secao.descricao && (
              <p className="text-en-primary-light text-sm mt-1">{secao.descricao}</p>
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
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex items-center gap-2">
              {ultimaSecao ? (
                <>
                  <button
                    onClick={() => exportar('tsv')}
                    disabled={exportando}
                    className="px-4 py-2 rounded-lg border border-en-primary-mid bg-en-primary-light text-sm text-en-primary hover:bg-en-primary-mid hover:text-white disabled:opacity-50 transition font-medium flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Exportar TSV
                  </button>
                  <button
                    onClick={exportarMd}
                    disabled={exportando}
                    className="px-4 py-2 rounded-lg border border-en-secondary-mid bg-en-secondary-light text-sm text-en-dark hover:bg-en-secondary-mid disabled:opacity-50 transition font-medium flex items-center gap-2"
                  >
                    <FileCode2 className="h-4 w-4" />
                    Exportar MD
                  </button>
                  <button
                    onClick={() => exportar('xlsx')}
                    disabled={exportando}
                    className="px-5 py-2 rounded-lg bg-en-secondary text-en-dark text-sm font-bold hover:bg-en-secondary-hover disabled:opacity-50 transition shadow-sm flex items-center gap-2"
                  >
                    {exportando
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
                      : <><FileSpreadsheet className="h-4 w-4" /> Exportar Excel</>}
                  </button>
                </>
              ) : (
                <button
                  onClick={avancar}
                  className="px-6 py-2 rounded-lg bg-en-secondary text-en-dark text-sm font-bold hover:bg-en-secondary-hover transition shadow-sm flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Campos marcados com <span className="text-red-400">*</span> são obrigatórios
        </p>
      </main>
    </div>
  );
}
