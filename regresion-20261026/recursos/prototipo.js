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
  function prestamoDe(equipoId) { return D.prestamos.filter(function (p) { return p.equipo === equipoId; })[0]; }
  function retraso(p) { return Math.max(0, entreDias(p.vence, D.hoy)); }
  function hasta(desde, dias) { return sumarDias(desde, dias - 1); }

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
    "P01-A01": { archivo: "P01-A01-consultar-equipos.html", nav: "Equipos", icono: "laptop", roles: TODOS },
    "P01-A02": { archivo: "P01-A02-solicitar-prestamo.html", nav: "Pedir préstamo", icono: "mas", roles: TODOS },
    "P01-A03": { archivo: "P01-A03-aprobar-solicitud.html", nav: "Solicitudes", icono: "lista", roles: ["recepcion"] },
    "P01-A04": { archivo: "P01-A04-registrar-entrega.html", nav: "Entregas", icono: "caja", roles: ["recepcion"] },
    "P01-A05": { archivo: "P01-A05-registrar-devolucion.html", nav: "Devoluciones", icono: "devolver", roles: ["recepcion"] },
    "P01-A06": { archivo: "P01-A06-recibir-recordatorio.html", nav: "Recordatorio", icono: "correo", roles: TODOS },
    "P01-A07": { archivo: "P01-A07-ver-resumen.html", nav: "Resumen", icono: "grafico", roles: ["jefe"] }
  };
  var ORDEN = ["P01-A01", "P01-A02", "P01-A03", "P01-A04", "P01-A05", "P01-A06", "P01-A07"];
  function rolPermitido(id) { return P[id].roles.indexOf(ROL) >= 0; }
  function ruta(id, extra) { return enlace(PREF + P[id].archivo, extra); }

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
    var rol = el("div", { clase: "rol" }, [el("label", { for: "selector-rol", texto: "Rol activo" }), selector, el("span", { clase: "rol__quien", texto: persona(yo()).nombre })]);
    panel.appendChild(el("div", { clase: "cab__panel-fila" }, [nav, rol]));
    boton.addEventListener("click", function () {
      var abierto = panel.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
    cont.appendChild(el("div", { clase: "banda", role: "note", texto: "Demo de muestra: nada se guarda ni se envía, y todos los datos son inventados." }));
    cont.appendChild(el("header", { clase: "cab" }, [el("div", { clase: "cab__fila" }, [marca, boton]), panel]));
  }

  // ---------- piezas de pantalla ----------
  function encabezado(id, titulo, ayuda) {
    return el("div", { clase: "encabezado-pantalla" }, [
      el("p", { clase: "encabezado-pantalla__ruta", texto: "Préstamo de equipos · " + id.replace("P01-", "") }),
      el("h1", { texto: titulo }),
      ayuda ? el("p", { clase: "encabezado-pantalla__ayuda", texto: ayuda }) : null
    ]);
  }
  function mensaje(tipo, icon, contenido, rolAlerta) {
    var m = el("div", { clase: "mensaje mensaje--" + tipo }, [icono(icon), el("div", { clase: "mensaje__cuerpo" }, contenido)]);
    if (rolAlerta) m.setAttribute("role", rolAlerta);
    return m;
  }
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
    return mensaje("error", "alerta", [el("p", {}, [el("strong", { texto: D.textos.errorCarga })]), el("a", { href: window.location.pathname.split("/").pop() + "?rol=" + ROL, "data-fijo": "", texto: "Intentar de nuevo" })], "alert");
  }
  function tabla(columnas, filas, claseExtra) {
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
  // Devuelve true si la pantalla ya quedó pintada (sin acceso, cargando o error).
  function estadosComunes(v, id) {
    if (!rolPermitido(id)) {
      var aviso = id === "P01-A07" ? D.textos.sinAccesoJefe : D.textos.sinAccesoRecepcion;
      v.appendChild(mensaje("aviso", "candado", [el("p", {}, [el("strong", { texto: aviso })]), el("p", { texto: "Cambia el rol activo arriba para verla." }), el("a", { href: PREF + P["P01-A01"].archivo, texto: "Ir a consultar equipos" })], "status"));
      return true;
    }
    if (ESTADO === "cargando") { v.appendChild(cargando()); return true; }
    if (ESTADO === "error") { v.appendChild(errorCarga()); return true; }
    return false;
  }

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
      var a = el("a", { href: PREF + P[id].archivo, texto: P[id].nav === "Equipos" ? "Consultar equipos disponibles" : TITULOS[id] });
      var quien = P[id].roles.length === 3 ? "Todos los roles" : D.roles[P[id].roles[0]].nombre;
      lista.appendChild(el("li", { clase: "paso" }, [el("span", {}, [a, el("small", { texto: quien })])]));
    });
  };
  var TITULOS = {
    "P01-A01": "Consultar equipos disponibles", "P01-A02": "Solicitar un préstamo por días", "P01-A03": "Aprobar o rechazar solicitudes",
    "P01-A04": "Registrar la entrega", "P01-A05": "Registrar la devolución", "P01-A06": "Recordatorio de vencimiento", "P01-A07": "Resumen para el jefe administrativo"
  };

  function tarjetaEquipo(e) {
    var pr = prestamoDe(e.id);
    var libre = !pr;
    var ven = pr && retraso(pr) > 0;
    var pie = el("div", { clase: "equipo__pie" });
    if (libre) {
      pie.appendChild(insignia("exito", "Disponible", "check"));
      pie.appendChild(el("a", { clase: "boton", href: PREF + P["P01-A02"].archivo + "?equipo=" + e.id, "aria-label": "Pedir prestado: " + e.nombre, texto: "Pedir prestado" }));
    } else {
      pie.appendChild(insignia(ven ? "aviso" : "info", "Prestado", "reloj"));
      pie.appendChild(el("span", { clase: "texto-2 pequeno", texto: ven ? "Debía volver el " + fechaCorta(pr.vence) : "Vuelve el " + fechaCorta(pr.vence) }));
    }
    return el("article", { clase: "tarjeta equipo" + (libre ? "" : " equipo--prestado"), "aria-label": e.nombre }, [
      el("div", { clase: "equipo__cab" }, [el("span", { clase: "equipo__icono" }, [icono(e.tipo === "portatil" ? "laptop" : "videobeam", "icono--lg")]),
        el("div", {}, [el("p", { clase: "equipo__codigo", texto: e.id }), el("h3", { texto: e.nombre })])]),
      pie
    ]);
  }

  R["P01-A01"] = function (v) {
    v.appendChild(encabezado("P01-A01", TITULOS["P01-A01"], "Mira qué portátiles y videobeams están libres hoy y pide el que necesites."));
    if (estadosComunes(v, "P01-A01")) return;
    var lista = ESTADO === "vacio" ? [] : D.equipos;
    var mio = D.prestamos.filter(function (p) { return p.persona === yo() && retraso(p) > 0; })[0];
    if (mio && ESTADO !== "vacio") {
      v.appendChild(mensaje("aviso", "alerta", [el("p", {}, [el("strong", { texto: "Tienes un préstamo vencido: " }), equipo(mio.equipo).nombre + " debía volver el " + fechaCorta(mio.vence) + "."]), el("a", { href: PREF + P["P01-A06"].archivo + "?id=" + mio.id, texto: "Ver el recordatorio" })], "status"));
    }
    if (!lista.length) { v.appendChild(vacio("laptop", D.textos.sinDisponibles)); v.appendChild(siguiente("P01-A02")); return; }
    var libres = lista.filter(function (e) { return !prestamoDe(e.id); }).length;
    v.appendChild(el("p", { clase: "texto-2" }, [el("strong", { texto: libres + " de " + lista.length + " equipos disponibles" }), " hoy, " + fechaLarga(D.hoy) + "."]));
    [["portatil", "Portátiles"], ["videobeam", "Videobeams"]].forEach(function (g) {
      var del = lista.filter(function (e) { return e.tipo === g[0]; }).sort(function (a, b) { return (prestamoDe(a.id) ? 1 : 0) - (prestamoDe(b.id) ? 1 : 0); });
      if (!del.length) return;
      var sec = el("section", { clase: "seccion", "aria-labelledby": "t-" + g[0] }, [el("h2", { id: "t-" + g[0], texto: g[1] })]);
      var rej = el("div", { clase: "rejilla rejilla--3" });
      del.forEach(function (e) { rej.appendChild(tarjetaEquipo(e)); });
      sec.appendChild(rej);
      v.appendChild(sec);
    });
    v.appendChild(siguiente("P01-A02"));
  };

  R["P01-A02"] = function (v) {
    v.appendChild(encabezado("P01-A02", TITULOS["P01-A02"], "Elige el equipo, desde qué día lo necesitas y por cuántos días."));
    if (ESTADO === "cargando") { v.appendChild(cargando()); return; }
    if (ESTADO === "error") { v.appendChild(mensaje("error", "alerta", [el("p", {}, [el("strong", { texto: D.textos.errorEnvio })])], "alert")); }
    var libres = D.equipos.filter(function (e) { return !prestamoDe(e.id); });
    var eq = q.get("equipo") && equipo(q.get("equipo")) && !prestamoDe(q.get("equipo")) ? q.get("equipo") : (libres[0] ? libres[0].id : "");
    var desde = q.get("desde") || sumarDias(D.hoy, 1);
    var dias = parseInt(q.get("dias") || "2", 10);
    if (ESTADO === "exito") {
      var f = equipo(eq) ? eq : libres[0].id;
      v.appendChild(mensaje("exito", "check", [el("p", {}, [el("strong", { texto: D.textos.solicitudEnviada })])], "status"));
      var dl = el("dl", {}, [el("dt", { texto: "Equipo" }), el("dd", { texto: equipo(f).nombre }), el("dt", { texto: "Desde" }), el("dd", { texto: fechaLarga(desde) }),
        el("dt", { texto: "Días" }), el("dd", { texto: String(dias) }), el("dt", { texto: "Devolución" }), el("dd", { texto: fechaLarga(hasta(desde, dias)) }), el("dt", { texto: "Solicita" }), el("dd", { texto: persona(yo()).nombre })]);
      v.appendChild(el("div", { clase: "resumen" }, [dl]));
      v.appendChild(el("div", { clase: "acciones" }, [el("a", { clase: "boton", href: PREF + P["P01-A01"].archivo, texto: "Volver a consultar equipos" }), el("a", { clase: "boton boton--secundario", href: PREF + P["P01-A02"].archivo, texto: "Pedir otro equipo" })]));
      v.appendChild(siguiente(null));
      return;
    }
    var vacioForm = ESTADO === "vacio";
    var sel = el("select", { id: "equipo", name: "equipo", "aria-describedby": "err-form" }, [el("option", { value: "", texto: "Elige un equipo" })]);
    libres.forEach(function (e) { sel.appendChild(el("option", { value: e.id, texto: e.id + " · " + e.nombre })); });
    sel.value = vacioForm ? "" : eq;
    var inDesde = el("input", { type: "date", id: "desde", name: "desde", min: sumarDias(D.hoy, 0) });
    inDesde.value = vacioForm ? "" : desde;
    var inDias = el("input", { type: "number", id: "dias", name: "dias", min: "1", step: "1", inputmode: "numeric" });
    inDias.value = vacioForm ? "" : String(dias);
    var aviso = el("div", { id: "err-form", clase: "campo__error oculto", role: "alert" }, [icono("alerta", "icono--sm"), el("span", { texto: D.textos.faltanDatos })]);
    var devol = el("span", { id: "devolucion", texto: "—" });
    var form = el("form", { clase: "tarjeta", novalidate: "novalidate" }, [
      el("div", { clase: "campo" }, [el("label", { for: "solicitante", texto: "Solicita" }), el("input", { id: "solicitante", value: persona(yo()).nombre, readonly: "readonly" })]),
      el("div", { clase: "campo" }, [el("label", { for: "equipo", texto: "Equipo" }), sel]),
      el("div", { clase: "filas-campos" }, [
        el("div", { clase: "campo" }, [el("label", { for: "desde", texto: "Desde el día" }), inDesde]),
        el("div", { clase: "campo" }, [el("label", { for: "dias", texto: "Número de días" }), inDias, el("span", { clase: "campo__ayuda" }, [el("span", { clase: "suposicion", texto: "El día de inicio cuenta como el primer día." })])])
      ]),
      el("p", { clase: "resumen" }, [el("strong", { texto: "Devuelves el: " }), devol]),
      aviso,
      el("div", { clase: "acciones" }, [el("button", { clase: "boton", type: "submit", texto: "Enviar solicitud" }), el("a", { clase: "boton boton--secundario", href: PREF + P["P01-A01"].archivo, texto: "Volver a consultar equipos" })])
    ]);
    function actualizar() {
      var n = parseInt(inDias.value, 10);
      devol.textContent = inDesde.value && n >= 1 ? fechaLarga(hasta(inDesde.value, n)) : "—";
    }
    inDesde.addEventListener("input", actualizar); inDias.addEventListener("input", actualizar); actualizar();
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = parseInt(inDias.value, 10);
      var malos = [[sel, !sel.value], [inDesde, !inDesde.value], [inDias, !(n >= 1)]];
      malos.forEach(function (m) { m[0].parentNode.classList.toggle("campo--error", m[1]); if (m[1]) m[0].setAttribute("aria-invalid", "true"); else m[0].removeAttribute("aria-invalid"); });
      var hayError = malos.some(function (m) { return m[1]; });
      aviso.classList.toggle("oculto", !hayError);
      if (hayError) return;
      ir(window.location.pathname.split("/").pop(), { estado: "exito", equipo: sel.value, desde: inDesde.value, dias: String(n) });
    });
    v.appendChild(form);
    v.appendChild(siguiente(null));
  };

  function filasSolicitud(lista, botones) {
    return lista.map(function (s) {
      return [equipo(s.equipo).nombre, persona(s.persona).nombre, fechaCorta(s.desde), plural(s.dias, "día", "días") + " (hasta el " + fechaCorta(hasta(s.desde, s.dias)) + ")", { acciones: botones(s) }];
    });
  }
  function primero(lista) { var id = q.get("id"); return lista.filter(function (x) { return x.id === id; })[0] || lista[0]; }

  R["P01-A03"] = function (v) {
    v.appendChild(encabezado("P01-A03", TITULOS["P01-A03"], "Cada solicitud se aprueba o se rechaza. Si la apruebas, pasa a entrega."));
    if (estadosComunes(v, "P01-A03")) return;
    var res = q.get("resultado") || (ESTADO === "exito" ? "aprobada" : "");
    var cual = primero(D.solicitudes);
    if (res === "aprobada") v.appendChild(mensaje("exito", "check", [el("p", {}, [el("strong", { texto: "Solicitud " + cual.id + " aprobada. " }), equipo(cual.equipo).nombre + " para " + persona(cual.persona).nombre + "."]), el("a", { href: PREF + P["P01-A04"].archivo, texto: "Registrar la entrega" })], "status"));
    if (res === "rechazada") v.appendChild(mensaje("info", "info", [el("p", {}, [el("strong", { texto: "Solicitud " + cual.id + " rechazada. " }), equipo(cual.equipo).nombre + " para " + persona(cual.persona).nombre + " sigue disponible."])], "status"));
    var lista = ESTADO === "vacio" ? [] : D.solicitudes.filter(function (s) { return !res || s.id !== cual.id; });
    if (!lista.length) { v.appendChild(vacio("lista", D.textos.sinSolicitudes)); v.appendChild(siguiente("P01-A04")); return; }
    var sec = el("section", { clase: "seccion", "aria-labelledby": "t-sol" }, [el("h2", { id: "t-sol" }, ["Por resolver ", insignia("info", String(lista.length))])]);
    sec.appendChild(tabla(["Equipo", "Solicita", "Desde", "Duración", "Decisión"], filasSolicitud(lista, function (s) {
      return [el("div", { clase: "par-decision" }, [
        el("a", { clase: "boton", href: window.location.pathname.split("/").pop() + "?resultado=aprobada&id=" + s.id, "aria-label": "Aprobar la solicitud " + s.id, texto: "Aprobar" }),
        el("a", { clase: "boton boton--peligro", href: window.location.pathname.split("/").pop() + "?resultado=rechazada&id=" + s.id, "aria-label": "Rechazar la solicitud " + s.id, texto: "Rechazar" })])];
    })));
    v.appendChild(sec);
    v.appendChild(siguiente("P01-A04"));
  };

  R["P01-A04"] = function (v) {
    v.appendChild(encabezado("P01-A04", TITULOS["P01-A04"], "Cuando la persona recoge el equipo, registra la entrega."));
    if (estadosComunes(v, "P01-A04")) return;
    var res = q.get("resultado") || (ESTADO === "exito" ? "entregado" : "");
    var cual = primero(D.porEntregar);
    if (res === "entregado") v.appendChild(mensaje("exito", "check", [el("p", {}, [el("strong", { texto: "Entrega registrada: " }), equipo(cual.equipo).nombre + " a " + persona(cual.persona).nombre + ", " + fechaLarga(D.hoy) + ", " + D.hora + ". Debe volver el " + fechaLarga(hasta(cual.desde, cual.dias)) + "."]), el("a", { href: PREF + P["P01-A05"].archivo, texto: "Ir a devoluciones" })], "status"));
    var lista = ESTADO === "vacio" ? [] : D.porEntregar.filter(function (s) { return !res || s.id !== cual.id; });
    if (!lista.length) { v.appendChild(vacio("caja", D.textos.sinEntregas)); v.appendChild(siguiente("P01-A05")); return; }
    var sec = el("section", { clase: "seccion", "aria-labelledby": "t-ent" }, [el("h2", { id: "t-ent" }, ["Por entregar ", insignia("info", String(lista.length))])]);
    sec.appendChild(tabla(["Equipo", "Solicita", "Desde", "Duración", "Registro"], filasSolicitud(lista, function (s) {
      return [el("a", { clase: "boton", href: window.location.pathname.split("/").pop() + "?resultado=entregado&id=" + s.id, "aria-label": "Registrar la entrega de " + equipo(s.equipo).nombre, texto: "Registrar entrega" })];
    })));
    v.appendChild(sec);
    v.appendChild(siguiente("P01-A05"));
  };

  R["P01-A05"] = function (v) {
    v.appendChild(encabezado("P01-A05", TITULOS["P01-A05"], "Cuando la persona regresa el equipo, registra la devolución."));
    if (estadosComunes(v, "P01-A05")) return;
    var res = q.get("resultado") || (ESTADO === "exito" ? "devuelto" : "");
    var ordenados = D.prestamos.slice().sort(function (a, b) { return retraso(b) - retraso(a) || (a.vence < b.vence ? -1 : 1); });
    var cual = primero(ordenados);
    if (res === "devuelto") v.appendChild(mensaje("exito", "check", [el("p", {}, [el("strong", { texto: "Devolución registrada: " }), equipo(cual.equipo).nombre + " de " + persona(cual.persona).nombre + ", " + fechaLarga(D.hoy) + ", " + D.hora + ". El equipo queda disponible."])], "status"));
    var lista = ESTADO === "vacio" ? [] : ordenados.filter(function (p) { return !res || p.id !== cual.id; });
    if (!lista.length) { v.appendChild(vacio("devolver", D.textos.sinPrestamos)); v.appendChild(siguiente("P01-A06", "Ver el recordatorio")); return; }
    var sec = el("section", { clase: "seccion", "aria-labelledby": "t-dev" }, [el("h2", { id: "t-dev" }, ["Equipos prestados ", insignia("info", String(lista.length))])]);
    sec.appendChild(tabla(["Equipo", "Lo tiene", "Entregado", "Vence", "Estado", "Registro"], lista.map(function (p) {
      var r = retraso(p);
      var acc = [el("a", { clase: "boton", href: window.location.pathname.split("/").pop() + "?resultado=devuelto&id=" + p.id, "aria-label": "Registrar la devolución de " + equipo(p.equipo).nombre, texto: "Registrar devolución" })];
      if (r > 0) acc.push(el("a", { clase: "boton boton--secundario", href: PREF + P["P01-A06"].archivo + "?id=" + p.id, texto: "Ver recordatorio" }));
      return [equipo(p.equipo).nombre, persona(p.persona).nombre, fechaCorta(p.entrega) + ", " + p.horaEntrega, fechaCorta(p.vence),
        { nodo: r > 0 ? insignia("error", "Vencido hace " + plural(r, "día", "días"), "alerta") : insignia("exito", "A tiempo", "check") }, { acciones: acc }];
    })));
    v.appendChild(sec);
    v.appendChild(siguiente("P01-A06", "Ver el recordatorio"));
  };

  R["P01-A06"] = function (v) {
    v.appendChild(encabezado("P01-A06", TITULOS["P01-A06"], "Así le llega el aviso a quien no devolvió el equipo a tiempo (ejemplo)."));
    if (estadosComunes(v, "P01-A06")) return;
    if (ESTADO === "vacio") { v.appendChild(vacio("check", D.textos.sinVencidos, "Volver a consultar equipos", PREF + P["P01-A01"].archivo)); v.appendChild(siguiente(null)); return; }
    var venc = D.prestamos.filter(function (p) { return retraso(p) > 0; });
    var p = venc.filter(function (x) { return x.id === q.get("id"); })[0] || venc.filter(function (x) { return x.persona === yo(); })[0] || venc[0];
    var e = equipo(p.equipo), nombre = persona(p.persona).nombre;
    var r = retraso(p);
    var c = el("article", { clase: "tarjeta correo", "aria-label": "Recordatorio de vencimiento" }, [
      el("div", { clase: "correo__cab" }, [icono("correo", "icono--lg"), el("div", {}, [el("p", { clase: "equipo__codigo", texto: "RECORDATORIO · " + fechaLarga(D.hoy) }), el("h2", { texto: "Devuelve " + e.nombre })])]),
      el("div", { clase: "correo__cuerpo" }, [
        el("p", { texto: "Hola, " + nombre.split(" ")[0] + "." }),
        el("p", {}, ["El préstamo de ", el("strong", { texto: e.nombre }), " terminaba el ", el("strong", { texto: fechaLarga(p.vence) }), ". Ya van ", el("strong", { texto: plural(r, "día", "días") }), " de retraso."]),
        el("p", { texto: "Por favor llévalo a recepción para registrar la devolución." }),
        insignia("error", "Vencido hace " + plural(r, "día", "días"), "alerta")
      ])
    ]);
    v.appendChild(c);
    v.appendChild(siguiente("P01-A07", "Siguiente: resumen del jefe"));
  };

  R["P01-A07"] = function (v) {
    v.appendChild(encabezado("P01-A07", TITULOS["P01-A07"], "Qué equipos se prestan más y quién tiene préstamos vencidos."));
    if (estadosComunes(v, "P01-A07")) return;
    var vac = ESTADO === "vacio";
    var sec1 = el("section", { clase: "seccion", "aria-labelledby": "t-rank" }, [el("h2", { id: "t-rank", texto: "Equipos que más se prestan" })]);
    if (vac) sec1.appendChild(vacio("grafico", D.textos.sinResumen));
    else {
      var orden = D.ranking.slice().sort(function (a, b) { return b.veces - a.veces; }), max = orden[0].veces;
      var ul = el("ol", { clase: "ranking" });
      orden.forEach(function (r) {
        var barra = el("span", { clase: "ranking__barra", "aria-hidden": "true" }, [el("span", { clase: "ranking__relleno" })]);
        barra.firstChild.style.width = Math.round(r.veces / max * 100) + "%";
        ul.appendChild(el("li", { clase: "ranking__item" }, [el("span", { clase: "ranking__nombre", texto: equipo(r.equipo).nombre }), el("span", { clase: "ranking__valor", texto: plural(r.veces, "préstamo", "préstamos") }), barra]));
      });
      sec1.appendChild(el("div", { clase: "tarjeta" }, [ul]));
    }
    v.appendChild(sec1);
    var venc = vac ? [] : D.prestamos.filter(function (p) { return retraso(p) > 0; }).sort(function (a, b) { return retraso(b) - retraso(a); });
    var sec2 = el("section", { clase: "seccion", "aria-labelledby": "t-venc" }, [el("h2", { id: "t-venc" }, ["Préstamos vencidos ", insignia(venc.length ? "error" : "exito", String(venc.length))])]);
    if (!venc.length) sec2.appendChild(vacio("check", D.textos.sinVencidosJefe));
    else sec2.appendChild(tabla(["Equipo", "Lo tiene", "Debía volver el", "Retraso"], venc.map(function (p) {
      return [equipo(p.equipo).nombre, persona(p.persona).nombre, fechaCorta(p.vence), { nodo: insignia("error", plural(retraso(p), "día", "días"), "alerta") }];
    })));
    v.appendChild(sec2);
    v.appendChild(siguiente(null));
  };

  // ---------- modo revisión ----------
  function pintarRevision() {
    if (!REV) return;
    cuerpo.classList.add("modo-revision");
    var caja = el("div", { clase: "revision__caja", role: "region", "aria-label": "Modo revisión" });
    caja.appendChild(el("h2", { texto: "Modo revisión · " + PANT }));
    if (cuerpo.dataset.criterios) caja.appendChild(el("p", {}, [el("strong", { texto: "Texto del cliente que ilustra: " }), cuerpo.dataset.criterios + ". Las historias de Grace aún no existen; se asocian al texto del cliente (ver mapa.md)."]));
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
    caja.appendChild(el("p", { texto: "Hoy simulado: " + fechaLarga(D.hoy) + ", " + D.hora + ". Los textos de la interfaz que no vienen del cliente están en «Decisiones tomadas» de mapa.md." }));
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
