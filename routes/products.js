// Fichier: backend BNWERS/routes/products.js

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Configuration de Multer pour gérer les fichiers en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

async function uploadImages(files) {
    if (!files || files.length === 0) return [];
    
    const uploadPromises = files.map(file => {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
        return supabase.storage.from('product-images').upload(fileName, file.buffer, {
            contentType: file.mimetype,
        });
    });

    const results = await Promise.all(uploadPromises);
    const imageUrls = [];
    
    for (const result of results) {
        if (result.error) throw result.error;
        const { data } = supabase.storage.from('product-images').getPublicUrl(result.data.path);
        imageUrls.push(data.publicUrl);
    }
    return imageUrls;
}

// GET tous les produits (public)
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET un seul produit par ID (public)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ message: "Produit non trouvé" });
    res.json(data);
});

// POST un nouveau produit (protégé)
router.post('/', authMiddleware, upload.array('images', 5), async (req, res) => {
    try {
        const { name, price, category, description, colors } = req.body;
        const imageUrls = await uploadImages(req.files);

        const { data, error } = await supabase.from('products').insert([{
            name,
            price: parseFloat(price),
            category: category ? category.toLowerCase() : null,
            description,
            colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [],
            images: imageUrls
        }]).select();

        if (error) throw error;
        res.status(201).json(data[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE un produit (protégé)
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    
    const { data: product, error: findError } = await supabase.from('products').select('images').eq('id', id).single();
    if (findError) return res.status(404).json({ message: "Produit non trouvé" });

    const { error: deleteError } = await supabase.from('products').delete().eq('id', id);
    if (deleteError) return res.status(500).json({ error: deleteError.message });

    if (product.images && product.images.length > 0) {
        const fileNames = product.images.map(url => url.split('/').pop());
        await supabase.storage.from('product-images').remove(fileNames);
    }

    res.json({ message: 'Produit supprimé avec succès' });
});

// PUT (modifier) un produit (protégé)
router.put('/:id', authMiddleware, upload.array('images', 5), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category, description, colors } = req.body;
        
        const { data: existingProduct, error: findError } = await supabase.from('products').select('images').eq('id', id).single();
        if (findError) return res.status(404).json({ message: "Produit non trouvé" });

        let imageUrls = existingProduct.images || [];
        if (req.files && req.files.length > 0) {
            const newImageUrls = await uploadImages(req.files);
            imageUrls = newImageUrls; // On remplace les anciennes images
        }

        const { data, error } = await supabase.from('products').update({
            name,
            price: parseFloat(price),
            category: category ? category.toLowerCase() : null,
            description,
            colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean) : [],
            images: imageUrls
        }).eq('id', id).select();

        if (error) throw error;
        res.json(data[0]);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;