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
    <section id={id} className="relative w-full min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image/Carousel */}
      <div className="absolute inset-0 w-full h-full">
        {heroCarouselImages.length > 0 ? (
          <HeroCarousel images={heroCarouselImages} />
        ) : heroMainImageUrl ? (
          <img
            src={heroMainImageUrl}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-white dark:from-gray-900 dark:to-gray-800"></div>
        )}

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20 dark:from-black/70 dark:via-black/50 dark:to-black/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-12 md:py-0">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            {/* Badge/Tag */}
            {heroSubtitle && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/90 text-white rounded-full text-sm font-semibold mb-6 shadow-lg backdrop-blur-sm">
                <span>🛍️</span>
                <span>{heroSubtitle}</span>
              </div>
            )}

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              {heroTitle}
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 leading-relaxed drop-shadow-lg max-w-xl">
              {heroDescription}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#productos"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary hover:brightness-110 text-white font-bold rounded-lg shadow-xl transition-all transform hover:scale-105 text-base sm:text-lg"
              >
                Ver Catálogo
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold rounded-lg border-2 border-white/50 shadow-xl transition-all text-base sm:text-lg"
              >
                Contactar
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator (opcional) */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block animate-bounce">
        <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
