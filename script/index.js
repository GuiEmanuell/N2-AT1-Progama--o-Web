//cadastro
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('reg-nome').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-senha').value;
    const perfil = document.getElementById('perfil').value;
    const message = document.getElementById('message');

    message.textContent = '';
    message.className = '';

    if (!name || !email || !password || !perfil) {
        return mostrarErro('Preencha todos os campos obrigatórios!');
    }

    if (name.length < 3) {
        return mostrarErro('O nome deve ter pelo menos 3 caracteres.');
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return mostrarErro('Digite um e-mail válido (ex: usuario@dominio.com)');
    }

    if (password.length < 6) {
        return mostrarErro('A senha deve ter no mínimo 6 caracteres.');
    }

    if (!['leitor', 'bibliotecario'].includes(perfil)) {
        return mostrarErro('Selecione um perfil válido.');
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, perfil })
        });

        const data = await response.json();

        if (response.ok) {
            mostrarSucesso(data.message || 'Cadastro realizado com sucesso!');
            document.getElementById('registerForm').reset();
        } else {
            mostrarErro(data.message || 'Erro ao cadastrar. Tente novamente.');
        }
    } catch (err) {
        console.error('Erro no cadastro:', err);
        mostrarErro('Erro de conexão. Verifique se o servidor está rodando.');
    }

    function mostrarErro(texto) {
        message.textContent = texto;
        message.className = 'msg error';
    }

    function mostrarSucesso(texto) {
        message.textContent = texto;
        message.className = 'msg success';
    }
});

//login
document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('senha').value;
    const message = document.getElementById('message');

    message.textContent = '';
    message.className = '';

    if (!email || !password) {
        return mostrarMensagem('Preencha e-mail e senha!', 'error');
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return mostrarMensagem('E-mail inválido!', 'error');
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
            localStorage.setItem('usuario', JSON.stringify(data.user));

            mostrarMensagem('Login realizado com sucesso! Redirecionando...', 'success');

            setTimeout(() => {
                if (data.user.perfil === 'bibliotecario') {
                    window.location.href = 'bibliotecario.html';
                } else {
                    window.location.href = 'leitor.html';
                }
            }, 1000);

        } else {
            mostrarMensagem(data.message || 'E-mail ou senha incorretos.', 'error');
        }

    } catch (error) {
        console.error('Erro no login:', error);
        mostrarMensagem('Erro de conexão com o servidor.', 'error');
    }

    function mostrarMensagem(texto, tipo) {
        message.textContent = texto;
        message.className = `msg ${tipo}`;
    }
});