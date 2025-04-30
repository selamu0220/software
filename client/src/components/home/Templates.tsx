import { Card, CardContent } from "@/components/ui/card";
import { VIDEO_TITLE_TEMPLATES } from "@/lib/openai";

export default function Templates() {
  const templateExamples = [
    {
      title: "The Listicle Format",
      description: "Perfect for generating curiosity and providing concrete value.",
      template: "Top [Number] [Topic] That Will [Benefit]",
      examples: [
        "Top 7 AI Tools That Will Save You 10+ Hours Per Week",
        "Top 5 Editing Mistakes That Are Killing Your YouTube Growth"
      ]
    },
    {
      title: "The How-To Guide",
      description: "Demonstrates expertise and provides actionable value.",
      template: "How to [Achieve Result] in [Timeframe] Without [Common Obstacle]",
      examples: [
        "How to Edit YouTube Videos in 30 Minutes Without Expensive Software",
        "How to Grow Your Channel in 2023 Without Showing Your Face"
      ]
    },
    {
      title: "The Tutorial Format",
      description: "Positions you as an expert while providing value.",
      template: "[Number] Steps to [Achieve Specific Goal] (Even If You're a Beginner)",
      examples: [
        "5 Steps to Create a Website with Framer (Even If You're a Beginner)",
        "7 Steps to Record Professional Audio for YouTube (Even With Cheap Equipment)"
      ]
    }
  ];

  return (
    <section id="templates" className="py-12 bg-ytlight">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-10">
          <h2 className="text-base text-primary font-semibold tracking-wide uppercase font-heading">Templates</h2>
          <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-ytdark sm:text-4xl font-heading">
            Proven YouTube Title Formulas
          </p>
          <p className="mt-4 max-w-2xl text-xl text-ytgray lg:mx-auto">
            Our AI uses these templates to generate compelling video ideas for any niche.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templateExamples.map((template, index) => (
            <Card key={index} className="overflow-hidden h-full">
              <CardContent className="p-6">
                <h3 className="text-lg leading-6 font-medium text-ytdark mb-3">
                  {template.title}
                </h3>
                <p className="text-ytgray text-sm mb-4">
                  {template.description}
                </p>
                <div className="bg-ytlight p-3 rounded-md">
                  <p className="text-base text-ytdark">
                    "{template.template}"
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-ytgray">Examples:</p>
                  {template.examples.map((example, idx) => (
                    <p key={idx} className="text-sm text-ytdark">"{example}"</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
