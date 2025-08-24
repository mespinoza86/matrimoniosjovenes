document.getElementById('newCourseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const year = e.target.year.value;

  const res = await fetch('/api/create-course', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year }),
  });

  if (res.ok) {
    loadCourses();
  } else {
    alert('Ya existe un curso para ese año.');
  }
});

async function loadCourses() {
  const res = await fetch('/api/courses');
  const courses = await res.json();
  const list = document.getElementById('courseList');
  list.innerHTML = '';
  courses.forEach(c => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/curso.html?year=${c.year}`;
    link.innerText = `Curso ${c.year}`;
    li.appendChild(link);
    list.appendChild(li);
  });
}

// 👇 Nuevo: detectar sesión preguntando al backend
async function checkAuth() {
  const loginBtn = document.getElementById('loginBtn');
  const profileBtn = document.getElementById('profileBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  try {
    const res = await fetch('/api/users/profile', {
      method: 'GET',
      // same-origin basta si sirves todo desde el mismo dominio/puerto.
      // credentials: 'include' también funciona.
      credentials: 'same-origin'
    });

    if (res.ok) {
      const user = await res.json();
      // Mostrar botones de perfil
      loginBtn.style.display = 'none';
      profileBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'inline-block';

      // (opcional) mostrar el nombre en el botón
      profileBtn.textContent = 'Mi Perfil';
      if (user?.firstName) {
        profileBtn.textContent = `Mi Perfil (${user.firstName})`;
      }
    } else {
      // No logueado
      loginBtn.style.display = 'inline-block';
      profileBtn.style.display = 'none';
      logoutBtn.style.display = 'none';
    }
  } catch (e) {
    // En caso de error de red, asumimos no logueado
    loginBtn.style.display = 'inline-block';
    profileBtn.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}

async function logout() {
  try {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'same-origin'
    });
  } catch (e) {}
  // Refresca UI
  await checkAuth();
}

loadCourses();
checkAuth();
