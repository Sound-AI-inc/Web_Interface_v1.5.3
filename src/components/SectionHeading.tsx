interface Props {
  badge?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export default function SectionHeading({ badge, title, subtitle, centered = true }: Props) {
  return (
    <div className={`mb-12 md:mb-16 ${centered ? "text-center" : ""}`}>
      {badge && (
        <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent-pink/10 text-accent-pink border border-accent-pink/20 mb-4">
          {badge}
        </span>
      )}
      <h2 className="font-poppins font-bold text-3xl md:text-4xl lg:text-5xl mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 dark:text-light-bg/60 max-w-2xl text-base md:text-lg leading-relaxed mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
