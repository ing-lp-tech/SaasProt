import { ShoppingCart, CreditCard, Package, CheckCircle } from "lucide-react";

const HowItWorks = () => {
    const steps = [
        {
            number: "01",
            icon: <ShoppingCart className="w-8 h-8" />,
            title: "Explora el Catálogo",
            description: "Navega por nuestra colección y encuentra lo que buscas"
        },
        {
            number: "02",
            icon: <ShoppingCart className="w-8 h-8" />,
            title: "Agrega al Carrito",
            description: "Selecciona tus productos favoritos con un solo clic"
        },
        {
            number: "03",
            icon: <CreditCard className="w-8 h-8" />,
            title: "Coordina Pago con la Empresa",
            description: "Paga de forma segura con múltiples métodos de pago"
        },
        {
            number: "04",
            icon: <Package className="w-8 h-8" />,
            title: "Recibe en Casa",
            description: "Envío rápido y seguimiento en tiempo real"
        }
    ];

    return (
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4 uppercase tracking-wide">
                        Cómo Funciona
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Nuestro Proceso de Compra
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Comprar nunca fue tan fácil. Sigue estos simples pasos.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-6">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="relative group"
                        >
                            {/* Connecting Line (hidden on mobile, shown on desktop between steps) */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 z-0"></div>
                            )}

                            {/* Step Card */}
                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:-translate-y-2 z-10">
                                {/* Number Badge */}
                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                    {step.number}
                                </div>

                                {/* Icon */}
                                <div className="mb-4 text-primary transform group-hover:scale-110 transition-transform duration-300">
                                    {step.icon}
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <div className="text-center mt-12">
                    <a
                        href="#productos"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:brightness-110 text-white font-bold rounded-lg shadow-xl transition-all transform hover:scale-105"
                    >
                        <ShoppingCart className="w-5 h-5" />
                        Comenzar a Comprar
                    </a>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
