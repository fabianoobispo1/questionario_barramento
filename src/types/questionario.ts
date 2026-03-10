export type TipoCampo =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'radio'
  | 'checkbox-group';

export interface Pergunta {
  id: string;
  label: string;
  tipo: TipoCampo;
  obrigatorio: boolean;
  placeholder?: string;
  opcoes?: string[];
}

export interface Secao {
  id: string;
  titulo: string;
  descricao?: string;
  perguntas: Pergunta[];
}

export interface Questionario {
  titulo: string;
  descricao: string;
  secoes: Secao[];
}

export type Respostas = Record<string, string | string[]>;
