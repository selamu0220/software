import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ReactNode } from "react";

type FAQItem = {
  question: string;
  answer: ReactNode;
};

interface FAQSectionProps {
  items: FAQItem[];
  title?: string;
  description?: string;
  className?: string;
}

/**
 * Componente para mostrar una sección de preguntas frecuentes (FAQs)
 * con marcado Schema.org para SEO
 */
export function FAQSection({
  items,
  title = "Preguntas frecuentes",
  description,
  className = "",
}: FAQSectionProps) {
  if (!items.length) return null;

  return (
    <section className={`my-8 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="mt-2 text-muted-foreground">{description}</p>}
      </div>

      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-left font-medium">
              {item.question}
            </AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Schema.org markup para FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": items.map((item) => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": typeof item.answer === "string" 
                  ? item.answer 
                  : "Consulta nuestra página para más detalles."
              }
            }))
          })
        }}
      />
    </section>
  );
}