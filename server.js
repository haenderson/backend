// Fichier: backend BNWERS/server.js

const express = require('express');
const cors =require('cors');
require('dotenv').config(); // Charge les variables de .env

// Importe nos routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');

const app = express();

// Middlewares (les "assistants" de notre serveur)
// Par cette nouvelle configuration :
app.use(cors({
  origin: 'https://bnwers-app.netlify.app'
})); // Autorise les requêtes depuis d'autres origines (notre frontend)
app.use(express.json()); // Permet de comprendre le JSON envoyé par le frontend

// Définir les routes de base de notre API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Route de test simple
app.get('/', (req, res) => {
    res.send('Le serveur BNWERS est en ligne !');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});