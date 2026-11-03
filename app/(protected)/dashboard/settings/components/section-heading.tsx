type Props = {
  id: string;
  title: string;
  description: string;
};

export default function SectionHeading({ id, title, description }: Props) {
  return (
    <div className="space-y-1">
      <h2 id={id} className="text-lg font-semibold">
        {title}
      </h2>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
