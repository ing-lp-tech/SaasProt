import React, { useState, useEffect } from "react";
import socios from "../assets/luis.jpg";
import { siteConfigService } from "../services/siteConfigService";
import { useTenant } from "../contexts/TenantContext";

const AboutMeSection = () => {
  const { tenant } = useTenant();
  const [bgImage, setBgImage] = useState(socios);
  const [aboutItems, setAboutItems] = useState([]);

  useEffect(() => {
    const fetchAboutContent = async () => {
      if (!tenant?.id) return;

      const config = await siteConfigService.getAllConfigs(tenant.id);

      if (config.about_bg_url) {
        setBgImage(config.about_bg_url);
      }

      if (config.about_content) {
        try {
          const parsed = typeof config.about_content === 'string'
            ? JSON.parse(config.about_content)
            : config.about_content;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAboutItems(parsed);
          }
        } catch (e) {
          console.error('Error parsing about_content:', e);
        }
      }
    };

    if (tenant) {
      fetchAboutContent();
    }
  }, [tenant]);

  return (
    <div
      id="sobre-mi"
      className="relative bg-gray-900 text-white"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gray-900/60"></div>

      {/* Contenido superpuesto */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-shadow">
        <div className="space-y-12">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-center">
            SOBRE MÍ
          </h2>

          {/* Bloques dinámicos */}
          {aboutItems.length > 0 ? (
            aboutItems.map((item, index) => (
              <div key={index} className="space-y-4">
                <h3 className="text-2xl font-semibold">{item.title}</h3>
                <p className="text-lg">{item.description}</p>
              </div>
            ))
          ) : (
            // Fallback si no hay contenido configurado
            <div className="space-y-12">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold">Sobre Nosotros</h3>
                <p className="text-lg">
                  Cuéntale a tus clientes quién eres y qué haces. Este espacio es ideal para compartir tu historia, valores y experiencia.
                </p>
                <p className="text-lg">
                  Ve al panel de administración para editar este texto, cambiar la imagen de fondo y personalizar completamente esta sección.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutMeSection;
