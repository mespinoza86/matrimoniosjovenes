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

loadCourses();
