/* import { resourcesLinks, platformLinks, communityLinks } from "../constants";
const Footer = () => {
  return (
    <footer className="mt-20 border-t py-10 border-neutral-700">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <h3 className="text-md font-semibold mb-4">Resources</h3>
          <ul className="space-y-2">
            {resourcesLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="text-neutral-300 hover:text-white"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-4">Platform</h3>
          <ul className="space-y-2">
            {platformLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="text-neutral-300 hover:text-white"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-md font-semibold mb-4">Community</h3>
          <ul className="space-y-2">
            {communityLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  className="text-neutral-300 hover:text-white"
                >
                  {link.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
 */

import { useState, useEffect } from "react";
import tiktok from "../assets/tiktok.svg";
import { Instagram, Facebook, Linkedin, Youtube, Twitter } from "lucide-react";
import avatarLuisPatty from "../assets/avatarLuisPattyJpg.jpg";
import logoEngineer from "../assets/logoEngineer.jpg";
import { siteConfigService } from "../services/siteConfigService";
import { useTenant } from "../contexts/TenantContext";

const Footer = ({ id }) => {
  const { tenant } = useTenant();
  const [footerLogo, setFooterLogo] = useState(null);
  const [footerTitle, setFooterTitle] = useState("Síguenos en nuestras redes");
  /* const [footerCopyright, setFooterCopyright] = useState(""); */
  /* const [footerDesignedBy, setFooterDesignedBy] = useState("Ing. Luis Patty Mamani"); const [footerDesignedByUrl, setFooterDesignedByUrl] = useState("https://www.linkedin.com/in/luis-patty-mamani/"); */
  const [socialLinks, setSocialLinks] = useState([]);

  useEffect(() => {
    const fetchFooterContent = async () => {
      if (!tenant?.id) return;

      const config = await siteConfigService.getAllConfigs(tenant.id);

      if (config.footer_logo_url) setFooterLogo(config.footer_logo_url);
      if (config.footer_title) setFooterTitle(config.footer_title);
      /* if (config.footer_copyright) setFooterCopyright(config.footer_copyright); */
      /* if (config.footer_designed_by) setFooterDesignedBy(config.footer_designed_by);
      if (config.footer_designed_by_url) setFooterDesignedByUrl(config.footer_designed_by_url); */

      // Construir array de redes sociales solo con las que tengan URL
      const links = [];
      if (config.social_facebook) {
        links.push({
          name: "Facebook",
          icon: <Facebook className="w-6 h-6" />,
          url: config.social_facebook
        });
      }
      if (config.social_instagram) {
        links.push({
          name: "Instagram",
          icon: <Instagram className="w-6 h-6" />,
          url: config.social_instagram
        });
      }
      if (config.social_tiktok) {
        links.push({
          name: "TikTok",
          icon: <img src={tiktok} alt="TikTok" className="w-6 h-6" loading="lazy" />,
          url: config.social_tiktok
        });
      }
      if (config.social_linkedin) {
        links.push({
          name: "LinkedIn",
          icon: <Linkedin className="w-6 h-6" />,
          url: config.social_linkedin
        });
      }
      if (config.social_youtube) {
        links.push({
          name: "YouTube",
          icon: <Youtube className="w-6 h-6" />,
          url: config.social_youtube
        });
      }
      if (config.social_twitter) {
        links.push({
          name: "Twitter",
          icon: <Twitter className="w-6 h-6" />,
          url: config.social_twitter
        });
      }

      // Si no hay redes configuradas, usar fallback
      if (links.length > 0) {
        setSocialLinks(links);
      } else {
        setSocialLinks([
          {
            name: "Facebook",
            icon: <Facebook className="w-6 h-6" />,
            url: "#",
          },
          {
            name: "Instagram",
            icon: <Instagram className="w-6 h-6" />,
            url: "#",
          },
        ]);
      }
    };

    if (tenant) {
      fetchFooterContent();
    }
  }, [tenant]);

  return (
    <footer id={id} className="bg-gradient-to-r from-indigo-900 via-blue-900 to-purple-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white py-12 transition-colors duration-300">
      <div className="container mx-auto px-4">
        {/* Sección de redes sociales */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <h3 className="text-lg font-semibold text-neutral-300">
            {footerTitle}
          </h3>
          <div>
            {footerLogo && (
              <img
                className="w-20 h-auto object-contain opacity-90 dark:opacity-100 brightness-0 dark:brightness-100 invert" src={footerLogo}
                alt="Logo"
              />
            )}
          </div>
          <div className="flex space-x-6">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-300 hover:text-white transition-colors duration-300"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-neutral-700 my-8"></div>

        {/* Información adicional */}
        <div className="text-center text-neutral-400">
          <p>© {new Date().getFullYear()} {tenant?.name || "Ingeniero Emprendedor"}. Todos los derechos reservados.</p>
          <p className="mt-2">
            Diseñado por{" "}
            <a
              href="https://www.linkedin.com/in/luis-patty-mamani/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors duration-300"
            >
              Ing. Luis Patty Mamani
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
