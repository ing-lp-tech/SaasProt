import { supabase } from '../lib/supabaseClient';

export const siteConfigService = {
    // Obtener todas las configuraciones del tenant actual
    async getAllConfigs(tenantId) {
        if (!tenantId) {
            console.error("getAllConfigs: tenantId is required");
            return {};
        }
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select('*')
                .eq('tenant_id', tenantId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return {};
                }
                throw error;
            }

            return data || {};
        } catch (error) {
            console.error('Error fetching all configs:', error);
            return {};
        }
    },

    // Obtener una configuración específica por columna
    async getConfig(columnName, tenantId) {
        if (!tenantId) return null;
        try {
            const { data, error } = await supabase
                .from('site_config')
                .select(columnName)
                .eq('tenant_id', tenantId)
                .single();

            if (error) throw error;
            return data?.[columnName] || null;
        } catch (error) {
            console.error(`Error fetching config for column ${columnName}:`, error);
            return null;
        }
    },

    // Actualizar una o varias configuraciones
    async updateConfig(columnName, value, tenantId) {
        if (!tenantId) throw new Error("tenantId is required for update");
        try {
            const { data: existing } = await supabase
                .from('site_config')
                .select('id')
                .eq('tenant_id', tenantId)
                .single();

            let result;

            if (!existing) {
                // No existe, crear con UPSERT
                const { data, error } = await supabase
                    .from('site_config')
                    .insert({
                        tenant_id: tenantId,
                        [columnName]: value,
                        updated_at: new Date()
                    })
                    .select();

                if (error) throw error;
                result = data;
            } else {
                // Existe, hacer UPDATE
                const { data, error } = await supabase
                    .from('site_config')
                    .update({
                        [columnName]: value,
                        updated_at: new Date()
                    })
                    .eq('id', existing.id)
                    .select();

                if (error) throw error;
                result = data;
            }

            return result;
        } catch (error) {
            console.error(`Error updating config for column ${columnName}:`, error);
            throw error;
        }
    },

    // Actualizar múltiples configuraciones a la vez
    async updateMultipleConfigs(updates, tenantId) {
        if (!tenantId) throw new Error("tenantId is required for update");
        try {
            const { data: existing } = await supabase
                .from('site_config')
                .select('id')
                .eq('tenant_id', tenantId)
                .single();

            let result;

            if (!existing) {
                // No existe, crear con UPSERT
                const { data, error } = await supabase
                    .from('site_config')
                    .insert({
                        tenant_id: tenantId,
                        ...updates,
                        updated_at: new Date()
                    })
                    .select();

                if (error) throw error;
                result = data;
            } else {
                // Existe, hacer UPDATE
                const { data, error } = await supabase
                    .from('site_config')
                    .update({
                        ...updates,
                        updated_at: new Date()
                    })
                    .eq('id', existing.id)
                    .select();

                if (error) throw error;
                result = data;
            }

            return result;
        } catch (error) {
            console.error('Error updating multiple configs:', error);
            throw error;
        }
    },

    // Subir imagen al bucket 'productos-imagenes' con organización multi-tenant
    async uploadImage(file, path) {
        try {
            // Obtener tenant_id del usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            // Obtener tenant_id desde auth metadata
            const tenantId = user.user_metadata?.tenant_id || 'default';

            // Crear nombre único y estructura de carpetas organizada
            const fileExt = file.name.split('.').pop();
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const fileName = `${path}-${timestamp}-${randomStr}.${fileExt}`;

            // Estructura: tenant-{tenant_id}/site-config/{archivo}
            // Esto mantiene las imágenes organizadas por cliente
            const filePath = `tenant-${tenantId}/site-config/${fileName}`;

            // Subir archivo
            const { error: uploadError } = await supabase.storage
                .from('productos-imagenes')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('productos-imagenes')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }
};
