import { useState, useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import comotrabajamos from "../assets/comotrabajamos.jpg";
import { checklistItems } from "../constants";
import { siteConfigService } from "../services/siteConfigService";
import { useTenant } from "../contexts/TenantContext";

const Workflow = ({ id }) => {
  const { tenant } = useTenant();
  const [workflowTitle, setWorkflowTitle] = useState("Nuestro Proceso de Trabajo");
  const [workflowSubtitle, setWorkflowSubtitle] = useState("Desde tu consulta hasta la entrega de tus insumos para confección, te garantizamos:");
  const [workflowImage, setWorkflowImage] = useState(comotrabajamos);
  const [workflowSteps, setWorkflowSteps] = useState(null);

  useEffect(() => {
    const fetchWorkflowContent = async () => {
      if (!tenant?.id) return;

      const config = await siteConfigService.getAllConfigs(tenant.id);
      if (config.workflow_title) setWorkflowTitle(config.workflow_title);
      if (config.workflow_subtitle) setWorkflowSubtitle(config.workflow_subtitle);
      if (config.workflow_image_url) setWorkflowImage(config.workflow_image_url);
      if (config.workflow_content) {
        try {
          const parsed = typeof config.workflow_content === 'string'
            ? JSON.parse(config.workflow_content)
            : config.workflow_content;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWorkflowSteps(parsed);
          }
        } catch (e) {
          console.error('Error parsing workflow content:', e);
        }
      }
    };

    if (tenant) {
      fetchWorkflowContent();
    }
  }, [tenant]);

  const stepsToDisplay = workflowSteps || checklistItems;
  return (
    <section id="#como-trabajamos" className="py-8 px-4 md:px-8 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-300">
      <div id={id} className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              {workflowTitle}
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {workflowSubtitle}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-center">
            <div className="lg:w-1/2">
              {workflowImage && (
                <img
                  src={workflowImage}
                  alt="Proceso de trabajo"
                  className="rounded-xl shadow-lg border-2 border-white"
                />
              )}
            </div>

            <div className="lg:w-1/2 space-y-6">
              {stepsToDisplay.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 bg-[rgb(37,99,235)] p-1 rounded-md text-white mr-4">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-base text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}

              <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-[rgb(37,99,235)] mb-2">
                  ¿Por qué elegirnos?
                </h3>
                <p className="text-gray-700 text-sm">
                  Somos especialistas en insumos para patronaje digital.
                  Ofrecemos plotters de alta precisión y papel técnico
                  específico para tizado en confección de ropa, con
                  asesoramiento personalizado para cada taller.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;
