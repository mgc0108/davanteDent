class Cita {
    constructor(id, dia, mes, anio, hora, minuto, nombre, dni, apellidos, telefono, fechaNacimiento, observaciones) {
        this.id = id;
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
    getFechaCompleta() {
        const h = String(this.hora).padStart(2, '0');
        const m = String(this.minuto).padStart(2, '0');
        return `${this.dia}/${this.mes}/${this.anio} ${h}:${m}`;
    }
}
const COOKIE_NAME = 'davantedent_citas';
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
function saveCitasToCookie(citasArray) {
    const jsonString = JSON.stringify(citasArray);
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = `${COOKIE_NAME}=${jsonString}${expires}; path=/`;
}
function validarHorario(dia, mes, anio, hora, minuto) {
    const fechaActual = new Date();
    const fechaCita = new Date(anio, mes - 1, dia, hora, minuto, 0, 0);
    const diaSemana = fechaCita.getDay();
    if (fechaCita.getTime() < fechaActual.getTime()) {
        return { valido: false, mensaje: 'La cita debe ser en el futuro.' };
    }
    if (diaSemana === 0 || diaSemana === 6) {
        return { valido: false, mensaje: 'No se puede reservar citas los Sábados ni Domingos.' };
    }
    const horaTotalMinutos = hora * 60 + minuto;
    const APERTURA_MANANA = 9 * 60;
    const CIERRE_MANANA = 14 * 60;
    const APERTURA_TARDE = 16 * 60;
    const CIERRE_TARDE = 20 * 60;
    const esMananaValida = (horaTotalMinutos >= APERTURA_MANANA && horaTotalMinutos < CIERRE_MANANA);
    const esTardeValida = (horaTotalMinutos >= APERTURA_TARDE && horaTotalMinutos < CIERRE_TARDE);
    if (esMananaValida || esTardeValida) {
        return { valido: true };
    } else {
        return { valido: false, mensaje: 'Horario no disponible. El horario es L-V: 9:00-14:00 y 16:00-20:00.' };
    }
}
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
function limpiarErrores() {
    const campos = ['fechaDia', 'fechaMes', 'fechaAnio', 'fechaHora', 'fechaMinuto', 'nombre', 'dni', 'apellidos', 'telefono', 'fechaNacimiento'];
    campos.forEach(id => mostrarError(id, ''));
}
function validarFormulario(datos) {
    let esValido = true;
    limpiarErrores();
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
    if (!/^\d{9}$/.test(datos.telefono)) {
        mostrarError('telefono', 'El teléfono debe contener exactamente 9 dígitos numéricos.');
        esValido = false;
    }
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
    if (isNaN(hora) || hora < 0 || hora > 23 || isNaN(minuto) || minuto < 0 || minuto > 59) {
        mostrarError('fechaHora', 'Hora o minuto inválido.');
        esValido = false;
    }
    if (esValido) {
        const resultadoHorario = validarHorario(dia, mes, anio, hora, minuto);
        if (!resultadoHorario.valido) {
            mostrarError('fechaDia', resultadoHorario.mensaje); 
            esValido = false;
        }
    }
    return esValido;
}
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
function limpiarFormulario() {
    document.getElementById('citaForm').reset();
    document.getElementById('citaId').value = '';
    document.getElementById('guardarCitaBtn').textContent = 'Guardar Cita';
    limpiarErrores();
}
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
function guardarCita(datos) {
    let citas = getCitasFromCookie();
    const nuevaCita = new Cita(
        datos.id, datos.dia, datos.mes, datos.anio, datos.hora, datos.minuto,
        datos.nombre, datos.dni, datos.apellidos, datos.telefono, datos.fechaNacimiento, datos.observaciones
    );
    const indiceExistente = citas.findIndex(c => c.id == nuevaCita.id);
    if (indiceExistente !== -1) {
        citas[indiceExistente] = nuevaCita;
    } else {
        citas.push(nuevaCita);
    }
    citas.sort((a, b) => {
        const dateA = new Date(a.anio, a.mes - 1, a.dia, a.hora, a.minuto);
        const dateB = new Date(b.anio, b.mes - 1, b.dia, b.hora, b.minuto);
        return dateA - dateB;
    });
    saveCitasToCookie(citas);
    cargarCitasInicial();
    limpiarFormulario();
}
function generarFilaCita(cita, index) {
    const row = document.createElement('tr');
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
function cargarCitasInicial() {
    const citas = getCitasFromCookie();
    const citasBody = document.getElementById('citasBody');
    citasBody.innerHTML = '';
    if (citas.length === 0) {
        citasBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No hay citas programadas.</td></tr>';
        return;
    }
    citas.forEach((cita, index) => {
        citasBody.appendChild(generarFilaCita(cita, index));
    });
}
function eliminarCita(citaId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta cita?')) {
        let citas = getCitasFromCookie();
        citas = citas.filter(c => c.id != citaId);
        saveCitasToCookie(citas);
        cargarCitasInicial();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const citaForm = document.getElementById('citaForm');
    if (citaForm) {
        citaForm.addEventListener('submit', function (event) {
            event.preventDefault();
            
            const datos = obtenerDatosFormulario();
            
            if (validarFormulario(datos)) {
                guardarCita(datos);
            }
        });
    }
    const limpiarBtn = document.getElementById('limpiarFormularioBtn');
    if (limpiarBtn) {
        limpiarBtn.addEventListener('click', limpiarFormulario);
    } else {
        const genericLimpiarBtn = document.querySelector('#formulario-citas button[type="button"]');
        if (genericLimpiarBtn) {
        genericLimpiarBtn.addEventListener('click', limpiarFormulario);
        }
    }
    cargarCitasInicial();
});