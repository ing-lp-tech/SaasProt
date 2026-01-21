import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { faqData } from "../constants";
import { siteConfigService } from "../services/siteConfigService";
import { useTenant } from "../contexts/TenantContext";

export default function FAQ({ items }) {
  const { tenant } = useTenant();
  const [openIndex, setOpenIndex] = useState(null);
  const [faqTitle, setFaqTitle] = useState("Preguntas Frecuentes");
  const [dynamicFaqs, setDynamicFaqs] = useState(null);

  useEffect(() => {
    const fetchFaqContent = async () => {
      if (!tenant?.id) return;

      const config = await siteConfigService.getAllConfigs(tenant.id);
      if (config.faq_title) setFaqTitle(config.faq_title);
      if (config.faq_content) {
        try {
          const parsed = typeof config.faq_content === 'string'
            ? JSON.parse(config.faq_content)
            : config.faq_content;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDynamicFaqs(parsed);
          }
        } catch (e) {
          console.error('Error parsing FAQ content:', e);
        }
      }
    };

    if (tenant) {
      fetchFaqContent();
    }
  }, [tenant]);

  // Use provided items or fallback to dynamic FAQs or default imported data
  const dataToDisplay = items || dynamicFaqs || faqData;

  const toggle = (i) => {
    setOpenIndex(i === openIndex ? null : i);
  };

  return (
    <section id="preguntasfrecuentes" className="py-12 px-4 md:px-8 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          {faqTitle}
        </h2>
        {dataToDisplay.map((category, catIndex) => (
          <div key={catIndex} className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-indigo-600 dark:text-indigo-400">
              {category.category}
            </h3>
            <div className="space-y-4">
              {category.questions ? category.questions.map((item, i) => {
                // Handle structure difference if necessary (questions vs items in prop data)
                // Assuming the passing structure matches: { category, questions: [{question, answer}] }
                const idx = `${catIndex}-${i}`;
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 shadow-sm transition-colors duration-300"
                  >
                    <button
                      className="flex justify-between w-full text-left font-medium text-gray-800 dark:text-gray-100"
                      onClick={() => toggle(idx)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform text-gray-600 dark:text-gray-400 ${isOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-gray-600 dark:text-gray-300">{item.answer}</p>
                    )}
                  </div>
                );
              }) : category.items.map((item, i) => {
                // Fallback for existing faqData structure if it uses .items
                const idx = `${catIndex}-${i}`;
                const isOpen = openIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                  >
                    <button
                      className="flex justify-between w-full text-left font-medium text-gray-800"
                      onClick={() => toggle(idx)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-gray-600">{item.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
