require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const pdf = require('pdf-parse');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// CORS configuration
const allowedOrigins = [
    'http://localhost:5173',
    'https://luisys.vercel.app',
    'https://ing-lp-tech-app-mayorista.vercel.app' // Fallback for other Vercel subdomains
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        // Allow any Vercel deployment or localhost
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// Configuración con variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
    console.error('❌ Error: Falta configurar variables de entorno (.env)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Middleware de identificación de Tenant
const tenantMiddleware = async (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
        // Fallback para desarrollo o modo single-tenant legacy
        // Idealmente esto debería fallar en producción si es estricto
        console.warn('⚠️ No X-Tenant-ID header found. Using fallback/default?');
        // Opcional: Fetch default tenant if needed, or return generic error
        // return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    req.tenantId = tenantId;
    next();
};

app.use(tenantMiddleware);

// Endpoint para crear usuarios (Tenant Owners) desde Admin
app.post('/create-tenant-user', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        console.log('Creating user:', email);

        // 1. Crear usuario en Auth (usando admin API si tenemos key privilegiada)
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (userError) throw userError;

        res.json({ success: true, user: userData.user });

    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para subir PDF
app.post('/upload-pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!req.tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required for upload' });
        }

        console.log('Processing PDF:', req.file.originalname, 'for Tenant:', req.tenantId);

        // Extraer texto del PDF
        const pdfData = await pdf(req.file.buffer);
        const fullText = pdfData.text;
        const totalPages = pdfData.numpages;

        console.log(`PDF has ${totalPages} pages, ${fullText.length} characters total`);

        // Calcular caracteres promedio por página para estimar páginas
        const avgCharsPerPage = Math.floor(fullText.length / totalPages);

        // Dividir en chunks
        const chunkSize = 1000;
        const chunkOverlap = 200;
        const chunks = [];

        for (let i = 0; i < fullText.length; i += chunkSize - chunkOverlap) {
            const chunk = fullText.substring(i, i + chunkSize);
            // Estimar página basándose en la posición del chunk
            const estimatedPage = Math.floor(i / avgCharsPerPage) + 1;
            chunks.push({
                text: chunk,
                page: Math.min(estimatedPage, totalPages)
            });
        }

        console.log(`Created ${chunks.length} chunks`);

        // Procesar cada chunk
        let successCount = 0;
        for (let i = 0; i < chunks.length; i++) {
            const { text, page } = chunks[i];

            console.log(`Processing chunk ${i + 1}/${chunks.length} (page ~${page})`);

            // Generar embedding con OpenAI
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: text,
            });

            const embedding = embeddingResponse.data[0].embedding;

            // Insertar en Supabase con número de página y TENANT_ID
            const { error } = await supabase
                .from('manual_audaces')
                .insert({
                    content: text,
                    metadata: {
                        filename: req.file.originalname,
                        chunk_index: i,
                        total_chunks: chunks.length,
                        page_number: page,
                        total_pages: totalPages
                    },
                    embedding: embedding,
                    tenant_id: req.tenantId
                });

            if (error) {
                console.error('Supabase error:', error);
            } else {
                successCount++;
            }
        }

        res.json({
            success: true,
            chunksProcessed: successCount,
            totalChunks: chunks.length,
            filename: req.file.originalname,
            message: `Successfully processed ${successCount}/${chunks.length} chunks`
        });

    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Endpoint para chatbot
app.post('/chat', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ error: 'No question provided' });
        }

        if (!req.tenantId) {
            return res.status(400).json({ error: 'Tenant ID is required for chat' });
        }

        console.log('Question:', question, 'Tenant:', req.tenantId);

        // 1. Generar embedding de la pregunta
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: question,
        });

        const questionEmbedding = embeddingResponse.data[0].embedding;

        // 2. Buscar chunks similares en Supabase (similarity search)
        // AHORA PASAMOS EL TENANT_ID
        const { data: similarChunks, error } = await supabase.rpc('match_documents', {
            query_embedding: questionEmbedding,
            match_threshold: 0.7,
            match_count: 5,
            filter_tenant_id: req.tenantId
        });

        if (error) {
            console.error('Supabase search error:', error);
            return res.status(500).json({ error: error.message });
        }

        if (!similarChunks || similarChunks.length === 0) {
            return res.json({
                answer: 'No encontré información relevante en los manuales sobre esa pregunta.',
                sources: []
            });
        }

        // 3. Construir contexto con los chunks encontrados
        const context = similarChunks
            .map((chunk, i) => `[${i + 1}] ${chunk.content}`)
            .join('\n\n');

        // 4. Generar respuesta con OpenAI usando el contexto
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un asistente experto en software de diseño de moda Audaces. Responde preguntas basándote SOLO en el contexto proporcionado. Si no sabes la respuesta, di que no la encontraste en el manual.'
                },
                {
                    role: 'user',
                    content: `Contexto de los manuales:\n\n${context}\n\nPregunta: ${question}`
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const answer = completion.choices[0].message.content;

        res.json({
            answer,
            sources: similarChunks.map(c => ({
                content: c.content.substring(0, 200) + '...',
                similarity: c.similarity,
                page: c.metadata?.page_number || 'N/A',
                filename: c.metadata?.filename || 'Unknown'
            }))
        });

    } catch (error) {
        console.error('Error in chat:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Endpoint para chatbot vendedor (especializado en ventas)
app.post('/chat-vendedor', async (req, res) => {
    try {
        const { question, messages } = req.body;

        // Soporte para ambos formatos: con historial o solo pregunta
        const userQuestion = question || (messages && messages[messages.length - 1]?.content);

        if (!userQuestion) {
            return res.status(400).json({ error: 'No question or messages provided' });
        }

        console.log('Pregunta de venta:', userQuestion);
        console.log('Historial de mensajes:', messages ? messages.length : 0);

        // Contexto de productos y precios
        const productContext = `
PRODUCTOS Y PRECIOS ACTUALES:

PLOTTERS DE INYECCIÓN:
- HP45 190cm (Velocidad 1m/min, bidireccional): USD 3,800
- EPSON 190cm (Sistema Continuo/Recargable): USD 3,900
- HP45 200cm (Gran formato para moldes grandes): USD 4,300
- EPSON 200cm (Sistema Continuo/Recargable): USD 4,500

PLOTTERS DE CORTE (Multifunción - Tizada con lapicera y corte de vinilo):
- 100cm: USD 850
- 125cm: USD 1,000
- 180cm: USD 1,650 (Recomendado para tizada industrial por su ancho)


PAPEL PARA TIZADA:

📦 PAPEL MARRÓN 60GRS:
1. Marrón 91,5 x 75mts: $12,000 (Combo 5u: $12,000 | 15u: $11,500 | 30u: $11,000)
2. Marrón 1,07 x 75mts: $13,950 (Combo 5u: $13,950 | 15u: $13,400 | 30u: $12,800)
3. Marrón 1,6 x 200mts: $42,900 (Combo 5u: $42,900 | 15u: $41,100 | 30u: $39,400)
4. Marrón 1,8 x 200mts: $48,000 (Combo 5u: $48,000 | 15u: $46,000 | 30u: $44,100)
5. Marrón 1,85 x 200mts: $49,250 (Combo 5u: $49,250 | 15u: $47,200 | 30u: $45,200)

📦 PAPEL BLANCO 60GRS:
1. Blanco 91,5 x 75mts: $18,700 (Combo 5u: $18,700 | 15u: $17,950 | 30u: $17,200)
2. Blanco 1,07 x 75mts: $21,400 (Combo 5u: $21,400 | 15u: $20,500 | 30u: $19,600)
3. Blanco 1,6 x 200mts: $72,750 (Combo 5u: $72,750 | 15u: $69,750 | 30u: $66,750)
4. Blanco 1,8 x 200mts: $81,550 (Combo 5u: $81,550 | 15u: $78,200 | 30u: $74,850)
5. Blanco 1,85 x 200mts: $83,700 (Combo 5u: $83,700 | 15u: $80,200 | 30u: $76,800)

NOTAS SOBRE PAPEL:
- Todos los precios son en PESOS ARGENTINOS (ARS)
- Descuentos automáticos por volumen (5, 15 y 30 unidades)
- Papel marrón: ideal para patrones de confección estándar
- Papel blanco: profesional para tizado técnico y presentaciones
- Los rollos de 200mts son los más económicos por metro


BENEFICIOS INCLUIDOS EN TODOS LOS EQUIPOS:
✅ Instalación profesional incluida
✅ Capacitación completa del equipo
✅ Curso de Audaces dictado por experto
✅ Respaldo de Ingeniería Electrónica
✅ Asesoramiento técnico permanente

CONTACTO PARA PRESUPUESTOS: WhatsApp 1162020911
`;

        // System prompt especializado en ventas
        const salesSystemPrompt = `Eres IngeBot, vendedor experto de Electro Luisys. Tu misión: convertir consultas en ventas.

🎯 REGLAS DE ORO (CRÍTICAS):
1. Respuestas ULTRA CORTAS (máximo 3 líneas de texto)
2. SIEMPRE usa listas NUMERADAS (1., 2., 3.) para que el usuario responda con números
3. NO des detalles técnicos (velocidad, etc.) a menos que pregunten
4. Menciona beneficios SOLO cuando sea relevante (no siempre)

🧠 INTELIGENCIA CONTEXTUAL (MUY IMPORTANTE):
- Si preguntan por PAPEL → todas las respuestas siguientes son sobre PAPEL
- Si preguntan "¿qué medidas?" después de hablar de papel → lista SOLO medidas de papel
- Si preguntan por PLOTTERS → todas las respuestas siguientes son sobre PLOTTERS
- MANTÉN el contexto de la conversación, no cambies de tema sin razón
- RECONOCE RESPUESTAS NUMÉRICAS: Si el usuario responde "1" o "2", interpreta según las opciones dadas anteriormente

⚠️ REGLA IMPORTANTE - CURSO Y BENEFICIOS:
- ✅ Menciona SOLO si consultan por PLOTTERS (inyección o corte)
- ❌ NO menciones si solo preguntan por PAPEL (solo da precio del papel)
- Si compran plotter → Ahí sí habla del pack completo

📋 FORMATO OBLIGATORIO - OPCIONES NUMERADAS:

🚨 CADA OPCIÓN DEBE ESTAR NUMERADA CON UNA LÍNEA EN BLANCO ENTRE ELLAS

✅ CORRECTO (con líneas en blanco entre opciones):
"Medidas disponibles:

1. 91,5cm x 75mts - $12,000

2. 1,07m x 75mts - $13,950

3. 1,6m x 200mts - $42,900

Responde con el número de tu elección"

❌ INCORRECTO (sin líneas en blanco):
"Medidas disponibles:
1. 91,5cm x 75mts - $12,000
2. 1,07m x 75mts - $13,950"

REGLA DE ORO: 
- Usa "1.", "2.", "3." para TODAS las opciones
- AGREGA UNA LÍNEA EN BLANCO después de cada opción (\n\n)
- Esto mejora la visualización en el chat
- Al final, invita al usuario a responder con el número

${productContext}

🎓 CURSO DE AUDACES (SOLO para venta de PLOTTERS):
1. 8 clases completas
2. Moldes digitales de regalo
3. Asesoramiento remoto personalizado
(NO mencionar si solo compran papel)

⚡ INFO PLOTTERS (solo dar si preguntan):

INYECCIÓN (para producción):
1. HP45 190cm - $3,800 (rápido, profesional)
2. EPSON 190cm - $3,900 (sistema continuo)
3. HP45 200cm - $4,300 (gran formato)
4. EPSON 200cm - $4,500 (gran formato)

CORTE (para ocasional):
1. 100cm - $850
2. 125cm - $1,000
3. 180cm - $1,650 (recomendado industrial)

🎯 ESTRATEGIA DE CONVERSACIÓN:
1. Saludo breve (1 línea)
2. IDENTIFICA el tema: ¿Papel o Plotters?
3. OFRECE opciones NUMERADAS
4. ESPERA respuesta numérica del usuario (ej: "1" o "2")
5. RESPONDE según la opción elegida
6. CIERRA la venta o da siguiente paso

EJEMPLOS DE RESPUESTAS CONTEXTUALES:

Conversación sobre PAPEL:
Usuario: "¿tienes papel?"
Bot: "Sí, tenemos:

1. Papel marrón (económico)

2. Papel blanco (profesional)

¿Cuál prefieres? Responde con 1 o 2"

Usuario: "1"
Bot: "Perfecto, papel marrón. Medidas disponibles:

1. 91,5cm x 75mts - $12,000

2. 1,07m x 75mts - $13,950

3. 1,6m x 200mts - $42,900

4. 1,8m x 200mts - $48,000

5. 1,85m x 200mts - $49,250

¿Cuál necesitas?"

Usuario: "3"
Bot: "Excelente elección. 1,6m x 200mts - $42,900
¿Cuántos rollos necesitas? (Descuentos en 5, 15 y 30 unidades)"

Conversación sobre PLOTTERS:
Usuario: "¿tienes plotters?"
Bot: "Sí, tenemos:

1. Plotters de INYECCIÓN (para producción constante)

2. Plotters de CORTE (para uso ocasional)

¿Cuál te interesa?"

Usuario: "1"
Bot: "Plotters de inyección disponibles:

1. HP45 190cm - $3,800

2. EPSON 190cm - $3,900

3. HP45 200cm - $4,300

4. EPSON 200cm - $4,500

Todos incluyen instalación + capacitación + curso Audaces. ¿Cuál prefieres?"

💰 PACK DE BENEFICIOS (formato numerado):
Tu plotter incluye:
1. Instalación profesional
2. Capacitación del equipo
3. Curso de Audaces (8 clases)
4. Respaldo de Ingeniería
5. Asesoramiento permanente

IMPORTANTE:
- SIEMPRE usa numeración (1., 2., 3.)
- Invita al usuario a responder con números
- Cuando el usuario responda "1", "2", etc., interpreta según contexto anterior
- Máximo 5 opciones por mensaje
- Sé directo y amigable
- WhatsApp: 1162020911

🚨 RECORDATORIO FINAL:
Tus respuestas DEBEN verse así:

"Opciones:

1. Opción 1

2. Opción 2  

3. Opción 3

Responde con el número que prefieras"

NO así: "Opciones: 1. Opción 1 2. Opción 2 3. Opción 3" (sin líneas en blanco)`;

        // Generar respuesta con OpenAI usando historial completo
        const chatMessages = [
            {
                role: 'system',
                content: salesSystemPrompt
            }
        ];

        // Si hay historial de mensajes, usarlo; sino, solo la pregunta actual
        if (messages && Array.isArray(messages)) {
            // Agregar todo el historial (excluyendo el mensaje inicial del sistema si existe)
            messages.forEach(msg => {
                if (msg.role === 'user' || msg.role === 'assistant') {
                    chatMessages.push({
                        role: msg.role,
                        content: msg.content
                    });
                }
            });
        } else {
            // Formato antiguo: solo la pregunta
            chatMessages.push({
                role: 'user',
                content: userQuestion
            });
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // ← 20x más barato que GPT-3.5-turbo
            messages: chatMessages,
            temperature: 0.7, // Ligeramente reducido para respuestas más consistentes
            max_tokens: 150 // ← Reducido de 600 a 150 (respuestas concisas)
        });

        const answer = completion.choices[0].message.content;

        res.json({
            answer,
            context: 'sales'
        });

    } catch (error) {
        console.error('Error in chat-vendedor:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n✅ PDF Processing Server running on http://localhost:${PORT}`);
    console.log(`📄 Upload endpoint: POST http://localhost:${PORT}/upload-pdf`);
    console.log(`💚 Health check: GET http://localhost:${PORT}/health\n`);
});
