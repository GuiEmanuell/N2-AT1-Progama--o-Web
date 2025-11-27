function criarCelula(texto) {
	const td = document.createElement('td');
	td.textContent = texto;
	return td;
}

async function carregarLivros() {
	const tbody = document.querySelector('#tabela-livros tbody');
	tbody.innerHTML = '';
	try {
		const resp = await fetch('/listar/livros');
		const livros = await resp.json();
		livros.forEach(livro => {
			const tr = document.createElement('tr');
			tr.appendChild(criarCelula(livro.id));
			tr.appendChild(criarCelula(livro.titulo));
			tr.appendChild(criarCelula(livro.autor));
			tr.appendChild(criarCelula(livro.ano));
			tr.appendChild(criarCelula(livro.quantidade));
			tr.appendChild(criarCelula(livro.disponivel));

			const tdAcoes = document.createElement('td');
			const btnEditar = document.createElement('button');
			btnEditar.textContent = 'Editar';
			btnEditar.onclick = () => editarLivro(livro);
			const btnExcluir = document.createElement('button');
			btnExcluir.textContent = 'Excluir';
			btnExcluir.onclick = () => excluirLivro(livro.id);
			tdAcoes.appendChild(btnEditar);
			tdAcoes.appendChild(btnExcluir);
			tr.appendChild(tdAcoes);

			tbody.appendChild(tr);
		});
	} catch (e) {
		alert('Erro ao carregar livros!');
	}
}

document.getElementById('form-cadastro-livro').addEventListener('submit', async (e) => {
	e.preventDefault();
	const titulo = document.getElementById('titulo').value;
	const autor = document.getElementById('autor').value;
	const ano = document.getElementById('ano').value;
	const quantidade = document.getElementById('quantidade').value;
	try {
		const resp = await fetch('/register/livro', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ titulo, autor, ano, quantidade })
		});
		if (resp.ok) {
			alert('Livro cadastrado!');
			e.target.reset();
			carregarLivros();
		} else {
			const erro = await resp.json();
			alert(erro.message || 'Erro ao cadastrar livro!');
		}
	} catch (err) {
		alert('Erro ao cadastrar livro!');
	}
});

async function editarLivro(livro) {
	const novoTitulo = prompt('Novo título:', livro.titulo);
	if (novoTitulo === null) return;
	const novoAutor = prompt('Novo autor:', livro.autor);
	if (novoAutor === null) return;
	const novoAno = prompt('Novo ano:', livro.ano);
	if (novoAno === null) return;
	const novaQuantidade = prompt('Nova quantidade:', livro.quantidade);
	if (novaQuantidade === null) return;
	try {
		const resp = await fetch(`/atualizar/livro/${livro.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ titulo: novoTitulo, autor: novoAutor, ano: novoAno, quantidade: novaQuantidade })
		});
		if (resp.ok) {
			alert('Livro atualizado!');
			carregarLivros();
		} else {
			alert('Erro ao atualizar livro!');
		}
	} catch (err) {
		alert('Erro ao atualizar livro!');
	}
}

async function excluirLivro(id) {
	if (!confirm('Tem certeza que deseja excluir este livro?')) return;
	try {
		const resp = await fetch(`/deletar/livro/${id}`, { method: 'DELETE' });
		if (resp.ok) {
			alert('Livro excluído!');
			carregarLivros();
		} else {
			alert('Erro ao excluir livro!');
		}
	} catch (err) {
		alert('Erro ao excluir livro!');
	}
}

async function carregarEmprestimos() {
	const tbody = document.querySelector('#tabela-emprestimos tbody');
	tbody.innerHTML = '';
	try {
		const resp = await fetch('/listar/emprestimos');
		const emprestimos = await resp.json();
		emprestimos.forEach(emp => {
			const tr = document.createElement('tr');
			tr.appendChild(criarCelula(emp.leitor));
			tr.appendChild(criarCelula(emp.livro));
			tr.appendChild(criarCelula(emp.data_emprestimo));
			tr.appendChild(criarCelula(emp.data_prevista));
			const tdAcoes = document.createElement('td');
			const btnAprovar = document.createElement('button');
			btnAprovar.textContent = 'Aprovar Devolução';
			btnAprovar.onclick = () => aprovarDevolucao(emp.id);
			tdAcoes.appendChild(btnAprovar);
			tr.appendChild(tdAcoes);
			tbody.appendChild(tr);
		});
	} catch (e) {
		alert('Erro ao carregar empréstimos!');
	}
}

async function aprovarDevolucao(id) {
	if (!confirm('Aprovar devolução deste empréstimo?')) return;
	try {
		const resp = await fetch(`/atualizar/emprestimo/${id}`, { method: 'PUT' });
		if (resp.ok) {
			alert('Devolução aprovada!');
			carregarEmprestimos();
			carregarLivros();
		} else {
			alert('Erro ao aprovar devolução!');
		}
	} catch (err) {
		alert('Erro ao aprovar devolução!');
	}
}

window.addEventListener('DOMContentLoaded', () => {
	carregarLivros();
	carregarEmprestimos();
});
