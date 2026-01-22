import { useEffect, useState } from "react";
import { siteConfigService } from "../services/siteConfigService";
import { useTenant } from "../contexts/TenantContext";
import { Sparkles, Heart, Shield, Star } from "lucide-react";

const WhyChooseUs = () => {
    const { tenant } = useTenant();
    const [features, setFeatures] = useState([]);
    const [title, setTitle] = useState("¿Por qué elegirnos?");

    // Features por defecto según el tema
    const defaultFeatures = [
        {
            icon: "✨",
            title: "Calidad Premium",
            description: "Productos seleccionados con los más altos estándares de calidad"
        },
        {
            icon: "💖",
            title: "Atención Personalizada",
            description: "Asesoramiento experto para ayudarte a encontrar lo que necesitas"
        },
        {
            icon: "🛡️",
            title: "Garantía Total",
            description: "Compra con confianza, garantizamos todos nuestros productos"
        },
        {
            icon: "⭐",
            title: "Envío Rápido",
            description: "Recibe tu pedido en tiempo récord con seguimiento incluido"
        }
    ];

    useEffect(() => {
        const fetchContent = async () => {
            if (!tenant?.id) return;

            const config = await siteConfigService.getAllConfigs(tenant.id);

            if (config.why_choose_title) {
                setTitle(config.why_choose_title);
            }

            if (config.why_choose_features) {
                try {
                    const parsed = typeof config.why_choose_features === 'string'
                        ? JSON.parse(config.why_choose_features)
                        : config.why_choose_features;
                    setFeatures(Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultFeatures);
                } catch (e) {
                    console.error('Error parsing why_choose_features:', e);
                    setFeatures(defaultFeatures);
                }
            } else {
                setFeatures(defaultFeatures);
            }
        };

        fetchContent();
    }, [tenant]);

    if (!features || features.length === 0) return null;

    return (
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 transition-colors">
            <div className="max-w-7xl mx-auto">
                {/* Título */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                        {title}
                    </h2>
                    <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
                </div>

                {/* Grid de características */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:-translate-y-2"
                        >
                            {/* Ícono */}
                            <div className="mb-4 text-5xl transform group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>

                            {/* Título */}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors">
                                {feature.title}
                            </h3>

                            {/* Descripción */}
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                {feature.description}
                            </p>

                            {/* Decoración */}
                            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
