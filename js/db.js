// js/db.js
// Base de datos local cifrada (clave fija, sin PIN)

const CLAVE_CIFRADO = "MiClaveSecreta2024"; // Cámbiala por una frase larga y segura

const db = new Dexie("PacientesDB");
db.version(1).stores({
  pacientes: "++id, cama, fechaIngreso"
});

function cifrar(datos) {
  return CryptoJS.AES.encrypt(JSON.stringify(datos), CLAVE_CIFRADO).toString();
}

function descifrar(textoCifrado) {
  const bytes = CryptoJS.AES.decrypt(textoCifrado, CLAVE_CIFRADO);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

async function guardarPaciente(paciente) {
  const datosSensibles = {
    nombre: paciente.nombre,
    diagnostico: paciente.diagnostico,
    observaciones: paciente.observaciones || "",
    medico: paciente.medico || "",
    alergias: paciente.alergias || ""
  };
  const blobCifrado = cifrar(datosSensibles);
  const registro = {
    cama: paciente.cama,
    fechaIngreso: paciente.fechaIngreso || new Date().toISOString(),
    datosCifrados: blobCifrado
  };

  if (paciente.id) {
    return db.pacientes.update(paciente.id, registro);
  } else {
    return db.pacientes.add(registro);
  }
}

async function obtenerPacientes() {
  const todos = await db.pacientes.toArray();
  return todos.map(p => {
    try {
      const datos = descifrar(p.datosCifrados);
      return {
        id: p.id,
        cama: p.cama,
        fechaIngreso: p.fechaIngreso,
        nombre: datos.nombre,
        diagnostico: datos.diagnostico,
        observaciones: datos.observaciones,
        medico: datos.medico,
        alergias: datos.alergias
      };
    } catch (e) {
      console.error("Error al descifrar paciente", p.id, e);
      return null;
    }
  }).filter(p => p !== null);
}

async function eliminarPaciente(id) {
  return db.pacientes.delete(id);
}

async function buscarPacientes(texto) {
  const todos = await obtenerPacientes();
  if (!texto) return todos;
  const termino = texto.toLowerCase();
  return todos.filter(p =>
    p.nombre.toLowerCase().includes(termino) ||
    p.diagnostico.toLowerCase().includes(termino) ||
    p.cama.toString().includes(termino)
  );
}
