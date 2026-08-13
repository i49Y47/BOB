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
    
    let query = {};
    if (moduleType) {
      query.moduleType = moduleType;
    }

    if (!accountNumber) {
      // Empty search - return all modules sorted
      const records = await Record.find(query).sort({ rackId: 1, shelfId: 1, fileTag: 1 });
      const formattedRecords = records.map(r => ({
        rackId: r.rackId,
        shelfId: r.shelfId,
        fileTag: r.fileTag,
        position: r.position,
        totalAccounts: r.accountNumbers ? r.accountNumbers.length : 0
      }));
      return res.json({ type: 'all', data: formattedRecords });
    }

    query.accountNumbers = { $regex: '^' + accountNumber };
    const records = await Record.find(query).sort({ rackId: 1, shelfId: 1, fileTag: 1 });

    if (records.length === 0) {
      return res.status(404).json({ error: 'Record not found for this account number' });
    }

    let matchedResults = [];
    let exactMatchRecord = null;
    let exactMatchFound = false;

    records.forEach(record => {
      const matchingAccs = record.accountNumbers.filter(acc => acc.startsWith(accountNumber));
      matchingAccs.forEach(acc => {
        matchedResults.push({
          rackId: record.rackId,
          shelfId: record.shelfId,
          fileTag: record.fileTag,
          position: record.position,
          accountNumber: acc
        });
        if (acc === accountNumber) {
          exactMatchFound = true;
          exactMatchRecord = record;
        }
      });
    });

    if (exactMatchFound && matchedResults.length === 1) {
      return res.json({ type: 'exact', data: exactMatchRecord });
    }

    return res.json({ type: 'partial', data: matchedResults });
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
        const savedRecord = await existingRecord.save();
        return res.status(200).json(savedRecord);
      }

      if (action === 'overwrite') {
        existingRecord.accountNumbers = accountNumbers;
        existingRecord.position = position;
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
