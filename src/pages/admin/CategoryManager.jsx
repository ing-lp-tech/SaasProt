import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit, Trash2, Save, X, MoveUp, MoveDown, ArrowLeft, ExternalLink } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import './CategoryManager.css';

export default function CategoryManager() {
    const { tenant } = useTenant();
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showNewForm, setShowNewForm] = useState(false);

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        orden: 0
    });

    useEffect(() => {
        if (tenant) {
            fetchCategorias();
        }
    }, [tenant]);

    const fetchCategorias = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('categorias')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('orden', { ascending: true });
        setCategorias(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                // Actualizar
                const { error } = await supabase
                    .from('categorias')
                    .update(formData)
                    .eq('id', editingId);

                if (error) throw error;
                alert('✅ Categoría actualizada');
            } else {
                // Crear nueva
                const { error } = await supabase
                    .from('categorias')
                    .insert([{
                        ...formData,
                        tenant_id: tenant.id
                    }]);

                if (error) throw error;
                alert('✅ Categoría creada');
            }

            resetForm();
            fetchCategorias();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error: ' + error.message);
        }
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({
            nombre: cat.nombre,
            descripcion: cat.descripcion || '',
            orden: cat.orden
        });
        setShowNewForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.')) return;

        try {
            const { error } = await supabase
                .from('categorias')
                .delete()
                .eq('id', id);

            if (error) throw error;
            alert('✅ Categoría eliminada');
            fetchCategorias();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({ nombre: '', descripcion: '', orden: 0 });
        setEditingId(null);
        setShowNewForm(false);
    };

    const moveCategory = async (cat, direction) => {
        const currentIndex = categorias.findIndex(c => c.id === cat.id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= categorias.length) return;

        const targetCat = categorias[targetIndex];

        try {
            // Intercambiar órdenes
            await supabase.from('categorias').update({ orden: targetCat.orden }).eq('id', cat.id);
            await supabase.from('categorias').update({ orden: cat.orden }).eq('id', targetCat.id);

            fetchCategorias();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al mover categoría');
        }
    };

    return (
        <div className="category-manager">
            <AdminHeader
                title="Gestión de Categorías"
                subtitle="Organiza tus productos para una mejor experiencia de compra"
            />

            {/* Barra de Herramientas */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex gap-3">
                    <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition font-medium"
                    >
                        <ArrowLeft size={18} /> Dashboard
                    </Link>
                    <a
                        href={tenant ? `/?tenant=${tenant.subdomain}` : "/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 rounded-lg transition font-medium"
                    >
                        <ExternalLink size={18} /> Ver Tienda
                    </a>
                </div>

                <button
                    onClick={() => setShowNewForm(!showNewForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition-colors font-semibold"
                >
                    <Plus size={18} />
                    Nueva Categoría
                </button>
            </div>

            {/* Formulario */}
            {showNewForm && (
                <div className="category-form-card">
                    <div className="form-header">
                        <h3>{editingId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                        <button onClick={resetForm} className="btn-close">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-field">
                            <label>Nombre de la Categoría *</label>
                            <input
                                type="text"
                                required
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Plotters inyección"
                            />
                        </div>

                        <div className="form-field">
                            <label>Descripción</label>
                            <textarea
                                rows="3"
                                value={formData.descripcion}
                                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Breve descripción que se mostrará en la página principal..."
                            />
                        </div>

                        <div className="form-field">
                            <label>Orden de visualización *</label>
                            <input
                                type="number"
                                required
                                value={formData.orden}
                                onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                                placeholder="1, 2, 3..."
                            />
                            <small>Menor número = aparece primero en el e-commerce</small>
                        </div>

                        <button type="submit" className="btn-submit">
                            <Save size={18} />
                            {editingId ? 'Guardar Cambios' : 'Crear Categoría'}
                        </button>
                    </form>
                </div>
            )}

            {/* Lista de Categorías */}
            <div className="categories-list">
                <h3>Categorías Actuales ({categorias.length})</h3>

                {loading ? (
                    <p>Cargando...</p>
                ) : (
                    <div className="categories-grid">
                        {categorias.map((cat, index) => (
                            <div key={cat.id} className="category-card">
                                <div className="category-order">
                                    <span className="order-badge">#{cat.orden}</span>
                                    <div className="order-controls">
                                        <button
                                            onClick={() => moveCategory(cat, 'up')}
                                            disabled={index === 0}
                                            title="Subir"
                                        >
                                            <MoveUp size={14} />
                                        </button>
                                        <button
                                            onClick={() => moveCategory(cat, 'down')}
                                            disabled={index === categorias.length - 1}
                                            title="Bajar"
                                        >
                                            <MoveDown size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="category-info">
                                    <h4>{cat.nombre}</h4>
                                    <p>{cat.descripcion || 'Sin descripción'}</p>
                                </div>

                                <div className="category-actions">
                                    <button onClick={() => handleEdit(cat)} className="btn-edit">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} className="btn-delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
