import express from 'express';

const router = express.Router();

export default (pool) => {
  router.post('/login', async (req, res) => {
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

  return router;
};
