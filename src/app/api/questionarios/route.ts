import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

type QuestionarioDisponivel = {
  arquivo: string;
  slug: string;
  titulo: string;
};

function formatarTituloPadrao(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ');
}

export async function GET() {
  const publicDir = path.join(process.cwd(), 'public');
  const arquivos = await fs.readdir(publicDir, { withFileTypes: true });

  const candidatos = arquivos
    .filter((item) => item.isFile() && item.name.toLowerCase().endsWith('.json'))
    .map((item) => item.name)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const questionarios: QuestionarioDisponivel[] = [];

  for (const arquivo of candidatos) {
    const slug = arquivo.replace(/\.json$/i, '');
    const caminho = path.join(publicDir, arquivo);
    let titulo = formatarTituloPadrao(slug);

    try {
      const conteudo = await fs.readFile(caminho, 'utf8');
      const json = JSON.parse(conteudo) as { titulo?: string };
      if (json.titulo && typeof json.titulo === 'string') {
        titulo = json.titulo;
      }
    } catch {
      // Se o JSON estiver inválido, ainda exibimos o arquivo para facilitar diagnóstico.
    }

    questionarios.push({ arquivo, slug, titulo });
  }

  return NextResponse.json({ questionarios });
}