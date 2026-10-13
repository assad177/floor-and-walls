import Link from "next/link";
import Image from "next/image";
import { THEMES } from "@/data/themes";

export default function FamousBuilds() {
  return (
    <section id="builds" className="mx-auto max-w-7xl px-4 pt-16">
      <h2 className="font-serif text-3xl text-navy">Famous Builds</h2>
      <p className="mt-2 text-ink/70">
        Pick a ready-made room, then change anything you like.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {THEMES.map((t) => (
          <li key={t.id}>
           
<Link href={`/theme/${t.id}`}
              className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg"
            >
              {/* Real Theme Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              {/* Theme Info */}
              <div className="p-4">
                <h3 className="font-serif text-lg text-navy">{t.name}</h3>
                <p className="text-sm text-ink/60">{t.blurb}</p>
                <p className="mt-2 text-sm font-medium text-navy transition group-hover:text-gold">
                  Use this room →
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}