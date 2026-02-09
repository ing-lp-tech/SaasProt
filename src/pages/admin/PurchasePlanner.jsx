import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext'; // Importar TenantContext
import { supabase } from '../../lib/supabaseClient';
import { compressImage } from '../../utils/imageOptimizer';
import {
    Calculator, Save, Trash2, Edit2, Image as ImageIcon,
    Calendar, Package, DollarSign, Upload, Loader2, ArrowLeft, FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PurchasePlanner = () => {
    const { tenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [fetchingDolar, setFetchingDolar] = useState(false);

    // Estado del Formulario
    const [formData, setFormData] = useState({
        nombre: '',
        marca: '',
        codigo: '',
        fecha_compra: new Date().toISOString().split('T')[0],
        tipo_unidad: 'DOCENA', // UNIDAD, DOCENA, PACK
        cantidad_por_paquete: 12, // Default para docena
        cantidad_paquetes: 1,
        costo_por_paquete: 0,
        costo_total: 0,
        gastos_importacion: 0, // NUEVO
        tipo_dolar: 'blue', // NUEVO: 'blue' o 'oficial'
        cotizacion_dolar: 0, // NUEVO: fetched from API
        imagen: null,
        imagen_preview: null
    });

    // Estado para edición
    const [editingId, setEditingId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [dolarRates, setDolarRates] = useState({ blue: 0, oficial: 0 });

    // Cargar datos y cotizaciones
    useEffect(() => {
        if (tenant) fetchItems();
        fetchAllDolarRates();
    }, [tenant]);

    // Bloquear scroll cuando el modal está abierto
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    // Fetch cotización del dólar cuando cambia el tipo
    // REMOVED: This useEffect is replaced by handleDolarTypeChange and fetchAllDolarRates

    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('purchase_drafts')
                .select('*')
                .eq('tenant_id', tenant.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllDolarRates = async () => {
        try {
            setFetchingDolar(true);
            const [blueRes, oficialRes] = await Promise.all([
                fetch('https://dolarapi.com/v1/dolares/blue'),
                fetch('https://dolarapi.com/v1/dolares/oficial')
            ]);

            const blueData = await blueRes.json();
            const oficialData = await oficialRes.json();

            const rates = {
                blue: blueData.venta || blueData.promedio || 0,
                oficial: oficialData.venta || oficialData.promedio || 0
            };

            setDolarRates(rates);

            // Si es un nuevo item (no edición), setear cotización inicial
            if (!editingId) {
                setFormData(prev => ({
                    ...prev,
                    cotizacion_dolar: rates[prev.tipo_dolar]
                }));
            }
        } catch (error) {
            console.error('Error fetching dolar rates:', error);
        } finally {
            setFetchingDolar(false);
        }
    };

    const handleDolarTypeChange = (type) => {
        setFormData(prev => ({
            ...prev,
            tipo_dolar: type,
            cotizacion_dolar: dolarRates[type] || prev.cotizacion_dolar
        }));
    };

    // --- LÓGICA DE CÁLCULADORA ---
    // Recalcular totales cuando cambian los inputs
    const handleCalcChange = (field, value) => {
        const newData = { ...formData, [field]: value };

        // Convertir strings a números para cálculos
        const qtyPacks = parseFloat(newData.cantidad_paquetes) || 0;
        const qtyPerPack = parseFloat(newData.cantidad_por_paquete) || 1;
        const costPerPack = parseFloat(newData.costo_por_paquete) || 0;
        const totalCost = parseFloat(newData.costo_total) || 0;

        if (field === 'costo_por_paquete' || field === 'cantidad_paquetes') {
            // Si cambio el unitario o cantidad, calculo el total
            newData.costo_total = (qtyPacks * costPerPack).toFixed(2);
        } else if (field === 'costo_total') {
            // Si cambio el total, calculo el unitario (si hay cantidad)
            if (qtyPacks > 0) {
                newData.costo_por_paquete = (totalCost / qtyPacks).toFixed(2);
            }
        } else if (field === 'tipo_unidad') {
            // Ajustar defaults según tipo
            if (value === 'UNIDAD') newData.cantidad_por_paquete = 1;
            if (value === 'DOCENA') newData.cantidad_por_paquete = 12;
            if (value === 'PACK') newData.cantidad_por_paquete = 10; // Default arbitrario
        }

        setFormData(newData);
    };

    // Calcular costo unitario real (por cada item individual) incluyendo gastos de importación
    const getRealUnitCost = () => {
        const total = parseFloat(formData.costo_total) || 0;
        const importCosts = parseFloat(formData.gastos_importacion) || 0;
        const packs = parseFloat(formData.cantidad_paquetes) || 0;
        const perPack = parseFloat(formData.cantidad_por_paquete) || 1;

        const totalUnits = packs * perPack;
        if (totalUnits === 0) return 0;

        // FÓRMULA: (Costo Total + Gastos Importación) / Total Unidades
        return ((total + importCosts) / totalUnits).toFixed(2);
    };

    // Calcular precio final en pesos argentinos
    const getPriceInARS = () => {
        const unitCostUSD = parseFloat(getRealUnitCost()) || 0;
        const exchangeRate = parseFloat(formData.cotizacion_dolar) || 0;

        if (exchangeRate === 0) return 0;
        return (unitCostUSD * exchangeRate).toFixed(2);
    };

    // Calcular costo por docena/pack (útil para mostrar al usuario)
    const getCostPerPack = () => {
        const unitCost = parseFloat(getRealUnitCost()) || 0;
        const perPack = parseFloat(formData.cantidad_por_paquete) || 1;
        return (unitCost * perPack).toFixed(2);
    };

    // Calcular costo por docena/pack en ARS
    const getCostPerPackARS = () => {
        const costPerPack = parseFloat(getCostPerPack()) || 0;
        const exchangeRate = parseFloat(formData.cotizacion_dolar) || 0;

        if (exchangeRate === 0) return 0;
        return (costPerPack * exchangeRate).toFixed(2);
    };

    // --- MANEJO DE IMAGEN ---
    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Preview inmediato
            setFormData({
                ...formData,
                imagen: file,
                imagen_preview: URL.createObjectURL(file)
            });
        }
    };

    // --- GUARDAR ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            if (!tenant) throw new Error("No se ha identificado el cliente (tenant).");

            let infoToSave = {
                tenant_id: tenant.id,
                nombre: formData.nombre,
                marca: formData.marca,
                codigo: formData.codigo,
                fecha_compra: formData.fecha_compra,
                tipo_unidad: formData.tipo_unidad,
                cantidad_por_paquete: formData.cantidad_por_paquete,
                cantidad_paquetes: formData.cantidad_paquetes,
                costo_por_paquete: formData.costo_por_paquete,
                costo_total: formData.costo_total,
                costo_unitario_final: getRealUnitCost(),
                gastos_importacion: formData.gastos_importacion,
                tipo_dolar: formData.tipo_dolar,
                cotizacion_dolar: formData.cotizacion_dolar,
                precio_final_ars: getPriceInARS()
            };

            // 1. Subir imagen si existe nueva
            if (formData.imagen) {
                // Comprimir
                let fileToUpload = formData.imagen;
                try {
                    fileToUpload = await compressImage(formData.imagen);
                } catch (err) {
                    console.warn("Compression failed, uploading original");
                }

                const fileExt = fileToUpload.name.split('.').pop();
                const fileName = `purchases/${tenant.id}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('productos-imagenes') // Reusamos bucket
                    .upload(fileName, fileToUpload);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('productos-imagenes')
                    .getPublicUrl(fileName);

                infoToSave.imagen_url = publicUrl;
            }

            // 2. Insertar o Actualizar
            if (editingId) {
                const { error } = await supabase
                    .from('purchase_drafts')
                    .update(infoToSave)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('purchase_drafts')
                    .insert(infoToSave);
                if (error) throw error;
            }

            // Reset
            resetForm();
            fetchItems();
            alert('¡Cálculo guardado!');

        } catch (error) {
            console.error(error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nombre: '',
            marca: '',
            codigo: '',
            fecha_compra: new Date().toISOString().split('T')[0],
            tipo_unidad: 'DOCENA',
            cantidad_por_paquete: 12,
            cantidad_paquetes: 1,
            costo_por_paquete: 0,
            costo_total: 0,
            gastos_importacion: 0,
            tipo_dolar: 'blue',
            cotizacion_dolar: dolarRates.blue || 0, // Reset to cached rate
            imagen: null,
            imagen_preview: null
        });
        setEditingId(null);
        setIsModalOpen(false);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        const savedDate = new Date(item.created_at).toISOString().split('T')[0]; // O fecha_compra si ya existe
        setFormData({
            nombre: item.nombre,
            marca: item.marca || '',
            codigo: item.codigo || '',
            fecha_compra: item.fecha_compra || savedDate,
            tipo_unidad: item.tipo_unidad || 'UNIDAD',
            cantidad_por_paquete: item.cantidad_por_paquete,
            cantidad_paquetes: item.cantidad_paquetes,
            costo_por_paquete: item.costo_por_paquete,
            costo_total: item.costo_total,
            gastos_importacion: item.gastos_importacion || 0,
            tipo_dolar: item.tipo_dolar || 'blue',
            cotizacion_dolar: item.cotizacion_dolar || 0,
            imagen: null,
            imagen_preview: item.imagen_url
        });
        setIsModalOpen(true);
    };

    const handleNew = () => {
        resetForm(); // Uses resetForm to get clean state with latest dollar
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Borrar este cálculo?")) return;

        try {
            const { error } = await supabase
                .from('purchase_drafts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchItems();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="w-full mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/admin/dashboard" className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <Calculator className="text-blue-600" /> Planificador de Compras
                            </h1>
                            <p className="text-gray-500 hidden md:block">Calcula costos, compara y guarda tus posibles compras</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNew}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center gap-2 transform active:scale-95"
                    >
                        <Calculator size={20} />
                        NUEVA POSIBLE COMPRA
                    </button>
                </div>

                <div className="w-full">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <FileText className="text-gray-400" />
                        Historial de Cálculos
                    </h2>

                    {loading ? (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                            <Loader2 className="animate-spin relative left-1/2 -ml-3 text-blue-500" size={30} />
                            <p className="text-gray-400 mt-2">Cargando...</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                            <Calculator className="mx-auto text-gray-300 mb-4" size={48} />
                            <h3 className="text-lg font-medium text-gray-600">Sin registros aún</h3>
                            <p className="text-gray-400">Usa la calculadora izquierda para agregar tu primer producto.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                            {items.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleEdit(item)}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col overflow-hidden"
                                >
                                    {/* IMAGEN SUPERIOR */}
                                    <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                                        {item.imagen_url ? (
                                            <img
                                                src={item.imagen_url}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                                alt={item.nombre}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                                <ImageIcon size={48} className="opacity-50" />
                                            </div>
                                        )}
                                        {/* Overlay Hover */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>

                                        {/* Botones de Acción Flotantes */}
                                        <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 duration-300">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                className="p-2 bg-white text-blue-600 rounded-lg shadow-sm hover:shadow-md hover:bg-blue-50 transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="p-2 bg-white text-red-500 rounded-lg shadow-sm hover:shadow-md hover:bg-red-50 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Price Tag Overlay */}
                                        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold text-gray-800 shadow-sm">
                                            ${item.costo_total} <span className="text-[10px] text-gray-500 font-normal">Total</span>
                                        </div>
                                    </div>

                                    {/* CONTENIDO */}
                                    <div className="p-4 flex-1 flex flex-col gap-3">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-gray-800 line-clamp-1 text-lg mb-1">{item.nombre}</h3>
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {item.marca && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-medium">{item.marca}</span>}
                                                {item.codigo && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">#{item.codigo}</span>}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mt-auto">
                                            {/* SECCIÓN USD */}
                                            <div className="bg-blue-50/80 p-2 rounded-lg border border-blue-100">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">USD</span>
                                                    <span className="text-[10px] text-blue-600 font-medium">Costo Importación</span>
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <div className="text-xs text-blue-700/80">
                                                        {item.cantidad_paquetes} x {item.cantidad_por_paquete} u.
                                                    </div>
                                                    <div className="text-right leading-tight">
                                                        {item.tipo_unidad !== 'UNIDAD' ? (
                                                            <>
                                                                <div className="font-bold text-blue-800 text-sm">
                                                                    ${(parseFloat(item.costo_unitario_final) * item.cantidad_por_paquete).toFixed(2)}
                                                                </div>
                                                                <div className="text-[10px] text-blue-600">
                                                                    Unit: ${item.costo_unitario_final}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="font-bold text-blue-800 text-sm">
                                                                ${item.costo_unitario_final}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SECCIÓN ARS */}
                                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded-lg border border-purple-100">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-1.5 py-0.5 rounded">ARS</span>
                                                    <span className="text-[10px] text-purple-600 font-medium">Precio Final</span>
                                                </div>
                                                <div className="text-right leading-tight">
                                                    {item.tipo_unidad !== 'UNIDAD' ? (
                                                        <>
                                                            <div className="font-bold text-purple-900 text-lg">
                                                                ${item.precio_final_ars
                                                                    ? (parseFloat(item.precio_final_ars) * item.cantidad_por_paquete).toLocaleString('es-AR')
                                                                    : '-'}
                                                            </div>
                                                            <div className="text-[10px] text-purple-700">
                                                                Unit: ${item.precio_final_ars ? parseFloat(item.precio_final_ars).toLocaleString('es-AR') : '-'}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="font-bold text-purple-900 text-lg">
                                                            ${item.precio_final_ars ? parseFloat(item.precio_final_ars).toLocaleString('es-AR') : '-'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE EDICIÓN / DETALLE */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-white w-full max-w-7xl h-[90vh] rounded-2xl shadow-2xl overflow-y-auto md:overflow-hidden flex flex-col md:flex-row relative animate-in fade-in zoom-in duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* BOTÓN CERRAR - FLOTANTE */}
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 z-20 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all text-gray-800 backdrop-blur-md"
                        >
                            <ArrowLeft size={24} />
                        </button>

                        {/* COLUMNA IZQUIERDA: IMAGEN GRANDE */}
                        <div className="md:w-1/2 bg-gray-100 flex items-center justify-center relative p-4 md:p-8 min-h-[300px]">
                            <div className="w-full h-full flex items-center justify-center">
                                {formData.imagen_preview ? (
                                    <img
                                        src={formData.imagen_preview}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                                    />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <ImageIcon className="mx-auto mb-4 opacity-50" size={120} />
                                        <p className="text-xl font-medium">Sin Imagen</p>
                                    </div>
                                )}
                            </div>

                            {/* CAMBIAR FOTO FLOTANTE */}
                            <label className="absolute bottom-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg cursor-pointer flex items-center gap-2 transition-transform transform active:scale-95">
                                <Upload size={20} />
                                <span className="font-bold">Cambiar Foto</span>
                                <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                            </label>
                        </div>

                        {/* COLUMNA DERECHA: FORMULARIO WIDE */}
                        <div className="md:w-1/2 md:overflow-y-auto bg-white p-6 md:p-10">
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Detalles del Producto</h2>
                                    <p className="text-gray-500">Edita la información y recalcula costos fácilmente.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* DATOS PRINCIPALES */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Producto</label>
                                            <input
                                                type="text"
                                                className="w-full text-lg p-4 bg-gray-50 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                                                required
                                                value={formData.nombre}
                                                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Marca</label>
                                            <input type="text" className="w-full p-4 bg-gray-50 rounded-xl border outline-none text-gray-800" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Código</label>
                                            <input type="text" className="w-full p-4 bg-gray-50 rounded-xl border outline-none text-gray-800" value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Compra</label>
                                            <input type="date" className="w-full p-4 bg-gray-50 rounded-xl border outline-none text-gray-800" value={formData.fecha_compra} onChange={e => setFormData({ ...formData, fecha_compra: e.target.value })} />
                                        </div>
                                    </div>

                                    <hr className="border-gray-100" />

                                    {/* CALCULADORA (REDISEÑADA PARA MODAL) */}
                                    <div>
                                        <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                                            <Calculator size={24} /> Costos y Precios
                                        </h3>

                                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-6">
                                            {/* SELECTOR */}
                                            <div className="flex gap-4">
                                                {['UNIDAD', 'DOCENA', 'PACK'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => handleCalcChange('tipo_unidad', type)}
                                                        className={`flex-1 py-3 rounded-xl font-bold transition-all border-2 ${formData.tipo_unidad === type ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* INPUTS GRID */}
                                            <div className="grid grid-cols-2 gap-6">
                                                {formData.tipo_unidad === 'PACK' && (
                                                    <div className="col-span-2">
                                                        <label className="text-sm font-medium text-gray-500 mb-1 block">Unidades por Pack</label>
                                                        <input type="number" className="w-full p-3 border rounded-xl text-center font-bold text-gray-800 text-lg bg-white" value={formData.cantidad_por_paquete} onChange={e => handleCalcChange('cantidad_por_paquete', e.target.value)} />
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="text-sm text-gray-500 mb-1 block">Cantidad ({formData.tipo_unidad})</label>
                                                    <input type="number" className="w-full p-3 border rounded-xl font-bold text-lg text-gray-800 bg-white" value={formData.cantidad_paquetes} onChange={e => handleCalcChange('cantidad_paquetes', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="text-sm text-gray-500 mb-1 block">Costo ({formData.tipo_unidad})</label>
                                                    <input type="number" className="w-full p-3 border rounded-xl font-bold text-lg text-gray-800 bg-white" value={formData.costo_por_paquete} onChange={e => handleCalcChange('costo_por_paquete', e.target.value)} step="0.01" />
                                                </div>
                                            </div>

                                            {/* COSTO TOTAL Y GASTOS */}
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-sm text-gray-500 mb-1 block">Costo Total Compra</label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-3 top-3.5 text-green-600" size={20} />
                                                        <input type="number" className="w-full pl-10 p-3 bg-green-50 border-green-200 border rounded-xl font-bold text-xl text-green-700" value={formData.costo_total} onChange={e => handleCalcChange('costo_total', e.target.value)} step="0.01" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm text-gray-500 mb-1 block">Gastos Importación (USD)</label>
                                                    <div className="relative">
                                                        <DollarSign className="absolute left-3 top-3.5 text-orange-600" size={20} />
                                                        <input type="number" className="w-full pl-10 p-3 bg-orange-50 border-orange-200 border rounded-xl font-bold text-xl text-orange-700" value={formData.gastos_importacion} onChange={e => setFormData({ ...formData, gastos_importacion: e.target.value })} step="0.01" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RESUMEN USD */}
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500">Costo Unitario Real:</span>
                                                    <span className="text-xl font-bold text-gray-800">${getRealUnitCost()} USD</span>
                                                </div>
                                                {formData.tipo_unidad !== 'UNIDAD' && (
                                                    <div className="flex justify-between items-center pt-2 border-t border-dashed">
                                                        <span className="text-gray-500">Costo por {formData.tipo_unidad === 'DOCENA' ? 'Docena' : 'Pack'}:</span>
                                                        <span className="text-lg font-bold text-blue-600">${getCostPerPack()} USD</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CONVERSIÓN ARS */}
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <h3 className="font-bold text-gray-700 mb-4 uppercase tracking-wide text-sm">Conversión a Pesos</h3>
                                        <div className="flex gap-4 mb-4">
                                            {['blue', 'oficial'].map(tipo => (
                                                <button
                                                    key={tipo}
                                                    type="button"
                                                    onClick={() => handleDolarTypeChange(tipo)}
                                                    className={`flex-1 py-2 px-2 md:px-4 rounded-lg font-medium transition-all text-xs md:text-sm ${formData.tipo_dolar === tipo ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-600 border border-gray-200'}`}
                                                >
                                                    <div>Dólar {tipo.charAt(0).toUpperCase() + tipo.slice(1)}</div>
                                                    <div className="font-bold opacity-80">
                                                        (${dolarRates[tipo]?.toLocaleString('es-AR')})
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-xl text-white">
                                            <div className="text-white/80 text-sm uppercase font-bold mb-3 border-b border-white/20 pb-2">Precio Final Total (ARS)</div>

                                            <div className="flex flex-col gap-4">
                                                {/* PRECIO POR UNIDAD */}
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white/80 text-sm">x Unidad</span>
                                                    <div className="text-right">
                                                        <div className="text-3xl md:text-4xl font-bold tracking-tight">
                                                            ${getPriceInARS() > 0 ? parseFloat(getPriceInARS()).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0.00'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* PRECIO POR PACK/DOCENA (Si aplica) */}
                                                {formData.tipo_unidad !== 'UNIDAD' && parseFloat(getCostPerPackARS()) > 0 && (
                                                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                                                        <span className="text-white/80 text-sm">x {formData.tipo_unidad === 'DOCENA' ? 'Docena' : 'Pack'}</span>
                                                        <div className="text-right">
                                                            <div className="text-xl md:text-2xl font-bold text-white/90">
                                                                ${parseFloat(getCostPerPackARS()).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* BOTÓN GUARDAR STICKY */}
                                    <div className="sticky bottom-0 pt-4 bg-white/95 backdrop-blur">
                                        <button
                                            type="submit"
                                            disabled={uploading}
                                            className="w-full py-5 text-lg bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-xl shadow-green-200 transform active:scale-95 transition-all flex justify-center items-center gap-3"
                                        >
                                            {uploading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                                            GUARDAR CAMBIOS
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

        </div>
    );
};

export default PurchasePlanner;
