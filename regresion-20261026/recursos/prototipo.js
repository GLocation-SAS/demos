/*
 * Demo navegable y NO funcional: nada se guarda, nada se envía, no hay servidor.
 * Este archivo maneja la navegación, el rol activo, los estados simulados y el modo revisión.
 * Parámetros de la dirección: ?rol=empleado|recepcion|jefe  ?estado=vacio|cargando|error|exito  ?revision=1
 */
(function () {
  "use strict";
  var D = window.DATOS;
  var q = new URLSearchParams(window.location.search);
  var ROL = D.roles[q.get("rol")] ? q.get("rol") : "empleado";
  var REV = q.get("revision") === "1";
  var ESTADOS = ["normal", "vacio", "cargando", "error", "exito"];
  var NOMBRES_ESTADO = { normal: "Normal", vacio: "Vacío", cargando: "Cargando", error: "Error", exito: "Éxito" };
  var ESTADO = ESTADOS.indexOf(q.get("estado")) >= 0 ? q.get("estado") : "normal";
  var cuerpo = document.body;
  var PANT = cuerpo.dataset.pantalla;
  var esInicio = PANT === "inicio";
  var PREF = esInicio ? "pantallas/" : "";
  var RAIZ = esInicio ? "" : "../";

  // ---------- utilidades ----------
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, attrs, hijos) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "texto") e.textContent = attrs[k];
      else if (k === "clase") e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (hijos || []).forEach(function (h) { if (h) e.appendChild(typeof h === "string" ? document.createTextNode(h) : h); });
    return e;
  }
  var ICONOS = {
    laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
    videobeam: '<rect x="3" y="8" width="18" height="9" rx="2"/><circle cx="15" cy="12.5" r="2.5"/><path d="M7 17v2M17 17v2M6.5 12h2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    alerta: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',
    grafico: '<path d="M5 20V11M11 20V4M17 20v-6M3 20h18"/>',
    correo: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    devolver: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
    caja: '<path d="M3 8l9-4 9 4-9 4z"/><path d="M3 8v8l9 4 9-4V8M12 12v8"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    flecha: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    candado: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/>'
  };
  function icono(nombre, extra) {
    var t = document.createElement("span");
    t.innerHTML = '<svg viewBox="0 0 24 24" class="icono' + (extra ? " " + extra : "") + '" aria-hidden="true" focusable="false">' + (ICONOS[nombre] || "") + "</svg>";
    return t.firstChild;
  }
  var DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  var DIAS_LARGO = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function aFecha(iso) { var p = iso.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function aIso(d) { return d.getUTCFullYear() + "-" + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + d.getUTCDate()).slice(-2); }
  function sumarDias(iso, n) { var d = aFecha(iso); d.setUTCDate(d.getUTCDate() + n); return aIso(d); }
  function entreDias(a, b) { return Math.round((aFecha(b) - aFecha(a)) / 86400000); }
  function fechaCorta(iso) { var d = aFecha(iso); return DIAS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MESES[d.getUTCMonth()]; }
  function fechaLarga(iso) { var d = aFecha(iso); return DIAS_LARGO[d.getUTCDay()] + " " + d.getUTCDate() + " " + MESES[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  function plural(n, uno, otros) { return n + " " + (n === 1 ? uno : otros); }
  function equipo(id) { return D.equipos.filter(function (e) { return e.id === id; })[0]; }
  function persona(id) { return D.personas[id]; }
  function yo() { return D.roles[ROL].persona; }
  function yoNombre() { return yo() ? persona(yo()).nombre : "Sin acceso"; }
  function prestamo(id) { return D.prestamos.filter(function (l) { return l.id === id; })[0]; }
  function esPersonaEmpresa() { return ROL !== "externa"; }
  // RN-18 / D-28: un préstamo entregado y sin devolver ocupa el equipo, también después de la fecha prevista, hasta que recepción registre la devolución.
  function ocupadoHasta(l) { return l.estado === "entregada" ? "9999-12-31" : l.hasta; }
  function ocupante(equipoId, desde, hasta, ignorarId) {
    return D.prestamos.filter(function (l) {
      return l.equipo === equipoId && l.id !== ignorarId && (l.estado === "aprobada" || l.estado === "entregada") && l.desde <= hasta && desde <= ocupadoHasta(l);
    })[0];
  }
  function atraso(l) { return l.estado === "entregada" ? Math.max(0, entreDias(l.hasta, D.hoy)) : 0; }
  function vencidos() { return D.prestamos.filter(function (l) { return atraso(l) > 0; }).sort(function (a, b) { return atraso(b) - atraso(a); }); }
  function habiles(desde, hasta) {
    var n = 0, f = desde;
    while (f <= hasta) { var d = aFecha(f).getUTCDay(); if (d !== 0 && d !== 6) n++; f = sumarDias(f, 1); }
    return n;
  }
  function rango(l) { return l.desde === l.hasta ? fechaCorta(l.desde) : fechaCorta(l.desde) + " al " + fechaCorta(l.hasta); }
  function pagina() { return window.location.pathname.split("/").pop(); }
  function textoMax() { return D.textos.maximoDias.replace("{N}", D.maxDias); }

  // ---------- enlaces que conservan rol y revisión ----------
  function enlace(href, extra) {
    var u = new URL(href, window.location.href);
    if (!u.searchParams.has("rol")) u.searchParams.set("rol", ROL);
    if (REV && !u.searchParams.has("revision")) u.searchParams.set("revision", "1");
    Object.keys(extra || {}).forEach(function (k) { if (extra[k] === null) u.searchParams.delete(k); else u.searchParams.set(k, extra[k]); });
    return u.href;
  }
  function ir(href, extra) { window.location.href = enlace(href, extra); }
  function reescribirEnlaces(ctx) {
    $$("a[href]", ctx).forEach(function (a) {
      var h = a.getAttribute("href");
      if (a.dataset.fijo !== undefined || /^(#|[a-z]+:)/i.test(h)) return;
      a.setAttribute("href", enlace(h));
    });
  }

  // ---------- pantallas del proceso P-01 ----------
  var TODOS = ["empleado", "recepcion", "jefe"];
  var P = {
    "P01-A01": { archivo: "P01-A01-consultar-equipos.html", nav: "Equipos", icono: "laptop", roles: TODOS, titulo: "Consultar equipos disponibles" },
    "P01-A02": { archivo: "P01-A02-solicitar-prestamo.html", nav: "Pedir préstamo", icono: "mas", roles: TODOS, titulo: "Pedir un equipo prestado por días" },
    "P01-A03": { archivo: "P01-A03-ver-mis-solicitudes.html", nav: "Mis solicitudes", icono: "lista", roles: TODOS, titulo: "Mis solicitudes" },
    "P01-A04": { archivo: "P01-A04-aprobar-solicitud.html", nav: "Solicitudes", icono: "check", roles: ["recepcion"], titulo: "Aprobar o rechazar solicitudes" },
    "P01-A05": { archivo: "P01-A05-registrar-entrega.html", nav: "Entregas", icono: "caja", roles: ["recepcion"], titulo: "Registrar la entrega" },
    "P01-A06": { archivo: "P01-A06-registrar-devolucion.html", nav: "Devoluciones", icono: "devolver", roles: ["recepcion"], titulo: "Registrar la devolución" },
    "P01-A07": { archivo: "P01-A07-recibir-recordatorio.html", nav: "Recordatorio", icono: "correo", roles: TODOS, titulo: "Recordatorio de vencimiento" },
    "P01-A08": { archivo: "P01-A08-ver-resumen.html", nav: "Resumen", icono: "grafico", roles: ["jefe"], titulo: "Resumen para el jefe administrativo" }
  };
  var ORDEN = ["P01-A01", "P01-A02", "P01-A03", "P01-A04", "P01-A05", "P01-A06", "P01-A07", "P01-A08"];
  function rolPermitido(id) { return P[id].roles.indexOf(ROL) >= 0; }

  // ---------- cabecera ----------
  function pintarCabecera() {
    var cont = $("#cabecera");
    if (!cont) return;
    var marca = el("a", { clase: "marca", href: RAIZ + "index.html" }, [el("span", { clase: "marca__punto", "aria-hidden": "true" }), D.marca]);
    var boton = el("button", { clase: "cab__menu", type: "button", "aria-expanded": "false", "aria-controls": "panel-menu" }, [icono("menu"), "Menú"]);
    var panel = el("div", { clase: "cab__panel", id: "panel-menu" });
    var nav = el("ul", { clase: "nav" });
    ORDEN.forEach(function (id) {
      if (!rolPermitido(id)) return;
      var a = el("a", { href: PREF + P[id].archivo }, [icono(P[id].icono, "icono--sm"), P[id].nav]);
      if (id === PANT) a.setAttribute("aria-current", "page");
      nav.appendChild(el("li", {}, [a]));
    });
    var selector = el("select", { id: "selector-rol" });
    Object.keys(D.roles).forEach(function (k) {
      var o = el("option", { value: k, texto: D.roles[k].nombre });
      if (k === ROL) o.selected = true;
      selector.appendChild(o);
    });
    selector.addEventListener("change", function () { ir(window.location.href, { rol: selector.value }); });
    var rol = el("div", { clase: "rol" }, [el("label", { for: "selector-rol", texto: "Rol activo" }), selector, el("span", { clase: "rol__quien", texto: yoNombre() })]);
    panel.appendChild(el("div", { clase: "cab__panel-fila" }, [nav, rol]));
    boton.addEventListener("click", function () {
      var abierto = panel.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
    cont.appendChild(el("div", { clase: "banda", role: "note", texto: "Demo de muestra: nada se guarda ni se envía, y todos los datos son inventados." }));
    cont.appendChild(el("header", { clase: "cab" }, [el("div", { clase: "cab__fila" }, [marca, boton]), panel]));
  }

  // ---------- piezas de pantalla ----------
  function encabezado(id, ayuda) {
    return el("div", { clase: "encabezado-pantalla" }, [
      el("p", { clase: "encabezado-pantalla__ruta", texto: "Préstamo de equipos · " + id.replace("P01-", "") }),
      el("h1", { texto: P[id].titulo }),
      ayuda ? el("p", { clase: "encabezado-pantalla__ayuda", texto: ayuda }) : null
    ]);
  }
  function mensaje(tipo, icon, contenido, rolAlerta) {
    var m = el("div", { clase: "mensaje mensaje--" + tipo }, [icono(icon), el("div", { clase: "mensaje__cuerpo" }, contenido)]);
    if (rolAlerta) m.setAttribute("role", rolAlerta);
    return m;
  }
  function msgError(texto, extra) { return mensaje("error", "alerta", [el("p", {}, [el("strong", { texto: texto })])].concat(extra || []), "alert"); }
  function msgExito(titulo, detalle, extra) { return mensaje("exito", "check", [el("p", {}, [el("strong", { texto: titulo + (detalle ? " " : "") }), detalle || ""])].concat(extra || []), "status"); }
  function vacio(icon, texto, enlaceTexto, href) {
    var c = el("div", { clase: "tarjeta vacio" }, [icono(icon), el("p", { texto: texto })]);
    if (enlaceTexto) c.appendChild(el("a", { clase: "boton boton--secundario", href: href, texto: enlaceTexto }));
    return c;
  }
  function cargando() {
    return el("div", { clase: "tarjeta", "aria-busy": "true", "aria-live": "polite" }, [
      el("p", { clase: "solo-lectores", texto: "Cargando…" }),
      el("div", { clase: "cargando", "aria-hidden": "true" }, [el("div", { clase: "cargando__barra" }), el("div", { clase: "cargando__barra" }), el("div", { clase: "cargando__barra cargando__barra--corta" })])
    ]);
  }
  function errorCarga() {
    return mensaje("error", "alerta", [el("p", {}, [el("strong", { texto: D.textos.errorCarga })]), el("a", { href: pagina() + "?rol=" + ROL, "data-fijo": "", texto: "Intentar de nuevo" })], "alert");
  }
  function tabla(columnas, filas) {
    var t = el("table", { clase: "tabla-apilable" });
    t.appendChild(el("thead", {}, [el("tr", {}, columnas.map(function (c) { return el("th", { scope: "col", texto: c }); }))]));
    var tb = el("tbody");
    filas.forEach(function (celdas) {
      var tr = el("tr");
      celdas.forEach(function (c, i) {
        var td = el("td", { "data-etiqueta": columnas[i] || "" });
        if (c && c.acciones) { td.className = "col-acciones"; td.removeAttribute("data-etiqueta"); c.acciones.forEach(function (n) { td.appendChild(n); }); }
        else if (c && c.nodo) td.appendChild(c.nodo);
        else td.textContent = c;
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return el("div", { clase: "tarjeta tabla-envoltura" }, [t]);
  }
  function insignia(tipo, texto, icon) { return el("span", { clase: "insignia insignia--" + tipo }, [icon ? icono(icon, "icono--sm") : null, texto]); }
  function siguiente(id, texto) {
    return el("div", { clase: "siguiente" }, [
      el("a", { href: RAIZ + "index.html#proceso", texto: "Volver al proceso" }),
      id && rolPermitido(id) ? el("a", { clase: "boton", href: PREF + P[id].archivo }, [texto || ("Siguiente: " + P[id].nav), icono("flecha", "icono--sm")]) : null
    ]);
  }
  function boton(texto, href, clase, etiqueta) {
    var a = el("a", { clase: "boton" + (clase ? " " + clase : ""), href: href, texto: texto });
    if (etiqueta) a.setAttribute("aria-label", etiqueta);
    return a;
  }
  function persona2(l) { return persona(l.persona).nombre; }
  function estadoPrestamo(l, comoPrestamo) {
    if (l.estado === "pendiente") return insignia("aviso", D.textos.pendiente.charAt(0).toUpperCase() + D.textos.pendiente.slice(1), "reloj");
    if (l.estado === "aprobada") return insignia("exito", comoPrestamo ? "Aprobado, sin entregar" : "Aprobada", "check");
    if (l.estado === "rechazada") return insignia("error", "Rechazada", "x");
    if (l.estado === "entregada") return atraso(l) > 0 ? insignia("error", "Vencido: " + plural(atraso(l), "día", "días") + " de atraso", "alerta") : insignia("info", "Entregado", "caja");
    return insignia("exito", "Devuelto", "devolver");
  }
  // Devuelve true si la pantalla ya quedó pintada (sin acceso, cargando o error genérico).
  function estadosComunes(v, id, errorGenerico) {
    if (!rolPermitido(id)) {
      var aviso = ROL === "externa" ? D.textos.sinAccesoExterna : (id === "P01-A08" ? D.textos.sinAccesoJefe : D.textos.sinAccesoRecepcion);
      v.appendChild(mensaje("aviso", "candado", [el("p", {}, [el("strong", { texto: aviso })]), el("p", { texto: ROL === "externa" ? "Cambia el rol activo arriba para ver la demostración." : "Cambia el rol activo arriba para verla." }), ROL === "externa" ? null : el("a", { href: PREF + P["P01-A01"].archivo, texto: "Ir a consultar equipos" })], "status"));
      return true;
    }
    if (ESTADO === "cargando") { v.appendChild(cargando()); return true; }
    if (ESTADO === "error" && errorGenerico) { v.appendChild(errorCarga()); return true; }
    return false;
  }
  function campo(id, etiqueta, control, ayuda, error) {
    var c = el("div", { clase: "campo" + (error ? " campo--error" : "") }, [el("label", { for: id, texto: etiqueta }), control]);
    if (ayuda) c.appendChild(el("span", { clase: "campo__ayuda", texto: ayuda }));
    if (error) { control.setAttribute("aria-invalid", "true"); c.appendChild(el("span", { clase: "campo__error" }, [icono("alerta", "icono--sm"), error])); }
    return c;
  }
  function inputFecha(id, valor) { var i = el("input", { type: "date", id: id, name: id }); i.value = valor || ""; return i; }

  var TITULOS = {};
  ORDEN.forEach(function (id) { TITULOS[id] = P[id].titulo; });

  // ---------- renderizado por pantalla ----------
  var R = {};

  R["inicio"] = function () {
    $$("input[name=rol]").forEach(function (i) {
      i.checked = i.value === ROL;
      i.addEventListener("change", function () { ir(window.location.href, { rol: i.value }); });
    });
    var rev = $("#enlace-revision");
    if (rev) {
      rev.textContent = REV ? "Salir del modo revisión" : "Entrar al modo revisión";
      rev.setAttribute("href", enlace(window.location.href, { revision: REV ? null : "1" }));
      rev.dataset.fijo = "";
    }
    var lista = $("#lista-pasos");
    ORDEN.forEach(function (id) {
      var quien = P[id].roles.length === 3 ? "Todos los roles de la empresa" : D.roles[P[id].roles[0]].nombre;
      lista.appendChild(el("li", { clase: "paso" }, [el("span", {}, [el("a", { href: PREF + P[id].archivo, texto: P[id].titulo }), el("small", { texto: quien })])]));
    });
  };

  // --- A-01 ---
  function tarjetaEquipo(e, desde, hasta) {
    var oc = ocupante(e.id, desde, hasta);
    var verQuien = ROL === "recepcion" || ROL === "jefe";
    var pie = el("div", { clase: "equipo__pie" });
    var cuerpo = [];
    if (!oc) {
      pie.appendChild(insignia("exito", "Disponible", "check"));
      pie.appendChild(el("a", { clase: "boton", href: PREF + P["P01-A02"].archivo + "?equipo=" + e.id + "&desde=" + desde + "&hasta=" + hasta, "aria-label": "Pedir prestado: " + e.nombre, texto: "Pedir prestado" }));
    } else {
      pie.appendChild(insignia("info", "No disponible", "reloj"));
      // CA-001-04 / D-26: el empleado ve la fecha de devolución prevista, nunca la persona.
      if (verQuien) {
        cuerpo.push(el("p", { clase: "pequeno texto-2" }, [el("strong", { texto: "Lo tiene: " }), persona2(oc)]));
        cuerpo.push(el("p", { clase: "pequeno texto-2" }, [el("strong", { texto: "Devolución prevista: " }), fechaCorta(oc.hasta)]));
        // CA-001-39 (aprobado, sin entregar) y CA-001-46 (vencido, solo en la lista de recepción, sin lista aparte).
        if (oc.estado === "aprobada") pie.appendChild(insignia("exito", "Aprobado, sin entregar", "check"));
        else if (ROL === "recepcion" && atraso(oc) > 0) pie.appendChild(insignia("error", "Vencido: " + plural(atraso(oc), "día", "días") + " de atraso", "alerta"));
        else pie.appendChild(insignia("aviso", "Prestado", "caja"));
        pie.appendChild(el("a", { clase: "boton boton--secundario", href: pagina() + "?desde=" + desde + "&hasta=" + hasta + "&prestamo=" + oc.id, "aria-label": "Ver el préstamo de " + e.nombre, texto: "Ver préstamo" }));
      } else {
        cuerpo.push(el("p", { clase: "pequeno texto-2" }, [el("strong", { texto: "Devolución prevista: " }), fechaCorta(oc.hasta)]));
      }
    }
    return el("article", { clase: "tarjeta equipo" + (oc ? " equipo--prestado" : ""), "aria-label": e.nombre }, [
      el("div", { clase: "equipo__cab" }, [el("span", { clase: "equipo__icono" }, [icono(e.tipo === "portatil" ? "laptop" : "videobeam", "icono--lg")]),
        el("div", {}, [el("p", { clase: "equipo__codigo", texto: e.tipo === "portatil" ? "PORTÁTIL" : "VIDEOBEAM" }), el("h3", { texto: e.nombre })])])
    ].concat(cuerpo, [pie]));
  }

  R["P01-A01"] = function (v) {
    v.appendChild(encabezado("P01-A01", "Elige los días que te interesan y mira qué equipos están libres."));
    if (estadosComunes(v, "P01-A01", true)) return;
    var desde = q.get("desde") || D.hoy;
    var hasta = q.get("hasta") || desde;
    var inD = inputFecha("desde", desde), inH = inputFecha("hasta", hasta);
    var f = el("form", { clase: "tarjeta", novalidate: "novalidate" }, [
      el("div", { clase: "filas-campos" }, [campo("desde", "Desde el día", inD), campo("hasta", "Hasta el día", inH)]),
      el("button", { clase: "boton", type: "submit", texto: "Ver disponibles" })
    ]);
    f.addEventListener("submit", function (ev) { ev.preventDefault(); ir(pagina(), { desde: inD.value || D.hoy, hasta: inH.value || inD.value || D.hoy, prestamo: null }); });
    v.appendChild(f);
    if (hasta < desde) { v.appendChild(el("div", { clase: "seccion" }, [msgError(D.textos.devolucionAnterior)])); return; }
    var det = (ROL === "recepcion" || ROL === "jefe") && q.get("prestamo") ? prestamo(q.get("prestamo")) : null;
    if (det) {
      var p = persona(det.persona);
      v.appendChild(el("section", { clase: "seccion", "aria-labelledby": "t-det" }, [el("h2", { id: "t-det", texto: "Préstamo " + det.id }),
        el("div", { clase: "resumen" }, [el("dl", {}, [el("dt", { texto: "Equipo" }), el("dd", { texto: equipo(det.equipo).nombre }), el("dt", { texto: "Persona" }), el("dd", { texto: p.nombre }), el("dt", { texto: "Correo" }), el("dd", { texto: p.correo }),
          el("dt", { texto: "Día de inicio" }), el("dd", { texto: fechaLarga(det.desde) }), el("dt", { texto: "Devolución prevista" }), el("dd", { texto: fechaLarga(det.hasta) }), el("dt", { texto: "Estado" }), el("dd", { nodo: null }, [estadoPrestamo(det, true)])])])]));
    }
    var lista = ESTADO === "vacio" ? [] : D.equipos;
    if (!lista.length) { v.appendChild(el("div", { clase: "seccion" }, [vacio("laptop", D.textos.sinEquipos)])); v.appendChild(siguiente("P01-A02")); return; }
    var libres = lista.filter(function (e) { return !ocupante(e.id, desde, hasta); }).length;
    var etiquetaDias = desde === hasta ? (desde === D.hoy ? "hoy, " + fechaLarga(desde) : "el " + fechaLarga(desde)) : "del " + fechaCorta(desde) + " al " + fechaCorta(hasta);
    v.appendChild(el("p", { clase: "texto-2 seccion" }, [el("strong", { texto: libres + " de " + lista.length + " equipos disponibles" }), " " + etiquetaDias + "."]));
    [["portatil", "Portátiles"], ["videobeam", "Videobeams"]].forEach(function (g) {
      var del = lista.filter(function (e) { return e.tipo === g[0]; }).sort(function (a, b) { return (ocupante(a.id, desde, hasta) ? 1 : 0) - (ocupante(b.id, desde, hasta) ? 1 : 0); });
      var sec = el("section", { clase: "seccion", "aria-labelledby": "t-" + g[0] }, [el("h2", { id: "t-" + g[0], texto: g[1] })]);
      var rej = el("div", { clase: "rejilla rejilla--3" });
      del.forEach(function (e) { rej.appendChild(tarjetaEquipo(e, desde, hasta)); });
      sec.appendChild(rej);
      v.appendChild(sec);
    });
    v.appendChild(siguiente("P01-A02"));
  };

  // --- A-02 ---
  function validarSolicitud(eq, desde, hasta) {
    if (!eq) return { campo: "equipo", texto: "Elige un equipo" };
    if (!desde || !hasta) return { campo: !desde ? "desde" : "hasta", texto: D.textos.faltaFechas };
    if (desde < D.hoy) return { campo: "desde", texto: D.textos.inicioAnterior };
    if (hasta < desde) return { campo: "hasta", texto: D.textos.devolucionAnterior };
    if (habiles(desde, hasta) > D.maxDias) return { campo: "hasta", texto: textoMax() };
    if (ocupante(eq, desde, hasta)) return { campo: "equipo", texto: D.textos.equipoNoDisponible };
    return null;
  }
  R["P01-A02"] = function (v) {
    v.appendChild(encabezado("P01-A02", "Elige el equipo, el día de inicio y el día de devolución."));
    if (estadosComunes(v, "P01-A02", false)) return;
    var eq = q.get("equipo") || "", desde = q.get("desde") || sumarDias(D.hoy, 1), hasta = q.get("hasta") || "";
    var enviado = q.get("enviar") === "1";
    if (ESTADO === "vacio") { eq = ""; desde = ""; hasta = ""; enviado = false; }
    if (ESTADO === "exito") { eq = "P02"; desde = "2026-11-16"; hasta = "2026-11-18"; enviado = true; }
    if (ESTADO === "error") { eq = "P03"; desde = "2026-11-13"; hasta = "2026-11-14"; enviado = true; }
    if (!q.get("hasta") && !q.has("enviar") && ESTADO === "normal") hasta = sumarDias(desde, 3);
    var err = enviado ? validarSolicitud(eq, desde, hasta) : null;
    if (enviado && !err) {
      v.appendChild(msgExito("Tu solicitud quedó " + D.textos.pendiente + ".", "Recepción la aprobará o la rechazará."));
      v.appendChild(el("div", { clase: "resumen" }, [el("dl", {}, [el("dt", { texto: "Equipo" }), el("dd", { texto: equipo(eq).nombre }), el("dt", { texto: "Desde" }), el("dd", { texto: fechaLarga(desde) }),
        el("dt", { texto: "Devolución" }), el("dd", { texto: fechaLarga(hasta) }), el("dt", { texto: "Solicita" }), el("dd", { texto: yoNombre() }), el("dt", { texto: "Estado" }), el("dd", { texto: D.textos.pendiente })])]));
      v.appendChild(el("div", { clase: "acciones" }, [boton("Ver mis solicitudes", PREF + P["P01-A03"].archivo + "?nueva=1"), boton("Pedir otro equipo", PREF + P["P01-A02"].archivo, "boton--secundario")]));
      v.appendChild(siguiente(null));
      return;
    }
    if (err) v.appendChild(msgError(err.texto));
    var sel = el("select", { id: "equipo", name: "equipo" }, [el("option", { value: "", texto: "Elige un equipo" })]);
    D.equipos.forEach(function (e) { sel.appendChild(el("option", { value: e.id, texto: e.nombre })); });
    sel.value = eq;
    var inD = inputFecha("desde", desde), inH = inputFecha("hasta", hasta);
    var dias = el("span", { id: "dias", texto: "—" });
    var f = el("form", { clase: "tarjeta", novalidate: "novalidate" }, [
      campo("solicitante", "Solicita", el("input", { id: "solicitante", value: yoNombre(), readonly: "readonly" })),
      campo("equipo", "Equipo", sel, null, err && err.campo === "equipo" ? err.texto : null),
      el("div", { clase: "filas-campos" }, [
        campo("desde", "Día de inicio", inD, null, err && err.campo === "desde" ? err.texto : null),
        campo("hasta", "Día de devolución", inH, "Ejemplo: máximo " + D.maxDias + " días laborales (lunes a viernes), contando el día de inicio y el de devolución. El valor real es configurable.", err && err.campo === "hasta" ? err.texto : null)
      ]),
      el("p", { clase: "resumen" }, [el("strong", { texto: "Días laborales del préstamo (incluye inicio y devolución): " }), dias]),
      el("div", { clase: "acciones" }, [el("button", { clase: "boton", type: "submit", texto: "Enviar solicitud" }), boton("Volver a consultar equipos", PREF + P["P01-A01"].archivo, "boton--secundario")])
    ]);
    function actualizar() { dias.textContent = inD.value && inH.value && inH.value >= inD.value ? String(habiles(inD.value, inH.value)) : "—"; }
    inD.addEventListener("input", actualizar); inH.addEventListener("input", actualizar); actualizar();
    f.addEventListener("submit", function (ev) {
      ev.preventDefault();
      ir(pagina(), { enviar: "1", equipo: sel.value, desde: inD.value, hasta: inH.value, estado: null });
    });
    v.appendChild(f);
    v.appendChild(siguiente(null));
  };

  // --- A-03 ---
  R["P01-A03"] = function (v) {
    v.appendChild(encabezado("P01-A03", "El estado de las solicitudes que has hecho."));
    if (estadosComunes(v, "P01-A03", true)) return;
    v.appendChild(el("p", { clase: "texto-2" }, ["Solicitudes y préstamos de ", el("strong", { texto: yoNombre() }), ". Aquí no se ven los de otras personas."]));
    if (q.get("nueva") === "1" || ESTADO === "exito") v.appendChild(msgExito("Tu solicitud quedó " + D.textos.pendiente + " y aparece en esta lista."));
    var mias = ESTADO === "vacio" ? [] : D.prestamos.filter(function (l) { return l.persona === yo(); }).sort(function (a, b) { return a.creada < b.creada ? 1 : -1; });
    if (!mias.length) { v.appendChild(vacio("lista", D.textos.sinSolicitudes, "Consultar equipos", PREF + P["P01-A01"].archivo)); v.appendChild(siguiente("P01-A02")); return; }
    v.appendChild(el("p", { clase: "texto-2 pequeno", texto: "De la más reciente a la más antigua." }));
    v.appendChild(tabla(["Equipo", "Día de inicio", "Devolución prevista", "Estado", "Detalle"], mias.map(function (l) {
      var det = l.estado === "rechazada" ? "Motivo: " + l.motivo : (l.estado === "devuelta" ? "Devuelto el " + fechaCorta(l.devolucion) : "—");
      return [equipo(l.equipo).nombre, fechaCorta(l.desde), fechaCorta(l.hasta), { nodo: estadoPrestamo(l) }, det];
    })));
    v.appendChild(siguiente("P01-A02", "Pedir otro equipo"));
  };

  // --- A-04 ---
  function resolver(accion, id, motivo) {
    var l = prestamo(id);
    if (!l) return { error: D.textos.yaResuelta };
    if (l.estado !== "pendiente") return { error: D.textos.yaResuelta };
    if (accion === "aprobada") {
      if (ocupante(l.equipo, l.desde, l.hasta, l.id)) return { error: D.textos.equipoYaPrestado };
      return { ok: true, l: l };
    }
    if (!motivo) return { error: D.textos.faltaMotivo, pedirMotivo: l };
    return { ok: true, l: l, motivo: motivo };
  }
  R["P01-A04"] = function (v) {
    v.appendChild(encabezado("P01-A04", "Aprueba o rechaza cada solicitud. Para rechazar hay que escribir el motivo."));
    if (estadosComunes(v, "P01-A04", false)) return;
    var accion = q.get("resultado") || "", id = q.get("id") || "", motivo = q.get("motivo") || "";
    if (ESTADO === "error") { accion = "aprobada"; id = "L-103"; }
    if (ESTADO === "exito") { accion = "aprobada"; id = "L-109"; }
    var quitar = null, formMotivo = q.get("rechazar") ? prestamo(q.get("rechazar")) : null;
    if (accion) {
      var r = resolver(accion, id, motivo);
      if (r.error) { v.appendChild(msgError(r.error)); if (r.pedirMotivo) formMotivo = r.pedirMotivo; }
      else if (accion === "aprobada") { quitar = id; v.appendChild(msgExito("Solicitud aprobada:", equipo(r.l.equipo).nombre + " para " + persona2(r.l) + ", " + rango(r.l) + ". " + persona2(r.l) + " la verá como aprobada.", [el("a", { href: PREF + P["P01-A05"].archivo, texto: "Registrar la entrega" })])); }
      else { quitar = id; v.appendChild(mensaje("info", "info", [el("p", {}, [el("strong", { texto: "Solicitud rechazada: " }), equipo(r.l.equipo).nombre + " para " + persona2(r.l) + ". " + persona2(r.l) + " verá el motivo: «" + r.motivo + "»."])], "status")); }
    }
    if (formMotivo && formMotivo.estado === "pendiente") {
      var ta = el("textarea", { id: "motivo", name: "motivo", rows: "3" }); ta.value = motivo;
      var fm = el("form", { clase: "tarjeta", novalidate: "novalidate" }, [
        el("h2", { texto: "Rechazar: " + equipo(formMotivo.equipo).nombre + " para " + persona2(formMotivo) }),
        campo("motivo", "Motivo del rechazo", ta, "Lo verá quien pidió el equipo.", q.has("motivo") && !motivo ? D.textos.faltaMotivo : null),
        el("div", { clase: "acciones" }, [el("button", { clase: "boton boton--peligro", type: "submit", texto: "Rechazar solicitud" }), boton("Cancelar", pagina(), "boton--secundario")])
      ]);
      fm.addEventListener("submit", function (ev) { ev.preventDefault(); ir(pagina(), { resultado: "rechazada", id: formMotivo.id, motivo: ta.value.trim(), rechazar: null, estado: null }); });
      v.appendChild(el("div", { clase: "seccion" }, [fm]));
    }
    var lista = ESTADO === "vacio" ? [] : D.prestamos.filter(function (l) { return l.estado === "pendiente" && l.id !== quitar; });
    if (!lista.length) { v.appendChild(el("div", { clase: "seccion" }, [vacio("lista", D.textos.sinPorResolver)])); v.appendChild(siguiente("P01-A05")); return; }
    var sec = el("section", { clase: "seccion", "aria-labelledby": "t-sol" }, [el("h2", { id: "t-sol" }, ["Por resolver ", insignia("info", String(lista.length))])]);
    sec.appendChild(tabla(["Equipo", "Solicita", "Días", "Decisión"], lista.map(function (l) {
      return [equipo(l.equipo).nombre, persona2(l), rango(l), { acciones: [el("div", { clase: "par-decision" }, [
        boton("Aprobar", pagina() + "?resultado=aprobada&id=" + l.id, "", "Aprobar la solicitud de " + equipo(l.equipo).nombre + " para " + persona2(l)),
        boton("Rechazar", pagina() + "?rechazar=" + l.id, "boton--peligro", "Rechazar la solicitud de " + equipo(l.equipo).nombre + " para " + persona2(l))])] }];
    })));
    v.appendChild(sec);
    v.appendChild(siguiente("P01-A05"));
  };

  // --- A-05 ---
  R["P01-A05"] = function (v) {
    v.appendChild(encabezado("P01-A05", "Cuando la persona recoge el equipo aprobado, registra la entrega."));
    if (estadosComunes(v, "P01-A05", false)) return;
    var accion = q.get("resultado") || "", id = q.get("id") || "";
    if (ESTADO === "error") { accion = "entregado"; id = "L-110"; }
    if (ESTADO === "exito") { accion = "entregado"; id = "L-104"; }
    var quitar = null;
    if (accion === "entregado") {
      var l = prestamo(id);
      if (!l || l.estado !== "aprobada") v.appendChild(msgError(D.textos.soloAprobado));
      else { quitar = id; v.appendChild(msgExito("Entrega registrada:", equipo(l.equipo).nombre + " a " + persona2(l) + ", el " + fechaLarga(D.hoy) + ", " + D.hora + ". Devolución prevista: " + fechaLarga(l.hasta) + ".", [el("a", { href: PREF + P["P01-A06"].archivo, texto: "Ir a devoluciones" })])); }
    }
    var lista = ESTADO === "vacio" ? [] : D.prestamos.filter(function (x) { return x.estado === "aprobada" && x.id !== quitar; });
    if (!lista.length) { v.appendChild(el("div", { clase: "seccion" }, [vacio("caja", D.textos.sinPorEntregar)])); v.appendChild(siguiente("P01-A06")); return; }
    var sec = el("section", { clase: "seccion", "aria-labelledby": "t-ent" }, [el("h2", { id: "t-ent" }, ["Aprobados por entregar ", insignia("info", String(lista.length))])]);
    sec.appendChild(tabla(["Equipo", "Lo recoge", "Días", "Registro"], lista.map(function (x) {
      return [equipo(x.equipo).nombre, persona2(x), rango(x), { acciones: [boton("Registrar entrega", pagina() + "?resultado=entregado&id=" + x.id, "", "Registrar la entrega de " + equipo(x.equipo).nombre + " a " + persona2(x))] }];
    })));
    v.appendChild(sec);
    v.appendChild(siguiente("P01-A06"));
  };

  // --- A-06 ---
  R["P01-A06"] = function (v) {
    v.appendChild(encabezado("P01-A06", "Cuando la persona regresa el equipo, registra la devolución."));
    if (estadosComunes(v, "P01-A06", false)) return;
    var accion = q.get("resultado") || "", id = q.get("id") || "";
    if (ESTADO === "error") { accion = "devuelto"; id = "L-102"; }
    if (ESTADO === "exito") { accion = "devuelto"; id = "L-105"; }
    var quitar = null;
    if (accion === "devuelto") {
      var l = prestamo(id);
      if (!l || l.estado !== "entregada") v.appendChild(msgError(D.textos.sinEntrega));
      else {
        quitar = id; var a = atraso(l);
        v.appendChild(msgExito("Devolución registrada:", equipo(l.equipo).nombre + " de " + persona2(l) + ", el " + fechaLarga(D.hoy) + ", " + D.hora + ", " + (a ? "con " + plural(a, "día", "días") + " de atraso" : "sin atraso") + ". El equipo queda disponible."));
      }
    }
    var lista = ESTADO === "vacio" ? [] : D.prestamos.filter(function (x) { return x.estado === "entregada" && x.id !== quitar; }).sort(function (a, b) { return atraso(b) - atraso(a) || (a.hasta < b.hasta ? -1 : 1); });
    if (!lista.length) { v.appendChild(el("div", { clase: "seccion" }, [vacio("devolver", D.textos.sinPorDevolver)])); v.appendChild(siguiente("P01-A07")); return; }
    var sec = el("section", { clase: "seccion", "aria-labelledby": "t-dev" }, [el("h2", { id: "t-dev" }, ["Equipos prestados ", insignia("info", String(lista.length))])]);
    sec.appendChild(tabla(["Equipo", "Lo tiene", "Devolución prevista", "Estado", "Registro"], lista.map(function (x) {
      return [equipo(x.equipo).nombre, persona2(x), fechaCorta(x.hasta), { nodo: estadoPrestamo(x) },
        { acciones: [boton("Registrar devolución", pagina() + "?resultado=devuelto&id=" + x.id, "", "Registrar la devolución de " + equipo(x.equipo).nombre + " de " + persona2(x))] }];
    })));
    v.appendChild(sec);
    v.appendChild(siguiente("P01-A07"));
  };

  // --- A-07 ---
  R["P01-A07"] = function (v) {
    v.appendChild(encabezado("P01-A07", "Así le llega el aviso a quien no devolvió el equipo a tiempo (ejemplo)."));
    if (estadosComunes(v, "P01-A07", true)) return;
    var venc = vencidos();
    var p = null;
    if (ESTADO !== "vacio") {
      p = venc.filter(function (x) { return x.id === q.get("id"); })[0];
      if (ROL === "empleado") p = p && p.persona === yo() ? p : venc.filter(function (x) { return x.persona === yo(); })[0];
      else p = p || venc.filter(function (x) { return x.persona === yo(); })[0] || venc.filter(function (x) { return x.id === "L-105"; })[0] || venc[0];
    }
    if (!p) { v.appendChild(vacio("check", D.textos.sinRecordatorio, "Volver a consultar equipos", PREF + P["P01-A01"].archivo)); v.appendChild(siguiente(null)); return; }
    var e = equipo(p.equipo), pe = persona(p.persona);
    var cuerpoTexto = D.textos.recordatorio.replace("{EQUIPO}", e.nombre).replace("{FECHA}", p.hasta);
    v.appendChild(el("article", { clase: "tarjeta correo", "aria-label": "Recordatorio de vencimiento" }, [
      el("div", { clase: "correo__cab" }, [icono("correo", "icono--lg"), el("div", {}, [el("p", { clase: "equipo__codigo", texto: "CORREO DE LA EMPRESA · " + D.hoy }), el("h2", { texto: "Asunto: " + D.textos.asuntoRecordatorio.replace("{EQUIPO}", e.nombre) })])]),
      el("div", { clase: "correo__cuerpo" }, [
        el("p", { clase: "texto-2 pequeno" }, [el("strong", { texto: "De: " }), D.textos.remitenteRecordatorio]),
        el("p", { clase: "texto-2 pequeno" }, [el("strong", { texto: "Para: " }), pe.nombre + " <" + pe.correo + ">"]),
        el("p", { texto: cuerpoTexto })
      ])
    ]));
    v.appendChild(el("section", { clase: "seccion", "aria-labelledby": "t-como" }, [el("h2", { id: "t-como", texto: "Cómo funciona el aviso" }),
      el("ul", { clase: "texto-2" }, [
        el("li", { texto: "Llega al correo de la empresa, una sola vez, el día siguiente a la fecha de devolución prevista." }),
        el("li", { texto: "No se envía el día de la devolución prevista ni si el equipo ya se devolvió." }),
        el("li", { texto: "Solo lo recibe quien tiene el préstamo vencido." })])]));
    v.appendChild(siguiente(ROL === "jefe" ? "P01-A08" : null, "Siguiente: resumen del jefe"));
  };

  // --- A-08 ---
  R["P01-A08"] = function (v) {
    v.appendChild(encabezado("P01-A08", "Qué equipos se prestan más y quién tiene préstamos vencidos."));
    if (estadosComunes(v, "P01-A08", true)) return;
    var vac = ESTADO === "vacio";
    var sec1 = el("section", { clase: "seccion", "aria-labelledby": "t-rank" }, [el("h2", { id: "t-rank", texto: "Equipos más prestados" })]);
    var cuentas = D.equipos.map(function (e) {
      var n = (D.historialPrevio[e.id] || 0) + D.prestamos.filter(function (l) { return l.equipo === e.id && (l.estado === "entregada" || l.estado === "devuelta"); }).length;
      return { e: e, n: n };
    }).sort(function (a, b) { return b.n - a.n || (a.e.nombre < b.e.nombre ? -1 : 1); });
    if (vac) sec1.appendChild(vacio("grafico", D.textos.sinResumen));
    else {
      var max = cuentas[0].n, ol = el("ol", { clase: "ranking" });
      cuentas.forEach(function (c) {
        var barra = el("span", { clase: "ranking__barra", "aria-hidden": "true" }, [el("span", { clase: "ranking__relleno" })]);
        barra.firstChild.style.width = Math.round(c.n / max * 100) + "%";
        ol.appendChild(el("li", { clase: "ranking__item" }, [el("span", { clase: "ranking__nombre", texto: c.e.nombre }), el("span", { clase: "ranking__valor", texto: plural(c.n, "préstamo", "préstamos") }), barra]));
      });
      sec1.appendChild(el("div", { clase: "tarjeta" }, [ol]));
    }
    if (!vac) sec1.appendChild(el("p", { clase: "texto-2 pequeno", texto: "Acumulado, sin filtro de periodo. Solo equipos y número de préstamos." }));
    v.appendChild(sec1);
    var venc = vac ? [] : vencidos();
    var sec2 = el("section", { clase: "seccion", "aria-labelledby": "t-venc" }, [el("h2", { id: "t-venc" }, ["Préstamos vencidos ", insignia(venc.length ? "error" : "exito", String(venc.length))])]);
    if (!venc.length) sec2.appendChild(vacio("check", D.textos.sinVencidos));
    else sec2.appendChild(tabla(["Persona", "Equipo", "Fecha prevista", "Atraso"], venc.map(function (l) {
      return [{ nodo: el("span", {}, [el("strong", { texto: persona2(l) }), el("br"), el("span", { clase: "texto-2 pequeno", texto: persona(l.persona).correo })]) }, equipo(l.equipo).nombre, l.hasta, { nodo: insignia("error", plural(atraso(l), "día", "días") + " de atraso", "alerta") }];
    })));
    v.appendChild(sec2);
    v.appendChild(siguiente(null));
  };

  // ---------- modo revisión: casos de los criterios ----------
  var CASOS = {
    "P01-A01": [
      ["CA-001-01", "Un equipo libre aparece como disponible (12 al 13 nov)", { rol: "empleado", desde: "2026-11-12", hasta: "2026-11-13" }],
      ["CA-001-02", "Videobeam 01 aprobado del 12 al 14: no disponible el 14", { rol: "empleado", desde: "2026-11-14", hasta: "2026-11-14" }],
      ["CA-001-03", "Sin fechas se consulta hoy", { rol: "empleado", desde: null, hasta: null }],
      ["CA-001-04", "El empleado ve «No disponible» con la devolución prevista, sin nombre ni correo", { rol: "empleado" }],
      ["CA-001-05", "Recepción y jefe ven quién lo tiene y la devolución prevista", { rol: "recepcion" }],
      ["CA-001-39", "Recepción ve el Portátil 03 «aprobado, sin entregar», con nombre y fecha", { rol: "recepcion" }],
      ["CA-001-40", "Un equipo vencido sin devolver no está disponible en fechas posteriores (Portátil 04)", { rol: "empleado", desde: "2026-11-16", hasta: "2026-11-17" }],
      ["CA-001-46", "Recepción ve el Portátil 04 marcado como vencido, con días de atraso, nombre y fecha prevista; sin lista aparte", { rol: "recepcion" }],
      ["CA-001-06", "Persona externa: sin acceso", { rol: "externa" }],
      ["CA-001-36", "Recepción abre el préstamo: nombre, correo, equipo, fechas y estado", { rol: "recepcion", prestamo: "L-101" }]
    ],
    "P01-A02": [
      ["CA-001-07", "Solicitud válida: pendiente de aprobación", { rol: "empleado", enviar: "1", equipo: "P02", desde: "2026-11-16", hasta: "2026-11-18" }],
      ["CA-001-08", "Equipo no disponible en esas fechas", { rol: "empleado", enviar: "1", equipo: "P03", desde: "2026-11-13", hasta: "2026-11-14" }],
      ["CA-001-09", "Inicio anterior a hoy", { rol: "empleado", enviar: "1", equipo: "P02", desde: "2026-11-09", hasta: "2026-11-13" }],
      ["CA-001-10", "Devolución anterior al inicio", { rol: "empleado", enviar: "1", equipo: "P02", desde: "2026-11-16", hasta: "2026-11-13" }],
      ["CA-001-11", "Falta el día de devolución", { rol: "empleado", enviar: "1", equipo: "P02", desde: "2026-11-16", hasta: "" }],
      ["CA-001-12", "Persona externa: se le impide", { rol: "externa" }],
      ["CA-001-35", "Más del máximo de días", { rol: "empleado", enviar: "1", equipo: "P02", desde: "2026-11-16", hasta: "2026-11-24" }]
    ],
    "P01-A03": [
      ["CA-001-07", "La solicitud pendiente aparece en «Mis solicitudes»", { rol: "empleado" }],
      ["CA-001-13", "La solicitud aprobada se ve como aprobada", { rol: "empleado" }],
      ["CA-001-14", "La solicitud rechazada muestra el motivo", { rol: "empleado" }],
      ["CA-001-37", "El empleado ve solo lo suyo, con su nombre, y nada de otras personas", { rol: "empleado" }],
      ["CA-001-41", "De la más reciente a la más antigua, con equipo, inicio, devolución y estado", { rol: "empleado" }],
      ["CA-001-42", "Préstamo entregado con su devolución prevista (Videobeam 02)", { rol: "empleado" }],
      ["CA-001-43", "Préstamo devuelto con su fecha de devolución (Portátil 06)", { rol: "empleado" }],
      ["CA-001-44", "Préstamo vencido con sus días de atraso (Portátil 04)", { rol: "empleado" }]
    ],
    "P01-A04": [
      ["CA-001-13", "Aprobar una solicitud", { rol: "recepcion", resultado: "aprobada", id: "L-109" }],
      ["CA-001-14", "Rechazar con motivo", { rol: "recepcion", resultado: "rechazada", id: "L-109", motivo: "El equipo está reservado para una capacitación" }],
      ["CA-001-15", "Rechazar sin motivo", { rol: "recepcion", resultado: "rechazada", id: "L-109", motivo: "" }],
      ["CA-001-16", "Aprobar con cruce de fechas", { rol: "recepcion", resultado: "aprobada", id: "L-103" }],
      ["CA-001-17", "Rechazar una solicitud ya aprobada", { rol: "recepcion", resultado: "rechazada", id: "L-102", motivo: "Ya no se necesita" }],
      ["CA-001-45", "Aprobar una solicitud ya rechazada", { rol: "recepcion", resultado: "aprobada", id: "L-111" }],
      ["CA-001-18", "Empleado: se le impide", { rol: "empleado" }],
      ["CA-001-18", "Jefe administrativo: se le impide", { rol: "jefe" }]
    ],
    "P01-A05": [
      ["CA-001-19", "Registrar la entrega de un préstamo aprobado", { rol: "recepcion", resultado: "entregado", id: "L-104" }],
      ["CA-001-20", "Entregar una solicitud pendiente", { rol: "recepcion", resultado: "entregado", id: "L-110" }],
      ["CA-001-24", "Empleado: se le impide", { rol: "empleado" }]
    ],
    "P01-A06": [
      ["CA-001-21", "Devolver el último día: sin atraso", { rol: "recepcion", resultado: "devuelto", id: "L-108" }],
      ["CA-001-22", "Devolver con 2 días de atraso", { rol: "recepcion", resultado: "devuelto", id: "L-107" }],
      ["CA-001-23", "Devolver un préstamo sin entrega", { rol: "recepcion", resultado: "devuelto", id: "L-102" }],
      ["CA-001-24", "Jefe administrativo: se le impide", { rol: "jefe" }]
    ],
    "P01-A07": [
      ["CA-001-25", "El correo: asunto «Préstamo vencido: …», remitente «Préstamo de equipos» y el mensaje del criterio", { rol: "empleado" }],
      ["CA-001-26", "No se envía el día de la devolución prevista (regla; ver «Cómo funciona el aviso»)", null],
      ["CA-001-27", "No se envía si ya se devolvió (regla)", null],
      ["CA-001-28", "No hay segundo recordatorio (regla)", null],
      ["CA-001-29", "Solo lo recibe quien tiene el préstamo vencido (regla)", null]
    ],
    "P01-A08": [
      ["CA-001-30", "Equipos más prestados, acumulado y sin filtro de periodo, de mayor a menor", { rol: "jefe" }],
      ["CA-001-38", "El ranking muestra solo equipo y número de préstamos, sin nombre ni correo", { rol: "jefe" }],
      ["CA-001-31", "Préstamos vencidos con nombre y correo de la persona, equipo, fecha prevista y días de atraso (hay uno de 2 días)", { rol: "jefe" }],
      ["CA-001-32", "Un préstamo devuelto con atraso no aparece como vencido (el Portátil 06 del 4 al 6 nov)", { rol: "jefe" }],
      ["CA-001-33", "Sin préstamos vencidos", { rol: "jefe", estado: "vacio" }],
      ["CA-001-34", "Recepción: se le impide", { rol: "recepcion" }]
    ]
  };

  function pintarRevision() {
    if (!REV) return;
    cuerpo.classList.add("modo-revision");
    var caja = el("div", { clase: "revision__caja", role: "region", "aria-label": "Modo revisión" });
    caja.appendChild(el("h2", { texto: "Modo revisión · " + PANT }));
    if (cuerpo.dataset.criterios) caja.appendChild(el("p", {}, [el("strong", { texto: "Historia y criterios que ilustra: " }), cuerpo.dataset.criterios + ". Historias del PR #3 en revisión (borrador hasta que se aprueben)."]));
    if (!esInicio) {
      var estados = el("div", { clase: "revision__estados" });
      ESTADOS.forEach(function (e) {
        var a = el("a", { href: enlace(window.location.href, { estado: e === "normal" ? null : e }), "data-fijo": "", texto: NOMBRES_ESTADO[e] });
        if (e === ESTADO) a.setAttribute("aria-current", "true");
        estados.appendChild(a);
      });
      caja.appendChild(el("p", { texto: "Estado de la pantalla:" }));
      caja.appendChild(estados);
    }
    var casos = CASOS[PANT];
    if (casos) {
      caja.appendChild(el("p", { texto: "Casos de los criterios (abren la pantalla con ese caso):" }));
      var ul = el("ul", { clase: "revision__casos" });
      casos.forEach(function (c) {
        var base = pagina();
        var u = c[2] ? new URL(base, window.location.href) : null;
        var contenido;
        if (u) {
          Object.keys(c[2]).forEach(function (k) { if (c[2][k] === null) u.searchParams.delete(k); else u.searchParams.set(k, c[2][k]); });
          if (REV) u.searchParams.set("revision", "1");
          contenido = el("a", { href: u.href, "data-fijo": "", texto: c[1] });
        } else contenido = document.createTextNode(c[1]);
        ul.appendChild(el("li", {}, [el("strong", { texto: c[0] + ": " }), contenido]));
      });
      caja.appendChild(ul);
    }
    caja.appendChild(el("p", { texto: "Hoy simulado: " + fechaLarga(D.hoy) + ", " + D.hora + ". Los datos de los criterios son ejemplos; los textos que no vienen de un criterio están marcados [propuesta] en mapa.md." }));
    var cont = $("#revision") || cuerpo.appendChild(el("div", { id: "revision" }));
    cont.className = "revision";
    cont.appendChild(caja);
  }

  // ---------- arranque ----------
  pintarCabecera();
  var vista = $("#vista");
  if (R[PANT]) R[PANT](vista || cuerpo);
  $$("table.tabla-apilable").forEach(function (t) {
    var cab = $$("thead th", t).map(function (th) { return th.textContent; });
    $$("tbody tr", t).forEach(function (tr) { $$("td", tr).forEach(function (td, i) { if (!td.dataset.etiqueta && !td.classList.contains("col-acciones")) td.setAttribute("data-etiqueta", cab[i] || ""); }); });
  });
  reescribirEnlaces(document);
  pintarRevision();
})();
