/*
 * Datos ficticios del demo. Todo es inventado: personas, equipos, códigos y préstamos.
 * No hay datos reales de la empresa ni de sus empleados. Nada se guarda ni se envía.
 * "Hoy" simulado: lunes 2026-10-26, 09:40.
 */
window.DATOS = {
  hoy: "2026-10-26",
  hora: "09:40",
  marca: "Préstamo de equipos",

  roles: {
    empleado: { nombre: "Empleado", persona: "p1", detalle: "Consulta equipos y pide préstamos" },
    recepcion: { nombre: "Recepción", persona: "r1", detalle: "Aprueba o rechaza, registra entregas y devoluciones" },
    jefe: { nombre: "Jefe administrativo", persona: "j1", detalle: "Ve el resumen de préstamos" }
  },

  personas: {
    p1: { nombre: "Laura Beltrán Cifuentes" },
    p2: { nombre: "Sebastián Quiceno Arango" },
    p3: { nombre: "Paola Andrea Ríos Salazar" },
    p4: { nombre: "Camilo Andrés Ortiz Beltrán" },
    p5: { nombre: "María Fernanda Castaño Londoño" },
    p6: { nombre: "Juan Sebastián Hoyos Valencia" },
    p7: { nombre: "Valentina Mejía Restrepo" },
    r1: { nombre: "Diana Marcela Gutiérrez Pardo" },
    j1: { nombre: "Hernán Darío Vélez Montoya" }
  },

  // tipo: portatil | videobeam. Casos: disponibles, prestados a tiempo, prestados vencidos y un nombre muy largo.
  equipos: [
    { id: "P-01", tipo: "portatil", nombre: "Portátil 14\u2033 P-01" },
    { id: "P-02", tipo: "portatil", nombre: "Portátil 14\u2033 P-02" },
    { id: "P-03", tipo: "portatil", nombre: "Portátil 14\u2033 P-03" },
    { id: "P-04", tipo: "portatil", nombre: "Portátil 14\u2033 P-04" },
    { id: "P-05", tipo: "portatil", nombre: "Portátil 15\u2033 P-05" },
    { id: "P-06", tipo: "portatil", nombre: "Portátil 15\u2033 P-06" },
    { id: "V-01", tipo: "videobeam", nombre: "Videobeam V-01" },
    { id: "V-02", tipo: "videobeam", nombre: "Videobeam V-02" },
    { id: "V-03", tipo: "videobeam", nombre: "Videobeam de alta luminosidad con control remoto, cable HDMI y maletín de transporte V-03" }
  ],

  // Préstamos en curso (entregados y sin devolver). vence = último día del préstamo.
  prestamos: [
    { id: "L-201", equipo: "P-03", persona: "p2", entrega: "2026-10-26", horaEntrega: "08:40", dias: 3, vence: "2026-10-28" },
    { id: "L-202", equipo: "P-04", persona: "p1", entrega: "2026-10-20", horaEntrega: "09:05", dias: 3, vence: "2026-10-22" },
    { id: "L-203", equipo: "V-02", persona: "p4", entrega: "2026-10-23", horaEntrega: "14:10", dias: 3, vence: "2026-10-25" },
    { id: "L-204", equipo: "V-03", persona: "p5", entrega: "2026-10-15", horaEntrega: "10:30", dias: 3, vence: "2026-10-17" },
    { id: "L-205", equipo: "P-06", persona: "p3", entrega: "2026-10-26", horaEntrega: "09:10", dias: 5, vence: "2026-10-30" }
  ],

  // Solicitudes que recepción aún no resuelve.
  solicitudes: [
    { id: "S-101", equipo: "V-01", persona: "p3", desde: "2026-10-27", dias: 2 },
    { id: "S-102", equipo: "P-01", persona: "p4", desde: "2026-10-27", dias: 5 },
    { id: "S-103", equipo: "P-02", persona: "p5", desde: "2026-10-28", dias: 1 },
    { id: "S-104", equipo: "P-05", persona: "p2", desde: "2026-10-29", dias: 3 }
  ],

  // Solicitudes ya aprobadas, esperando que recepción registre la entrega.
  porEntregar: [
    { id: "S-097", equipo: "P-01", persona: "p6", desde: "2026-10-26", dias: 1 },
    { id: "S-099", equipo: "V-01", persona: "p7", desde: "2026-10-26", dias: 1 }
  ],

  // Veces que se prestó cada equipo (cifras inventadas para el ejemplo).
  ranking: [
    { equipo: "P-01", veces: 14 }, { equipo: "V-01", veces: 12 }, { equipo: "P-02", veces: 11 },
    { equipo: "P-05", veces: 9 }, { equipo: "V-02", veces: 8 }, { equipo: "P-03", veces: 7 },
    { equipo: "P-04", veces: 6 }, { equipo: "V-03", veces: 4 }, { equipo: "P-06", veces: 3 }
  ],

  // Textos de la interfaz que ningún texto del cliente trae (decisión D-08 de mapa.md).
  textos: {
    errorCarga: "No se pudo cargar la información. Intenta de nuevo.",
    errorEnvio: "No se pudo enviar la solicitud. Intenta de nuevo.",
    faltanDatos: "Elige el equipo, la fecha de inicio y los días del préstamo.",
    solicitudEnviada: "Solicitud enviada. Recepción la aprobará o rechazará.",
    sinAccesoRecepcion: "Esta pantalla es solo para recepción.",
    sinAccesoJefe: "Esta pantalla es solo para el jefe administrativo.",
    sinDisponibles: "Ahora no hay equipos disponibles.",
    sinSolicitudes: "No hay solicitudes por resolver.",
    sinEntregas: "No hay entregas pendientes.",
    sinPrestamos: "No hay equipos prestados.",
    sinVencidos: "No tienes préstamos vencidos. Gracias por devolver a tiempo.",
    sinResumen: "Todavía no hay préstamos para mostrar.",
    sinVencidosJefe: "No hay préstamos vencidos."
  }
};
