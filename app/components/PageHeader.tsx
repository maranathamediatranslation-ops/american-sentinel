type Props = {
  title: string;
  children?: React.ReactNode;
};

export function PageHeader({ title, children }: Props) {
  return (
    <header className="flex max-w-[52rem] flex-col gap-3 pt-8 pb-6 lg:pt-12">
      <h1 className="font-slab text-headline-1">{title}</h1>
      {children}
    </header>
  );
}
