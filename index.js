const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'web')));

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});