const express = require('express');
const fs = require('fs').promises;  
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static('public'));

const historyFilePath = './searchHistory.json';

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/api/weather/history', async (req, res) => {
  try {
    const data = await fs.readFile(historyFilePath, 'utf8');
    res.json(JSON.parse(data)); 
  } catch (err) {
    console.error('Error reading history:', err);
    res.status(500).json({ message: 'Error reading search history' });
  }
});

app.post('/api/weather', async (req, res) => {
  const { cityName } = req.body;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!cityName) {
    return res.status(400).json({ message: 'City name is required' });
  }

  try {
    const weatherData = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}`
    );

    let history = [];
    try {
      const data = await fs.readFile(historyFilePath, 'utf8');
      history = JSON.parse(data); 
    } catch (err) {
      console.log('No previous history found, initializing empty array.');
      history = []; 
    }

    if (!history.includes(cityName)) {
      history.push(cityName);
      await fs.writeFile(historyFilePath, JSON.stringify(history)); 
      console.log(`City ${cityName} added to history.`);
    } else {
      console.log(`${cityName} is already in the history.`);
    }

    res.json(weatherData.data);  
  } catch (error) {
    console.error('Error fetching weather data:', error);
    res.status(500).json({ message: 'Error fetching weather data' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
