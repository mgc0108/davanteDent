class Cita {
    // Clase que representa una cita individual
    // Encapsula datos y provee métodos útiles como formatear la fecha
    constructor(id, dia, mes, anio, hora, minuto, nombre, dni, apellidos, telefono, fechaNacimiento, observaciones) {
        this.id = id; // ID único para identificar/editar citas
        this.dia = dia;
        this.mes = mes;
        this.anio = anio;
        this.hora = hora;
        this.minuto = minuto;
        this.nombre = nombre;
        this.dni = dni;
        this.apellidos = apellidos;
        this.telefono = telefono;
        this.fechaNacimiento = fechaNacimiento;
        this.observaciones = observaciones;
    }
    // Devuelve fecha formateada para mostrar en la tabla
    getFechaCompleta() {
        const h = String(this.hora).padStart(2, '0');
        const m = String(this.minuto).padStart(2, '0');
        return `${this.dia}/${this.mes}/${this.anio} ${h}:${m}`;
    }
}
// Nombre único para almacenar los datos en cookies
const COOKIE_NAME = 'davantedent_citas';
// Obtiene citas almacenadas en la cookie y las transforma en objetos Cita
function getCitasFromCookie() {
    const nameEQ = COOKIE_NAME + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            const jsonString = c.substring(nameEQ.length, c.length);
            try {
                const citasArray = JSON.parse(jsonString);
                // Reconstrucción de instancias de Cita
                return citasArray.map(obj => new Cita(
                    obj.id, obj.dia, obj.mes, obj.anio, obj.hora, obj.minuto,
                    obj.nombre, obj.dni, obj.apellidos, obj.telefono, obj.fechaNacimiento, obj.observaciones
                ));
            } catch (e) {
                console.error("Error al parsear JSON de la cookie:", e);
                return [];
            }
        }
    }
    return [];
}
// Guarda el array de citas en una cookie persistente (1 año)
function saveCitasToCookie(citasArray) {
    const jsonString = JSON.stringify(citasArray);
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000)); // +1 año
    const expires = "; expires=" + date.toUTCString();
    document.cookie = `${COOKIE_NAME}=${jsonString}${expires}; path=/`;
}
// Valida fecha y hora según norma de la clínica (laborables 9-14 y 16-20)
function validarHorario(dia, mes, anio, hora, minuto) {
    const fechaActual = new Date();
    const fechaCita = new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
    const diaSemana = fechaCita.getDay();
    // No permitir citas en el pasado
    if (fechaCita.getTime() < fechaActual.getTime()) {
        return { valido: false, mensaje: 'La cita debe ser en el futuro.' };
    }
    // Bloqueo fines de semana
    if (diaSemana === 0 || diaSemana === 6) {
        return { valido: false, mensaje: 'No se puede reservar citas los Sábados ni Domingos.' };
    }
    const horaTotalMinutos = hora * 60 + minuto;
    const APERTURA_MANANA = 9 * 60; // Franja mañana
    const CIERRE_MANANA = 14 * 60; // Franja mañana
    const APERTURA_TARDE = 16 * 60; // Franja tarde
    const CIERRE_TARDE = 20 * 60; // Franja tarde
    const esMananaValida = (horaTotalMinutos >= APERTURA_MANANA && horaTotalMinutos < CIERRE_MANANA);
    const esTardeValida = (horaTotalMinutos >= APERTURA_TARDE && horaTotalMinutos < CIERRE_TARDE);
    if (esMananaValida || esTardeValida) {
        return { valido: true };
    } else {
        return { valido: false, mensaje: 'Horario no disponible. El horario es L-V: 9:00-14:00 y 16:00-20:00.' };
    }
}
// Muestra mensajes de error en inputs basado en su ID
function mostrarError(inputId, message) {
    const inputElement = document.getElementById(inputId);
    const errorElement = document.getElementById('error' + inputId.charAt(0).toUpperCase() + inputId.slice(1));
    if (inputElement) {
        if (message) {
            inputElement.classList.add('error-input');
        } else {
            inputElement.classList.remove('error-input');
        }
    }
    // Trato especial para inputs de fecha
    if (inputId.startsWith('fecha')) {
        const inputFechaDia = document.getElementById('fechaDia');
        if (inputFechaDia) {
            if (message) inputFechaDia.classList.add('error-input');
            else inputFechaDia.classList.remove('error-input');
        }
    }
    if (errorElement) {
        if (message) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
}
// Limpia todos los errores visibles
function limpiarErrores() {
    const campos = ['fechaDia', 'fechaMes', 'fechaAnio', 'fechaHora', 'fechaMinuto', 'nombre', 'dni', 'apellidos', 'telefono', 'fechaNacimiento'];
    campos.forEach(id => mostrarError(id, ''));
}
// Validación completa del formulario antes de guardar
function validarFormulario(datos) {
    let esValido = true;
    limpiarErrores();
    // Validación fecha nacimiento
    if (!datos.fechaNacimiento.trim()) {
        mostrarError('fechaNacimiento', 'La fecha de nacimiento es obligatoria.');
        esValido = false;
    } else {
        const fechaNac = new Date(datos.fechaNacimiento);
        if (isNaN(fechaNac.getTime())) {
            mostrarError('fechaNacimiento', 'Formato de fecha de nacimiento incorrecto.');
            esValido = false;
        } else if (fechaNac > new Date()) {
            mostrarError('fechaNacimiento', 'La fecha de nacimiento no puede ser futura.');
            esValido = false;
        }
    }
    // Teléfono español estándar (9 dígitos)
    if (!/^\d{9}$/.test(datos.telefono)) {
        mostrarError('telefono', 'El teléfono debe contener exactamente 9 dígitos numéricos.');
        esValido = false;
    }
    // Formato general de DNI
    if (!/^\d{8}[A-Za-z]$/.test(datos.dni)) {
        mostrarError('dni', 'El DNI debe tener 8 números y una letra.');
        esValido = false;
    }
    if (!datos.nombre.trim()) { mostrarError('nombre', 'El nombre es obligatorio.'); esValido = false; }
    if (!datos.apellidos.trim()) { mostrarError('apellidos', 'Los apellidos son obligatorios.'); esValido = false; }
    const dia = parseInt(datos.dia);
    const mes = parseInt(datos.mes);
    const anio = parseInt(datos.anio);
    const hora = parseInt(datos.hora);
    const minuto = parseInt(datos.minuto);
    // Validación fecha básica
    if (isNaN(dia) || dia < 1 || dia > 31 || isNaN(mes) || mes < 1 || mes > 12 || isNaN(anio) || anio < 2025) {
        mostrarError('fechaDia', 'Fecha inválida. Revisa día, mes y año.');
        esValido = false;
    } else {
        const diasEnMes = new Date(anio, mes, 0).getDate();
        if (dia > diasEnMes) {
            mostrarError('fechaDia', `El mes ${mes} del año ${anio} solo tiene ${diasEnMes} días.`);
            esValido = false;
        }
    }
    // Validación hora
    if (isNaN(hora) || hora < 0 || hora > 23 || isNaN(minuto) || minuto < 0 || minuto > 59) {
        mostrarError('fechaHora', 'Hora o minuto inválido.');
        esValido = false;
    }
    // Validación del horario comercial
    if (esValido) {
        const resultadoHorario = validarHorario(dia, mes, anio, hora, minuto);
        if (!resultadoHorario.valido) {
            mostrarError('fechaDia', resultadoHorario.mensaje); 
            esValido = false;
        }
    }
    return esValido;
}
// Obtiene todos los valores actuales del formulario
function obtenerDatosFormulario() {
    return {
        id: document.getElementById('citaId').value || new Date().getTime().toString(),
        dia: document.getElementById('fechaDia').value,
        mes: document.getElementById('fechaMes').value,
        anio: document.getElementById('fechaAnio').value,
        hora: document.getElementById('fechaHora').value,
        minuto: document.getElementById('fechaMinuto').value,
        nombre: document.getElementById('nombre').value.trim(),
        dni: document.getElementById('dni').value.trim(),
        apellidos: document.getElementById('apellidos').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        fechaNacimiento: document.getElementById('fechaNacimiento').value,
        observaciones: document.getElementById('observaciones').value.trim()
    };
}
// Resetea el formulario a estado "nuevo"
function limpiarFormulario() {
    document.getElementById('citaForm').reset();
    document.getElementById('citaId').value = '';
    document.getElementById('guardarCitaBtn').textContent = 'Guardar Cita';
    limpiarErrores();
}
// Carga una cita previamente guardada en el formulario para edición
function cargarCitaParaModificar(citaId) {
    const citas = getCitasFromCookie();
    const cita = citas.find(c => c.id == citaId);
    if (cita) {
        document.getElementById('citaId').value = cita.id;
        document.getElementById('fechaDia').value = cita.dia;
        document.getElementById('fechaMes').value = cita.mes;
        document.getElementById('fechaAnio').value = cita.anio;
        document.getElementById('fechaHora').value = cita.hora;
        document.getElementById('fechaMinuto').value = cita.minuto;
        document.getElementById('nombre').value = cita.nombre;
        document.getElementById('dni').value = cita.dni;
        document.getElementById('apellidos').value = cita.apellidos;
        document.getElementById('telefono').value = cita.telefono;
        document.getElementById('fechaNacimiento').value = cita.fechaNacimiento;
        document.getElementById('observaciones').value = cita.observaciones;
        document.getElementById('guardarCitaBtn').textContent = 'Modificar Cita';
        limpiarErrores();
    }
}
// Guarda una cita nueva o actualiza una existente
function guardarCita(datos) {
    // Obtiene todas las citas almacenadas (persistencia en cookie)
    let citas = getCitasFromCookie();
    // Crea un objeto Cita a partir de los datos del formulario
    const nuevaCita = new Cita(
        datos.id, datos.dia, datos.mes, datos.anio, datos.hora, datos.minuto,
        datos.nombre, datos.dni, datos.apellidos, datos.telefono, datos.fechaNacimiento, datos.observaciones
    );
    // Si la cita ya existe (mismo ID), se reemplaza; si no, se añade como nueva
    const indiceExistente = citas.findIndex(c => c.id == nuevaCita.id);
    if (indiceExistente !== -1) {
        citas[indiceExistente] = nuevaCita;
    } else {
        citas.push(nuevaCita);
    }
    // Ordena las citas por fecha/hora para mantener la tabla siempre organizada
    citas.sort((a, b) => {
        const dateA = new Date(a.anio, a.mes - 1, a.dia, a.hora, a.minuto);
        const dateB = new Date(b.anio, b.mes - 1, b.dia, b.hora, b.minuto);
        return dateA - dateB;
    });
    // Guarda las citas actualizadas y refresca la interfaz
    saveCitasToCookie(citas);
    cargarCitasInicial();
    limpiarFormulario();
}
// Genera el elemento <tr> correspondiente a una cita para insertarlo en la tabla
function generarFilaCita(cita, index) {
    const row = document.createElement('tr');
    // Inserta la fila completa usando template strings
    row.innerHTML = `
        <td data-label="Orden">${index + 1}</td>
        <td data-label="Fecha y Hora">${cita.getFechaCompleta()}</td>
        <td data-label="Nombre">${cita.nombre} ${cita.apellidos}</td>
        <td data-label="DNI">${cita.dni}</td>
        <td data-label="Teléfono">${cita.telefono}</td>
        <td data-label="Acciones">
            <button class="btn-modificar" onclick="cargarCitaParaModificar('${cita.id}')">Modificar</button>
            <button class="btn-eliminar" onclick="eliminarCita('${cita.id}')">Eliminar</button>
        </td>
    `;
    return row;
}
// Carga todas las citas al iniciar la página o tras actualizar una
function cargarCitasInicial() {
    const citas = getCitasFromCookie();
    const citasBody = document.getElementById('citasBody');
    // Limpia la tabla antes de rellenarla
    citasBody.innerHTML = '';
    // Mensaje visible cuando no existen citas
    if (citas.length === 0) {
        citasBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No hay citas programadas.</td></tr>';
        return;
    }
    // Genera una fila por cada cita
    citas.forEach((cita, index) => {
        citasBody.appendChild(generarFilaCita(cita, index));
    });
}
// Elimina una cita por ID después de confirmar la acción
function eliminarCita(citaId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
        // Filtra la cita a eliminar
        let citas = getCitasFromCookie();
        citas = citas.filter(c => c.id != citaId);
        saveCitasToCookie(citas);
        cargarCitasInicial();
    }
}
// Inicializa eventos y carga las citas al abrir la página
document.addEventListener('DOMContentLoaded', () => {
    const citaForm = document.getElementById('citaForm');
    // Maneja el envío del formulario (crear/modificar cita)
    if (citaForm) {
        citaForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const datos = obtenerDatosFormulario();
            // Solo guarda si la validación es correcta
            if (validarFormulario(datos)) {
                guardarCita(datos);
            }
        });
    }
    // Maneja el botón de limpiar (si existe uno explícito o un botón genérico)
    const limpiarBtn = document.getElementById('limpiarFormularioBtn');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarFormulario);
    } else {
        const genericLimpiarBtn = document.querySelector('#formulario-citas button[type="button"]');
        if (genericLimpiarBtn) {
        genericLimpiarBtn.addEventListener('click', limpiarFormulario);
        }
    }
    // Carga inicial de citas
    cargarCitasInicial();
});