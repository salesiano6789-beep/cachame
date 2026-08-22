const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Servir archivos estáticos desde 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API de prueba
app.get('/api/ranking', (req, res) => {
  res.json([
    { id: 1, name: "Cachame.cl", description: "El ranking chileno", link: "https://cachame.cl", amount: 10000 },
    { id: 2, name: "Prueba", description: "Testeando", link: "https://google.com", amount: 5000 }
  ]);
});

// API para pagos (simulada)
app.post('/api/create-preference', express.json(), (req, res) => {
  console.log('📝 Recibido:', req.body);
  res.json({ 
    success: true,
    message: '✅ Pago registrado (modo prueba)',
    init_point: '#'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor en http://0.0.0.0:${port}`);
});
