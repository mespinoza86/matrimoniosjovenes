document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    firstName: e.target.firstName.value,
    lastName: e.target.lastName.value,
    username: e.target.username.value,
    email: e.target.email.value,
    password: e.target.password.value,
    confirmPassword: e.target.confirmPassword.value
  };

  const res = await fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (res.ok) {
    alert('Usuario creado con éxito');
    window.location.href = 'index.html';
  } else {
    const err = await res.json();
    alert(err.error || 'Error creando usuario');
  }
});
