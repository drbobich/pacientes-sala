// js/app.js
// Lógica de la interfaz (sin bloqueo)

document.addEventListener("DOMContentLoaded", () => {

  const addBtn = document.getElementById("addPatientBtn");
  const searchInput = document.getElementById("searchInput");
  const closeFormBtn = document.getElementById("closeFormBtn");
  const saveBtn = document.getElementById("savePatientBtn");
  const formOverlay = document.getElementById("formOverlay");
  const slideForm = document.getElementById("slideForm");

  addBtn.addEventListener("click", () => {
    formOverlay.classList.add("active");
    slideForm.classList.add("active");
    document.getElementById("camaInput").focus();
  });

  function cerrarFormulario() {
    formOverlay.classList.remove("active");
    slideForm.classList.remove("active");
    limpiarFormulario();
  }
  closeFormBtn.addEventListener("click", cerrarFormulario);
  formOverlay.addEventListener("click", cerrarFormulario);

  saveBtn.addEventListener("click", async () => {
    const cama = document.getElementById("camaInput").value.trim();
    const nombre = document.getElementById("nombreInput").value.trim();
    const diagnostico = document.getElementById("diagInput").value.trim();

    if (!cama || !nombre || !diagnostico) {
      alert("Completa al menos: cama, nombre y diagnóstico.");
      return;
    }

    const nuevoPaciente = {
      cama: parseInt(cama) || cama,
      nombre: nombre,
      diagnostico: diagnostico,
      observaciones: document.getElementById("obsInput").value.trim(),
      medico: document.getElementById("medInput").value.trim(),
      alergias: document.getElementById("alerInput").value.trim(),
      fechaIngreso: new Date().toISOString()
    };

    await guardarPaciente(nuevoPaciente);
    cerrarFormulario();
    cargarListaPacientes();
  });

  searchInput.addEventListener("input", (e) => {
    buscarYMostrarPacientes(e.target.value);
  });

  // Carga inicial
  cargarListaPacientes();
});

function limpiarFormulario() {
  document.getElementById("camaInput").value = "";
  document.getElementById("nombreInput").value = "";
  document.getElementById("diagInput").value = "";
  document.getElementById("obsInput").value = "";
  document.getElementById("medInput").value = "";
  document.getElementById("alerInput").value = "";
}

async function cargarListaPacientes(filtro = "") {
  const lista = document.getElementById("patientList");
  const contador = document.getElementById("patientCount");

  let pacientes;
  if (filtro) {
    pacientes = await buscarPacientes(filtro);
  } else {
    pacientes = await obtenerPacientes();
  }

  contador.textContent = pacientes.length;

  if (pacientes.length === 0) {
    lista.innerHTML = `
      <div class="empty-state">
        <p>📋 No hay pacientes ingresados.</p>
        <p style="font-size:0.9rem; margin-top:0.5rem;">Usa el botón + para añadir el primero.</p>
      </div>`;
    return;
  }

  lista.innerHTML = pacientes.map(p => `
    <div class="patient-card" data-id="${p.id}">
      <div class="bed-number">${p.cama}</div>
      <div class="info">
        <div class="patient-name">${p.nombre}</div>
        <div class="diagnosis-preview">${p.diagnostico}</div>
      </div>
      <div class="alert-dot" style="background: ${p.alergias ? '#e63946' : '#2a9d8f'};" title="${p.alergias ? 'Tiene alergias' : 'Sin alergias'}"></div>
    </div>
  `).join("");

  document.querySelectorAll(".patient-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = parseInt(card.getAttribute("data-id"));
      mostrarDetallePaciente(id);
    });
  });
}

async function mostrarDetallePaciente(id) {
  const pacientes = await obtenerPacientes();
  const p = pacientes.find(pac => pac.id === id);
  if (!p) return;

  const modalHTML = `
    <div class="overlay active" id="modalOverlay" style="z-index:350;"></div>
    <div class="modal active" id="detalleModal">
      <h3>🛏️ Cama ${p.cama} — ${p.nombre}</h3>
      <p><strong>Diagnóstico:</strong> ${p.diagnostico}</p>
      <p><strong>Fecha ingreso:</strong> ${new Date(p.fechaIngreso).toLocaleString()}</p>
      <p><strong>Observaciones:</strong> ${p.observaciones || "—"}</p>
      <p><strong>Médico:</strong> ${p.medico || "—"}</p>
      <p><strong>Alergias:</strong> ${p.alergias || "—"}</p>
      <div class="modal-btns">
        <button class="btn-delete" id="btnEliminar">Eliminar paciente</button>
        <button class="btn-close-modal" id="btnCerrarModal">Cerrar</button>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  document.getElementById("btnCerrarModal").addEventListener("click", cerrarModal);
  document.getElementById("modalOverlay").addEventListener("click", cerrarModal);
  document.getElementById("btnEliminar").addEventListener("click", async () => {
    if (confirm("¿Estás seguro de eliminar a este paciente?")) {
      await eliminarPaciente(id);
      cerrarModal();
      cargarListaPacientes();
    }
  });
}

function cerrarModal() {
  const overlay = document.getElementById("modalOverlay");
  const modal = document.getElementById("detalleModal");
  if (overlay) overlay.remove();
  if (modal) modal.remove();
}

async function buscarYMostrarPacientes(termino) {
  cargarListaPacientes(termino);
}
