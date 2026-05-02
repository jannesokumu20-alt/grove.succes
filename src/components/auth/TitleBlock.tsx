interface TitleBlockProps {
  title: string;
  subtitle: string;
}

export function TitleBlock({ title, subtitle }: TitleBlockProps) {
  return (
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 text-sm">{subtitle}</p>
    </div>
  );
}
