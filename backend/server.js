import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

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


app.post('/register', async (req, res) => {
    console.log('Requisição para cadastro recebida com sucesso');
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Preencha todos os campos' });
    }

        try {
            const query = 'INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)';
            const [result] = await pool.execute(query, [name, email, password]);

        console.log('Usuario cadastrado com sucesso');
        res.status(201).json({ message: 'Cadastro realizado com sucesso' });
    } catch (err) {
        console.error('Erro ao cadastrar usuario:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'E-mail já cadastrado!' });
        }
        res.status(500).json({ message: 'Erro no servidor: ' + err.message });
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios!' });
    }

    try {
        const query = 'SELECT * FROM usuario WHERE email = ?';
        const [rows] = await pool.execute(query, [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
        }

        const user = rows[0];
        const match = password === user.senha;

        if (!match) {
            return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
        }

        res.json({ 
            success: true,
            message: 'Login realizado com sucesso!', 
            user: { id: user.id, nome: user.nome, email: user.email } 
        });
    } catch (err) {
        console.error('Erro no login:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});