'use client';

import { Pergunta, Respostas } from '@/types/questionario';

interface Props {
  pergunta: Pergunta;
  respostas: Respostas;
  onChange: (id: string, valor: string | string[]) => void;
  erro?: string;
}

export default function CampoFormulario({ pergunta, respostas, onChange, erro }: Props) {
  const valor = respostas[pergunta.id];

  const inputBase =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500';
  const inputNormal = `${inputBase} border-gray-300`;
  const inputErro = `${inputBase} border-red-400 focus:ring-red-400`;
  const classeInput = erro ? inputErro : inputNormal;

  if (pergunta.tipo === 'radio') {
    return (
      <div className="space-y-1">
        {(pergunta.opcoes ?? []).map((opcao) => (
          <label key={opcao} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name={pergunta.id}
              value={opcao}
              checked={valor === opcao}
              onChange={() => onChange(pergunta.id, opcao)}
              className="h-4 w-4 accent-blue-600"
            />
            <span className="text-sm text-gray-700 group-hover:text-blue-700">{opcao}</span>
          </label>
        ))}
        {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
      </div>
    );
  }

  if (pergunta.tipo === 'checkbox-group') {
    const selecionados: string[] = Array.isArray(valor) ? valor : [];
    const toggle = (opcao: string) => {
      const novo = selecionados.includes(opcao)
        ? selecionados.filter((v) => v !== opcao)
        : [...selecionados, opcao];
      onChange(pergunta.id, novo);
    };
    return (
      <div className="space-y-1">
        {(pergunta.opcoes ?? []).map((opcao) => (
          <label key={opcao} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selecionados.includes(opcao)}
              onChange={() => toggle(opcao)}
              className="h-4 w-4 rounded accent-blue-600"
            />
            <span className="text-sm text-gray-700 group-hover:text-blue-700">{opcao}</span>
          </label>
        ))}
        {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
      </div>
    );
  }

  if (pergunta.tipo === 'textarea') {
    return (
      <div>
        <textarea
          rows={3}
          placeholder={pergunta.placeholder ?? ''}
          value={(valor as string) ?? ''}
          onChange={(e) => onChange(pergunta.id, e.target.value)}
          className={`${classeInput} resize-y`}
        />
        {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
      </div>
    );
  }

  // text, number, date
  return (
    <div>
      <input
        type={pergunta.tipo}
        placeholder={pergunta.placeholder ?? ''}
        value={(valor as string) ?? ''}
        onChange={(e) => onChange(pergunta.id, e.target.value)}
        className={classeInput}
      />
      {erro && <p className="text-xs text-red-500 mt-1">{erro}</p>}
    </div>
  );
}
