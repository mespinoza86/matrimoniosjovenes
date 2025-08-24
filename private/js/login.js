document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    username: e.target.username.value,
    password: e.target.password.value
  };

  const res = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'same-origin'
  });

  if (res.ok) {
    alert('Login exitoso');
    // replace evita mantener la página de login en el historial
    window.location.replace('index.html');
  } else {
    const err = await res.json();
    alert(err.error || 'Error en login');
  }
});
