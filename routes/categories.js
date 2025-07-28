// Fichier: backend/routes/categories.js (Version SÉCURISÉE)

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// GET toutes les catégories (public)
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST nouvelle catégorie (protégé)
router.post('/', authMiddleware, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom est requis' });
    const { data, error } = await supabase.from('categories').insert([{ name: name.toLowerCase() }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

// DELETE une catégorie (protégé)
router.delete('/:name', authMiddleware, async (req, res) => {
    const { name } = req.params;
    
    // Étape 1: Mettre à jour les produits qui utilisent cette catégorie pour la rendre nulle
    const { error: updateError } = await supabase.from('products').update({ category: null }).eq('category', name);
    if (updateError) {
        console.error("Erreur lors de la mise à jour des produits pour la suppression de catégorie:", updateError);
        // On ne bloque pas la suppression pour ça, on continue
    }
    
    // Étape 2: Supprimer la catégorie
    const { error: deleteError } = await supabase.from('categories').delete().eq('name', name);
    if (deleteError) return res.status(500).json({ error: deleteError.message });
    
    res.json({ message: 'Catégorie supprimée avec succès.' });
});

// PUT (modifier) une catégorie (protégé)
router.put('/:name', authMiddleware, async (req, res) => {
    const oldName = req.params.name;
    const { name: newName } = req.body;

    if (!newName) return res.status(400).json({ message: 'Un nouveau nom est requis.' });
    
    // Étape 1: Mettre à jour les produits
    const { error: updateError } = await supabase.from('products').update({ category: newName.toLowerCase() }).eq('category', oldName);
    if (updateError) {
        console.error("Erreur lors de la mise à jour des produits pour le renommage de catégorie:", updateError);
        // On ne bloque pas pour ça
    }
    
    // Étape 2: Mettre à jour la catégorie elle-même
    const { error: catError } = await supabase.from('categories').update({ name: newName.toLowerCase() }).eq('name', oldName);
    if (catError) return res.status(500).json({ error: catError.message });

    res.json({ message: 'Catégorie mise à jour avec succès' });
});

module.exports = router;