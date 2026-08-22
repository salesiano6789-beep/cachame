const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal - Sirve el HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Obtener ranking (datos de prueba)
app.get('/api/ranking', (req, res) => {
  const testData = [
    { 
      id: 1, 
      name: "Cachame.cl", 
      description: "El ranking chileno", 
      link: "https://cachame.cl", 
      amount: 10000, 
      created_at: new Date().toISOString() 
    },
    { 
      id: 2, 
      name: "Prueba", 
      description: "Testeando la API", 
      link: "https://google.com", 
      amount: 5000, 
      created_at: new Date().toISOString() 
    }
  ];
  res.json(testData);
});

// API: Crear preferencia de pago
app.post('/api/create-preference', (req, res) => {
  const { name, description, link, amount, platform, buttonText } = req.body;
  
  console.log('📝 Nueva entrada recibida:', { name, description, link, amount, platform, buttonText });
  
  if (!name || !link || !amount || amount < 1000) {
    return res.status(400).json({ error: 'Faltan datos o el monto es menor a $1.000 CLP' });
  }

  // Por ahora, solo devolvemos un mensaje de éxito simulado
  res.json({ 
    success: true,
    message: '✅ Pago registrado (modo de prueba)',
    data: { name, description, link, amount }
  });
});

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${port}`);
  console.log(`📁 Sirviendo archivos desde: ${path.join(__dirname, 'public')}`);
});
