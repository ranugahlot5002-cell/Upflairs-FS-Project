const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Activity = require('./models/Activity');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully!'))
    .catch(err => console.log('DB Error: ', err.message));

app.post('/api/activities', async (req, res) => {
    try {
        const { userName, category, value } = req.body;
        let multiplier = 10;
        if (category === 'Transport') multiplier = 15;
        if (category === 'Waste') multiplier = 8;

        const impactScore = Number(value) * multiplier;
        const newActivity = new Activity({ userName, category, value: Number(value), impactScore });
        await newActivity.save();

        res.status(201).json({ success: true, data: newActivity });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/activities', async (req, res) => {
    try {
        const activities = await Activity.find().sort({ timestamp: -1 });
        const totalScore = activities.reduce((acc, curr) => acc + curr.impactScore, 0);

        let recommendation = "Maintain your current daily routine!";
        if (totalScore < 50) {
            recommendation = "Consider opting for public transit or walking short distances today.";
        } else if (totalScore >= 50 && totalScore < 150) {
            recommendation = "Great momentum! Try reducing single-use plastic to hit the next tier.";
        } else {
            recommendation = "Outstanding sustainability index! You're leading the local community grid.";
        }

        res.json({ success: true, totalScore, recommendation, activities });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));