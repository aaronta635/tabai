import Image from "next/image";

export function PhotoCard({
  src,
  alt,
  caption,
  priority = false,
}: {
  src: string;
  alt: string;
  caption: string;
  priority?: boolean;
}) {
  return (
    <figure className="overflow-hidden rounded-[28px] bg-[#ece7de]">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 768px) 720px, 100vw"
          className="object-cover"
        />
      </div>
      <figcaption className="px-5 py-3 text-sm text-[#6b6560]">{caption}</figcaption>
    </figure>
  );
}
