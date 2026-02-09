import React, { useState, useEffect } from "react";
import { useTenant } from "../contexts/TenantContext";
import { siteConfigService } from "../services/siteConfigService";
import "./AboutMeSection.css";

const AboutMeSection = () => {
  const { tenant } = useTenant();
  const [aboutContent, setAboutContent] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchAboutContent = async () => {
      if (!tenant?.id) return;

      const config = await siteConfigService.getAllConfigs(tenant.id);

      // Cargar imagen de fondo
      if (config.about_bg_url) {
        setBgImage(config.about_bg_url);
      }

      if (config.about_content) {
        try {
          const parsed = typeof config.about_content === 'string'
            ? JSON.parse(config.about_content)
            : config.about_content;
          setAboutContent(parsed);
        } catch (e) {
          console.error('Error parsing about_content:', e);
        }
      }
    };

    if (tenant) {
      fetchAboutContent();
    }
  }, [tenant]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("sobre-mi");
    if (section) observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);

  // Contenido por defecto SOLO para la página principal de IngeStore (sin tenant)
  const ingeStoreDefaultContent = {
    name: "Luis Patty Mamani",
    title: "Ingeniero Electrónico & Desarrollador Full Stack",
    tagline: "Transformando ideas en soluciones digitales innovadoras",
    description: "Ingeniero Electrónico con especialización en desarrollo web y aplicaciones SaaS. Combino sólida formación tecnológica con experiencia práctica en frontend y backend para crear productos digitales escalables y modernos.",
    expertise: [
      {
        icon: "💻",
        title: "Desarrollo Web",
        description: "Aplicaciones web modernas con React, Node.js y tecnologías de vanguardia"
      },
      {
        icon: "🚀",
        title: "Aplicaciones SaaS",
        description: "Sistemas multi-tenant escalables con arquitectura robusta y segura"
      },
      {
        icon: "🎨",
        title: "UI/UX Moderno",
        description: "Interfaces atractivas y funcionales con Tailwind CSS y Material UI"
      }
    ],
    education: [
      {
        title: "Ingeniería Electrónica",
        institution: "UNLAM - Universidad Nacional de La Matanza",
        period: "2014 - 2022"
      },
      {
        title: "Desarrollo Web Full Stack",
        institution: "UTN - Universidad Tecnológica Nacional",
        period: "2023 - 2024"
      }
    ],
    skills: {
      frontend: ["React", "JavaScript", "HTML/CSS", "Tailwind CSS", "Material UI", "Chakra UI"],
      backend: ["Node.js", "Express", "PostgreSQL", "Supabase", "APIs RESTful"],
      tools: ["Git", "Vercel", "AutoCAD", "Proteus", "Jira"]
    },
    experience: "2+ años de experiencia en desarrollo web profesional, trabajando en proyectos desde startups hasta empresas establecidas. Enfoque en código limpio, mejores prácticas y entrega de valor real.",
    cta: {
      primary: "Ver Proyectos",
      secondary: "Contactar"
    }
  };

  // Contenido por defecto para clientes (personalizable desde admin)
  const clientDefaultContent = {
    name: tenant?.name || "Nombre de tu Negocio",
    title: "Descripción de tu negocio",
    tagline: "Tu eslogan principal",
    description: "Descripción detallada de tu negocio. Puedes editar este contenido desde el panel de administración en la sección 'Gestionar Contenido'.",
    expertise: [
      {
        icon: "🎯",
        title: "Servicio 1",
        description: "Descripción del primer servicio que ofreces"
      },
      {
        icon: "⭐",
        title: "Servicio 2",
        description: "Descripción del segundo servicio que ofreces"
      },
      {
        icon: "🏆",
        title: "Servicio 3",
        description: "Descripción del tercer servicio que ofreces"
      }
    ],
    education: [],
    skills: {
      frontend: [],
      backend: [],
      tools: []
    },
    experience: "Información sobre tu experiencia y trayectoria.",
    cta: {
      primary: "Ver Productos",
      secondary: "Contactar"
    }
  };

  // Determinar qué contenido mostrar
  let content;
  if (!tenant) {
    // Página principal de IngeStore (sin tenant)
    content = ingeStoreDefaultContent;
  } else {
    // Página de un cliente (con tenant)
    content = aboutContent || clientDefaultContent;
  }

  // Renderizado específico para clientes con contenido personalizado (Array de bloques)
  const renderClientContent = (blocks) => (
    <div className="about-container">
      {/* Título Principal de la Sección */}
      <div className="about-header fade-in-up">
        <div className="about-badge">
          <span className="badge-icon">✨</span>
          <span>Sobre Nosotros</span>
        </div>
        {/* Si hay un nombre de negocio, mostrarlo */}
        {tenant?.name && (
          <h2 className="about-name typewriter">
            {tenant.name}
          </h2>
        )}
      </div>

      {/* Renderizar bloques de contenido dinámico */}
      <div className="info-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
        {blocks.map((block, index) => (
          <div key={index} className="info-block glass-card fade-in-up" style={{ width: '100%', maxWidth: '900px', textAlign: 'left' }}>
            <h4 className="info-title" style={{ marginBottom: '1rem', color: 'var(--about-accent-light)' }}>
              {block.title}
            </h4>
            <p className="about-description" style={{ margin: '0', fontSize: '1.1rem', color: 'var(--about-text-primary)' }}>
              {block.description}
            </p>
          </div>
        ))}
      </div>

      {/* CTAs Opcionales */}
      <div className="about-ctas fade-in-up delay-5" style={{ marginTop: '3rem' }}>
        <a href="#proyectos" className="cta-primary">
          <span>Ver Productos</span>
          <svg className="cta-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
        <a href="#contacto" className="cta-secondary">
          Contactar
        </a>
      </div>
    </div>
  );

  return (
    <div
      id="sobre-mi"
      className={`about-section ${isVisible ? 'visible' : ''}`}
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {/* Fondo animado con gradientes (solo si no hay imagen de fondo, o como superposición) */}
      {!bgImage && (
        <div className="about-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
      )}

      {bgImage && <div className="absolute inset-0 bg-black/60 z-0"></div>}

      {/* Lógica de Renderizado: Array (Cliente) vs Objeto (Default/IngeStore) */}
      {Array.isArray(aboutContent) ? (
        renderClientContent(aboutContent)
      ) : (
        <div className="about-container">
          {/* Header / Hero interno */}
          <div className="about-header fade-in-up">
            <div className="about-badge">
              <span className="badge-icon">✨</span>
              <span>Sobre Mí</span>
            </div>

            <h2 className="about-name typewriter">
              {content.name}
            </h2>

            <h3 className="about-title">
              {content.title}
            </h3>

            <p className="about-tagline">
              {content.tagline}
            </p>

            <p className="about-description">
              {content.description}
            </p>
          </div>

          {/* Grid de Especialidades - Solo si existe y tiene datos */}
          {content.expertise?.length > 0 && (
            <div className="expertise-grid">
              {content.expertise.map((item, index) => (
                <div
                  key={index}
                  className={`expertise-card glass-card fade-in-up delay-${index + 1}`}
                >
                  <div className="card-icon float">{item.icon}</div>
                  <h4 className="card-title">{item.title}</h4>
                  <p className="card-description">{item.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Formación y Habilidades - Renderizado Condicional */}
          {(content.education?.length > 0 ||
            content.skills?.frontend?.length > 0) && (
              <div className="info-section">
                {/* Educación */}
                {content.education?.length > 0 && (
                  <div className="info-block glass-card fade-in-left">
                    <h4 className="info-title">
                      <span className="title-icon">🎓</span>
                      Formación Académica
                    </h4>
                    <div className="education-list">
                      {content.education.map((edu, index) => (
                        <div key={index} className="education-item">
                          <div className="edu-dot"></div>
                          <div>
                            <h5 className="edu-title">{edu.title}</h5>
                            <p className="edu-institution">{edu.institution}</p>
                            <p className="edu-period">{edu.period}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stack Tecnológico */}
                {content.skills?.frontend?.length > 0 && (
                  <div className="info-block glass-card fade-in-right">
                    <h4 className="info-title">
                      <span className="title-icon">⚡</span>
                      Stack Tecnológico
                    </h4>
                    <div className="skills-section">
                      <div className="skill-category">
                        <div className="skill-tags">
                          {content.skills.frontend.map((skill, index) => (
                            <span key={index} className="skill-tag skill-tag-blue">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Experiencia destacada - Renderizado Condicional */}
          {content.experience && (
            <div className="experience-section glass-card fade-in-up delay-4">
              <div className="experience-icon-wrapper">
                <span className="experience-icon">💼</span>
              </div>
              <p className="experience-text">
                {content.experience}
              </p>
            </div>
          )}

          {/* CTAs */}
          <div className="about-ctas fade-in-up delay-5">
            <a
              href="#proyectos"
              className="cta-primary"
            >
              <span>{content.cta?.primary || "Ver Proyectos"}</span>
              <svg className="cta-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="#contacto"
              className="cta-secondary"
            >
              {content.cta?.secondary || "Contactar"}
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutMeSection;
