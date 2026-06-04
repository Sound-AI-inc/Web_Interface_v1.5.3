interface ThemedLogoProps {
  className?: string;
  alt?: string;
}

export default function ThemedLogo({
  className = "h-full w-full object-contain",
  alt = "SoundAI",
}: ThemedLogoProps) {
  return (
    <img
      src="/logo SoundAI v1.5 (1).svg"
      alt={alt}
      className={`soundai-logo-mark ${className}`}
    />
  );
}
