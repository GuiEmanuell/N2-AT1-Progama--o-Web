import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

import registerRoute from '../routes/register.js';
import loginRoute from '../routes/login.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/style', express.static(path.join(__dirname, '../style')));
app.use('/script', express.static(path.join(__dirname, '../script')));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '2mic50@NOMAD',
    database: 'biblioteca',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conectado ao banco com sucesso, pai! TMJ');
        connection.release();
    } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    }
})();


app.use(registerRoute(pool));
app.use(loginRoute(pool));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});