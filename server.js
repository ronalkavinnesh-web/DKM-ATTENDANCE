const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase Client using Environment Variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Explicit page routes for Vercel / Render deployment
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API Endpoint: Submit Attendance (Saves to Supabase Cloud)
app.post('/api/attendance', async (req, res) => {
    try {
        const { user_type, student_id, student_name, class_name, entry_method } = req.body;
        
        if (!student_id || !student_name) {
            return res.status(400).json({ success: false, message: 'ID and Name are required.' });
        }

        const newEntry = {
            user_type: user_type || 'student',
            student_id: student_id.trim(),
            student_name: student_name.trim(),
            class_name: class_name || 'General',
            entry_method: entry_method || 'QR_SCAN',
            timestamp: new Date().toLocaleString()
        };

        const { error } = await supabase.from('attendance').insert([newEntry]);

        if (error) throw error;

        res.json({ success: true, message: 'Attendance recorded successfully!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API Endpoint: Retrieve & Filter Logs from Cloud
app.get('/api/attendance', async (req, res) => {
    try {
        const { type, class_name } = req.query;
        let query = supabase.from('attendance').select('*').order('id', { ascending: false });

        if (type && type !== 'all') {
            query = query.eq('user_type', type);
        }
        if (class_name && class_name !== 'all') {
            query = query.eq('class_name', class_name);
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data: data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Export for Vercel Serverless
module.exports = app;
