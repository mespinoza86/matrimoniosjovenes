const urlParams = new URLSearchParams(window.location.search);
const year = urlParams.get('year');

document.getElementById('addCoupleBtn').addEventListener('click', async () => {
  const name = document.getElementById('newCouple').value.trim();
  if (!name) return alert('Escribe un nombre');

  const confirmAdd = confirm(`¿Estás seguro que quieres agregar la pareja "${name}"?`);
  if (!confirmAdd) return;

  await fetch(`/api/course/${year}/couple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  document.getElementById('newCouple').value = '';
  loadCouples();
});

document.getElementById('deleteBtn').addEventListener('click', async () => {
  const checkboxes = document.querySelectorAll('input[name=\"coupleDelete\"]:checked');
  const names = Array.from(checkboxes).map(cb => cb.value);

  if (!names.length) return alert('No seleccionaste ninguna pareja');
  const confirmDelete = confirm('¿Estás seguro que quieres eliminar las parejas seleccionadas?');
  if (!confirmDelete) return;

  await fetch(`/api/course/${year}/couples/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names }),
  });

  loadCouples();
});

function volver() {
  window.location.href = `curso.html?year=${year}`;
}

async function loadCouples() {
  const res = await fetch(`/api/course/${year}`);
  const data = await res.json();
  const listDiv = document.getElementById('coupleList');
  listDiv.innerHTML = data.couples.map(c => `
  <div class="attendance-item">
    <span>${c}</span>
    <input type="checkbox" name="coupleDelete" value="${c}" />
  </div>
`).join('');
}

loadCouples();
