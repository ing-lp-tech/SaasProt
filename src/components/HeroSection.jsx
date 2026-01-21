import { motion } from "framer-motion";
import plotter2 from "../assets/plotter2.jpg";
import React, { useState, useEffect } from "react"; // Importar useEffect
import avatarLuisPatty from "../assets/avatarLuisPattyJpg.jpg";
import llegoIngeJPG from "../assets/llegoIngepng.png";
import { siteConfigService } from "../services/siteConfigService"; // Importar servicio
import HeroCarousel from "./HeroCarousel";
import { useTenant } from "../contexts/TenantContext"; // Importar contexto

const HeroSection = ({ id, dolarOficial }) => {
  const { tenant } = useTenant(); // Obtener tenant del contexto
  const phoneNumber = "5491162020911";
  const defaultMessage = "Hola, me gustaría obtener más información.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    defaultMessage
  )}`;
  const API_URL = "http://localhost:5000/api/products";

  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState(""); // estado para mostrar mensaje de éxito/error

  // Estados para imágenes dinámicas del Hero
  const [heroLogoUrl, setHeroLogoUrl] = useState(null);
  const [heroMainImageUrl, setHeroMainImageUrl] = useState(null);
  const [heroCarouselImages, setHeroCarouselImages] = useState([]);

  // Estados para contenido de texto dinámico
  const [heroTitle, setHeroTitle] = useState("Soluciones profesionales para patronaje digital");
  const [heroSubtitle, setHeroSubtitle] = useState(null);
  const [heroDescription, setHeroDescription] = useState("Equipos y materiales de alta precisión para diseñadores y fabricantes de moda. Maximiza la eficiencia en tu producción con nuestros plotters industriales y papel técnico especializado para tizado.");

  useEffect(() => {
    const fetchHeroContent = async () => {
      if (!tenant?.id) return; // Esperar a que el tenant esté cargado

      const config = await siteConfigService.getAllConfigs(tenant.id);
      if (config.hero_logo_url) setHeroLogoUrl(config.hero_logo_url);
      if (config.hero_main_image_url) setHeroMainImageUrl(config.hero_main_image_url);

      // Cargar imágenes del carousel
      if (config.hero_carousel_images) {
        try {
          const parsed = typeof config.hero_carousel_images === 'string'
            ? JSON.parse(config.hero_carousel_images)
            : config.hero_carousel_images;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setHeroCarouselImages(parsed);
          }
        } catch (e) {
          console.error('Error parsing carousel images:', e);
        }
      }

      if (config.hero_title) setHeroTitle(config.hero_title);
      if (config.hero_subtitle) setHeroSubtitle(config.hero_subtitle);
      if (config.hero_description) setHeroDescription(config.hero_description);
    };
    if (tenant) {
      fetchHeroContent();
    }
  }, [tenant]); // Dependencia del tenant

  return (
    <>
      <div id={id} className="flex flex-col items-center mt-4 mb-0 lg:mt-10 overflow-hidden w-full">
        <div className="bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8 w-full transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 md:gap-12">
              <div className="w-full md:w-1/2 text-center md:text-left">
                <div className="items-center justify-between hidden md:block">
                  {heroLogoUrl && (
                    <img
                      className="w-full max-w-[200px] mb-4"
                      src={heroLogoUrl} // Dinámico
                      alt="Logo Hero"
                    />
                  )}
                </div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight">
                  {heroTitle}
                </h1>

                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed max-w-2xl mx-auto md:mx-0">
                  {heroDescription}
                </p>

                {/* Botones ocultos a pedido del usuario (12/1/2026)
                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  ... (código comentado sin cambios)
                </div>
                */}

                <div className="mt-8 flex items-center justify-center md:justify-start space-x-4">
                  <div className="flex -space-x-2">
                    {/* Iconos de clientes o marcas */}
                  </div>
                </div>
              </div>

              {/* Imagen destacada */}
              <div className="w-full md:w-1/2 relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700 h-[400px]">
                  {heroCarouselImages.length > 0 ? (
                    <HeroCarousel images={heroCarouselImages} />
                  ) : heroMainImageUrl ? (
                    <img
                      className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                      src={heroMainImageUrl}
                      alt="Plotter industrial en funcionamiento"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
                      Sin imagen de portada
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>
                {/* Mobile only additional logo if needed */}
                <div className="md:hidden mt-4 flex justify-center">
                  {heroLogoUrl && (
                    <img
                      className="w-32 object-contain"
                      src={heroLogoUrl} // Dinámico
                      alt="Logo"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Logos de marcas o certificaciones */}
            <div className="mt-16 sm:mt-20">
              <h3 className="text-center text-gray-400 dark:text-gray-500 text-sm font-bold tracking-widest mb-8 uppercase">
                TRABAJAMOS CON LAS MEJORES MARCAS
              </h3>
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                <img
                  className="h-10 sm:h-12"
                  src={avatarLuisPatty}
                  alt="Marca 1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
