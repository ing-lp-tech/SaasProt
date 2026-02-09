import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

import { siteConfigService } from "../services/siteConfigService";
import { useTenant } from "../contexts/TenantContext";
import { THEMES } from "../constants/themes";

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

      // 1. Intentar cargar contenido personalizado
      if (config.faq_content) {
        try {
          const parsed = typeof config.faq_content === 'string'
            ? JSON.parse(config.faq_content)
            : config.faq_content;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDynamicFaqs(parsed);
            return;
          }
        } catch (e) {
          console.error('Error parsing FAQ content:', e);
        }
      }

      // 2. Si no hay personalizado, cargar default del tema
      const presetId = config.preset_id || 'default';
      const theme = THEMES.find(t => t.id === presetId);
      if (theme?.defaultFaqs) {
        setDynamicFaqs(theme.defaultFaqs);
      }
    };

    fetchFaqContent();
  }, [tenant]);

  const defaultFaqs = [
    {
      category: "General",
      questions: [
        {
          question: "¿Cómo edito estas preguntas?",
          answer: "Ve al panel de administración > Gestionar Contenido > Preguntas Frecuentes para agregar tus propias respuestas."
        }
      ]
    }
  ];

  // Use provided items or fallback to dynamic FAQs or default generic data
  const dataToDisplay = items || dynamicFaqs || defaultFaqs;

  const toggle = (i) => {
    setOpenIndex(i === openIndex ? null : i);
  };

  return (
    <section id="preguntasfrecuentes" className="py-12 px-4 md:px-8 bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          {faqTitle}
        </h2>
        {dataToDisplay.map((category, catIndex) => (
          <div key={catIndex} className="mb-10">
            <h3 className="text-xl font-semibold mb-4 text-primary dark:text-indigo-400">
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
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300"
                  >
                    <button
                      className="flex justify-between w-full text-left font-medium text-gray-900 dark:text-gray-100"
                      onClick={() => toggle(idx)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform text-gray-400 ${isOpen ? "rotate-180" : ""
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
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300"
                  >
                    <button
                      className="flex justify-between w-full text-left font-medium text-gray-900 dark:text-gray-100"
                      onClick={() => toggle(idx)}
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`h-5 w-5 transition-transform text-gray-400 ${isOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="mt-3 text-gray-600 dark:text-gray-300">{item.answer}</p>
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
