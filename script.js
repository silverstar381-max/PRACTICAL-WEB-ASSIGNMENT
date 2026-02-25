const students = [];

// DOM Elements
const studentForm = document.getElementById("studentForm");
const performanceForm = document.getElementById("performanceForm");
const studentTableBody = document.getElementById("studentTableBody");
const emptyState = document.getElementById("emptyState");
const detailsBox = document.getElementById("detailsBox");
const formMsg = document.getElementById("formMsg");
const perfMsg = document.getElementById("perfMsg");
const searchInput = document.getElementById("searchInput");
const filterForm = document.getElementById("filterForm");

// --- Helper Functions ---

function showMessage(target, text, type) {
    target.textContent = text;
    target.className = `message ${type === "ok" ? "good" : "bad"}`;
    setTimeout(() => { target.className = "message"; }, 4000);
}

function normalizeId(id) { 
    return id.trim().toUpperCase(); 
}

function findStudentById(id) {
    return students.find((s) => s.id === normalizeId(id));
}

function calculateFormAverage(record) {
    const values = Object.values(record.subjects);
    return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateOverallAverage(student) {
    if (!student.performance.length) return null;
    let total = 0, count = 0;
    student.performance.forEach(record => {
        Object.values(record.subjects).forEach(val => {
            total += val;
            count++;
        });
    });
    return count ? total / count : null;
}

// --- Rendering Functions ---

function renderStudents() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const formFilter = filterForm.value;

    const filtered = students.filter(s => {
        const matchesSearch = s.id.toLowerCase().includes(searchTerm) || s.name.toLowerCase().includes(searchTerm);
        const matchesForm = !formFilter || String(s.form) === formFilter;
        return matchesSearch && matchesForm;
    });

    studentTableBody.innerHTML = "";
    filtered.forEach(student => {
        const avg = calculateOverallAverage(student);
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>Form ${student.form}</td>
            <td>${avg === null ? "N/A" : avg.toFixed(1) + "%"}</td>
            <td>
                <div class="actions">
                    <button class="btn-sm btn-ok" onclick="viewStudent('${student.id}')">View</button>
                    <button class="btn-sm" onclick="prefillPerf('${student.id}', ${student.form})">Add Result</button>
                    <button class="btn-sm" onclick="promoteStudent('${student.id}')">Promote</button>
                    <button class="btn-sm btn-danger" onclick="deleteStudent('${student.id}')">Delete</button>
                </div>
            </td>
        `;
        studentTableBody.appendChild(tr);
    });
    emptyState.style.display = filtered.length ? "none" : "block";
}

// --- Interactive Logic ---

window.viewStudent = (id) => {
    const student = findStudentById(id);
    if (!student) return;

    const perfRows = student.performance.map(p => `
        <tr>
            <td>Form ${p.form}</td>
            <td>${p.subjects.math}</td>
            <td>${p.subjects.english}</td>
            <td>${p.subjects.science}</td>
            <td>${p.subjects.social}</td>
            <td>${calculateFormAverage(p).toFixed(1)}%</td>
        </tr>
    `).join("");

    detailsBox.innerHTML = `
        <div style="line-height: 1.6">
            <h3>Student Profile: ${student.name}</h3>
            <p><strong>ID:</strong> ${student.id} | <strong>Gender:</strong> ${student.gender}</p>
            <p><strong>Age:</strong> ${student.age} | <strong>Current Status:</strong> Form ${student.form}</p>
            <hr>
            <h4>Academic Records</h4>
            <table>
                <thead><tr><th>Form</th><th>Math</th><th>Eng</th><th>Sci</th><th>Soc</th><th>Avg</th></tr></thead>
                <tbody>${perfRows || '<tr><td colspan="6" class="muted">No records found for this student.</td></tr>'}</tbody>
            </table>
        </div>
    `;
    detailsBox.className = "card";
};

window.prefillPerf = (id, form) => {
    document.getElementById("perfStudentId").value = id;
    document.getElementById("perfForm").value = form;
    performanceForm.scrollIntoView({ behavior: "smooth" });
};

window.promoteStudent = (id) => {
    const student = findStudentById(id);
    if (student.form < 4) {
        student.form++;
        renderStudents();
        showMessage(formMsg, `${student.name} promoted to Form ${student.form}`, "ok");
    } else {
        alert("Student is already in Form 4 (Final O-Level year).");
    }
};

window.deleteStudent = (id) => {
    if (confirm(`Are you sure you want to delete ${id}?`)) {
        const idx = students.findIndex(s => s.id === id);
        students.splice(idx, 1);
        renderStudents();
        detailsBox.innerHTML = "Select 'View' from the list to see full history.";
        detailsBox.className = "muted";
    }
};

// --- Form Submissions ---

studentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = normalizeId(document.getElementById("studentId").value);
    
    if (findStudentById(id)) {
        return showMessage(formMsg, "Error: Student ID already exists", "bad");
    }

    students.push({
        id,
        name: document.getElementById("name").value,
        gender: document.getElementById("gender").value,
        age: document.getElementById("age").value,
        form: parseInt(document.getElementById("formLevel").value),
        performance: []
    });

    studentForm.reset();
    renderStudents();
    showMessage(formMsg, "Student registered successfully", "ok");
});

performanceForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = normalizeId(document.getElementById("perfStudentId").value);
    const student = findStudentById(id);
    
    if (!student) {
        return showMessage(perfMsg, "Error: Student ID not found", "bad");
    }

    const formVal = parseInt(document.getElementById("perfForm").value);
    const subjects = {
        math: parseInt(document.getElementById("math").value),
        english: parseInt(document.getElementById("english").value),
        science: parseInt(document.getElementById("science").value),
        social: parseInt(document.getElementById("social").value)
    };

    const existingIdx = student.performance.findIndex(p => p.form === formVal);
    if (existingIdx > -1) {
        student.performance[existingIdx].subjects = subjects;
    } else {
        student.performance.push({ form: formVal, subjects });
    }

    performanceForm.reset();
    renderStudents();
    viewStudent(id); // Update details view if open
    showMessage(perfMsg, "Academic results updated", "ok");
});

searchInput.addEventListener("input", renderStudents);
filterForm.addEventListener("change", renderStudents);