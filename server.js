const express = require('express');
const cors = require('cors');
const path = require('path');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar Mercado Pago con el Access Token de prueba
const client = new MercadoPagoConfig({
  accessToken: 'APP_USR-8030251261743182', // TU ACCESS TOKEN
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Obtener ranking (datos de prueba)
app.get('/api/ranking', (req, res) => {
  const testData = [
    { id: 1, name: "Cachame.cl", description: "El ranking chileno", link: "https://cachame.cl", amount: 10000, created_at: new Date().toISOString() },
    { id: 2, name: "Prueba", description: "Testeando la API", link: "https://google.com", amount: 5000, created_at: new Date().toISOString() }
  ];
  res.json(testData);
});

// API: Crear preferencia de pago en Mercado Pago
app.post('/api/create-preference', async (req, res) => {
  try {
    const { name, description, link, amount, platform, buttonText } = req.body;

    console.log('📝 Recibido:', { name, description, link, amount, platform, buttonText });

    if (!name || !link || !amount || amount < 1000) {
      return res.status(400).json({ error: 'Faltan datos o el monto es menor a $1.000 CLP' });
    }

    // Crear preferencia en Mercado Pago
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'cachame-puesto-' + Date.now(),
            title: `Puesto en Cachame.lol - ${name}`,
            description: description || `Entrada en el ranking para ${name}`,
            quantity: 1,
            currency_id: 'CLP',
            unit_price: Number(amount),
          }
        ],
        payer: {
          email: 'test@test.com',
        },
        back_urls: {
          success: 'https://cachame-production.up.railway.app/success',
          failure: 'https://cachame-production.up.railway.app/failure',
          pending: 'https://cachame-production.up.railway.app/pending',
        },
        auto_return: 'approved',
        external_reference: JSON.stringify({ 
          name, 
          description, 
          link, 
          amount,
          platform: platform || 'external',
          buttonText: buttonText || 'Conocer más'
        }),
        notification_url: 'https://cachame-production.up.railway.app/api/webhook',
      }
    });

    console.log('✅ Preferencia creada:', result.id);
    res.json({ init_point: result.init_point });

  } catch (error) {
    console.error('❌ Error al crear preferencia:', error);
    res.status(500).json({ error: 'Error al crear la preferencia de pago: ' + error.message });
  }
});

// Webhook para recibir notificaciones de Mercado Pago
app.post('/api/webhook', express.json(), async (req, res) => {
  try {
    console.log('📩 Webhook recibido:', req.body);
    // Aquí procesarías el pago y guardarías en la base de datos
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    res.sendStatus(500);
  }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor en http://0.0.0.0:${port}`);
});
