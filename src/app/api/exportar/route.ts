import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { Questionario, Respostas } from '@/types/questionario';

function formatarValor(valor: string | string[] | undefined): string {
  if (!valor) return '';
  if (Array.isArray(valor)) return valor.join(' | ');
  return valor;
}

function gerarLinhas(questionario: Questionario, respostas: Respostas) {
  const linhas: string[][] = [['Seção', 'Pergunta', 'Resposta']];
  for (const secao of questionario.secoes) {
    linhas.push([secao.titulo, '', '']);
    for (const pergunta of secao.perguntas) {
      linhas.push([
        '',
        pergunta.label + (pergunta.obrigatorio ? ' *' : ''),
        formatarValor(respostas[pergunta.id]),
      ]);
    }
    linhas.push(['', '', '']);
  }
  return linhas;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { respostas, formato, questionario } = body as {
    respostas: Respostas;
    formato: 'tsv' | 'xlsx';
    questionario: Questionario;
  };

  const linhas = gerarLinhas(questionario, respostas);

  if (formato === 'tsv') {
    const tsv = linhas.map((linha) => linha.join('\t')).join('\n');
    return new NextResponse(tsv, {
      headers: {
        'Content-Type': 'text/tab-separated-values; charset=utf-8',
        'Content-Disposition': `attachment; filename="onboarding-barramento.tsv"`,
      },
    });
  }

  // xlsx
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(linhas);

  // Larguras das colunas
  ws['!cols'] = [{ wch: 40 }, { wch: 70 }, { wch: 60 }];

  // Estilo do cabeçalho (linha 1)
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!ws[addr]) ws[addr] = {};
    ws[addr].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1F4E79' } },
      alignment: { horizontal: 'center' },
    };
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Onboarding');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="onboarding-barramento.xlsx"`,
    },
  });
}
