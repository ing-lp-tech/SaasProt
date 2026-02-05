

import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import WhyChooseUs from "./components/WhyChooseUs";
import HowItWorks from "./components/HowItWorks";
import ProductSection from "./components/FeatureSection";
import Workflow from "./components/Workflow";
import AboutMeSection from "./components/AboutMeSection";
import DolarQuote from "./components/DolarQuote";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import CartPage from "./components/CartPage";
import ComunidadPage from "./components/ComunidadPage";
import ImportacionPage from "./components/ImportacionPage";
import FAQ from "./components/Faq";
import SEO from "./components/SEO"; // Import SEO component
import ManualUploader from "./components/ManualUploader";
import ChatAudaces from "./components/ChatAudaces";

import ChatVendedor from "./components/ChatVendedor"; // Chat para ventas (público)
import "./components/ChatAudaces.css";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import ProductManager from "./pages/admin/ProductManager";
import CategoryManager from "./pages/admin/CategoryManager";
import PurchasePlanner from "./pages/admin/PurchasePlanner";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminUsers from "./pages/admin/AdminUsers";
import { SiteConfigEditor } from "./components/admin/SiteConfigEditor";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminDashboard from "./components/admin/SuperAdminDashboard";
import TenantManager from "./pages/admin/TenantManager";
import TeamManager from "./pages/admin/TeamManager";
import { useEffect, useState } from "react";

import LandingPage from "./pages/LandingPage";
import { useTenant } from "./contexts/TenantContext";

const AppContent = ({ cart, addToCart, removeFromCart }) => {
  const { tenant } = useTenant();
  const [dolarOficial, setDolarOficial] = useState(null);
  const location = useLocation();
  const isComunidad = location.pathname === "/comunidad";

  // Determinar si estamos en una ruta admin
  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    const fetchDolar = async () => {
      try {
        const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
        const data = await res.json();
        setDolarOficial(data.venta);
      } catch (error) {
        console.error("Error al obtener la cotización:", error);
      }
    };

    fetchDolar();
  }, []);

  return (
    <>
      {!isComunidad && location.pathname !== '/login' && !isAdminRoute && tenant && <Navbar />}
      <div className="max-w-7xl mx-auto pt-0 px-0 bg-white dark:bg-gray-900 transition-colors duration-300 min-h-screen">
        {!isComunidad && location.pathname !== '/login' && !isAdminRoute && tenant && <WhatsAppButton />}

        <Routes>
          <Route
            path="/"
            element={
              !tenant ? (
                <LandingPage />
              ) : (
                <>
                  <SEO /> {/* Default SEO for Home */}
                  {/* Le pasamos la prop dolarOficial */}
                  <HeroSection id="inicio" dolarOficial={dolarOficial} />
                  <WhyChooseUs />
                  <ProductSection
                    id="servicios"
                    cart={cart}
                    addToCart={addToCart}
                  />
                  <HowItWorks />
                  <Workflow id="como-trabajamos" />
                  <FAQ id="preguntasfreceuntes" />
                  <AboutMeSection id="sobre-mi" />
                  <DolarQuote />
                </>
              )
            }
          />
          <Route
            path="/cart"
            element={
              <>
                <SEO title="Carrito de Compras" description="Revisa tu pedido de plotters y accesorios." />
                <CartPage cart={cart} removeFromCart={removeFromCart} />
              </>
            }
          />
          <Route
            path="/comunidad"
            element={
              <>
                <SEO title="Comunidad" description="Únete a la comunidad de Ingeniero Emprendedor." />
                <ComunidadPage />
              </>
            }
          />
          <Route
            path="/importacion"
            element={
              <>
                <SEO title="Importación" description="Servicios de importación de maquinaria textil." />
                <ImportacionPage />
              </>
            }
          />
          <Route path="/upload-manual" element={<ManualUploader />} />
          <Route path="/chat-audaces" element={<ChatAudaces />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upload-pdf"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'tenant_owner']}>
                <ManualUploader />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'tenant_owner']}>
                <ProductManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'tenant_owner']}>
                <CategoryManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/purchases"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'tenant_owner']}>
                <PurchasePlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leads"
            element={
              <ProtectedRoute allowedRoles={['admin', 'vendedor', 'owner', 'tenant_owner']}>
                <AdminLeads />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'tenant_owner']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/site-config"
            element={
              <ProtectedRoute allowedRoles={['admin', 'owner', 'tenant_owner']}>
                <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
                  <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                      <h1 className="text-3xl font-bold text-gray-800">Editor de Sitio Web</h1>
                      <p className="text-gray-600">Personaliza las imágenes y textos de tu página principal.</p>
                    </div>
                    <SiteConfigEditor />
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tenants"
            element={
              <ProtectedRoute allowedRoles={['owner', 'super_admin']}>
                <TenantManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/team"
            element={
              <ProtectedRoute allowedRoles={['owner', 'tenant_owner', 'admin']}>
                <TeamManager />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {location.pathname !== '/login' && <Footer id="contacto" />}

      {/* Renderizar chatbot de ventas SOLO en parte pública, ocultar en login y admin */}
      {location.pathname !== '/login' && !isAdminRoute && (
        /* Si hay tenant, validar bot_enabled. Si no (landing principal), mostrar por defecto. */
        (!tenant || tenant.bot_enabled) && <ChatVendedor />
      )}
    </>
  );
};

export default AppContent;
