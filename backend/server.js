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


const autenticar = (req, res, next) => {
    const userId = req.headers['userid'];
    if (!userId) return res.status(401).json({ message: 'Faça login.' });
    req.userId = parseInt(userId);
    next();
};


const somenteBibliotecario = async (req, res, next) => {
    try {
        const [rows] = await pool.execute('SELECT perfil FROM usuario WHERE id_usuario = ?', [req.userId]);
        if (!rows[0] || rows[0].perfil !== 'bibliotecario') {
            return res.status(403).json({ message: 'Acesso negado.' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: 'Erro interno' });
    }
};



// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.execute('SELECT * FROM usuario WHERE email = ?', [email]);
        if (rows.length === 0 || rows[0].senha !== password) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const user = rows[0];
        res.json({
            success: true,
            user: {
                id_usuario: user.id_usuario,
                nome: user.nome,
                email: user.email,
                perfil: user.perfil
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// Cadastro
app.post('/register', async (req, res) => {
    const { name, email, password, perfil } = req.body;
    try {
        await pool.execute(
            'INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [name, email, password, perfil]
        );
        res.status(201).json({ message: 'Sucesso!' });
    } catch (err) {
        res.status(400).json({ message: 'Erro ao cadastrar (email duplicado ou dados inválidos)' });
    }
});

// Livros
app.get('/books', autenticar, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM livros ORDER BY titulo');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar livros' });
    }
});


app.get('/books/available', autenticar, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM livros WHERE quantidade_disponivel > 0 ORDER BY titulo');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao listar' });
    }
});

app.post('/books', autenticar, somenteBibliotecario, async (req, res) => {
    const { titulo, autor, ano_publicacao, quantidade_disponivel } = req.body;
    try {
        await pool.execute(
            'INSERT INTO livros (titulo, autor, ano_publicacao, quantidade_disponivel) VALUES (?, ?, ?, ?)',
            [titulo, autor, ano_publicacao, quantidade_disponivel]
        );
        res.status(201).json({ message: 'Livro criado!' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao criar' });
    }
});

app.put('/books/:id', autenticar, somenteBibliotecario, async (req, res) => {
    const id = req.params.id;
    const { titulo, autor, ano_publicacao, quantidade_disponivel } = req.body;
    try {
        await pool.execute(
            'UPDATE livros SET titulo=?, autor=?, ano_publicacao=?, quantidade_disponivel=? WHERE id_livro=?',
            [titulo, autor, ano_publicacao, quantidade_disponivel, id]
        );
        res.json({ message: 'Atualizado!' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao atualizar' });
    }
});

app.delete('/books/:id', autenticar, somenteBibliotecario, async (req, res) => {
    const id = req.params.id;
    try {
        const [emp] = await pool.execute('SELECT * FROM emprestimos WHERE id_livro = ? AND status_livro = "ativo"', [id]);
        if (emp.length > 0) return res.status(400).json({ message: 'Livro emprestado!' });
        
        await pool.execute('DELETE FROM livros WHERE id_livro = ?', [id]);
        res.json({ message: 'Removido!' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao remover' });
    }
});


app.post('/loans', autenticar, async (req, res) => {
    
    const { id_livro } = req.body;
    const id_usuario = req.userId;

    try {
        const [livro] = await pool.execute('SELECT quantidade_disponivel FROM livros WHERE id_livro = ?', [id_livro]);
        if (!livro[0] || livro[0].quantidade_disponivel <= 0) {
            return res.status(400).json({ message: 'Sem estoque.' });
        }

        await pool.execute(
            'INSERT INTO emprestimos (id_livro, id_usuario, data_emprestimo, data_devolucao_prevista, status_livro) VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), "ativo")',
            [id_livro, id_usuario]
        );
        await pool.execute('UPDATE livros SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id_livro = ?', [id_livro]);
        
        res.json({ message: 'Empréstimo realizado!' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao emprestar' });
    }
});

app.get('/loans', autenticar, somenteBibliotecario, async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT e.id_emprestimo, u.nome as nome_leitor, l.titulo as titulo_livro, e.data_emprestimo, e.data_devolucao_prevista 
        FROM emprestimos e
        JOIN usuario u ON e.id_usuario = u.id_usuario
        JOIN livros l ON e.id_livro = l.id_livro
        WHERE e.status_livro = 'ativo'
    `);
    res.json(rows);
});

app.get('/loans/my', autenticar, async (req, res) => {
    const [rows] = await pool.execute(`
        SELECT e.id_emprestimo, l.titulo as titulo_livro, e.status_livro as status
        FROM emprestimos e
        JOIN livros l ON e.id_livro = l.id_livro
        WHERE e.id_usuario = ?
    `, [req.userId]);
    res.json(rows);
});

app.put('/loans/:id/return', autenticar, somenteBibliotecario, async (req, res) => {
    const id = req.params.id;
    const [emp] = await pool.execute('SELECT id_livro FROM emprestimos WHERE id_emprestimo = ?', [id]);
    if (!emp[0]) return res.status(404).json({ message: 'Não encontrado' });

    await pool.execute('UPDATE emprestimos SET status_livro="devolvido", data_devolucao_real=CURDATE() WHERE id_emprestimo=?', [id]);
    await pool.execute('UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = ?', [emp[0].id_livro]);
    res.json({ message: 'Devolvido!' });
});

app.delete('/loans/:id', autenticar, async (req, res) => {
    const id = req.params.id;
    const [emp] = await pool.execute('SELECT id_livro FROM emprestimos WHERE id_emprestimo = ?', [id]);
    if (!emp[0]) return res.status(404).json({ message: 'Não encontrado' });

    await pool.execute('DELETE FROM emprestimos WHERE id_emprestimo = ?', [id]);
    await pool.execute('UPDATE livros SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = ?', [emp[0].id_livro]);
    res.json({ message: 'Cancelado!' });
});

const PORT = process.env.PORT || 3000; app.listen(PORT, () => { console.log(`Servidor rodando em http://localhost:${PORT}`); });