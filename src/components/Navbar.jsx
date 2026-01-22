/* import { Menu, X } from "lucide-react";
import { useState } from "react";
import logoLucfra from "../assets/lucfra_t.png";
import { navItems } from "../constants";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <nav className="sticky top-0 z-50 py-3 bg-white/70 backdrop-blur-md shadow-md border-b border-neutral-300">
      <div className="container px-4 mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/">
            <img
              className="h-14 w-40 object-contain"
              src={logoLucfra}
              alt="Logo"
            />
          </Link>
          <ul className="hidden lg:flex gap-10 font-medium text-neutral-800">
            {navItems.map((item, index) => (
              <li key={index}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-all"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    className="hover:text-blue-600 transition-all"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <div className="lg:hidden">
            <button onClick={toggleNavbar} aria-label="Toggle Menu">
              {mobileDrawerOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full right-0 w-full bg-[rgb(37,99,235)] text-white flex flex-col items-center shadow-md z-40"
            >
              {navItems.map((item, index) =>
                item.external ? (
                  <a
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-4 text-lg tracking-wide border-b border-white/30 hover:text-yellow-300 transition-all"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={item.href}
                    className="w-full text-center py-4 text-lg tracking-wide border-b border-white/30 hover:text-yellow-300 transition-all"
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
 */

import { Menu, X, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
// import logoLucfra from "../assets/lucfra_t.png"; // Removed default logo
import { navItems } from "../constants";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, User } from "lucide-react";
import { useTenant } from "../contexts/TenantContext";
import { useDarkMode } from "../hooks/useDarkMode"; // Dark mode hook

const Navbar = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode(); // Dark mode state

  // Logo dinámico
  const logoUrl = tenant?.config?.navbar_logo_url || tenant?.config?.logoUrl;

  const handleLogout = async () => {
    await signOut();
    navigate(tenant ? `/?tenant=${tenant.subdomain}` : "/");
  };

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 py-3 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md border-b border-neutral-300 dark:border-gray-700 transition-colors">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center">
            <Link to={tenant?.subdomain ? `/?tenant=${tenant.subdomain}` : "/"} className="flex items-center">
              {logoUrl ? (
                <img
                  className="h-14 w-auto object-contain max-w-[200px]"
                  src={logoUrl}
                  alt={tenant?.name || "Logo"}
                />
              ) : (
                <span className="text-xl font-bold text-gray-800 dark:text-white truncate max-w-[200px]">
                  {tenant?.name || "Mi Tienda"}
                </span>
              )}
            </Link>

            {/* Menú desktop */}
            <ul className="hidden lg:flex gap-10 font-medium text-neutral-800 dark:text-gray-200 items-center">
              {navItems.map((item, index) => (
                <li key={index}>
                  {item.href.startsWith("#") ? (
                    <a
                      href={item.href}
                      className="hover:text-primary dark:hover:text-primary transition-all"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="hover:text-primary dark:hover:text-primary transition-all"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}

              {/* Dark Mode Toggle */}
              <li>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-700" />}
                </button>
              </li>

              {/* Login/Admin Button */}
              <li>
                {user ? (
                  <Link
                    to="/admin/dashboard"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all shadow-md hover:shadow-lg"
                  >
                    <User size={18} />
                    Admin
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:brightness-110 transition-all shadow-md hover:shadow-lg"
                  >
                    <LogIn size={18} />
                    Login
                  </Link>
                )}
              </li>
            </ul>

            {/* Botón menú móvil */}
            <div className="lg:hidden">
              <button onClick={toggleNavbar} aria-label="Toggle Menu" className="p-2 text-neutral-800 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors">
                {mobileDrawerOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Menú mobile */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-primary z-[100] flex flex-col items-center justify-center lg:hidden"
          >
            <div className="absolute top-4 right-4">
              <button onClick={toggleNavbar} aria-label="Close Menu">
                <X size={32} className="text-white hover:text-gray-200 transition-colors" />
              </button>
            </div>

            <div className="flex flex-col gap-8 items-center w-full px-8">
              {navItems.map((item, index) =>
                item.href.startsWith("#") ? (
                  <a
                    key={index}
                    href={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="text-2xl font-medium text-white hover:text-yellow-300 transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={item.href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className="text-2xl font-medium text-white hover:text-yellow-300 transition-colors"
                  >
                    {item.label}
                  </Link>
                )
              )}

              <div className="w-full h-px bg-white/20 my-2"></div>

              {/* Login/Admin Mobile */}
              {user ? (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-full text-xl shadow-lg hover:bg-gray-100 transition-all w-full justify-center"
                >
                  <User size={24} />
                  Panel Admin
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-full text-xl shadow-lg hover:bg-gray-100 transition-all w-full justify-center"
                >
                  <LogIn size={24} />
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
