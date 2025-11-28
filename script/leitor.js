function getUsuarioLogado() {
    try {
        const usuarioJson = localStorage.getItem('usuario');
        if (!usuarioJson) {
            window.location.href = '/index.html';
            return null;
        }
        const usuario = JSON.parse(usuarioJson);
        
        if (!usuario || !usuario.id_usuario) {
            console.warn("Sessão inválida detectada no Leitor.");
            localStorage.removeItem('usuario');
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
        'userid': usuario.id_usuario.toString() 
    };
}


window.addEventListener('DOMContentLoaded', () => {
    const usuario = getUsuarioLogado();
    if (!usuario) return; 

    if (usuario.perfil !== 'leitor') {
        alert('Você não tem permissão de leitor.');
        window.location.href = '/index.html';
        return;
    }

    
    const spanNome = document.getElementById('nomeLeitor');
    if (spanNome) spanNome.textContent = usuario.nome;

    
    const btnLogout = document.querySelector('.logout') || document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.onclick = () => {
            if(confirm('Deseja sair?')) {
                localStorage.removeItem('usuario');
                window.location.href = '/index.html';
            }
        };
    }

    carregarLivrosDisponiveis();
    carregarMeusEmprestimos();
});


async function carregarLivrosDisponiveis() {
    const tbody = document.querySelector('#tabela-livros tbody');
    if (!tbody) return; 
    
    tbody.innerHTML = '<tr><td colspan="4">Carregando livros...</td></tr>';

    try {
        
        const resp = await fetch('/books/available', { headers: getHeaders() });
        
        if (!resp.ok) {
            const erro = await resp.json();
            throw new Error(erro.message || 'Erro ao buscar livros');
        }

        const livros = await resp.json();
        tbody.innerHTML = '';

        if (livros.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Nenhum livro disponível no momento.</td></tr>';
            return;
        }

        livros.forEach(livro => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${livro.id_livro}</td>
                <td>${livro.titulo}</td>
                <td>${livro.autor}</td>
                <td>
                    <button class="btn-emprestar" onclick="solicitarEmprestimo(${livro.id_livro}, '${livro.titulo}')">
                        Solicitar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error("Erro no catálogo:", err);
        tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar catálogo. Verifique o console.</td></tr>';
    }
}


window.solicitarEmprestimo = async (idLivro, titulo) => {
    if (!confirm(`Deseja pegar o livro "${titulo}" emprestado?`)) return;

    try {
        const resp = await fetch('/loans', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ id_livro: idLivro }) 
        });

        const data = await resp.json();

        if (resp.ok) {
            alert('Empréstimo realizado com sucesso!');
            carregarLivrosDisponiveis();  
            carregarMeusEmprestimos();    
        } else {
            alert(data.message || 'Erro ao solicitar empréstimo.');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão ao solicitar empréstimo.');
    }
};


async function carregarMeusEmprestimos() {
    const tbody = document.querySelector('#meus-emprestimos tbody');
    if (!tbody) return;

    try {
        const resp = await fetch('/loans/my', { headers: getHeaders() });
        const lista = await resp.json();
        
        tbody.innerHTML = '';

        if (lista.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">Você não tem empréstimos ativos.</td></tr>';
            return;
        }

        lista.forEach(emp => {
            const tr = document.createElement('tr');
            
            let btnAcao = '-';
            if (emp.status === 'ativo' || emp.status === 'atrasado') {
                btnAcao = `<button class="btn-cancelar" onclick="cancelarEmprestimo(${emp.id_emprestimo})">Cancelar</button>`;
            } else if (emp.status === 'devolvido') {
                btnAcao = 'Devolvido';
            }

            tr.innerHTML = `
                <td>${emp.titulo_livro}</td>
                <td>${emp.status.toUpperCase()}</td>
                <td>${btnAcao}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Erro meus empréstimos:", err);
        tbody.innerHTML = '<tr><td colspan="3">Erro ao carregar dados.</td></tr>';
    }
}

window.cancelarEmprestimo = async (id) => {
    if (!confirm('Deseja cancelar/devolver este empréstimo?')) return;

    try {
        const resp = await fetch(`/loans/${id}`, { 
            method: 'DELETE', 
            headers: getHeaders() 
        });
        
        if (resp.ok) {
            alert('Empréstimo cancelado!');
            carregarMeusEmprestimos();
            carregarLivrosDisponiveis();
        } else {
            alert('Erro ao cancelar.');
        }
    } catch (err) {
        alert('Erro de conexão.');
    }
};