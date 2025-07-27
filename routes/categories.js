// Fichier: backend BNWERS/routes/categories.js

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET toutes les catégories (public, tout le monde peut voir)
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST nouvelle catégorie (protégé par le videur)
router.post('/', authMiddleware, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom est requis' });
    const { data, error } = await supabase.from('categories').insert([{ name: name.toLowerCase() }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

// DELETE une catégorie (protégé par le videur)
router.delete('/:name', authMiddleware, async (req, res) => {
    const { name } = req.params;
    const { error } = await supabase.from('categories').delete().eq('name', name);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Catégorie supprimée' });
});

// PUT (modifier) une catégorie (protégé par le videur)
router.put('/:name', authMiddleware, async (req, res) => {
    const oldName = req.params.name;
    const { name: newName } = req.body;

    // Étape 1: Mettre à jour la catégorie dans la table 'categories'
    const { error: catError } = await supabase.from('categories').update({ name: newName.toLowerCase() }).eq('name', oldName);
    if (catError) return res.status(500).json({ error: `Erreur categories: ${catError.message}` });

    // Étape 2: Mettre à jour tous les produits qui utilisaient l'ancienne catégorie
    const { error: prodError } = await supabase.from('products').update({ category: newName.toLowerCase() }).eq('category', oldName);
    if (prodError) return res.status(500).json({ error: `Erreur products: ${prodError.message}` });

    res.json({ message: 'Catégorie et produits mis à jour avec succès' });
});

module.exports = router;