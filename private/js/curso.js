const urlParams = new URLSearchParams(window.location.search);
const year = urlParams.get('year');
document.getElementById('cursoTitle').innerText = `Curso ${year}`;
let currentData;
let editMode = false; // por defecto solo lectura

async function loadCourse() {
  const res = await fetch(`/api/course/${year}`);
  currentData = await res.json();
  renderTabs();
}
loadCourse();

function renderTabs() {
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';

  const peopleTab = document.createElement('button');
  peopleTab.innerText = 'Parejas';
  peopleTab.onclick = () => {
    setActiveTab(peopleTab);
    renderPeopleTab();
  };
  tabs.appendChild(peopleTab);

  currentData.classes.forEach((cls, i) => {
    const tab = document.createElement('button');
    tab.innerText = `Clase ${i + 1}`;
    tab.onclick = () => {
      setActiveTab(tab);
      renderClassTab(i);
    };
    tabs.appendChild(tab);
  });

  if (editMode) {
    const addClassTab = document.createElement('button');
    addClassTab.innerText = '+ Agregar clase';
    addClassTab.onclick = async () => {
      const nextClassNumber = currentData.classes.length + 1;
      if (!confirm(`¿Quieres crear la Clase ${nextClassNumber}?`)) return;
      await fetch(`/api/course/${year}/class/add`, { method: 'POST' });
      await loadCourse();
    };
    tabs.appendChild(addClassTab);
  }

  if (currentData.classes.length > 0) {
    const firstTab = tabs.querySelectorAll('button')[1]; // el primero es "Parejas"
    if (firstTab) {
      setActiveTab(firstTab);
      renderClassTab(0);
    }
  } else {
    setActiveTab(peopleTab);
    renderPeopleTab();
  }
}

function setActiveTab(button) {
  document.querySelectorAll('#tabs button').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
}

async function addCouple() {
  const name = document.getElementById('coupleName').value;
  if (!name) return;
  await fetch(`/api/course/${year}/couple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  loadCourse();
}

function renderPeopleTab() {
  const div = document.getElementById('classContent');
  div.innerHTML = `
    <h3>Parejas</h3>
    ${editMode ? `<button onclick="location.href='parejas.html?year=' + year">Agregar o Eliminar Parejas</button>` 
               : `<button class="modifyBtn">Modificar</button>`}
    <ul>${currentData.couples.map(p => `<li>${p}</li>`).join('')}</ul>
  `;

  if (!editMode) {
    div.querySelector('.modifyBtn').addEventListener('click', () => {
      document.getElementById('editLogin').style.display = 'block';
    });
  }
}

function renderClassTab(index) {
  const c = currentData.classes[index] || {
    title: '',
    attendance: [],
    activities: '',
    notes: '',
    agenda: '',
    files: [],
  };

  const disabled = editMode ? '' : 'disabled';
  const div = document.getElementById('classContent');
  div.innerHTML = `
    <h3>Clase ${index + 1}</h3>
    <label>Título: <input type="text" id="title" value="${c.title || ''}" ${disabled} /></label><br>
    <label>Agenda: <textarea id="agenda" rows="20" ${disabled}>${c.agenda || ''}</textarea></label><br>
    <label>Actividades: <textarea id="activities" rows="20" ${disabled}>${c.activities || ''}</textarea></label><br>
    <label>Notas: <textarea id="notes" rows="10" ${disabled}>${c.notes || ''}</textarea></label><br>

    ${editMode ? `<button onclick="saveClass(${index})">Guardar</button>` : `<button id="modifyBtn">Modificar</button>`}
     
    <!-- Subida de archivos -->
    <form id="fileUploadForm" enctype="multipart/form-data">
      <input type="file" name="files" multiple ${disabled}/>
      <button type="submit" ${disabled}>Subir Archivos</button>
    </form>

    <h4>Archivos Subidos</h4>
    <form id="fileDeleteForm">
      <ul class="file-list">
        ${c.files.map(file => `
          <li>
            <input type="checkbox" name="deleteFile" value="${file.name}" ${disabled}>
            <a href="/api/course/${year}/class/${index}/files/${file.name}" download="${file.name}">
              ${file.name}
            </a>
          </li>
        `).join('')}
      </ul>
      ${c.files.length && editMode ? `<button type="submit">Eliminar archivos seleccionados</button>` : ''}
    </form>

    <h4>Asistencia</h4>
    <form id="attendanceForm" class="attendance-list">
      ${currentData.couples.map(p => `
        <div class="attendance-item">
          <span>${p}</span>
          <input type="checkbox" name="attendance" value="${p}" ${c.attendance.includes(p) ? 'checked' : ''} ${disabled} />
        </div>
      `).join('')}
      ${editMode ? '<button type="submit">Guardar Asistencia</button>' : ''}
    </form>

    <button id="downloadPdfBtn">Descargar como PDF</button>
  `;

  if (!editMode) {
    document.getElementById('modifyBtn')?.addEventListener('click', () => {
      document.getElementById('editLogin').style.display = 'block';
    });
  }

  // SUBIR ARCHIVOS
  document.getElementById('fileUploadForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!editMode) return alert('Modo solo lectura');
    const formData = new FormData(e.target);
    await fetch(`/api/course/${year}/class/${index}/files`, { method: 'POST', body: formData });
    await loadCourse();
    alert('Archivos subidos');
  };

  // GUARDAR ASISTENCIA
  document.getElementById('attendanceForm').onsubmit = async (e) => {
    e.preventDefault();
    if (!editMode) return alert('Modo solo lectura');
    const checkboxes = document.querySelectorAll('input[name="attendance"]:checked');
    const attendance = Array.from(checkboxes).map(cb => cb.value);
    await fetch(`/api/course/${year}/class/${index}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance }),
    });
    alert('Asistencia guardada');
    await loadCourse();
  };

  // ELIMINAR ARCHIVOS
  document.getElementById('fileDeleteForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editMode) return alert('Modo solo lectura');
    const checkboxes = document.querySelectorAll('input[name="deleteFile"]:checked');
    if (checkboxes.length === 0) return alert('Selecciona archivos para eliminar');
    if (!confirm('¿Estás seguro de que quieres eliminar los archivos seleccionados?')) return;
    const filenames = Array.from(checkboxes).map(cb => cb.value);
    await fetch(`/api/course/${year}/class/${index}/files/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filenames }),
    });
    alert('Archivos eliminados');
    await loadCourse();
  });

  // DESCARGAR PDF
  document.getElementById('downloadPdfBtn').onclick = () => {
    window.open(`/api/course/${year}/class/${index}/pdf`, '_blank');
  };
}

// LOGIN para habilitar edición
document.getElementById('loginBtn')?.addEventListener('click', async () => {
  const username = document.getElementById('editUser').value;
  const password = document.getElementById('editPass').value;
  try {
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      editMode = true;
      document.getElementById('editLogin').style.display = 'none';
      await loadCourse();
      alert('Modo edición habilitado');
    } else {
      alert('Usuario o contraseña incorrecta');
    }
  } catch(e) { console.error(e); }
});

async function saveClass(index) {
  if (!editMode) return alert('Modo solo lectura');
  const cleanText = (text) => text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[^\x20-\x7E\n\u00C0-\u017F]/g, '');
  const body = {
    title: cleanText(document.getElementById('title').value),
    activities: cleanText(document.getElementById('activities').value),
    notes: cleanText(document.getElementById('notes').value),
    agenda: cleanText(document.getElementById('agenda').value),
  };
  await fetch(`/api/course/${year}/class/${index}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await loadCourse();
  alert('Datos guardados');
}
