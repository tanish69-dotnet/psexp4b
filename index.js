const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory array to store student records
let students = [];
let nextId = 1;

// GET /students -> Get all students
app.get('/students', (req, res) => {
    res.status(200).json(students);
});

// GET /students/:id -> Get a specific student
app.get('/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id);
    const student = students.find(s => s.ID === studentId);
    
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    res.status(200).json(student);
});

// POST /students -> Add a new student
app.post('/students', (req, res) => {
    const { Name, Branch, Year } = req.body;
    
    if (!Name || !Branch || !Year) {
        return res.status(400).json({ error: 'Name, Branch, and Year are required fields' });
    }
    
    const newStudent = {
        ID: nextId++,
        Name,
        Branch,
        Year
    };
    
    students.push(newStudent);
    console.log(`[SYS] NODE_CREATED: ${newStudent.Name} (ID: ${newStudent.ID}) [${newStudent.Branch}, ${newStudent.Year}]`);
    res.status(201).json(newStudent);
});

// PATCH /students/:id -> Update student details
app.patch('/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id);
    const student = students.find(s => s.ID === studentId);
    
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    const { Name, Branch, Year } = req.body;
    
    if (Name !== undefined) student.Name = Name;
    if (Branch !== undefined) student.Branch = Branch;
    if (Year !== undefined) student.Year = Year;
    
    console.log(`[SYS] NODE_UPDATED: ID_${student.ID} -> ${student.Name} [${student.Branch}, ${student.Year}]`);
    res.status(200).json(student);
});

// DELETE /students/:id -> Delete a student
app.delete('/students/:id', (req, res) => {
    const studentId = parseInt(req.params.id);
    const studentIndex = students.findIndex(s => s.ID === studentId);
    
    if (studentIndex === -1) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    const deletedStudent = students.splice(studentIndex, 1)[0];
    console.log(`[SYS] NODE_PURGED: ${deletedStudent.Name} (ID: ${deletedStudent.ID})`);
    res.status(200).json({ message: 'Student deleted successfully', student: deletedStudent });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
