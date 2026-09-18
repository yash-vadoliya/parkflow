const express = require('express');
const mysql = require('mysql2/promise'); // Using promise-based API
const cors = require('cors');
const mainRoutes = require('./routes/mainRoutes')

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests

app.use('/uploads', express.static(('uploads')));
app.use('/api', mainRoutes);

app.get('/', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Parking Api is Running..'
  });
});


// IMPORTANT: How to listen for other devices on the network
// Binding to '0.0.0.0' allows connections from any IP on the network.
const PORT = Number(process.env.PORT || 3300);
const server = app.listen(PORT, '0.0.0.0', () => {
  server.ref();
  console.log(`Server is running and listening on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server failed:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing API process or choose another PORT.`);
  }
  process.exitCode = 1;
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
