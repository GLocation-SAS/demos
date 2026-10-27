/*
 * Datos ficticios del demo. Todo es inventado: personas, correos, equipos y préstamos.
 * No hay datos reales de la empresa ni de sus empleados. Nada se guarda ni se envía.
 * "Hoy" simulado: jueves 2026-11-12, 09:40 (los criterios CA-001-nn usan estas fechas de ejemplo).
 */
window.DATOS = {
  hoy: "2026-11-12",
  hora: "09:40",
  marca: "Préstamo de equipos",
  // Máximo de días del préstamo: parámetro configurable. Valor de EJEMPLO (D-18, propuesta de Grace): 5 días hábiles (lunes a viernes).
  maxDias: 5,

  roles: {
    empleado: { nombre: "Empleado", persona: "p1" },
    recepcion: { nombre: "Recepción", persona: "r1" },
    jefe: { nombre: "Jefe administrativo", persona: "j1" },
    externa: { nombre: "Persona externa (sin acceso)", persona: null }
  },

  // De cada persona solo se guardan el nombre y el correo de la empresa (RN-17, acta F-04).
  personas: {
    p1: { nombre: "Laura Beltrán Cifuentes", correo: "laura.beltran@empresa.example" },
    p2: { nombre: "Sebastián Quiceno Arango", correo: "sebastian.quiceno@empresa.example" },
    p3: { nombre: "Paola Andrea Ríos Salazar", correo: "paola.rios@empresa.example" },
    p4: { nombre: "Camilo Andrés Ortiz Beltrán", correo: "camilo.ortiz@empresa.example" },
    p5: { nombre: "María Fernanda Castaño Londoño", correo: "maria.castano@empresa.example" },
    p6: { nombre: "Juan Sebastián Hoyos Valencia", correo: "juan.hoyos@empresa.example" },
    r1: { nombre: "Diana Marcela Gutiérrez Pardo", correo: "diana.gutierrez@empresa.example" },
    j1: { nombre: "Hernán Darío Vélez Montoya", correo: "hernan.velez@empresa.example" }
  },

  // tipo: portatil | videobeam. Incluye un nombre muy largo.
  equipos: [
    { id: "P01", tipo: "portatil", nombre: "Portátil 01" },
    { id: "P02", tipo: "portatil", nombre: "Portátil 02" },
    { id: "P03", tipo: "portatil", nombre: "Portátil 03" },
    { id: "P04", tipo: "portatil", nombre: "Portátil 04" },
    { id: "P05", tipo: "portatil", nombre: "Portátil 05" },
    { id: "P06", tipo: "portatil", nombre: "Portátil 06" },
    { id: "V01", tipo: "videobeam", nombre: "Videobeam 01" },
    { id: "V02", tipo: "videobeam", nombre: "Videobeam 02" },
    { id: "V03", tipo: "videobeam", nombre: "Videobeam 03 de alta luminosidad, con control remoto, cable HDMI y maletín de transporte" }
  ],

  // Solicitudes y préstamos. estado: pendiente | aprobada | rechazada | entregada | devuelta
  // desde / hasta = día de inicio y día de devolución prevista. Cubren todos los casos de los criterios.
  prestamos: [
    { id: "L-101", equipo: "P01", persona: "p2", desde: "2026-11-11", hasta: "2026-11-13", estado: "entregada", entrega: "2026-11-11", horaEntrega: "09:15" },
    { id: "L-102", equipo: "P03", persona: "p3", desde: "2026-11-12", hasta: "2026-11-13", estado: "aprobada" },
    { id: "L-103", equipo: "P03", persona: "p4", desde: "2026-11-13", hasta: "2026-11-14", estado: "pendiente" },
    { id: "L-104", equipo: "V01", persona: "p1", desde: "2026-11-12", hasta: "2026-11-14", estado: "aprobada" },
    { id: "L-105", equipo: "P04", persona: "p1", desde: "2026-11-09", hasta: "2026-11-11", estado: "entregada", entrega: "2026-11-09", horaEntrega: "10:20" },
    { id: "L-106", equipo: "P05", persona: "p4", desde: "2026-11-06", hasta: "2026-11-09", estado: "entregada", entrega: "2026-11-06", horaEntrega: "16:00" },
    { id: "L-107", equipo: "V03", persona: "p5", desde: "2026-11-09", hasta: "2026-11-10", estado: "entregada", entrega: "2026-11-09", horaEntrega: "11:30" },
    { id: "L-108", equipo: "V02", persona: "p6", desde: "2026-11-12", hasta: "2026-11-12", estado: "entregada", entrega: "2026-11-12", horaEntrega: "08:30" },
    { id: "L-109", equipo: "P02", persona: "p5", desde: "2026-11-16", hasta: "2026-11-17", estado: "pendiente" },
    { id: "L-110", equipo: "P06", persona: "p1", desde: "2026-11-16", hasta: "2026-11-17", estado: "pendiente" },
    { id: "L-111", equipo: "P02", persona: "p1", desde: "2026-11-12", hasta: "2026-11-13", estado: "rechazada", motivo: "El equipo está reservado para una capacitación" },
    { id: "L-112", equipo: "P06", persona: "p1", desde: "2026-11-02", hasta: "2026-11-03", estado: "devuelta", entrega: "2026-11-02", devolucion: "2026-11-03" },
    { id: "L-113", equipo: "P06", persona: "p3", desde: "2026-11-04", hasta: "2026-11-06", estado: "devuelta", entrega: "2026-11-04", devolucion: "2026-11-09" }
  ],

  // Préstamos entregados antes de los que figuran arriba (acumulado de ejemplo para el resumen del jefe).
  historialPrevio: { P01: 10, V01: 9, P02: 8, P05: 7, V02: 6, P03: 5, P04: 4, V03: 3, P06: 2 },

  // Mensajes: los de los criterios van tal cual (CA-001-nn); el resto son [propuesta] (ver mapa.md).
  textos: {
    // De los criterios
    equipoNoDisponible: "El equipo no está disponible en esas fechas",            // CA-001-08
    inicioAnterior: "La fecha de inicio no puede ser anterior a hoy",               // CA-001-09
    devolucionAnterior: "La fecha de devolución no puede ser anterior a la de inicio", // CA-001-10
    faltaFechas: "Indica el día de inicio y el día de devolución",                  // CA-001-11
    maximoDias: "El préstamo no puede pasar de {N} días",                           // CA-001-35
    pendiente: "pendiente de aprobación",                                           // CA-001-07
    faltaMotivo: "Indica el motivo del rechazo",                                    // CA-001-15
    equipoYaPrestado: "El equipo ya está prestado en esas fechas",                  // CA-001-16
    yaResuelta: "Esta solicitud ya fue resuelta",                                   // CA-001-17
    soloAprobado: "Solo se puede entregar un equipo con préstamo aprobado",         // CA-001-20
    sinEntrega: "Este préstamo no tiene una entrega registrada",                    // CA-001-23
    recordatorio: "Tu préstamo del {EQUIPO} venció el {FECHA}. Devuélvelo en recepción.", // CA-001-25
    sinVencidos: "No hay préstamos vencidos",                                       // CA-001-33
    // [propuesta]
    errorCarga: "No se pudo cargar la información. Intenta de nuevo.",
    sinAccesoExterna: "Esta aplicación es solo para personas de la empresa.",
    sinAccesoRecepcion: "Solo recepción puede hacer esto.",
    sinAccesoJefe: "Solo el jefe administrativo puede ver este resumen.",
    sinEquipos: "No hay equipos para mostrar.",
    sinSolicitudes: "Todavía no has pedido ningún equipo.",
    sinPorResolver: "No hay solicitudes por resolver.",
    sinPorEntregar: "No hay entregas pendientes.",
    sinPorDevolver: "No hay equipos prestados.",
    sinRecordatorio: "No tienes préstamos vencidos. Gracias por devolver a tiempo.",
    sinResumen: "Todavía no hay préstamos para mostrar."
  }
};
