import express from "express";
const router = express.Router();

export default (pool) => {
   
    router.get("/livros/disponiveis", async (req, res) => {
        try {
            const [rows] = await pool.query("SELECT id, titulo, autor, ano, quantidade_disponivel FROM livros WHERE quantidade_disponivel > 0");
            res.json(rows);
        } catch (err) {
            res.status(500).json({ mensagem: "Erro ao buscar livros disponíveis." });
        }
    });

    router.get("/emprestimos/usuario/:usuarioId", async (req, res) => {
        const usuarioId = Number(req.params.usuarioId);
        try {
            const [rows] = await pool.query(
                "SELECT e.id, e.livro_id, l.titulo, e.data_emprestimo, e.data_prevista, e.status FROM emprestimos e JOIN livros l ON e.livro_id = l.id WHERE e.usuario_id = ? AND e.status = 'ativo'",
                [usuarioId]
            );
            if (rows.length === 0) {
                return res.status(404).json({ mensagem: "Nenhum empréstimo ativo encontrado para este usuário." });
            }
            res.json(rows);
        } catch (err) {
            res.status(500).json({ mensagem: "Erro ao buscar empréstimos." });
        }
    });

  
    router.get("/livros/:id", async (req, res) => {
        const id = Number(req.params.id);
        try {
            const [rows] = await pool.query("SELECT id, titulo, autor, ano, quantidade_disponivel FROM livros WHERE id = ?", [id]);
            if (rows.length === 0) {
                return res.status(404).json({ mensagem: "Livro não encontrado." });
            }
            res.json(rows[0]);
        } catch (err) {
            res.status(500).json({ mensagem: "Erro ao buscar livro." });
        }
    });

    return router;
};