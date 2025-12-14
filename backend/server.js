const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, 'data.json');

const defaultData = {
  transactions: [],
  categories: [],
  goals: [],
  subscriptions: [],
  debts: [],
  subscriptionLevel: 'FREE',
  theme: 'DARK',
};

const readData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return { ...defaultData };
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultData, ...parsed };
  } catch (error) {
    console.error('Failed to read data file, resetting to defaults', error);
    return { ...defaultData };
  }
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const createCollectionRoutes = (key) => {
  app.get(`/api/${key}`, (_req, res) => {
    const data = readData();
    res.json(data[key] || []);
  });

  app.post(`/api/${key}`, (req, res) => {
    const item = { ...req.body };
    if (!item.id) {
      item.id = uuid();
    }

    const data = readData();
    data[key] = data[key] || [];
    data[key].push(item);
    writeData(data);
    res.status(201).json(item);
  });

  app.put(`/api/${key}/:id`, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const data = readData();
    const list = data[key] || [];
    const index = list.findIndex((entry) => entry.id === id);

    if (index === -1) {
      return res.status(404).json({ message: `${key} item not found` });
    }

    const updated = { ...list[index], ...updates, id };
    list[index] = updated;
    data[key] = list;
    writeData(data);
    res.json(updated);
  });

  app.delete(`/api/${key}/:id`, (req, res) => {
    const { id } = req.params;
    const data = readData();
    const list = data[key] || [];
    const filtered = list.filter((entry) => entry.id !== id);

    if (filtered.length === list.length) {
      return res.status(404).json({ message: `${key} item not found` });
    }

    data[key] = filtered;
    writeData(data);
    res.status(204).send();
  });
};

['transactions', 'categories', 'goals', 'subscriptions', 'debts'].forEach(createCollectionRoutes);

app.get('/api/settings', (_req, res) => {
  const data = readData();
  res.json({
    subscriptionLevel: data.subscriptionLevel || 'FREE',
    theme: data.theme || 'DARK',
  });
});

app.post('/api/settings/subscription', (req, res) => {
  const { level } = req.body;
  if (!['FREE', 'PRO', 'PREMIUM'].includes(level)) {
    return res.status(400).json({ message: 'Invalid subscription level' });
  }

  const data = readData();
  data.subscriptionLevel = level;
  writeData(data);
  res.json({ subscriptionLevel: level });
});

app.post('/api/settings/theme', (req, res) => {
  const { theme } = req.body;
  if (!['LIGHT', 'DARK'].includes(theme)) {
    return res.status(400).json({ message: 'Invalid theme' });
  }

  const data = readData();
  data.theme = theme;
  writeData(data);
  res.json({ theme });
});

app.listen(PORT, () => {
  console.log(`Backend API server running on http://localhost:${PORT}`);
});
