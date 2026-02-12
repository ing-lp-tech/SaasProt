import { Link } from "react-router-dom";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTenant } from '../contexts/TenantContext';
import mercadopagoService from '../services/mercadopagoService';


const CartPage = ({ cart, removeFromCart, clearCart }) => {
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [availableMethods, setAvailableMethods] = useState([]);
  const [depositAmount, setDepositAmount] = useState(0);

  useEffect(() => {
    if (tenant?.id) {
      loadPaymentMethods();
    }
  }, [tenant]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await mercadopagoService.getPaymentMethods(tenant.id);
      setAvailableMethods(methods);

      // Seleccionar primer método disponible
      if (methods.length > 0) {
        setPaymentMethod(methods[0].method_type);
      }

      // Calcular seña si existe método de depósito
      const depositMethod = methods.find(m => m.method_type === 'mercadopago_deposit');
      if (depositMethod) {
        const amount = (total * depositMethod.deposit_percentage) / 100;
        setDepositAmount(amount);
      }
    } catch (error) {
      console.error('Error cargando métodos de pago:', error);
    }
  };

  const handleCheckout = async () => {
    if (!tenant) {
      alert("Error: No se ha identificado la tienda.");
      return;
    }

    setLoading(true);

    try {
      // 1. Preparar datos del carrito
      const cartItems = cart.map(item => ({
        id: item.id,
        quantity: item.quantity || 1,
        name: item.name
      }));

      // 2. Registrar venta en base de datos (verifica stock)
      const { data: saleData, error: saleError } = await supabase
        .rpc('register_sale', {
          cart_items: cartItems,
          tenant_id_param: tenant.id
        });

      if (saleError) throw saleError;

      // 3. Crear orden en la base de datos
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tenant_id: tenant.id,
          total: total,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'pending' : 'pending',
          items_description: cart.map((item, i) =>
            `${i + 1}. ${item.name} (x${item.quantity || 1})`
          ).join(', '),
          customer_name: 'Cliente Web', // TODO: Pedir datos del cliente
          customer_email: null,
          customer_phone: null,
          paid_amount: 0,
          remaining_amount: total
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Procesar según método de pago
      if (paymentMethod === 'cash') {
        // Pago en efectivo - Redirigir a WhatsApp
        const message = `¡Hola! Quiero realizar esta compra (Pedido Web #${order.id.substring(0, 8)}):\n\n` +
          cart.map((item, index) =>
            `${index + 1}. ${item.name} (x${item.quantity || 1}) - $${(item.price * (item.quantity || 1)).toLocaleString()}`
          ).join("\n") +
          `\n\n*Total: $${total.toLocaleString()}*\n\n` +
          `💵 *Pagaré en efectivo al retirar*`;

        clearCart();
        window.open(`https://wa.me/5491162021005?text=${encodeURIComponent(message)}`, '_blank');
        alert('¡Pedido registrado! Te contactaremos por WhatsApp para coordinar la entrega.');
      }
      else if (paymentMethod === 'mercadopago_full') {
        // Pago completo por MercadoPago
        const preference = await mercadopagoService.createPreference(
          tenant.id,
          {
            id: order.id,
            total: total,
            items_description: `Pedido #${order.id.substring(0, 8)}`,
            customer_name: 'Cliente Web',
            customer_email: 'cliente@email.com',
            store_name: tenant.company_name
          },
          'full'
        );

        // Redirigir a MercadoPago
        window.location.href = preference.init_point || preference.sandbox_init_point;
      }
      else if (paymentMethod === 'mercadopago_deposit') {
        // Seña por MercadoPago
        const preference = await mercadopagoService.createPreference(
          tenant.id,
          {
            id: order.id,
            total: total,
            items_description: `Seña Pedido #${order.id.substring(0, 8)}`,
            customer_name: 'Cliente Web',
            customer_email: 'cliente@email.com',
            store_name: tenant.company_name
          },
          'deposit'
        );

        // Redirigir a MercadoPago
        window.location.href = preference.init_point || preference.sandbox_init_point;
      }

    } catch (error) {
      console.error('Error en checkout:', error);
      alert(`No se pudo procesar la venta: ${error.message || 'Error desconocido'}\n\nEs posible que falte stock de algún producto.`);
    } finally {
      setLoading(false);
    }
  };

  console.log(cart);


  return (
    <div className="py-8 px-4">
      <div className="flex items-center mb-8">
        <Link to={tenant ? `/?tenant=${tenant.subdomain}` : "/"} className="mr-4 text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Tu Carrito de Compras
        </h1>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600 mb-6">Tu carrito está vacío</p>
          <Link
            to={tenant ? `/?tenant=${tenant.subdomain}` : "/"}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {cart.map((item) => (
              <div
                key={item.id}
                className="border-b py-4 flex items-start gap-4 sm:flex-row"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex flex-col w-full relative">
                  {/* <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="text-sm text-red-500 hover:text-red-700 absolute top-0 right-0"
                  >
                    Eliminar
                  </button> */}
                  <h3 className="text-base sm:text-lg font-medium pr-12">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mt-1 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                      <p className="text-lg font-bold text-blue-600">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full font-medium transition w-full sm:w-auto"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Resumen de compra</h2>
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Envío:</span>
                <span>Gratis</span>
              </div>
              <div className="border-t my-4"></div>
              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total:</span>
                <span>${total.toLocaleString()}</span>
              </div>

              {/* SELECTOR DE MÉTODO DE PAGO */}
              {availableMethods.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-sm text-gray-700">Método de Pago</h3>
                  <div className="space-y-2">
                    {availableMethods.map((method) => {
                      const isSelected = paymentMethod === method.method_type;
                      const depositPercentage = method.deposit_percentage || 30;
                      const depositAmt = (total * depositPercentage) / 100;

                      return (
                        <label
                          key={method.method_type}
                          className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${isSelected
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.method_type}
                            checked={isSelected}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">
                                {method.method_type === 'cash' && '💵 Efectivo en Local'}
                                {method.method_type === 'mercadopago_full' && '💳 Pago Completo'}
                                {method.method_type === 'mercadopago_deposit' && '💰 Seña Online'}
                              </span>
                              {method.method_type === 'mercadopago_deposit' && isSelected && (
                                <span className="text-xs font-bold text-blue-600">
                                  ${depositAmt.toFixed(0)}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {method.method_type === 'cash' && 'Pagas cuando retiras'}
                              {method.method_type === 'mercadopago_full' && 'Pago 100% online'}
                              {method.method_type === 'mercadopago_deposit' &&
                                `${depositPercentage}% ahora, resto en efectivo`}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full text-white py-3 rounded-lg font-medium inline-block text-center transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {loading ? 'Procesando...' :
                  paymentMethod === 'cash' ? 'Enviar Pedido' :
                    paymentMethod === 'mercadopago_full' ? 'Pagar Ahora' :
                      'Pagar Seña'}
              </button>

              <Link
                to={tenant ? `/?tenant=${tenant.subdomain}` : "/"}
                className="block mt-4 text-center text-blue-600 hover:text-blue-800"
              >
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
