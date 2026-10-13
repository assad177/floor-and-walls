const STEPS = [
  { n: 1, title: "Design online", text: "Build your room in the studio and see the price as you go." },
  { n: 2, title: "Free sample box", text: "We deliver samples of your chosen materials to your home." },
  { n: 3, title: "Measure & fit", text: "Our crew measures, confirms the final price and fits everything." },
];

export default function Process() {
  return (
    <section id="process" className="mx-auto max-w-7xl px-4 pt-16">
      <h2 className="font-serif text-3xl text-navy">The Turnkey Promise</h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="rounded-2xl bg-white p-6 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-serif text-cream">{s.n}</span>
            <h3 className="mt-3 font-serif text-xl text-navy">{s.title}</h3>
            <p className="mt-1 text-sm text-ink/70">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
