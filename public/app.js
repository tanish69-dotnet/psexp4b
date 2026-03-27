const API_URL = '/students';

// State
let isEditing = false;
let currentEditId = null;

// DOM
const recordsContainer = document.getElementById('records-container');
const formModal = document.getElementById('form-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const form = document.getElementById('student-form');
const viewFormTitle = document.getElementById('view-form-title');
const submitBtn = document.getElementById('submit-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const statsCounter = document.getElementById('stats-counter');
const bg = document.getElementById('holographic-bg');
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

// ================= Engine Logistics =================
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('page-loader').classList.add('hidden');
    }, 1200);
});

// Cursor Engine
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
});

function attachInteractions() {
    const targets = document.querySelectorAll('.hover-target');
    targets.forEach(t => {
        t.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        t.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    const sideItems = document.querySelectorAll('.side-nav li');
    sideItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
                sideItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            }
        });
    });
}

function attachTilt(selector) {
    const nodes = document.querySelectorAll(selector);
    nodes.forEach(node => {
        node.addEventListener('mousemove', (e) => {
            const rect = node.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const tiltX = ((y - centerY) / centerY) * -12; 
            const tiltY = ((x - centerX) / centerX) * 12;
            
            node.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
        });
        node.addEventListener('mouseleave', () => {
            node.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });
}

// ================= Core Application Logic =================

function openModal() {
    formModal.classList.add('active');
}

function closeModal() {
    formModal.classList.remove('active');
    setTimeout(() => {
        if(!isEditing) form.reset();
    }, 500);
}

openModalBtn.addEventListener('click', () => {
    resetFormState();
    openModal();
});
closeModalBtn.addEventListener('click', closeModal);

function sysLog(msg, isErr = false) {
    toastMessage.textContent = msg;
    toast.querySelector('.toast-edge').style.background = isErr ? '#ff007f' : '#f8cc46';
    toast.querySelector('.toast-sys').textContent = isErr ? 'ERR: ' : 'SYS: ';
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);

    terminalLog(msg);
}

function terminalLog(msg) {
    const logTerminal = document.getElementById('log-terminal');
    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span>[${time}]</span> ${msg.toUpperCase().replace(/\s/g, '_')}...`;
    logTerminal.appendChild(line);
    logTerminal.scrollTop = logTerminal.scrollHeight;
}

async function fetchStudents() {
    terminalLog('Initiating node synchronization');
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        renderNetwork(data);
        terminalLog('Node synchronization successful');
    } catch (err) {
        console.error(err);
        sysLog('Network transmission failed', true);
    }
}

function renderNetwork(students) {
    recordsContainer.innerHTML = '';
    statsCounter.innerText = `NODES: ${String(students.length).padStart(3, '0')}`;
    
    if(students.length === 0) {
        recordsContainer.innerHTML = `<div class="empty-state">SCANNING PORT... NO DATA FOUND.</div>`;
        return;
    }

    students.forEach((student, i) => {
        const chip = document.createElement('div');
        chip.className = 'data-chip hover-target';
        chip.style.animation = `entranceReveal 0.6s cubic-bezier(0.19, 1, 0.22, 1) ${i * 0.1}s backwards`;
        
        chip.innerHTML = `
            <div class="chip-id">TGT_${String(student.ID).padStart(4, '0')}</div>
            <div class="chip-name">${escapeHTML(student.Name)}</div>
            <div class="chip-metrics">
                <div class="metric">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    <span>${escapeHTML(student.Branch)}</span>
                </div>
                <div class="metric">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    <span>${escapeHTML(student.Year)}</span>
                </div>
            </div>
            <div class="chip-actions">
                <button class="chip-btn edit hover-target" onclick="engageEdit(${student.ID}, '${escapeJS(student.Name)}', '${escapeJS(student.Branch)}', '${escapeJS(student.Year)}')">OVERRIDE</button>
                <button class="chip-btn del hover-target" onclick="purgeNode(${student.ID})">PURGE</button>
            </div>
        `;
        recordsContainer.appendChild(chip);
    });
    
    attachInteractions();
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        Name: document.getElementById('name').value,
        Branch: document.getElementById('branch').value,
        Year: document.getElementById('year').value
    };

    try {
        if(isEditing) {
            await fetch(`${API_URL}/${currentEditId}`, {
                method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
            });
            sysLog('Data node successfully updated.');
        } else {
            await fetch(API_URL, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
            });
            sysLog('New data node instantiated.');
        }
        closeModal();
        fetchStudents();
    } catch(err) {
        sysLog('Database handshake failed.', true);
    }
});

window.purgeNode = async (id) => {
    if(!confirm('AUTHORIZATION REQUIRED: Permanently purge this node?')) return;
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        sysLog('Node eradicated from registry.', true);
        fetchStudents();
    } catch (err) {
        sysLog('Purge failed.', true);
    }
};

window.engageEdit = (id, name, branch, year) => {
    isEditing = true;
    currentEditId = id;
    
    document.getElementById('name').value = name;
    document.getElementById('branch').value = branch;
    document.getElementById('year').value = year;
    
    // trigger validity pseudo-classes dynamically if necessary, here they are triggered by values
    viewFormTitle.innerText = 'OVERRIDE_NODE';
    submitBtn.innerHTML = '<span>UPLOAD PATCH</span>';
    
    openModal();
};

function resetFormState() {
    isEditing = false;
    currentEditId = null;
    form.reset();
    viewFormTitle.innerText = 'ADD_NODE';
    submitBtn.innerHTML = '<span>ESTABLISH LINK</span>';
}

function escapeHTML(s) {
    return s.replace(/[&<>'"]/g, t => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]));
}
function escapeJS(s) {
    return s.replace(/'/g, "\\'");
}

// Initial Call
attachInteractions();
fetchStudents();

// Entrance Animation Keyframe addition for cards dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes entranceReveal {
        0% { opacity: 0; transform: scale(0.8) translateY(50px); filter: blur(10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
    }
`;
document.head.appendChild(style);
