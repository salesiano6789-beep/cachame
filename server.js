const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Buscar la carpeta 'public' en varias ubicaciones
const publicPaths = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'public'),
  path.join(process.cwd(), 'public'),
];

let publicPath = null;
for (const p of publicPaths) {
  if (fs.existsSync(p)) {
    publicPath = p;
    break;
  }
}

if (publicPath) {
  console.log(`📁 Sirviendo archivos desde: ${publicPath}`);
  app.use(express.static(publicPath));
} else {
  console.error('❌ No se encontró la carpeta public');
}

// Ruta principal - SIRVE EL HTML
app.get('/', (req, res) => {
  if (publicPath) {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send('⚠️ index.html no encontrado en public');
    }
  } else {
    res.send('⚠️ Carpeta public no encontrada');
  }
});

// API: Obtener ranking (datos de prueba)
app.get('/api/ranking', (req, res) => {
  const testData = [
    { id: 1, name: "Cachame.cl", description: "El ranking chileno", link: "https://cachame.cl", amount: 10000, created_at: new Date().toISOString() },
    { id: 2, name: "Prueba", description: "Testeando la API", link: "https://google.com", amount: 5000, created_at: new Date().toISOString() }
  ];
  res.json(testData);
});

// API: Crear preferencia de pago (simulada)
app.post('/api/create-preference', (req, res) => {
  const { name, description, link, amount, platform, buttonText } = req.body;
  
  if (!name || !link || !amount || amount < 1000) {
    return res.status(400).json({ error: 'Faltan datos o el monto es menor a $1.000 CLP' });
  }

  // Simular respuesta de Mercado Pago
  console.log('📝 Nueva entrada:', { name, description, link, amount, platform, buttonText });
  
  // En modo de prueba, solo mostramos un mensaje
  res.json({ 
    init_point: '#',
    message: '⚠️ Modo de prueba: Para pagar, configura Mercado Pago con tus credenciales reales.'
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${port}`);
  console.log(`📁 Sirviendo desde: ${publicPath || 'no encontrado'}`);
});
