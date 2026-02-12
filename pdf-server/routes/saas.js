// ============================================
// RUTAS DE ADMINISTRACIÓN SAAS - BACKEND
// ============================================
// Maneja gestión de tenants, pagos de suscripción, etc.
// ============================================

const express = require('express');
const router = express.Router();

/**
 * GET /saas/tenants
 * Listar todos los tenants (solo super admin)
 */
router.get('/tenants', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('tenants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data || []);

    } catch (error) {
        console.error('Error listing tenants:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /saas/tenants/with-debt
 * Obtener tenants con deuda
 */
router.get('/tenants/with-debt', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .rpc('get_tenants_with_debt');

        if (error) throw error;

        res.json(data || []);

    } catch (error) {
        console.error('Error getting tenants with debt:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /saas/tenants/:id/payment-status
 * Actualizar estado de pago de un tenant
 */
router.put('/tenants/:id/payment-status', async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status, monthly_fee, owner_phone } = req.body;

        const updateData = {};
        if (payment_status) updateData.payment_status = payment_status;
        if (monthly_fee !== undefined) updateData.monthly_fee = monthly_fee;
        if (owner_phone !== undefined) updateData.owner_phone = owner_phone;

        const { data, error } = await req.supabase
            .from('tenants')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(data);

    } catch (error) {
        console.error('Error updating tenant payment status:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /saas/tenants/:id/register-payment
 * Registrar un pago de suscripción
 */
router.post('/tenants/:id/register-payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, payment_date } = req.body;

        const updateData = {
            last_payment_date: payment_date || new Date().toISOString(),
            payment_status: 'up_to_date'
        };

        const { data, error } = await req.supabase
            .from('tenants')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Pago registrado exitosamente',
            tenant: data
        });

    } catch (error) {
        console.error('Error registering payment:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /saas/tenants/:id/custom-domain
 * Configurar dominio personalizado
 */
router.put('/tenants/:id/custom-domain', async (req, res) => {
    try {
        const { id } = req.params;
        const { custom_domain } = req.body;

        // Validar que el dominio no esté en uso
        if (custom_domain) {
            const { data: existing } = await req.supabase
                .from('tenants')
                .select('id, company_name')
                .eq('custom_domain', custom_domain)
                .neq('id', id)
                .single();

            if (existing) {
                return res.status(400).json({
                    error: `El dominio ${custom_domain} ya está en uso por ${existing.company_name}`
                });
            }
        }

        const { data, error } = await req.supabase
            .from('tenants')
            .update({ custom_domain })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: custom_domain
                ? `Dominio personalizado ${custom_domain} configurado`
                : 'Dominio personalizado eliminado',
            tenant: data
        });

    } catch (error) {
        console.error('Error updating custom domain:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
