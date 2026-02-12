import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Loader, CheckCircle, Store } from 'lucide-react';

export default function RequestStoreModal({ isOpen, onClose }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        mensaje: '',
        social_link: ''
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validations
        if (formData.nombre.trim().length < 3) {
            alert('Por favor ingresa un nombre completo válido.');
            return;
        }

        if (!formData.email.includes('@') || formData.email.length < 5) {
            alert('Por favor ingresa un email válido.');
            return;
        }

        // Phone validation: allows only numbers, spaces, and optional + at the start
        const phoneRegex = /^[+]?[0-9\s]+$/;
        if (!phoneRegex.test(formData.telefono) || formData.telefono.replace(/\D/g, '').length < 6) {
            alert('El teléfono solo debe contener números y opcionalmente el signo + al principio.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('leads')
                .insert([
                    {
                        nombre: formData.nombre,
                        email: formData.email,
                        telefono: formData.telefono,
                        mensaje: formData.mensaje,
                        social_link: formData.social_link,
                        origen: 'landing_modal',
                        estado: 'nuevo'
                    }
                ]);

            if (error) throw error;



            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setFormData({ nombre: '', email: '', telefono: '', mensaje: '', social_link: '' });
            }, 3000);

        } catch (error) {
            console.error('Error saving lead:', error);
            alert('Error al enviar solicitud. Por favor intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all scale-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition"
                    >
                        <X size={24} />
                    </button>
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                        <Store size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">Solicita tu Tienda</h2>
                    <p className="text-indigo-100 text-sm mt-2">Déjanos tus datos y te contactaremos para configurar tu e-commerce.</p>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Solicitud Enviada!</h3>
                            <p className="text-gray-500">Un asesor se pondrá en contacto contigo a la brevedad.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    placeholder=""
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    placeholder=""
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    placeholder=""
                                    value={formData.telefono}
                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Redes Sociales (Link)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    placeholder=""
                                    value={formData.social_link}
                                    onChange={(e) => setFormData({ ...formData, social_link: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje (Opcional)</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                                    placeholder=""
                                    rows="3"
                                    value={formData.mensaje}
                                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition duration-200 shadow-md transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader className="animate-spin" size={20} /> Enviando...
                                    </>
                                ) : (
                                    'Solicitar Alta'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
