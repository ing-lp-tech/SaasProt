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
    const { user } = useAuth();
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

    // Cargar datos
    useEffect(() => {
        if (tenant) fetchItems();
    }, [tenant]);

    // Fetch cotización del dólar cuando cambia el tipo
    useEffect(() => {
        if (formData.tipo_dolar) {
            fetchDolarRate(formData.tipo_dolar);
        }
    }, [formData.tipo_dolar]);

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

    const fetchDolarRate = async (tipo) => {
        try {
            setFetchingDolar(true);
            const url = `https://dolarapi.com/v1/dolares/${tipo}`;
            const response = await fetch(url);
            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                cotizacion_dolar: data.venta || data.promedio || 0
            }));
        } catch (error) {
            console.error('Error fetching dolar rate:', error);
            setFormData(prev => ({ ...prev, cotizacion_dolar: 0 }));
        } finally {
            setFetchingDolar(false);
        }
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
                    // eslint-disable-next-line no-undef
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
            cotizacion_dolar: 0,
            imagen: null,
            imagen_preview: null
        });
        setEditingId(null);
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
        // Scroll top
        window.scrollTo(0, 0);
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
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/admin/dashboard" className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <Calculator className="text-blue-600" /> Planificador de Compras
                        </h1>
                        <p className="text-gray-500">Calcula costos, compara y guarda tus posibles compras</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* PANEL IZQUIERDO: CALCULADORA Y FORMULARIO */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden sticky top-6">
                            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                                <span className="font-semibold flex items-center gap-2">
                                    {editingId ? <Edit2 size={18} /> : <Calculator size={18} />}
                                    {editingId ? 'Editar Cálculo' : 'Nuevo Cálculo'}
                                </span>
                                {editingId && (
                                    <button onClick={resetForm} className="text-xs bg-blue-700 px-2 py-1 rounded hover:bg-blue-500">
                                        Cancelar
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                {/* IMAGEN */}
                                <div className="flex justify-center">
                                    <label className="cursor-pointer relative group">
                                        <div className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${formData.imagen_preview ? 'border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}>
                                            {formData.imagen_preview ? (
                                                <img src={formData.imagen_preview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center text-gray-400">
                                                    <ImageIcon className="mx-auto mb-1" />
                                                    <span className="text-xs">Foto</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Upload className="text-white" size={24} />
                                        </div>
                                    </label>
                                </div>

                                {/* DATOS BASICOS */}
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Nombre del Producto..."
                                        className="w-full p-3 bg-gray-50 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Marca"
                                            className="p-2 bg-gray-50 rounded-lg border outline-none text-sm"
                                            value={formData.marca}
                                            onChange={e => setFormData({ ...formData, marca: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Código"
                                            className="p-2 bg-gray-50 rounded-lg border outline-none text-sm"
                                            value={formData.codigo}
                                            onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 border p-2 rounded-lg bg-gray-50">
                                        <Calendar size={16} className="text-gray-400" />
                                        <input
                                            type="date"
                                            className="bg-transparent outline-none text-sm w-full"
                                            value={formData.fecha_compra}
                                            onChange={e => setFormData({ ...formData, fecha_compra: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-4"></div>

                                {/* CALCULADORA */}
                                <div className="space-y-4 bg-blue-50 p-4 rounded-xl">
                                    <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">
                                        Calculadora de Costos
                                    </label>

                                    {/* SELECTOR TIPO */}
                                    <div className="flex bg-white rounded-lg p-1 shadow-sm">
                                        {['UNIDAD', 'DOCENA', 'PACK'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => handleCalcChange('tipo_unidad', type)}
                                                className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors ${formData.tipo_unidad === type
                                                    ? 'bg-blue-600 text-white shadow'
                                                    : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Si es PACK, pedir cantidad por pack */}
                                    {formData.tipo_unidad === 'PACK' && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-600 whitespace-nowrap">Unidades por Pack:</span>
                                            <input
                                                type="number"
                                                className="w-20 p-1 border rounded text-center font-bold text-blue-700"
                                                value={formData.cantidad_por_paquete}
                                                onChange={e => handleCalcChange('cantidad_por_paquete', e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* INPUTS PRINCIPALES */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">
                                                Cant. ({formData.tipo_unidad === 'UNIDAD' ? 'Unidades' : (formData.tipo_unidad === 'DOCENA' ? 'Docenas' : 'Packs')})
                                            </label>
                                            <div className="relative">
                                                <Package className="absolute left-2 top-2.5 text-gray-400" size={14} />
                                                <input
                                                    type="number"
                                                    className="w-full pl-7 pr-2 py-2 border rounded-lg text-gray-800 font-medium focus:border-blue-500 outline-none"
                                                    value={formData.cantidad_paquetes}
                                                    onChange={e => handleCalcChange('cantidad_paquetes', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">
                                                Costo x {formData.tipo_unidad === 'UNIDAD' ? 'Unid.' : (formData.tipo_unidad === 'DOCENA' ? 'Docena' : 'Pack')}
                                            </label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-2 top-2.5 text-gray-400" size={14} />
                                                <input
                                                    type="number"
                                                    className="w-full pl-7 pr-2 py-2 border rounded-lg text-gray-800 font-medium focus:border-blue-500 outline-none"
                                                    step="0.01"
                                                    value={formData.costo_por_paquete}
                                                    onChange={e => handleCalcChange('costo_por_paquete', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="text-xs text-gray-500 mb-1 block">Costo Total Compra</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 text-green-600" size={18} />
                                            <input
                                                type="number"
                                                className="w-full pl-9 pr-3 py-3 border-2 border-green-100 bg-green-50 rounded-lg text-green-800 font-bold text-lg focus:border-green-500 outline-none"
                                                step="0.01"
                                                value={formData.costo_total}
                                                onChange={e => handleCalcChange('costo_total', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* NUEVO: GASTOS DE IMPORTACIÓN */}
                                    <div className="pt-2 border-t border-blue-200 mt-2">
                                        <label className="text-xs text-gray-500 mb-1 block">
                                            Gastos de Importación/Envío (USD)
                                        </label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 text-orange-600" size={18} />
                                            <input
                                                type="number"
                                                className="w-full pl-9 pr-3 py-3 border-2 border-orange-100 bg-orange-50 rounded-lg text-orange-800 font-bold text-lg focus:border-orange-500 outline-none"
                                                step="0.01"
                                                value={formData.gastos_importacion}
                                                onChange={e => setFormData({ ...formData, gastos_importacion: e.target.value })}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* RESUMEN INTERMEDIO */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-200">
                                            <span>Costo REAL unitario (USD):</span>
                                            <span className="font-bold text-gray-800 text-sm">
                                                ${getRealUnitCost()} / unidad
                                            </span>
                                        </div>

                                        {/* Mostrar costo por docena/pack si no es UNIDAD */}
                                        {formData.tipo_unidad !== 'UNIDAD' && (
                                            <div className="flex justify-between items-center text-xs text-gray-500 bg-blue-50 p-2 rounded-lg border border-blue-200">
                                                <span>Costo por {formData.tipo_unidad === 'DOCENA' ? 'Docena' : 'Pack'} (USD):</span>
                                                <span className="font-bold text-blue-800 text-sm">
                                                    ${getCostPerPack()} / {formData.tipo_unidad.toLowerCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* NUEVO: SELECTOR TIPO DE DÓLAR */}
                                    <div className="pt-2 border-t border-blue-200 mt-2">
                                        <label className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 block">
                                            Convertir a Pesos Argentinos
                                        </label>

                                        <div className="flex gap-2 mb-3">
                                            {['blue', 'oficial'].map(tipo => (
                                                <button
                                                    key={tipo}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, tipo_dolar: tipo })}
                                                    className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium transition-all border-2 ${formData.tipo_dolar === tipo
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    Dólar {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* COTIZACIÓN ACTUAL */}
                                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 mb-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-indigo-700">Cotización {formData.tipo_dolar}:</span>
                                                <span className="font-bold text-indigo-900">
                                                    {fetchingDolar ? (
                                                        <Loader2 className="animate-spin inline" size={14} />
                                                    ) : (
                                                        `$${formData.cotizacion_dolar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        {/* PRECIO FINAL EN ARS */}
                                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-xl shadow-lg">
                                            <div className="text-white/80 text-xs uppercase tracking-wider mb-1">Precio Final por Unidad</div>
                                            <div className="text-white text-2xl font-bold">
                                                ${getPriceInARS() > 0 ? parseFloat(getPriceInARS()).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0.00'} ARS
                                            </div>
                                            <div className="text-white/60 text-xs mt-1">
                                                = ${getRealUnitCost()} USD × ${formData.cotizacion_dolar.toLocaleString('es-AR')}
                                            </div>

                                            {/* Mostrar precio por docena/pack si no es UNIDAD */}
                                            {formData.tipo_unidad !== 'UNIDAD' && parseFloat(getCostPerPackARS()) > 0 && (
                                                <>
                                                    <div className="border-t border-white/20 my-2"></div>
                                                    <div className="text-white/80 text-xs uppercase tracking-wider mb-1">
                                                        Precio por {formData.tipo_unidad === 'DOCENA' ? 'Docena' : 'Pack'}
                                                    </div>
                                                    <div className="text-white text-xl font-bold">
                                                        ${parseFloat(getCostPerPackARS()).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                                                    </div>
                                                    <div className="text-white/60 text-xs mt-1">
                                                        = ${getCostPerPack()} USD × ${formData.cotizacion_dolar.toLocaleString('es-AR')}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/30 transform active:scale-95 transition-all flex justify-center items-center gap-2"
                                >
                                    {uploading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                    {editingId ? 'ACTUALIZAR DATOS' : 'GUARDAR CÁLCULO'}
                                </button>

                            </form>
                        </div>
                    </div>

                    {/* PANEL DERECHO: LISTA */}
                    <div className="lg:col-span-3">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                            <div className="space-y-4">
                                {items.map(item => (
                                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex gap-4 items-start">
                                        {/* THUMBNAIL */}
                                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                            {item.imagen_url ? (
                                                <img src={item.imagen_url} className="w-full h-full object-cover" alt={item.nombre} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <ImageIcon size={24} />
                                                </div>
                                            )}
                                        </div>

                                        {/* CONTENT */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 truncate">{item.nombre}</h3>
                                                    <p className="text-xs text-gray-500 mb-1">
                                                        {item.marca && <span className="mr-2 bg-gray-100 px-1 rounded">{item.marca}</span>}
                                                        {item.codigo && <span>#{item.codigo}</span>}
                                                    </p>
                                                    <p className="text-xs text-blue-600 font-medium">
                                                        {new Date(item.fecha_compra).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-green-600">${item.costo_total}</p>
                                                    <p className="text-xs text-gray-500">Total Compra</p>
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center gap-4 text-sm bg-gray-50 p-2 rounded-lg">
                                                <div>
                                                    <span className="text-gray-400 text-xs block">Compra</span>
                                                    <span className="font-medium">
                                                        {item.cantidad_paquetes} {item.tipo_unidad.toLowerCase()}(s)
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 text-xs block">Costo / {item.tipo_unidad.toLowerCase()}</span>
                                                    <span className="font-medium">${item.costo_por_paquete}</span>
                                                </div>

                                                {/* Mostrar costo por docena/pack si NO es UNIDAD */}
                                                {item.tipo_unidad !== 'UNIDAD' && (
                                                    <div className="border-l pl-4">
                                                        <span className="text-gray-400 text-xs block">
                                                            Costo por {item.tipo_unidad === 'DOCENA' ? 'Docena' : 'Pack'}
                                                        </span>
                                                        <span className="font-bold text-purple-700">
                                                            ${(((item.costo_total + (item.gastos_importacion || 0)) / (item.cantidad_paquetes * item.cantidad_por_paquete)) * item.cantidad_por_paquete).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className={`${item.tipo_unidad !== 'UNIDAD' ? 'border-l' : 'ml-auto border-l'} pl-4`}>
                                                    <span className="text-gray-400 text-xs block">Costo Unitario Real</span>
                                                    <span className="font-bold text-blue-700">
                                                        ${(((item.costo_total || 0) + (item.gastos_importacion || 0)) / (item.cantidad_paquetes * item.cantidad_por_paquete)).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchasePlanner;
