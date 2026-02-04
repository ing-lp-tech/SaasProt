export const THEMES = [
    {
        id: 'default',
        name: 'Personalizado',
        description: 'Configuración manual',
        colors: { primary: '#3b82f6' },
        font: 'Poppins',
        defaultFaqs: [
            {
                category: "General",
                questions: [
                    { question: "¿Cómo edito estas preguntas?", answer: "Ve al panel de administración > Gestionar Contenido > Preguntas Frecuentes para agregar tus propias respuestas." }
                ]
            }
        ]
    },
    {
        id: 'moda-dama',
        name: 'Moda Dama',
        description: 'Rosa elegante, estilo boutique',
        colors: { primary: '#ec4899' },
        font: 'Playfair Display',
        defaultFaqs: [
            {
                category: "Sobre Nuestras Prendas",
                questions: [
                    { question: "¿Qué tallas tienen disponibles?", answer: "Manejamos tallas desde XS hasta XXL. Cada prenda incluye una guía de tallas detallada." },
                    { question: "¿Las prendas son de temporada?", answer: "Sí, actualizamos nuestra colección cada temporada con las últimas tendencias en moda femenina." },
                    { question: "¿Puedo cambiar una prenda si no me queda?", answer: "Sí, aceptamos cambios dentro de los 15 días posteriores a la compra, siempre que la prenda esté sin usar y con etiquetas." }
                ]
            },
            {
                category: "Envíos y Entregas",
                questions: [
                    { question: "¿Hacen envíos a todo el país?", answer: "Sí, realizamos envíos a nivel nacional. El costo varía según la ubicación." },
                    { question: "¿Puedo retirar en tienda?", answer: "Sí, ofrecemos retiro gratuito en nuestra boutique. Coordina con nosotros el horario." }
                ]
            }
        ]
    },
    {
        id: 'moda-caballero',
        name: 'Moda Caballero',
        description: 'Azul marino premium',
        colors: { primary: '#1e3a8a' },
        font: 'Merriweather',
        defaultFaqs: [
            {
                category: "Productos y Calidad",
                questions: [
                    { question: "¿Qué materiales utilizan?", answer: "Trabajamos con telas premium: algodón egipcio, lino italiano y mezclas de alta calidad." },
                    { question: "¿Tienen trajes a medida?", answer: "Sí, ofrecemos servicio de sastrería personalizada. Consulta disponibilidad y precios." },
                    { question: "¿Cómo sé mi talla correcta?", answer: "Tenemos una guía de medidas detallada. También puedes agendar una cita para toma de medidas." }
                ]
            },
            {
                category: "Compras y Garantía",
                questions: [
                    { question: "¿Ofrecen garantía en sus productos?", answer: "Sí, todos nuestros productos tienen garantía de calidad. Cualquier defecto de fábrica es reemplazado." },
                    { question: "¿Puedo devolver un producto?", answer: "Aceptamos devoluciones dentro de los 30 días si el producto no ha sido usado." }
                ]
            }
        ]
    },
    {
        id: 'ropa-bebe',
        name: 'Ropa Bebé',
        description: 'Tonos pastel suaves y tiernos',
        colors: { primary: '#fca5a5' },
        font: 'Quicksand',
        defaultFaqs: [
            {
                category: "Seguridad y Materiales",
                questions: [
                    { question: "¿La ropa es segura para recién nacidos?", answer: "Sí, toda nuestra ropa está certificada y libre de químicos nocivos. Usamos 100% algodón orgánico." },
                    { question: "¿Cómo lavo la ropa del bebé?", answer: "Recomendamos lavar a mano o en ciclo delicado con jabón neutro. No usar suavizantes." },
                    { question: "¿Qué tallas manejan?", answer: "Tenemos desde recién nacido (0-3 meses) hasta 24 meses." }
                ]
            },
            {
                category: "Compras y Regalos",
                questions: [
                    { question: "¿Hacen paquetes de regalo?", answer: "Sí, ofrecemos envoltura especial para regalo sin costo adicional." },
                    { question: "¿Puedo armar un set personalizado?", answer: "¡Por supuesto! Contáctanos y te ayudamos a crear el set perfecto para tu bebé." }
                ]
            }
        ]
    },
    {
        id: 'ropa-ninos',
        name: 'Ropa Niños',
        description: 'Vibrante y divertido',
        colors: { primary: '#f59e0b' },
        font: 'Fredoka',
        defaultFaqs: [
            {
                category: "Productos",
                questions: [
                    { question: "¿Para qué edades es la ropa?", answer: "Nuestra colección es para niños de 2 a 12 años." },
                    { question: "¿La ropa es resistente?", answer: "Sí, diseñamos ropa pensada para el juego activo. Materiales duraderos y costuras reforzadas." },
                    { question: "¿Tienen diseños de personajes?", answer: "Sí, tenemos colecciones con personajes populares y diseños originales." }
                ]
            },
            {
                category: "Tallas y Cambios",
                questions: [
                    { question: "¿Cómo elijo la talla correcta?", answer: "Usa nuestra guía de tallas por edad y altura. En caso de duda, te recomendamos la talla mayor." },
                    { question: "¿Puedo cambiar si la talla no es correcta?", answer: "Sí, cambios sin costo dentro de los 15 días." }
                ]
            }
        ]
    },
    {
        id: 'electrotech',
        name: 'ElectroTech',
        description: 'Tech moderno y minimalista',
        colors: { primary: '#0ea5e9' },
        font: 'Orbitron',
        defaultFaqs: [
            {
                category: "Productos y Especificaciones",
                questions: [
                    { question: "¿Los productos son originales?", answer: "Sí, todos nuestros productos son 100% originales con garantía del fabricante." },
                    { question: "¿Tienen stock disponible?", answer: "El stock se actualiza en tiempo real. Si ves un producto disponible, lo tenemos en inventario." },
                    { question: "¿Ofrecen asesoría técnica?", answer: "Sí, nuestro equipo puede ayudarte a elegir el producto ideal según tus necesidades." }
                ]
            },
            {
                category: "Garantía y Soporte",
                questions: [
                    { question: "¿Qué garantía tienen los productos?", answer: "Todos los productos incluyen garantía oficial del fabricante (6-24 meses según el producto)." },
                    { question: "¿Hacen instalación?", answer: "Ofrecemos servicio de instalación para productos seleccionados. Consulta disponibilidad." },
                    { question: "¿Puedo devolver un producto?", answer: "Sí, aceptamos devoluciones dentro de los 7 días si el producto está sin abrir y en su empaque original." }
                ]
            }
        ]
    }
];
