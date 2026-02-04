import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Store, Shield, CheckCircle, Menu, X, ArrowRight, DollarSign, Laptop, MessageCircle } from 'lucide-react';
import saasLogo from '../assets/avatarLuisPatty.jpg'; // Avatar como logo
import Footer from "../components/Footer";
import FAQ from "../components/Faq";
import AboutMeSection from "../components/AboutMeSection";
import DolarQuote from "../components/DolarQuote";

import RequestStoreModal from "../components/RequestStoreModal";

export default function LandingPage() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const whatsappUrl = "https://wa.me/5491162020911?text=Hola!%20Quiero%20mas%20info%20sobre%20IngeStore";

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Navbar */}
            <nav className="bg-white/90 backdrop-blur-md shadow-sm py-4 px-6 md:px-12 sticky top-0 z-50 transition-all duration-300">
                <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                        <img src={saasLogo} alt="IngeStore Logo" className="h-10 w-10 object-cover rounded-full border-2 border-indigo-100 shadow-sm" />
                        <span className="font-extrabold text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight hidden sm:block">
                            IngeStore
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
                        <a href="#" className="hover:text-blue-600 transition">Inicio</a>
                        <a href="#beneficios" className="hover:text-blue-600 transition">Beneficios</a>
                        <a href="#planes" className="hover:text-blue-600 transition">Planes</a>
                        <a href="#about-me" className="hover:text-blue-600 transition">Nosotros</a>
                        <button
                            onClick={() => document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' })}
                            className="hover:text-blue-600 transition"
                        >
                            Contacto
                        </button>
                    </div>

                    <div className="hidden md:flex gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 transform hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            Login Admin
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700 hover:text-blue-600">
                            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full bg-white border-b shadow-xl py-6 px-6 flex flex-col gap-4 animate-in slide-in-from-top-5 fade-in duration-200">
                        <a href="#" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-800">Inicio</a>
                        <a href="#beneficios" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-800">Beneficios</a>
                        <a href="#planes" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-800">Planes</a>
                        <a href="#about-me" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-800">Nosotros</a>
                        <div className="h-px bg-gray-100 my-2"></div>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-md"
                        >
                            Login Admin
                        </button>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-slate-50">
                {/* Background Blobs */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

                <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="md:w-1/2 space-y-8 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm mx-auto md:mx-0">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                            </span>
                            Plataforma #1 para Vender Online
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                            Tu Negocio, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Abierto 24/7.</span>
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed max-w-lg mx-auto md:mx-0">
                            Olvídate de alquilar local físico. Ten tu propia sucursal digital y vende sin límites, sin fronteras y con total libertad.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4">
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-green-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition transform hover:-translate-y-1 shadow-xl hover:shadow-2xl">
                                <MessageCircle size={24} />
                                ¡Quiero mi App!
                            </a>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-indigo-700 bg-white border-2 border-indigo-50 hover:bg-indigo-50 hover:border-indigo-100 transition shadow-sm"
                            >
                                Solicitar Alta
                            </button>
                        </div>
                        <div className="pt-6 flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">👤</div>
                                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs">👤</div>
                                <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-xs">👤</div>
                            </div>
                            +500 Emprendedores confían en IngeStore
                        </div>
                    </div>

                    {/* Hero Image - Web Store Visualization (Replaces Avatar) */}
                    <div className="md:w-1/2 w-full perspective-1000">
                        <div className="relative group transform rotate-y-3 hover:rotate-y-0 transition-all duration-700 ease-out">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                                {/* Browser Window Header */}
                                <div className="bg-gray-100 px-4 py-3 border-b flex gap-2 items-center">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    <div className="ml-4 bg-white px-3 py-1 rounded-md text-xs text-gray-400 flex-1 text-center font-mono">
                                        tutienda.ingestore.com
                                    </div>
                                </div>
                                {/* Browser Body - Mockup */}
                                <div className="p-1 bg-gray-50 aspect-video flex items-center justify-center relative overflow-hidden">
                                    {/* Simple CSS Illustration of a Store */}
                                    <div className="w-full h-full bg-slate-100 grid grid-cols-4 gap-2 p-4">
                                        {/* Header */}
                                        <div className="col-span-4 h-8 bg-white rounded shadow-sm mb-2"></div>
                                        {/* Banner */}
                                        <div className="col-span-4 h-32 bg-indigo-100 rounded-lg shadow-sm flex items-center justify-center text-indigo-300 mb-2">
                                            <Store size={48} />
                                        </div>
                                        {/* Products */}
                                        <div className="h-24 bg-white rounded shadow-sm"></div>
                                        <div className="h-24 bg-white rounded shadow-sm"></div>
                                        <div className="h-24 bg-white rounded shadow-sm"></div>
                                        <div className="h-24 bg-white rounded shadow-sm"></div>
                                    </div>

                                    {/* Overlay Floating Card */}
                                    <div className="absolute bottom-6 -left-4 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 animate-bounce-slow">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-100 p-2 rounded-lg">
                                                <DollarSign className="text-green-600" size={24} />
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 font-semibold uppercase">Ventas Hoy</div>
                                                <div className="text-xl font-bold text-gray-900">$124.500</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Section (New) */}
            <div className="bg-white py-24 border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Físico vs Digital</h2>
                        <p className="text-gray-500 text-lg">La diferencia en tu bolsillo es abismal.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
                        {/* Old Way */}
                        <div className="p-8 rounded-3xl bg-gray-50 border border-gray-200 opacity-80 hover:opacity-100 transition">
                            <h3 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
                                <Store size={20} /> Local Físico Tradicional
                            </h3>
                            <ul className="space-y-4 text-gray-600">
                                <li className="flex items-center gap-3">
                                    <X className="text-red-500 shrink-0" size={18} />
                                    <span>Alquiler: <strong>$300.000+ / mes</strong></span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <X className="text-red-500 shrink-0" size={18} />
                                    <span>Servicios e Impuestos caros</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <X className="text-red-500 shrink-0" size={18} />
                                    <span>Horario limitado</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <X className="text-red-500 shrink-0" size={18} />
                                    <span>Solo clientes del barrio</span>
                                </li>
                            </ul>
                        </div>

                        {/* New Way */}
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">GANADOR</div>
                            <h3 className="text-xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
                                <Laptop size={20} /> Tienda IngeStore
                            </h3>
                            <ul className="space-y-4 text-gray-700">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="text-green-500 shrink-0" size={18} />
                                    <span>Inversión: <strong>Mínima mensual</strong></span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="text-green-500 shrink-0" size={18} />
                                    <span>Mantenimiento incluido</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="text-green-500 shrink-0" size={18} />
                                    <span>Abierto <strong>24/7</strong></span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="text-green-500 shrink-0" size={18} />
                                    <span>Ventas a todo el país</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Process Section (New) */}
            <div id="process" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Lanza tu web en 3 Pasos</h2>
                        <p className="text-gray-500">Sin complicaciones técnicas.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: "01", title: "Elegís tu Plan", desc: "Selecciona el paquete que mejor se adapte a tu stock." },
                            { step: "02", title: "Subís tus Productos", desc: "Carga fotos y precios desde nuestro Panel Admin fácil de usar." },
                            { step: "03", title: "Empezás a Vender", desc: "Compartís tu link y recibís pedidos a tu WhatsApp." }
                        ].map((item, idx) => (
                            <div key={idx} className="relative group p-8 bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300">
                                <div className="text-6xl font-black text-gray-100 absolute top-4 right-4 group-hover:text-indigo-50 transition">{item.step}</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{item.title}</h3>
                                <p className="text-gray-600 relative z-10">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features (Styled) */}
            <div id="beneficios" className="bg-white py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Herramientas Potentes</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-10">
                        <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition duration-300">
                            <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                                <Store size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Catálogo Interactivo</h3>
                            <p className="text-gray-600">
                                Tus clientes amarán navegar tus productos. Fotos HD y carrito de compras rápido.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition duration-300">
                            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                                <Shield size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Autogestión Total</h3>
                            <p className="text-gray-600">
                                Cambia precios, pausa productos sin stock y sube novedades en segundos.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition duration-300">
                            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                                <Rocket size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Integración WhatsApp</h3>
                            <p className="text-gray-600">
                                Los pedidos llegan listos para confirmar. Cierra la venta hablando directamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Section (New) */}
            <div id="planes" className="bg-slate-900 py-24 text-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Planes Transparentes</h2>
                        <p className="text-slate-400">Escala tu negocio sin letras chicas.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Plan Start */}
                        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 hover:border-indigo-500 transition">
                            <h3 className="text-xl font-semibold mb-2">Inicial</h3>
                            <div className="text-4xl font-bold mb-6">$15k<span className="text-sm text-slate-400 font-normal">/mes</span></div>
                            <ul className="space-y-4 mb-8 text-slate-300">
                                <li className="flex gap-2"><CheckCircle size={18} className="text-indigo-400" /> Hasta 50 Productos</li>
                                <li className="flex gap-2"><CheckCircle size={18} className="text-indigo-400" /> Catálogo Web</li>
                                <li className="flex gap-2"><CheckCircle size={18} className="text-indigo-400" /> Pedidos x WhatsApp</li>
                            </ul>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold transition">
                                Elegir Plan
                            </a>
                        </div>

                        {/* Plan Pro */}
                        <div className="bg-indigo-600 rounded-3xl p-8 border-4 border-indigo-500 transform md:-translate-y-6 shadow-2xl relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Más Popular</div>
                            <h3 className="text-xl font-semibold mb-2">Profesional</h3>
                            <div className="text-4xl font-bold mb-6">$25k<span className="text-sm text-indigo-200 font-normal">/mes</span></div>
                            <ul className="space-y-4 mb-8 text-white">
                                <li className="flex gap-2"><CheckCircle size={18} className="text-white" /> Productos Ilimitados</li>
                                <li className="flex gap-2"><CheckCircle size={18} className="text-white" /> Dominio Personalizado</li>
                                <li className="flex gap-2"><CheckCircle size={18} className="text-white" /> QR para tu Local</li>
                                <li className="flex gap-2"><CheckCircle size={18} className="text-white" /> Soporte Prioritario</li>
                            </ul>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 rounded-xl bg-white text-indigo-600 font-bold hover:bg-gray-100 transition shadow-lg">
                                Comenzar Ahora
                            </a>
                        </div>

                        {/* Plan Enterprise */}
                        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 hover:border-indigo-500 transition">
                            <h3 className="text-xl font-semibold mb-2">Empresas</h3>
                            <div className="text-4xl font-bold mb-6">Consultar</div>
                            <ul className="space-y-4 mb-8 text-slate-300">
                                <li className="flex gap-2"><CheckCircle size={18} className="text-indigo-400" /> Múltiples Sucursales</li>
                                <li className="flex gap-2"><CheckCircle size={18} className="text-indigo-400" /> App Móvil Nativa</li>
                                <li className="flex gap-2"><CheckCircle size={18} className="text-indigo-400" /> Integración ERP</li>
                            </ul>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center py-3 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold transition">
                                Contactar Ventas
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Me Section - Reused */}
            <div id="about-me">
                <AboutMeSection />
            </div>

            {/* Cotización del Dólar */}
            <DolarQuote />

            {/* FAQ Section - Reused */}
            <div id="faq-section">
                <FAQ items={[
                    {
                        category: "Dudas Comunes",
                        questions: [
                            {
                                question: "¿Necesito saber programar o diseñar?",
                                answer: "¡Para nada! Nosotros nos encargamos de todo el trabajo pesado. Te entregamos tu tienda lista para vender. Tú solo te preocupas por despachar tus productos."
                            },
                            {
                                question: "¿Cuánto tardan en entregarme mi tienda?",
                                answer: "Sabemos que el tiempo es dinero. En nuestro plan Inicial, tu tienda queda operativa en menos de 48 horas hábiles una vez nos envíes tu logo y productos."
                            },
                            {
                                question: "¿Es difícil cargar productos y cambiar precios?",
                                answer: "Es más fácil que usar Instagram. Te damos una App y un Panel de Control diseñados para que cambies precios o stock en 3 clics desde tu celular."
                            },
                            {
                                question: "¿Cobran comisión por mis ventas?",
                                answer: "NO. A diferencia de MercadoLibre o otras plataformas, el 100% de la venta es tuya. Solo pagas el mantenimiento mensual fijo de tu plan."
                            },
                            {
                                question: "¿Sirve si vendo servicios y no productos?",
                                answer: "¡Sí! Adaptamos la plataforma para que tus clientes puedan reservar turnos, consultar presupuestos o ver tu portafolio de trabajos."
                            }
                        ]
                    }
                ]} />
            </div>

            {/* CTA Final */}
            <div className="bg-white py-24 relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight">
                        Tu competencia ya está online. <br /><span className="text-indigo-600">¿Qué estás esperando?</span>
                    </h2>
                    <p className="text-gray-500 text-xl mb-12 max-w-2xl mx-auto">
                        Prueba gratis por 14 días. Sin tarjeta de crédito.
                    </p>
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 text-white px-12 py-5 rounded-full font-bold text-xl hover:bg-green-700 transition shadow-2xl hover:shadow-green-500/20 transform hover:-translate-y-1"
                    >
                        <MessageCircle size={28} />
                        Hablar con un Asesor
                    </a>
                </div>
            </div>

            {/* Footer handled globally in AppContent */}
            {/* Modal de Solicitud */}
            <RequestStoreModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
