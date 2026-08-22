const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const mercadopago = require('mercadopago');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

// Configurar base de datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Crear tabla si no existe (con más campos)
pool.query(`
  CREATE TABLE IF NOT EXISTS ranking (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    link TEXT NOT NULL,
    amount INTEGER NOT NULL,
    platform TEXT,
    button_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.error('Error creando tabla:', err));

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Obtener el ranking
app.get('/api/ranking', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ranking ORDER BY amount DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error obteniendo ranking:', error);
    res.status(500).json({ error: 'Error al obtener el ranking' });
  }
});

// Crear una preferencia de pago en Mercado Pago
app.post('/api/create-preference', async (req, res) => {
  const { name, description, link, amount, platform, buttonText } = req.body;

  if (!name || !link || !amount || amount < 1000) {
    return res.status(400).json({ error: 'Faltan datos o el monto es menor a $1.000 CLP' });
  }

  try {
    // Crear preferencia en Mercado Pago
    const preference = {
      items: [
        {
          title: `Puesto en Cachame.lol - ${name}`,
          description: description || `Entrada en el ranking para ${name}`,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: Number(amount),
        },
      ],
      back_urls: {
        success: `${process.env.SITE_URL}/success.html`,
        failure: `${process.env.SITE_URL}/failure.html`,
        pending: `${process.env.SITE_URL}/pending.html`,
      },
      auto_return: 'approved',
      external_reference: JSON.stringify({ 
        name, 
        description, 
        link, 
        amount,
        platform: platform || 'external',
        button_text: buttonText || 'Conocer más'
      }),
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({ init_point: response.body.init_point });
  } catch (error) {
    console.error('Error creando preferencia:', error);
    res.status(500).json({ error: 'Error al crear la preferencia de pago' });
  }
});

// Webhook para recibir notificaciones de Mercado Pago
app.post('/api/webhook', express.json(), async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data.id;
      const payment = await mercadopago.payment.findById(paymentId);
      
      if (payment.body.status === 'approved') {
        const externalReference = JSON.parse(payment.body.external_reference);
        const { name, description, link, amount, platform, button_text } = externalReference;

        await pool.query(
          'INSERT INTO ranking (name, description, link, amount, platform, button_text) VALUES ($1, $2, $3, $4, $5, $6)',
          [name, description || '', link, amount, platform || 'external', button_text || 'Conocer más']
        );
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook:', error);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
});