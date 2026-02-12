// ============================================
// SERVICIO DE MERCADOPAGO - FRONTEND
// ============================================
// Maneja la comunicación con el backend para MercadoPago
// ============================================

import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

class MercadoPagoService {

    /**
     * Obtener configuración de MercadoPago del tenant
     */
    async getConfig(tenantId) {
        try {
            const { data, error } = await supabase
                .from('mercadopago_config')
                .select('id, tenant_id, public_key, is_sandbox, enabled, created_at, updated_at')
                .eq('tenant_id', tenantId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data || { enabled: false };
        } catch (error) {
            console.error('Error obteniendo config MP:', error);
            throw error;
        }
    }

    /**
     * Guardar/actualizar configuración de MercadoPago
     */
    async saveConfig(tenantId, config) {
        try {
            const updateData = {
                tenant_id: tenantId,
                public_key: config.publicKey,
                is_sandbox: config.isSandbox,
                enabled: config.enabled,
                updated_at: new Date().toISOString()
            };

            // Solo actualizar el token si se proporciona uno nuevo
            if (config.accessToken) {
                updateData.access_token_encrypted = config.accessToken; // TODO: Encriptar en backend
            }

            const { data, error } = await supabase
                .from('mercadopago_config')
                .upsert(updateData, { onConflict: 'tenant_id' })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error guardando config MP:', error);
            throw error;
        }
    }

    /**
     * Crear preferencia de pago
     */
    async createPreference(tenantId, orderData, paymentType = 'full') {
        try {
            console.log('[DEBUG] Frontend createPreference - TenantID:', tenantId);
            const response = await fetch(`${API_URL}/api/mercadopago/create-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-ID': tenantId
                },
                body: JSON.stringify({
                    tenantId,
                    orderData: {
                        ...orderData,
                        return_url: window.location.origin
                    },
                    paymentType
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error creando preferencia MP');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creando preferencia MP:', error);
            throw error;
        }
    }

    /**
     * Obtener métodos de pago habilitados para el tenant
     */
    async getPaymentMethods(tenantId) {
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('enabled', true)
                .order('method_type');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo métodos de pago:', error);
            throw error;
        }
    }

    /**
     * Actualizar métodos de pago
     */
    async updatePaymentMethods(tenantId, methods) {
        try {
            const updates = methods.map(method => ({
                tenant_id: tenantId,
                method_type: method.type,
                enabled: method.enabled,
                deposit_percentage: method.depositPercentage || 30,
                updated_at: new Date().toISOString()
            }));

            const { data, error } = await supabase
                .from('payment_methods')
                .upsert(updates, { onConflict: 'tenant_id,method_type' })
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error actualizando métodos de pago:', error);
            throw error;
        }
    }

    /**
     * Obtener transacciones de MercadoPago
     */
    async getTransactions(tenantId, options = {}) {
        try {
            let query = supabase
                .from('mercadopago_transactions')
                .select('*, orders(id, total, created_at)')
                .eq('tenant_id', tenantId)
                .order('created_at', { ascending: false });

            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.status) {
                query = query.eq('status', options.status);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error obteniendo transacciones MP:', error);
            throw error;
        }
    }

    /**
     * Verificar estado de un pago
     */
    async checkPaymentStatus(transactionId) {
        try {
            const { data, error } = await supabase
                .from('mercadopago_transactions')
                .select('*')
                .eq('id', transactionId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error verificando estado de pago:', error);
            throw error;
        }
    }

    /**
     * Calcular monto de seña
     */
    async calculateDepositAmount(tenantId, totalAmount) {
        try {
            const methods = await this.getPaymentMethods(tenantId);
            const depositMethod = methods.find(m => m.method_type === 'mercadopago_deposit');
            const percentage = depositMethod?.deposit_percentage || 30;
            return (parseFloat(totalAmount) * percentage) / 100;
        } catch (error) {
            console.error('Error calculando seña:', error);
            return (parseFloat(totalAmount) * 30) / 100; // Default 30%
        }
    }
}

export default new MercadoPagoService();
