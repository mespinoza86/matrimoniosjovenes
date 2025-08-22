// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PDFDocument = require('pdfkit');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/private', express.static(path.join(__dirname, 'private')));

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

connectDB();

const fileSchema = new mongoose.Schema({
  name: String,
  data: Buffer,
  mimetype: String,
});

const courseSchema = new mongoose.Schema({
  year: Number,
  couples: [String],
  classes: [
    {
      title: String,
      attendance: [String],
      activities: String,
      notes: String,
      agenda: String,
      files: [fileSchema],
    },
  ],
});

const Course = mongoose.model('Course', courseSchema);

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/create-course', async (req, res) => {
  const { year } = req.body;
  const existing = await Course.findOne({ year });
  if (existing) return res.status(400).send('Course already exists');

  const newCourse = new Course({
    year,
    couples: [],
    clases: [],
  });

  await newCourse.save();
  res.sendStatus(200);
});

app.get('/api/courses', async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

app.get('/api/course/:year', async (req, res) => {
  const course = await Course.findOne({ year: req.params.year });
  res.json(course);
});

app.post('/api/course/:year/class/add', async (req, res) => {
  const course = await Course.findOne({ year: req.params.year });
  course.classes.push({
    title: '',
    attendance: [],
    activities: '',
    notes: '',
    agenda: '',
    files: [],
  });
  await course.save();
  res.sendStatus(200);
});

app.post('/api/course/:year/couple', async (req, res) => {
  const { name } = req.body;
  const course = await Course.findOne({ year: req.params.year });
  course.couples.push(name);
  await course.save();
  res.sendStatus(200);
});

app.post('/api/course/:year/couples/delete', async (req, res) => {
  const { names } = req.body;
  const course = await Course.findOne({ year: req.params.year });
  course.couples = course.couples.filter(name => !names.includes(name));
  await course.save();
  res.sendStatus(200);
});

app.post('/api/course/:year/class/:index/files', upload.array('files'), async (req, res) => {
  const course = await Course.findOne({ year: req.params.year });
  const index = req.params.index;
  const files = req.files.map(f => ({ name: f.originalname, data: f.buffer, mimetype: f.mimetype }));
  course.classes[index].files.push(...files);
  await course.save();
  res.sendStatus(200);
});

app.get('/api/course/:year/class/:index/files/:filename', async (req, res) => {
  const { year, index, filename } = req.params;
  const course = await Course.findOne({ year });
  const file = course.classes[index].files.find(f => f.name === filename);
  if (!file) return res.sendStatus(404);
  res.set('Content-Type', file.mimetype);
  res.set('Content-Disposition', `attachment; filename="${file.name}"`);
  res.send(file.data);
});

app.post('/api/course/:year/class/:index/files/delete', async (req, res) => {
  const { filenames } = req.body;
  const course = await Course.findOne({ year: req.params.year });
  course.classes[req.params.index].files = course.classes[req.params.index].files.filter(f => !filenames.includes(f.name));
  await course.save();
  res.sendStatus(200);
});

app.post('/api/course/:year/class/:index', async (req, res) => {
  const { title, activities, notes, agenda } = req.body;
  const course = await Course.findOne({ year: req.params.year });
  const index = req.params.index;

  if (!course.classes[index]) {
    course.classes[index] = {
      title: '',
      attendance: [],
      activities: '',
      notes: '',
      agenda: '',
      files: [],
    };
  }

  // Solo actualizar los campos, sin borrar archivos ni asistencia
  course.classes[index].title = title;
  course.classes[index].activities = activities;
  course.classes[index].notes = notes;
  course.classes[index].agenda = agenda;

  await course.save();
  res.sendStatus(200);
});

// Generar PDF de una clase
app.get('/api/course/:year/class/:index/pdf', async (req, res) => {
  try {
    const { year, index } = req.params;
    const course = await Course.findOne({ year });
    if (!course) return res.status(404).send('Curso no encontrado');
    const c = course.classes[index];
    if (!c) return res.status(404).send('Clase no encontrada');

    const doc = new PDFDocument();
    const filename = `clase_${parseInt(index) + 1}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // Contenido del PDF
    doc.fontSize(20).text(`Clase ${parseInt(index) + 1}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(16).text('Título:', { underline: true });
    doc.fontSize(12).text(c.title || '---');
    doc.moveDown();

    doc.fontSize(16).text('Agenda:', { underline: true });
     if (c.agenda) {
      c.agenda.split('\n').forEach(line => {
      if (line.trim()) doc.fontSize(12).text(`• ${line}`);
      });
    } else {
      doc.fontSize(12).text('---');
    }

    doc.moveDown();

    doc.fontSize(16).text('Actividades:', { underline: true });
    if (c.activities) {
      c.activities.split('\n').forEach(line => {
      if (line.trim()) doc.fontSize(12).text(`• ${line}`);
      });
    } else {
      doc.fontSize(12).text('---');
    }
    doc.moveDown();


    doc.fontSize(16).text('Notas:', { underline: true });
    doc.fontSize(12).text(c.notes || '---');
    doc.moveDown();

    doc.fontSize(16).text('Asistencia:', { underline: true });
    if (c.attendance?.length) {
      c.attendance.forEach(name => doc.fontSize(12).text(`• ${name}`));
    } else {
      doc.fontSize(12).text('---');
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generando el PDF');
  }
});

// Resetear la base de datos (borrar todos los cursos)
/*
app.post('/api/reset-db', async (req, res) => {
  try {
    await Course.deleteMany({});
    res.send('Base de datos reiniciada');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al reiniciar la base de datos');
  }
});

app.get('/api/reset-db', async (req, res) => {
  try {
    await Course.deleteMany({});
    res.send('Base de datos reiniciada (GET)');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al reiniciar la base de datos');
  }
});
*/

app.post('/api/course/:year/class/:index/attendance', async (req, res) => {
  const { attendance } = req.body;
  const course = await Course.findOne({ year: req.params.year });
  course.classes[req.params.index].attendance = attendance;
  await course.save();
  res.sendStatus(200);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
