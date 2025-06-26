export default function Features() {
  const features = [
    {
      title: "Feature One",
      description: "A description of the first feature.",
    },
    {
      title: "Feature Two",
      description: "A description of the second feature.",
    },
    {
      title: "Feature Three",
      description: "A description of the third feature.",
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto">
        <h2 className="text-center text-3xl font-bold">Features</h2>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {features.map((feature, i) => (
            <div key={i} className="rounded-md border p-4">
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 