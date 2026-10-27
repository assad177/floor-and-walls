import { FiMonitor, FiBox, FiTool } from "react-icons/fi";

export default function ProcessSection() {
  const steps = [
    {
      id: "01",
      title: "Design Online",
      description: "Use our interactive Virtual Studio to mix and match floors, walls, and furnishings in real-time.",
      icon: <FiMonitor className="h-8 w-8" />,
    },
    {
      id: "02",
      title: "Free Sample Box",
      description: "We deliver physical samples of your selected materials to your door so you can feel the quality.",
      icon: <FiBox className="h-8 w-8" />,
    },
    {
      id: "03",
      title: "Measurement & Fitting",
      description: "Our professional crew visits for exact measurements, followed by a flawless installation.",
      icon: <FiTool className="h-8 w-8" />,
    },
  ];

  return (
    <section className="relative bg-white py-24 sm:py-32 overflow-hidden">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gold mb-2">
            The Turnkey Promise
          </h2>
          <p className="font-serif text-3xl font-bold tracking-tight text-navy sm:text-5xl">
            Seamless Workmanship & Process Guarantee
          </p>
          <p className="mt-4 text-lg leading-8 text-ink/70">
            From an online concept to a finished physical room, we handle everything. No stress, just perfect execution.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8 relative">
            
            {/* Desktop Connecting Line */}
            <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-ink/10 border-t-2 border-dashed border-ink/20"></div>

            {steps.map((step) => (
              <div key={step.id} className="relative group text-center">
                {/* Icon Circle */}
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-cream border-4 border-white shadow-lg transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl relative z-10">
                  <div className="text-navy group-hover:text-gold transition-colors duration-300">
                    {step.icon}
                  </div>
                  {/* Step Number Badge */}
                  <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-sm">
                    {step.id}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-8">
                  <h3 className="font-serif text-xl font-bold text-navy group-hover:text-gold transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}