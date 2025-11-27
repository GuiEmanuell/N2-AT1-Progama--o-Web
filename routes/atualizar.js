app.put('/update-user/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, password } = req.body;


    if (!name || !email) {
        return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
    }

    try {
        let query = '';
        let params = [];

        
        if (password) {
            query = 'UPDATE usuario SET nome = ?, email = ?, senha = ? WHERE id = ?';
            params = [name, email, password, id];
        } else {
            query = 'UPDATE usuario SET nome = ?, email = ? WHERE id = ?';
            params = [name, email, id];
        }

        const [result] = await pool.execute(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.json({ message: 'Usuário atualizado com sucesso!' });
        
    } catch (err) {
        console.error('Erro ao atualizar usuário:', err);
        res.status(500).json({ message: 'Erro no servidor.' });
 }
});