import { Link } from "react-router-dom";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTenant } from '../contexts/TenantContext';

const CartPage = ({ cart, removeFromCart, clearCart }) => {
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!tenant) {
      alert("Error: No se ha identificado la tienda.");
      return;
    }

    setLoading(true);

    try {
      // 1. Preparar datos para el backend
      const cartItems = cart.map(item => ({
        id: item.id,
        quantity: item.quantity || 1, // Asegurar que quantity exista
        name: item.name
      }));

      // 2. Llamar a la función RPC 'register_sale'
      // Esta función verifica stock y descuenta automáticamente
      const { data, error } = await supabase
        .rpc('register_sale', {
          cart_items: cartItems,
          tenant_id_param: tenant.id
        });

      if (error) throw error;

      // 3. Si todo salió bien, redirigir a WhatsApp
      const message = `¡Hola! Quiero realizar esta compra (Pedido Web):\n\n` +
        cart.map((item, index) =>
          `${index + 1}. ${item.name} (x${item.quantity || 1}) - $${(item.price * (item.quantity || 1)).toLocaleString()}`
        ).join("\n") +
        `\n\n*Total: $${total.toLocaleString()}*`;

      // Limpiar carrito (opcional, dependiendo del flujo)
      // clearCart(); 

      window.open(`https://wa.me/5491162021005?text=${encodeURIComponent(message)}`, '_blank');

    } catch (error) {
      console.error('Error en checkout:', error);
      alert(`No se pudo procesar la venta: ${error.message || 'Error desconocido'}\n\nEs posible que falta stock de algún producto.`);
    } finally {
      setLoading(false);
    }
  };

  console.log(cart);

  return (
    <div className="py-8 px-4">
      <div className="flex items-center mb-8">
        <Link to="/" className="mr-4 text-blue-600 hover:text-blue-800">
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
            to="/"
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

              <button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full text-white py-3 rounded-lg font-medium inline-block text-center transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {loading ? 'Procesando...' : 'Proceder al pago'}
              </button>

              <Link
                to="/"
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
