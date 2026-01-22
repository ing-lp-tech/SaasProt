import React, { useState, useEffect } from "react";
import { siteConfigService } from "../../services/siteConfigService";
import { Save, Upload, Loader, Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useTenant } from "../../contexts/TenantContext";
import { THEMES } from "../../constants/themes";

export const SiteConfigEditor = () => {
    const { tenant } = useTenant();
    const [configs, setConfigs] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({});

    // Estados para contenido editable
    const [aboutItems, setAboutItems] = useState([]);
    const [workflowSteps, setWorkflowSteps] = useState([]);
    const [faqCategories, setFaqCategories] = useState([]);
    const [carouselImages, setCarouselImages] = useState([]);
    const [whyChooseFeatures, setWhyChooseFeatures] = useState([]);

    // Estados para secciones colapsables
    const [expandedSections, setExpandedSections] = useState({
        images: false,
        hero: false,
        carousel: false,
        whychoose: false,
        about: false,
        workflow: false,
        faq: false,
        footer: false,
        design: false
    });

    const CONFIG_KEYS = [
        { key: "navbar_logo_url", label: "Logo Barra de Navegación", type: "image", description: "200x80px, PNG transparente recomendado, <500KB" },
        { key: "hero_logo_url", label: "Logo Hero", type: "image", description: "400x200px, PNG transparente, <500KB" },
        { key: "hero_main_image_url", label: "Imagen Principal Hero", type: "image", description: "1920x1080px, JPG/PNG, <2MB" },
        { key: "about_bg_url", label: "Fondo Sección 'Sobre Mí'", type: "image", description: "1920x1080px, JPG, <3MB" },
        { key: "workflow_image_url", label: "Imagen 'Cómo Trabajamos'", type: "image", description: "1200x800px, JPG/PNG, <2MB" },
        { key: "footer_logo_url", label: "Logo Footer", type: "image", description: "200x100px, PNG, <500KB" },
    ];

    useEffect(() => {
        if (tenant?.id) {
            loadConfigs();
        }
    }, [tenant?.id]);

    const loadConfigs = async () => {
        setLoading(true);
        const data = await siteConfigService.getAllConfigs(tenant.id);
        setConfigs(data || {});

        // Parsear about_content
        try {
            const aboutContent = data?.about_content;
            if (aboutContent) {
                const parsed = typeof aboutContent === 'string' ? JSON.parse(aboutContent) : aboutContent;
                setAboutItems(Array.isArray(parsed) ? parsed : []);
            }
        } catch (e) {
            console.error('Error parsing about_content:', e);
        }

        // Parsear workflow_content
        try {
            const workflowContent = data?.workflow_content;
            if (workflowContent) {
                const parsed = typeof workflowContent === 'string' ? JSON.parse(workflowContent) : workflowContent;
                setWorkflowSteps(Array.isArray(parsed) ? parsed : []);
            }
        } catch (e) {
            console.error('Error parsing workflow_content:', e);
        }

        // Parsear faq_content
        try {
            const faqContent = data?.faq_content;
            if (faqContent) {
                const parsed = typeof faqContent === 'string' ? JSON.parse(faqContent) : faqContent;
                setFaqCategories(Array.isArray(parsed) ? parsed : []);
            } else {
                // Pre-cargar defaults si no hay contenido guardado
                const presetId = data?.preset_id || 'default';
                const theme = THEMES.find(t => t.id === presetId);
                if (theme?.defaultFaqs) {
                    setFaqCategories(theme.defaultFaqs);
                }
            }
        } catch (e) {
            console.error('Error parsing faq_content:', e);
        }

        // Parsear hero_carousel_images
        try {
            const carouselContent = data?.hero_carousel_images;
            if (carouselContent) {
                const parsed = typeof carouselContent === 'string' ? JSON.parse(carouselContent) : carouselContent;
                setCarouselImages(Array.isArray(parsed) ? parsed : []);
            }
        } catch (e) {
            console.error('Error parsing hero_carousel_images:', e);
        }

        // Parsear why_choose_features
        try {
            const whyChooseContent = data?.why_choose_features;
            if (whyChooseContent) {
                const parsed = typeof whyChooseContent === 'string' ? JSON.parse(whyChooseContent) : whyChooseContent;
                setWhyChooseFeatures(Array.isArray(parsed) ? parsed : []);
            }
        } catch (e) {
            console.error('Error parsing why_choose_features:', e);
        }

        setLoading(false);
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Manejo de imágenes
    const handleImageUpload = async (key, file) => {
        if (!file) return;
        setUploading((prev) => ({ ...prev, [key]: true }));
        try {
            const url = await siteConfigService.uploadImage(file, key);
            if (url) {
                setConfigs((prev) => ({ ...prev, [key]: url }));
                await siteConfigService.updateConfig(key, url, tenant.id);
                alert("Imagen subida correctamente.");
            }
        } catch (error) {
            console.error(error);
            alert("Error al subir imagen.");
        } finally {
            setUploading((prev) => ({ ...prev, [key]: false }));
        }
    };

    // Manejo de About Items
    const handleAboutItemChange = (index, field, value) => {
        const newItems = [...aboutItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setAboutItems(newItems);
    };

    const addAboutItem = () => {
        setAboutItems([...aboutItems, { title: "", description: "" }]);
    };

    const removeAboutItem = (index) => {
        if (window.confirm("¿Eliminar este bloque?")) {
            setAboutItems(aboutItems.filter((_, i) => i !== index));
        }
    };

    // Manejo de Workflow Steps
    const handleWorkflowStepChange = (index, field, value) => {
        const newSteps = [...workflowSteps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setWorkflowSteps(newSteps);
    };

    const addWorkflowStep = () => {
        setWorkflowSteps([...workflowSteps, { title: "", description: "" }]);
    };

    const removeWorkflowStep = (index) => {
        if (window.confirm("¿Eliminar este paso?")) {
            setWorkflowSteps(workflowSteps.filter((_, i) => i !== index));
        }
    };

    // Manejo de FAQ
    const handleFaqCategoryChange = (catIndex, value) => {
        const newCategories = [...faqCategories];
        newCategories[catIndex].category = value;
        setFaqCategories(newCategories);
    };

    const handleFaqQuestionChange = (catIndex, qIndex, field, value) => {
        const newCategories = [...faqCategories];
        newCategories[catIndex].questions[qIndex][field] = value;
        setFaqCategories(newCategories);
    };

    const addFaqCategory = () => {
        setFaqCategories([...faqCategories, { category: "", questions: [] }]);
    };

    const removeFaqCategory = (catIndex) => {
        if (window.confirm("¿Eliminar esta categoría?")) {
            setFaqCategories(faqCategories.filter((_, i) => i !== catIndex));
        }
    };

    const addFaqQuestion = (catIndex) => {
        const newCategories = [...faqCategories];
        if (!newCategories[catIndex].questions) {
            newCategories[catIndex].questions = [];
        }
        newCategories[catIndex].questions.push({ question: "", answer: "" });
        setFaqCategories(newCategories);
    };

    const removeFaqQuestion = (catIndex, qIndex) => {
        if (window.confirm("¿Eliminar esta pregunta?")) {
            const newCategories = [...faqCategories];
            newCategories[catIndex].questions = newCategories[catIndex].questions.filter((_, i) => i !== qIndex);
            setFaqCategories(newCategories);
        }
    };

    // Manejo de Carousel
    const handleCarouselImageUpload = async (index, file) => {
        if (!file) return;
        const uploadKey = `carousel_${index}`;
        setUploading((prev) => ({ ...prev, [uploadKey]: true }));
        try {
            const url = await siteConfigService.uploadImage(file, `hero_carousel_${index}`);
            if (url) {
                const newImages = [...carouselImages];
                newImages[index] = url;
                setCarouselImages(newImages);
                alert("Imagen del carousel subida correctamente.");
            }
        } catch (error) {
            console.error(error);
            alert("Error al subir imagen del carousel.");
        } finally {
            setUploading((prev) => ({ ...prev, [uploadKey]: false }));
        }
    };

    const removeCarouselImage = (index) => {
        if (window.confirm("¿Eliminar esta imagen del carousel?")) {
            const newImages = [...carouselImages];
            newImages[index] = null;
            setCarouselImages(newImages);
        }
    };

    const handleSaveAll = async () => {
        if (!tenant?.id) {
            alert("Error: No se ha detectado el tenant.");
            return;
        }
        setSaving(true);
        try {
            // Preparar todos los updates en un solo objeto
            const allUpdates = {
                ...configs,
                about_content: JSON.stringify(aboutItems),
                workflow_content: JSON.stringify(workflowSteps),
                faq_content: JSON.stringify(faqCategories),
                hero_carousel_images: JSON.stringify(carouselImages.filter(img => img !== null)),
                why_choose_features: JSON.stringify(whyChooseFeatures.filter(f => f.title))
            };

            // Guardar todo en una sola operación
            await siteConfigService.updateMultipleConfigs(allUpdates, tenant.id);

            alert("✅ Cambios guardados exitosamente.");
            await loadConfigs(); // Recargar para reflejar cambios
        } catch (error) {
            console.error(error);
            alert("❌ Error al guardar cambios: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Cargando configuración...</div>;

    const SectionHeader = ({ title, section, icon }) => (
        <div
            className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition-colors border border-indigo-200"
            onClick={() => toggleSection(section)}
        >
            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                {icon} {title}
            </h3>
            {expandedSections[section] ? <ChevronUp className="text-indigo-600" /> : <ChevronDown className="text-indigo-600" />}
        </div>
    );

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-6xl mx-auto mb-20">
            {/* Header con navegación */}
            <div className="border-b pb-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-3">
                        <Link
                            to="/admin/dashboard"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
                        >
                            <ArrowLeft size={18} />
                            Dashboard
                        </Link>
                        <a
                            href={tenant ? `/?tenant=${tenant.subdomain}` : "/"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition font-medium border border-blue-200"
                        >
                            <ExternalLink size={18} />
                            Ver Tienda
                        </a>
                    </div>
                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg text-white font-bold transition ${saving ? "bg-green-800 cursor-wait" : "bg-green-600 hover:bg-green-700"
                            }`}
                    >
                        <Save size={20} />
                        {saving ? "Guardando..." : "Guardar Todo"}
                    </button>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Editor de Contenido del Sitio</h2>
                <p className="text-sm text-gray-500 mt-1">Personaliza las imágenes y textos de tu página principal.</p>
            </div>

            <div className="space-y-4">
                {/* SECCIÓN: IMÁGENES GENERALES */}
                <SectionHeader title="Imágenes Generales" section="images" icon="🖼️" />
                {expandedSections.images && (
                    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                        {CONFIG_KEYS.map((field) => (
                            <div key={field.key} className="p-4 bg-white border rounded-lg shadow-sm">
                                <label className="block text-sm font-bold text-gray-700 mb-1">{field.label}</label>
                                <p className="text-xs text-blue-600 mb-3">📐 {field.description}</p>
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    <div className="w-32 h-32 border rounded bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {configs[field.key] ? (
                                            <img src={configs[field.key]} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-gray-300 text-xs text-center">Sin imagen</span>
                                        )}
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className={`flex items-center gap-2 px-4 py-2 rounded cursor-pointer text-white text-sm font-medium transition w-fit ${uploading[field.key] ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                                            }`}>
                                            {uploading[field.key] ? <Loader className="animate-spin" size={16} /> : <Upload size={16} />}
                                            {uploading[field.key] ? "Subiendo..." : "Cambiar Imagen"}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(field.key, e.target.files[0])}
                                                className="hidden"
                                                disabled={uploading[field.key]}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SECCIÓN: HERO/PORTADA */}
                <SectionHeader title="Sección Hero / Portada" section="hero" icon="🎯" />
                {expandedSections.hero && (
                    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Título Principal</label>
                            <input
                                type="text"
                                value={configs.hero_title || ""}
                                onChange={(e) => setConfigs({ ...configs, hero_title: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Soluciones profesionales para patronaje digital"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Subtítulo (Opcional)</label>
                            <input
                                type="text"
                                value={configs.hero_subtitle || ""}
                                onChange={(e) => setConfigs({ ...configs, hero_subtitle: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: La mejor tecnología para tu negocio"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                            <textarea
                                rows="4"
                                value={configs.hero_description || ""}
                                onChange={(e) => setConfigs({ ...configs, hero_description: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Descripción detallada que aparecerá debajo del título..."
                            />
                        </div>
                    </div>
                )}

                {/* SECCIÓN: CAROUSEL HERO */}
                <SectionHeader title="Carousel Hero" section="carousel" icon="🎠" />
                {expandedSections.carousel && (
                    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                        <p className="text-sm text-gray-600 mb-4">
                            📸 Sube 3 imágenes para el carousel que se mostrará en la sección Hero de tu tienda. Las imágenes se mostrarán con auto-play y controles manuales.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[0, 1, 2].map((index) => (
                                <div key={index} className="p-4 bg-white border rounded-lg shadow-sm">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Imagen {index + 1}
                                    </label>
                                    <div className="space-y-3">
                                        <div className="w-full h-48 border-2 border-dashed rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
                                            {carouselImages[index] ? (
                                                <img
                                                    src={carouselImages[index]}
                                                    alt={`Carousel ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-gray-400 text-sm text-center px-4">
                                                    Sin imagen
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <label
                                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded cursor-pointer text-white text-sm font-medium transition ${uploading[`carousel_${index}`]
                                                    ? "bg-gray-400"
                                                    : "bg-blue-600 hover:bg-blue-700"
                                                    }`}
                                            >
                                                {uploading[`carousel_${index}`] ? (
                                                    <Loader className="animate-spin" size={16} />
                                                ) : (
                                                    <Upload size={16} />
                                                )}
                                                {uploading[`carousel_${index}`] ? "Subiendo..." : "Subir"}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) =>
                                                        handleCarouselImageUpload(index, e.target.files[0])
                                                    }
                                                    className="hidden"
                                                    disabled={uploading[`carousel_${index}`]}
                                                />
                                            </label>
                                            {carouselImages[index] && (
                                                <button
                                                    onClick={() => removeCarouselImage(index)}
                                                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded transition text-sm font-medium"
                                                    title="Eliminar imagen"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Tip: Usa imágenes de al menos 1920x600px para mejor calidad en pantallas grandes.
                        </p>
                    </div>
                )}

                {/* SECCIÓN: SOBRE MÍ */}
                <SectionHeader title='Sección "Sobre Mí"' section="about" icon="👤" />
                {expandedSections.about && (
                    <div className="p-6 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-sm text-gray-600">Bloques de contenido para la sección "Sobre Mí"</p>
                            <button
                                onClick={addAboutItem}
                                className="flex items-center gap-1 text-sm bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition"
                            >
                                <Plus size={16} /> Agregar Bloque
                            </button>
                        </div>
                        <div className="space-y-4">
                            {aboutItems.map((item, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-white relative group">
                                    <button
                                        onClick={() => removeAboutItem(index)}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="mb-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
                                        <input
                                            type="text"
                                            value={item.title}
                                            onChange={(e) => handleAboutItemChange(index, 'title', e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                                            placeholder="Ej: Ingeniero Electrónico"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                        <textarea
                                            value={item.description}
                                            onChange={(e) => handleAboutItemChange(index, 'description', e.target.value)}
                                            className="w-full p-2 border rounded h-24 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-y"
                                            placeholder="Escribe el contenido aquí..."
                                        />
                                    </div>
                                </div>
                            ))}
                            {aboutItems.length === 0 && (
                                <div className="text-center p-8 text-gray-500 bg-white border border-dashed rounded-lg">
                                    No hay bloques. Agrega uno para comenzar.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SECCIÓN: CÓMO TRABAJAMOS */}
                <SectionHeader title='Sección "Cómo Trabajamos"' section="workflow" icon="⚙️" />
                {expandedSections.workflow && (
                    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Título</label>
                            <input
                                type="text"
                                value={configs.workflow_title || ""}
                                onChange={(e) => setConfigs({ ...configs, workflow_title: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Nuestro Proceso de Trabajo"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Subtítulo</label>
                            <input
                                type="text"
                                value={configs.workflow_subtitle || ""}
                                onChange={(e) => setConfigs({ ...configs, workflow_subtitle: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Desde tu consulta hasta la entrega..."
                            />
                        </div>
                        <div className="flex justify-between items-center mt-6">
                            <p className="text-sm text-gray-600 font-semibold">Pasos del Proceso</p>
                            <button
                                onClick={addWorkflowStep}
                                className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition"
                            >
                                <Plus size={16} /> Agregar Paso
                            </button>
                        </div>
                        <div className="space-y-4 mt-4">
                            {workflowSteps.map((step, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-white relative group">
                                    <button
                                        onClick={() => removeWorkflowStep(index)}
                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="mb-3">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título del Paso</label>
                                        <input
                                            type="text"
                                            value={step.title}
                                            onChange={(e) => handleWorkflowStepChange(index, 'title', e.target.value)}
                                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Ej: Asesoramiento personalizado"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                        <textarea
                                            value={step.description}
                                            onChange={(e) => handleWorkflowStepChange(index, 'description', e.target.value)}
                                            className="w-full p-2 border rounded h-20 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                            placeholder="Describe este paso del proceso..."
                                        />
                                    </div>
                                </div>
                            ))}
                            {workflowSteps.length === 0 && (
                                <div className="text-center p-8 text-gray-500 bg-white border border-dashed rounded-lg">
                                    No hay pasos. Agrega uno para comenzar.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SECCIÓN: PREGUNTAS FRECUENTES */}
                <SectionHeader title="Preguntas Frecuentes" section="faq" icon="❓" />
                {expandedSections.faq && (
                    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Título de la Sección</label>
                            <input
                                type="text"
                                value={configs.faq_title || "Preguntas Frecuentes"}
                                onChange={(e) => setConfigs({ ...configs, faq_title: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Preguntas Frecuentes"
                            />
                        </div>
                        <div className="flex justify-between items-center mt-6">
                            <p className="text-sm text-gray-600 font-semibold">Categorías y Preguntas</p>
                            <button
                                onClick={addFaqCategory}
                                className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition"
                            >
                                <Plus size={16} /> Agregar Categoría
                            </button>
                        </div>
                        <div className="space-y-6 mt-4">
                            {faqCategories.map((cat, catIndex) => (
                                <div key={catIndex} className="p-4 border-2 border-indigo-200 rounded-lg bg-white">
                                    <div className="flex justify-between items-start mb-4">
                                        <input
                                            type="text"
                                            value={cat.category}
                                            onChange={(e) => handleFaqCategoryChange(catIndex, e.target.value)}
                                            className="flex-1 p-2 border-b-2 border-indigo-300 focus:border-indigo-500 outline-none font-bold text-indigo-900"
                                            placeholder="Nombre de la categoría"
                                        />
                                        <button
                                            onClick={() => removeFaqCategory(catIndex)}
                                            className="ml-2 p-1 text-gray-400 hover:text-red-600 transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => addFaqQuestion(catIndex)}
                                        className="flex items-center gap-1 text-xs bg-indigo-500 text-white px-2 py-1 rounded hover:bg-indigo-600 transition mb-3"
                                    >
                                        <Plus size={14} /> Agregar Pregunta
                                    </button>
                                    <div className="space-y-3">
                                        {cat.questions?.map((q, qIndex) => (
                                            <div key={qIndex} className="p-3 bg-gray-50 border rounded relative group">
                                                <button
                                                    onClick={() => removeFaqQuestion(catIndex, qIndex)}
                                                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="mb-2">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Pregunta</label>
                                                    <input
                                                        type="text"
                                                        value={q.question}
                                                        onChange={(e) => handleFaqQuestionChange(catIndex, qIndex, 'question', e.target.value)}
                                                        className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        placeholder="¿Cuál es tu pregunta?"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Respuesta</label>
                                                    <textarea
                                                        value={q.answer}
                                                        onChange={(e) => handleFaqQuestionChange(catIndex, qIndex, 'answer', e.target.value)}
                                                        className="w-full p-2 border rounded h-16 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                                                        placeholder="Escribe la respuesta aquí..."
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        {(!cat.questions || cat.questions.length === 0) && (
                                            <div className="text-center p-4 text-gray-400 text-sm bg-gray-100 border border-dashed rounded">
                                                No hay preguntas en esta categoría
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {faqCategories.length === 0 && (
                                <div className="text-center p-8 text-gray-500 bg-white border border-dashed rounded-lg">
                                    No hay categorías. Agrega una para comenzar.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SECCIÓN: DISEÑO Y TEMA */}
                <SectionHeader title="Diseño y Tema" section="design" icon="🎨" />
                {expandedSections.design && (
                    <div className="p-6 bg-gray-50 rounded-lg space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Elige una Plantilla / Tema
                            </label>
                            <p className="text-sm text-gray-500 mb-4">
                                Selecciona un estilo predefinido para cambiar los colores y tipografía de tu tienda al instante.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => {
                                            setConfigs({
                                                ...configs,
                                                primary_color: theme.colors.primary, // Use snake_case for DB
                                                primaryColor: theme.colors.primary, // Keep camelCase for local UI state if needed
                                                font: theme.font,
                                                preset_id: theme.id
                                            });
                                        }}
                                        className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] flex flex-col gap-2 relative overflow-hidden ${configs.preset_id === theme.id || (theme.id === 'default' && !configs.preset_id)
                                            ? 'border-blue-500 ring-2 ring-blue-200 bg-white'
                                            : 'border-transparent bg-white shadow-md hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-bold text-gray-800">{theme.name}</span>
                                            {configs.preset_id === theme.id && <span className="text-xl">✅</span>}
                                        </div>
                                        <p className="text-xs text-gray-500">{theme.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div
                                                className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                                                style={{ backgroundColor: theme.colors.primary }}
                                                title={`Color Primario: ${theme.colors.primary}`}
                                            ></div>
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded border border-gray-200 font-mono">
                                                {theme.font}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Override */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                <span>🛠️</span> Ajustes Manuales (Sobrescribir)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Color Primario
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={configs.primary_color || configs.primaryColor || "#3b82f6"}
                                            onChange={(e) => setConfigs({ ...configs, primary_color: e.target.value, primaryColor: e.target.value, preset_id: 'custom' })}
                                            className="h-10 w-10 p-1 rounded cursor-pointer border bg-white"
                                        />
                                        <input
                                            type="text"
                                            value={configs.primary_color || configs.primaryColor || ""}
                                            onChange={(e) => setConfigs({ ...configs, primary_color: e.target.value, primaryColor: e.target.value, preset_id: 'custom' })}
                                            placeholder="#3b82f6"
                                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        Tipografía
                                    </label>
                                    <select
                                        value={configs.font || "Poppins"}
                                        onChange={(e) => setConfigs({ ...configs, font: e.target.value, preset_id: 'custom' })}
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="Poppins">Poppins (Default)</option>
                                        <option value="Playfair Display">Playfair Display (Elegante)</option>
                                        <option value="Merriweather">Merriweather (Serif)</option>
                                        <option value="Quicksand">Quicksand (Rounded)</option>
                                        <option value="Fredoka">Fredoka (Fun)</option>
                                        <option value="Orbitron">Orbitron (Tech)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SECCIÓN: FOOTER Y REDES SOCIALES */}
                <SectionHeader title="Footer y Redes Sociales" section="footer" icon="🔗" />
                {expandedSections.footer && (
                    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Título de Redes Sociales</label>
                            <input
                                type="text"
                                value={configs.footer_title || ""}
                                onChange={(e) => setConfigs({ ...configs, footer_title: e.target.value })}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ej: Síguenos en nuestras redes"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">🔵 Facebook URL</label>
                                <input
                                    type="url"
                                    value={configs.social_facebook || ""}
                                    onChange={(e) => setConfigs({ ...configs, social_facebook: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://facebook.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">📸 Instagram URL</label>
                                <input
                                    type="url"
                                    value={configs.social_instagram || ""}
                                    onChange={(e) => setConfigs({ ...configs, social_instagram: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://instagram.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">🎵 TikTok URL</label>
                                <input
                                    type="url"
                                    value={configs.social_tiktok || ""}
                                    onChange={(e) => setConfigs({ ...configs, social_tiktok: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://tiktok.com/@..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">💼 LinkedIn URL</label>
                                <input
                                    type="url"
                                    value={configs.social_linkedin || ""}
                                    onChange={(e) => setConfigs({ ...configs, social_linkedin: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://linkedin.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">▶️ YouTube URL</label>
                                <input
                                    type="url"
                                    value={configs.social_youtube || ""}
                                    onChange={(e) => setConfigs({ ...configs, social_youtube: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://youtube.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">🐦 Twitter/X URL</label>
                                <input
                                    type="url"
                                    value={configs.social_twitter || ""}
                                    onChange={(e) => setConfigs({ ...configs, social_twitter: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="https://twitter.com/..."
                                />
                            </div>
                        </div>
                        <div className="border-t pt-4 mt-6">
                            {/* <div className="mb-4">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Texto Copyright</label>
                                <input
                                    type="text"
                                    value={configs.footer_copyright || ""}
                                    onChange={(e) => setConfigs({ ...configs, footer_copyright: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej: Todos los derechos reservados."
                                />
                            </div> */}
                            {/* Créditos de diseño fijos por código */}
                        </div>
                    </div>
                )}
            </div>

            {/* Botón flotante para mobile */}
            <div className="fixed bottom-4 right-4 md:hidden z-50">
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-2xl text-white font-bold transition ${saving ? "bg-green-800" : "bg-green-600"
                        }`}
                >
                    <Save size={20} />
                    {saving ? "Guardando..." : "Guardar"}
                </button>
            </div>
        </div>
    );
};
