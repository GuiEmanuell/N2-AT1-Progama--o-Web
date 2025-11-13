// cadastro do formulário
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const name = document.getElementById('reg-nome').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-senha').value.trim();
    const message = document.getElementById('message');

    message.textContent = '';
    message.className = '';

    if (!name || !email || !password) {
        message.textContent = 'Preencha todos os campos.';
        message.className = 'msg error';
        return;
    }

    if (password.length < 6) {
        message.textContent = 'A senha deve ter pelo menos 6 caracteres.';
        message.className = 'msg error';
        return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        message.textContent = 'E-mail inválido.';
        message.className = 'msg error';
        return;
    }

   
    const payload = { name, email, password };
    console.log('Enviando para o backend:', payload);

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Resposta do servidor:', data);

        if (response.ok) {
            message.textContent = data.message || 'Cadastro realizado com sucesso.';
            message.className = 'msg success';
            document.getElementById('registerForm').reset();
        } else {
            message.textContent = data.message || 'Erro ao cadastrar.';
            message.className = 'msg error';
        }
    } catch (err) {
        console.error('Erro no fetch:', err);
        message.textContent = 'Erro de conexão. Verifique o servidor.';
        message.className = 'msg error';
    }
});


// login do formulário

document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value.trim();
    const message = document.getElementById('message');

    message.textContent = '';
    message.className = '';

    if (!email || !password) {
        message.textContent = 'Preencha todos os campos.';
        message.classList.add('error');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            message.textContent = data.message || 'Login realizado com sucesso!';
            message.classList.add('success');

            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 1000);

        } else {
            message.classList.add('error');
            message.textContent = data.message || 'E-mail ou senha incorretos.';
        }

    } catch (error) {
        console.error('Erro:', error);
        message.classList.add('error');
        message.textContent = 'Erro de conexão. Verifique o servidor.';
    }
});