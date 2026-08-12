const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const Record = require('./models/Record');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bob-records')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes

// Search records by account number
app.get('/api/records/search', async (req, res) => {
  try {
    const { accountNumber, moduleType } = req.query;
    
    if (!accountNumber) {
      return res.status(400).json({ error: 'Account number is required' });
    }

    const query = { accountNumbers: accountNumber };
    if (moduleType) {
      query.moduleType = moduleType;
    }

    const record = await Record.findOne(query);
    
    if (record) {
      res.json(record);
    } else {
      res.status(404).json({ error: 'Record not found for this account number' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new record
app.post('/api/records', async (req, res) => {
  try {
    const {
      moduleType,
      rackId,
      shelfId,
      position,
      fileTag,
      accountType,
      accountNumbers,
      action = 'check'
    } = req.body;

    // Check for existing document with same file tag location
    const existingRecord = await Record.findOne({ moduleType, rackId, shelfId, fileTag });

    if (existingRecord) {
      if (action === 'check') {
        return res.status(409).json({ exists: true, message: 'File tag already exists at this location.' });
      }
      
      if (action === 'append') {
        existingRecord.accountNumbers = Array.from(new Set([...existingRecord.accountNumbers, ...accountNumbers]));
        existingRecord.position = position;
        existingRecord.accountType = accountType;
        const savedRecord = await existingRecord.save();
        return res.status(200).json(savedRecord);
      }

      if (action === 'overwrite') {
        existingRecord.accountNumbers = accountNumbers;
        existingRecord.position = position;
        existingRecord.accountType = accountType;
        const savedRecord = await existingRecord.save();
        return res.status(200).json(savedRecord);
      }
    }

    // If no existing record or it's a completely new file
    const newRecord = new Record({
      moduleType,
      rackId,
      shelfId,
      position,
      fileTag,
      accountType,
      accountNumbers
    });

    const savedRecord = await newRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all records (for debugging/admin)
app.get('/api/records', async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
