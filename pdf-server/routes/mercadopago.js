// ============================================
// RUTAS DE MERCADOPAGO - BACKEND
// ============================================
// Maneja creación de preferencias, webhooks y gestión de pagos
// ============================================

const express = require('express');
const router = express.Router();

/**
 * POST /mercadopago/create-preference
 * Crea una preferencia de pago en MercadoPago
 */
router.post('/create-preference', async (req, res) => {
    try {
        const { tenantId, orderData, paymentType } = req.body;

        if (!tenantId || !orderData) {
            return res.status(400).json({ error: 'tenantId and orderData are required' });
        }

        console.log('Creating MP preference for tenant:', tenantId, 'Order:', orderData.id);

        // Obtener configuración de MercadoPago del tenant
        console.log(`[DEBUG] Buscando config MP para tenant: ${tenantId}`);
        const { data: mpConfig, error: configError } = await req.supabase
            .from('mercadopago_config')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        console.log(`[DEBUG] Resultado consulta MP:`, { mpConfig, error: configError });

        if (configError || !mpConfig) {
            return res.status(404).json({
                error: 'MercadoPago no configurado para este tenant',
                details: configError?.message
            });
        }

        if (!mpConfig.enabled) {
            return res.status(400).json({ error: 'MercadoPago está deshabilitado' });
        }

        // Calcular monto según tipo de pago
        let amount = parseFloat(orderData.total);

        if (paymentType === 'deposit') {
            // Obtener porcentaje de seña
            const { data: methods } = await req.supabase
                .from('payment_methods')
                .select('deposit_percentage')
                .eq('tenant_id', tenantId)
                .eq('method_type', 'mercadopago_deposit')
                .single();

            const percentage = methods?.deposit_percentage || 30;
            amount = (parseFloat(orderData.total) * percentage) / 100;
        }

        // Preparar preferencia de pago
        const preference = {
            items: [{
                title: orderData.items_description || `Orden #${orderData.id?.substring(0, 8)}`,
                quantity: 1,
                unit_price: parseFloat(amount.toFixed(2)),
                currency_id: 'ARS'
            }],
            payer: {
                email: orderData.customer_email || 'cliente@email.com',
                name: orderData.customer_name || 'Cliente'
            },
            back_urls: {
                success: `${orderData.return_url || 'http://localhost:5173'}/checkout/success?order_id=${orderData.id}`,
                failure: `${orderData.return_url || 'http://localhost:5173'}/checkout/failure?order_id=${orderData.id}`,
                pending: `${orderData.return_url || 'http://localhost:5173'}/checkout/pending?order_id=${orderData.id}`
            },
            // auto_return: 'approved', // Comentado para desarrollo local
            external_reference: orderData.id,
            notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/mercadopago/webhook`,
            statement_descriptor: orderData.store_name || 'TIENDA ONLINE'
        };

        console.log('Calling MercadoPago API with preference:', JSON.stringify(preference, null, 2));

        // Llamar a API de MercadoPago
        const mpApiUrl = mpConfig.is_sandbox
            ? 'https://api.mercadopago.com/checkout/preferences'
            : 'https://api.mercadopago.com/checkout/preferences';

        const mpResponse = await fetch(mpApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mpConfig.access_token_encrypted}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preference)
        });

        if (!mpResponse.ok) {
            const errorText = await mpResponse.text();
            console.error('MercadoPago API error:', mpResponse.status, errorText);
            throw new Error(`MercadoPago API error: ${mpResponse.status} - ${errorText}`);
        }

        const mpData = await mpResponse.json();
        console.log('MercadoPago preference created:', mpData.id);

        // Guardar transacción en base de datos
        const { data: transaction, error: txError } = await req.supabase
            .from('mercadopago_transactions')
            .insert({
                tenant_id: tenantId,
                order_id: orderData.id,
                mp_preference_id: mpData.id,
                payment_type: paymentType || 'full',
                amount: amount,
                status: 'pending',
                external_reference: orderData.id
            })
            .select()
            .single();

        if (txError) {
            console.error('Error saving transaction:', txError);
        }

        // Retornar URLs de pago
        res.json({
            success: true,
            preference_id: mpData.id,
            init_point: mpData.init_point, // URL para web
            sandbox_init_point: mpData.sandbox_init_point, // URL para sandbox
            amount: amount,
            payment_type: paymentType || 'full',
            transaction_id: transaction?.id
        });

    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * POST /mercadopago/webhook
 * Webhook para recibir notificaciones de MercadoPago
 */
router.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook received from MercadoPago:', JSON.stringify(req.body, null, 2));
        console.log('Query params:', req.query);

        const { type, data, action } = req.body;

        // MercadoPago envía diferentes tipos de notificaciones
        if (type === 'payment' || action === 'payment.created' || action === 'payment.updated') {
            const paymentId = data?.id || req.query.id;

            if (!paymentId) {
                console.error('No payment ID in webhook');
                return res.status(400).json({ error: 'No payment ID' });
            }

            console.log('Processing payment ID:', paymentId);

            // Buscar la transacción por preference_id (si existe en external_reference)
            // Primero intentamos encontrar la config de MP para obtener el access token
            // Como no sabemos el tenant aún, buscamos la transacción por payment_id si existe

            // Esperar un poco para que MP procese el pago
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Consultar info del pago a API de MercadoPago
            // Por ahora vamos a buscar todas las configs activas y probar
            const { data: allConfigs } = await req.supabase
                .from('mercadopago_config')
                .select('*')
                .eq('enabled', true);

            let paymentData = null;
            let configUsed = null;

            // Intentar con cada config hasta encontrar el pago
            for (const config of allConfigs || []) {
                try {
                    const mpApiUrl = `https://api.mercadopago.com/v1/payments/${paymentId}`;
                    const mpResponse = await fetch(mpApiUrl, {
                        headers: {
                            'Authorization': `Bearer ${config.access_token_encrypted}`
                        }
                    });

                    if (mpResponse.ok) {
                        paymentData = await mpResponse.json();
                        configUsed = config;
                        break;
                    }
                } catch (err) {
                    console.error('Error querying payment with config:', config.tenant_id, err.message);
                }
            }

            if (!paymentData || !configUsed) {
                console.error('Payment not found with any config');
                return res.status(404).json({ error: 'Payment not found' });
            }

            console.log('Payment data retrieved:', JSON.stringify(paymentData, null, 2));

            // Actualizar o crear transacción
            const { data: existingTx } = await req.supabase
                .from('mercadopago_transactions')
                .select('*')
                .eq('mp_preference_id', paymentData.metadata?.preference_id || paymentData.external_reference)
                .eq('tenant_id', configUsed.tenant_id)
                .single();

            const txUpdate = {
                mp_payment_id: paymentId,
                status: paymentData.status,
                status_detail: paymentData.status_detail,
                payment_method: paymentData.payment_type_id,
                webhook_data: paymentData,
                updated_at: new Date().toISOString()
            };

            if (existingTx) {
                // Actualizar transacción existente
                await req.supabase
                    .from('mercadopago_transactions')
                    .update(txUpdate)
                    .eq('id', existingTx.id);

                console.log('Transaction updated:', existingTx.id);

                // Si el pago fue aprobado, actualizar la orden
                if (paymentData.status === 'approved' && existingTx.order_id) {
                    const orderUpdate = {
                        payment_status: existingTx.payment_type === 'full' ? 'completed' : 'partial',
                        paid_amount: parseFloat(existingTx.amount),
                        updated_at: new Date().toISOString()
                    };

                    if (existingTx.payment_type === 'deposit') {
                        // Calcular monto restante
                        const { data: order } = await req.supabase
                            .from('orders')
                            .select('total')
                            .eq('id', existingTx.order_id)
                            .single();

                        if (order) {
                            orderUpdate.remaining_amount = parseFloat(order.total) - parseFloat(existingTx.amount);
                        }
                    }

                    await req.supabase
                        .from('orders')
                        .update(orderUpdate)
                        .eq('id', existingTx.order_id);

                    console.log('Order updated:', existingTx.order_id);
                }
            } else {
                // Crear nueva transacción si no existe
                await req.supabase
                    .from('mercadopago_transactions')
                    .insert({
                        tenant_id: configUsed.tenant_id,
                        mp_payment_id: paymentId,
                        payment_type: 'full',
                        amount: paymentData.transaction_amount,
                        external_reference: paymentData.external_reference,
                        ...txUpdate
                    });

                console.log('New transaction created from webhook');
            }

            res.status(200).json({ success: true });
        } else {
            // Otros tipos de notificaciones
            console.log('Webhook type not handled:', type, action);
            res.status(200).json({ received: true });
        }

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /mercadopago/config/:tenantId
 * Obtener configuración de MercadoPago de un tenant (sin mostrar access_token)
 */
router.get('/config/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;

        const { data, error } = await req.supabase
            .from('mercadopago_config')
            .select('id, tenant_id, public_key, is_sandbox, enabled, created_at, updated_at')
            .eq('tenant_id', tenantId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
            throw error;
        }

        res.json(data || { enabled: false });

    } catch (error) {
        console.error('Error getting config:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /mercadopago/payment-methods/:tenantId
 * Obtener métodos de pago habilitados para un tenant
 */
router.get('/payment-methods/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;

        const { data, error } = await req.supabase
            .from('payment_methods')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('enabled', true)
            .order('method_type');

        if (error) throw error;

        res.json(data || []);

    } catch (error) {
        console.error('Error getting payment methods:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /mercadopago/transactions/:tenantId
 * Obtener transacciones de un tenant
 */
router.get('/transactions/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { limit = 50, status } = req.query;

        let query = req.supabase
            .from('mercadopago_transactions')
            .select('*, orders(id, total, created_at)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        res.json(data || []);

    } catch (error) {
        console.error('Error getting transactions:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
