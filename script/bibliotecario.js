function getUsuarioLogado() {
    try {
        const usuarioJson = localStorage.getItem('usuario');
        if (!usuarioJson) {
            window.location.href = '/index.html';
            return null;
        }
        const usuario = JSON.parse(usuarioJson);
        
        if (!usuario || !usuario.id_usuario) {
            localStorage.removeItem('usuario');
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = '/index.html';
            return null;
        }
        return usuario;
    } catch (err) {
        localStorage.removeItem('usuario');
        window.location.href = '/index.html';
        return null;
    }
}

function getHeaders() {
    const usuario = getUsuarioLogado();
    if (!usuario) return {};
    return {
        'Content-Type': 'application/json',
        'userId': usuario.id_usuario.toString()
    };
}

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    const usuario = getUsuarioLogado();
    if (!usuario) return;

    if (usuario.perfil !== 'bibliotecario') {
        alert('Acesso negado!');
        window.location.href = '/index.html';
        return;
    }
    
    // Configura logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        if(confirm('Sair?')) {
            localStorage.removeItem('usuario');
            window.location.href = '/index.html';
        }
    });

    carregarLivros();
    carregarEmprestimos();
});

// Carregar Livros
async function carregarLivros() {
    const tbody = document.querySelector('#tabela-livros tbody');
    tbody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

    try {
        const resp = await fetch('/books', { headers: getHeaders() });
        const livros = await resp.json();
        tbody.innerHTML = '';

        if (!livros.length) {
            tbody.innerHTML = '<tr><td colspan="7">Nenhum livro</td></tr>';
            return;
        }

        livros.forEach(livro => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${livro.id_livro}</td>
                <td>${livro.titulo}</td>
                <td>${livro.autor}</td>
                <td>${livro.ano_publicacao || '-'}</td>
                <td>${livro.quantidade_disponivel}</td>
                <td>${livro.quantidade_disponivel > 0 ? 'Sim' : 'Não'}</td>
                <td>
                    <button onclick="editarLivro(${livro.id_livro}, '${livro.titulo}', '${livro.autor}', ${livro.ano_publicacao}, ${livro.quantidade_disponivel})">Editar</button>
                    <button onclick="excluirLivro(${livro.id_livro})">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7">Erro ao carregar</td></tr>';
    }
}

// Cadastrar
document.getElementById('form-cadastro-livro')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value;
    const autor = document.getElementById('autor').value;
    const ano = document.getElementById('ano').value;
    const qtd = document.getElementById('quantidade').value;

    await fetch('/books', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ titulo, autor, ano_publicacao: ano, quantidade_disponivel: qtd })
    });
    alert('Cadastrado!');
    carregarLivros();
    e.target.reset();
});

// Editar
window.editarLivro = async (id, tit, aut, ano, qtd) => {
    const novoTit = prompt("Título:", tit);
    if (!novoTit) return;
    const novoAut = prompt("Autor:", aut);
    const novoAno = prompt("Ano:", ano);
    const novaQtd = prompt("Qtd:", qtd);

    await fetch(`/books/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ titulo: novoTit, autor: novoAut, ano_publicacao: novoAno, quantidade_disponivel: novaQtd })
    });
    alert('Atualizado!');
    carregarLivros();
};

// Excluir
window.excluirLivro = async (id) => {
    if (!confirm('Excluir?')) return;
    const resp = await fetch(`/books/${id}`, { method: 'DELETE', headers: getHeaders() });
    if (resp.ok) {
        alert('Excluído!');
        carregarLivros();
    } else {
        alert('Erro ao excluir (verifique se há empréstimos).');
    }
};

async function carregarEmprestimos() {
    const tbody = document.querySelector('#tabela-emprestimos tbody');
    const resp = await fetch('/loans', { headers: getHeaders() });
    const lista = await resp.json();
    tbody.innerHTML = '';
    
    lista.forEach(emp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.nome_leitor}</td>
            <td>${emp.titulo_livro}</td>
            <td>${new Date(emp.data_emprestimo).toLocaleDateString()}</td>
            <td>${new Date(emp.data_devolucao_prevista).toLocaleDateString()}</td>
            <td><button onclick="devolver(${emp.id_emprestimo})">Receber</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.devolver = async (id) => {
    if (!confirm('Confirmar devolução?')) return;
    await fetch(`/loans/${id}/return`, { method: 'PUT', headers: getHeaders() });
    alert('Devolvido!');
    carregarEmprestimos();
    carregarLivros();
};