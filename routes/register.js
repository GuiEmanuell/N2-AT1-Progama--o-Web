import express from 'express';

const router = express.Router();

export default (pool) => {
  router.post('/register', async (req, res) => {
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

  return router;
};
