// Fichier: backend BNWERS/routes/auth.js

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/login', (req, res) => {
    const { password } = req.body;

    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign(
            { role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({ message: "Connexion réussie", token: token });
    } else {
        res.status(401).json({ message: "Mot de passe incorrect" });
    }
});

module.exports = router;