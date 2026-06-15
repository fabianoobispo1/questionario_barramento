import QuestionarioApp from '@/components/QuestionarioApp';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PaginaQuestionario({ params }: Props) {
  const { slug } = await params;
  return <QuestionarioApp arquivoBase={slug} />;
}