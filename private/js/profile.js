async function loadProfile() {
  const res = await fetch('/api/users/profile', { credentials: 'same-origin' });
  if (res.ok) {
    const user = await res.json();
    document.getElementById('profileData').innerHTML = `
      <p><strong>Nombre:</strong> ${user.firstName} ${user.lastName}</p>
      <p><strong>Usuario:</strong> ${user.username}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;
  } else {
    alert('Debes iniciar sesión');
    window.location.href = 'login.html';
  }
}

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    oldPassword: e.target.oldPassword.value,
    newPassword: e.target.newPassword.value
  };

  const res = await fetch('/api/users/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'same-origin'
  });

  if (res.ok) {
    alert('Contraseña actualizada');
    e.target.reset();
  } else {
    const err = await res.json();
    alert(err.error || 'Error actualizando contraseña');
  }
});

loadProfile();
