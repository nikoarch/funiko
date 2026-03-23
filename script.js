let datosCompletos = [];
let categoriaActual = 'todos';
let filtroEstadoActual = 'todos';
let statsReveladas = false;
let indicesFotos = {};
let idAbiertoLightbox = null;
let xDown = null;                                                        
let yDown = null;

const urlParams = new URLSearchParams(window.location.search);
const paramSecreto = urlParams.get('secreto');

// Si el parámetro es 'yes', guardamos en memoria local
if (paramSecreto === 'yes') {
    localStorage.setItem('modoSecreto', 'true');
} 
// Si el parámetro es 'no', borramos de memoria local
else if (paramSecreto === 'no') {
    localStorage.removeItem('modoSecreto');
}

// El modo secreto se activa si el parámetro es 'yes' O si ya estaba guardado en memoria
const esModoSecreto = (paramSecreto === 'yes') || (localStorage.getItem('modoSecreto') === 'true');

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});

async function cargarDatos() {
    try {
        const respuesta = await fetch('Funiko_BBDD.json?t=' + new Date().getTime());
        if (!respuesta.ok) throw new Error("JSON no encontrado");
        datosCompletos = await respuesta.json();
        
        // Inicializamos los índices de fotos para todos los elementos
        datosCompletos.forEach((_, index) => {
            indicesFotos[index] = 0;
        });

        generarBotonesFiltro();
        filtrarTodo();
    } catch (e) { 
        console.error("Error al cargar datos:", e); 
    }
}

function render(items) {
    const grid = document.getElementById('collection-grid');
    const contadorDiv = document.getElementById('contador');
    if (!grid) return;

    // Función auxiliar para formatear valores "-" como "N/A"
    const f = (v) => (v === '-' || v === '' || v === null || v === undefined) ? 'N/A' : v;

    grid.innerHTML = '';
    let totalInv = 0;
    let itemsConPrecio = 0;

    items.forEach(item => {
        // Limpiamos el texto: quitamos '€', cambiamos ',' por '.' y quitamos espacios
        const precioLimpio = item.precio.replace('€','').replace(',','.').trim();
        const p = parseFloat(precioLimpio);
        
        if(!isNaN(p) && p > 0) { 
            totalInv += p; 
            itemsConPrecio++; 
        }
    });

    const promedio = itemsConPrecio > 0 ? (totalInv / itemsConPrecio).toFixed(2) : 0;
    if (contadorDiv) {
        if (esModoSecreto) {
            contadorDiv.innerHTML = `
                <div class="stat-pill pill-count"><span><img src="imagenes/funkoIcon.png" alt="Icono" class="stat-icon"></span><span><b>${items.length}</b></span><span>Funkos</span></div>
                <div class="stat-pill pill-price blur-stat ${statsReveladas ? 'revealed' : ''}"><span>📊</span><span>Media:</span><span><b>${promedio}€</b></span></div>
            `;
            
            const mediaPill = contadorDiv.querySelector('.pill-price');
            if (mediaPill) {
                mediaPill.onclick = () => {
                    statsReveladas = !statsReveladas;
                    render(items); // Re-renderizamos para sincronizar ambos indicadores
                };
            }
        } else {
            contadorDiv.innerHTML = `
                <div class="stat-pill pill-count"><span><img src="imagenes/funkoIcon.png" alt="Icono" class="stat-icon"></span><span><b>${items.length}</b></span><span>Funkos</span></div>
            `;
        }
    }

    const footerInv = document.getElementById('footer-inversion');
    if (footerInv) {
        if (esModoSecreto) {
            footerInv.innerHTML = `<div class="stat-pill pill-total blur-stat ${statsReveladas ? 'revealed' : ''}"><span>💰</span><span>Inversión:</span><span><b>${totalInv.toFixed(2)}€</b></span></div>`;
            
            const totalPill = footerInv.querySelector('.pill-total');
            if (totalPill) {
                totalPill.onclick = () => {
                    statsReveladas = !statsReveladas;
                    render(items);
                };
            }
        } else {
            footerInv.innerHTML = '';
        }
    }

    items.forEach((item, index) => {
        const realID = datosCompletos.indexOf(item);
        const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
        if (!(realID in indicesFotos)) indicesFotos[realID] = 0;

        let claseEstado = 'estado-default';
        const estadoLimpio = item.estadoPedido ? item.estadoPedido.toLowerCase().trim() : '';
        if (estadoLimpio === 'recibido') claseEstado = 'estado-recibido';
        else if (estadoLimpio.includes('transito') || estadoLimpio.includes('tránsito')) claseEstado = 'estado-transito';
        else if (estadoLimpio === 'preventa') claseEstado = 'estado-preventa';

        const card = document.createElement('div');
        card.className = 'card';
        
        // Lógica específica para el badge de precio (mostrar N/A si es 0)
        const precioBadge = (() => {
            const lp = item.precio.replace('€','').replace(',','.').trim();
            const val = parseFloat(lp);
            return (isNaN(val) || val <= 0 || item.precio === '-') ? 'N/A' : item.precio;
        })();

        card.innerHTML = `
            <div class="card-img-container" style="touch-action: pan-y;">
                <img id="img-${realID}" src="${fotos[indicesFotos[realID]]}" onerror="this.src='https://via.placeholder.com'">
                ${esModoSecreto ? `<div class="price-badge">${precioBadge}</div>` : ''}
                <div class="status-badge ${claseEstado}">${f(item.estadoPedido)}</div>
                ${fotos.length > 1 ? `
                <div class="nav-overlay">
                    <button class="nav-btn prev-btn">❮</button>
                    <button class="nav-btn next-btn">❯</button>
                </div>
                <div class="foto-counter" id="count-${realID}" style="position:absolute; bottom:8px; right:12px; font-size:0.75rem; background:rgba(0,0,0,0.6); padding:2px 8px; border-radius:10px; color:white;">
                    ${indicesFotos[realID] + 1}/${fotos.length}
                </div>` : ''}
            </div>
            <div class="card-content">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                    <div style="display:flex; flex-direction:column;">
                        <span class="category-tag">${f(item.franquicia)}</span>
                        <span class="tvshow-tag">${f(item.tvShow)}</span>
                    </div>
                    <span class="nro-funko-tag">#${f(item.nroFunko)}</span>
                </div>
                <h3>${f(item.personaje)}</h3>
                <div class="btn-group">
                    <button class="btn-detail btn-detail-trigger">📋 Detalles</button>
                    ${item.video && item.video !== '#' && item.video !== '-' ? `<a href="${item.video}" target="_blank" class="btn-video">▶ Video</a>` : '<span></span>'}
                </div>
            </div>`;
        
        const imgCont = card.querySelector('.card-img-container');
        
        imgCont.addEventListener('click', (e) => {
            if (!e.target.classList.contains('nav-btn')) abrirLightbox(realID);
        });

        const btnPrev = card.querySelector('.prev-btn');
        const btnNext = card.querySelector('.next-btn');
        if(btnPrev) btnPrev.onclick = (e) => { e.stopPropagation(); cambiarFoto(realID, -1); };
        if(btnNext) btnNext.onclick = (e) => { e.stopPropagation(); cambiarFoto(realID, 1); };

        card.querySelector('.btn-detail-trigger').onclick = () => verFichaTecnica(realID);

        // Soporte Táctil en Tarjeta
        imgCont.addEventListener('touchstart', (e) => {
            xDown = e.touches[0].clientX;                                      
            yDown = e.touches[0].clientY;                                      
        }, {passive: true});

        imgCont.addEventListener('touchmove', (e) => {
            if (!xDown || !yDown) return;
            let xDiff = xDown - e.touches[0].clientX;
            let yDiff = yDown - e.touches[0].clientY;

            if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 30) {
                cambiarFoto(realID, xDiff > 0 ? 1 : -1);
                xDown = null; yDown = null;
            }
        }, {passive: true});

        grid.appendChild(card);
    });
}

function verFichaTecnica(id) {
    const item = datosCompletos[id];
    const f = (v) => (v === '-' || v === '' || v === null || v === undefined) ? 'N/A' : v;
    const sub = item.subtienda && item.subtienda !== '-' ? ` (${item.subtienda})` : '';
    const waveStyle = (item.fullWave === 'Si' || item.fullWave === 'So') ? 'color:#6ee7b7; font-weight:800;' : '';
    
    // Si tvShow es igual a franquicia, mostramos "TV Show" para evitar repetición
    const tvShowDisplay = (item.tvShow === item.franquicia) ? "TV Show" : f(item.tvShow);
    
    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin:0 0 5px; color:white;">${f(item.personaje)}</h2>
        <p style="color:var(--primary); font-weight:bold; margin-bottom:20px;">${f(item.franquicia)} · ${f(item.linea)} · ${tvShowDisplay}</p>
        <div class="modal-info-grid">
            <div class="info-item">Fecha Compra<b>${f(item.fecha)}</b></div>
            <div class="info-item">Lanzamiento<b>${f(item.fechaLanzamiento)}</b></div>
            <div class="info-item">Nº Serie<b>${f(item.nroSerie)}</b></div>
            <div class="info-item">Tienda<b>${f(item.compradoEn)}${sub}</b></div>
            ${esModoSecreto ? `<div class="info-item">Gastos Envío<b>${f(item.gastosEnvio)}</b></div>` : ''}
            <div class="info-item">Full Wave<b style="${waveStyle}">${f(item.fullWave)}</b></div>
            <div class="info-item">Estado Pieza<b>${f(item.estado)}</b></div>
        </div>
        <div class="notes-box" style="margin-top: 15px; border-left-color: #a855f7;"><strong>✨ Especial:</strong><br>${f(item.caracteristicasEspeciales) === 'N/A' ? 'Sin características especiales.' : item.caracteristicasEspeciales}</div>
        <div class="notes-box" style="margin-top: 15px; border-left-color: #eab308;"><strong>📦 Estado Caja:</strong><br>${f(item.estadoCaja) === 'N/A' ? 'Sin detalles del estado.' : item.estadoCaja}</div>
        <div class="notes-box"><strong>📝 Notas:</strong><br>${f(item.notas) === 'N/A' ? 'Sin notas.' : item.notas}</div>
    `;
    document.getElementById('infoModal').style.display = 'flex';
    
    // Añadimos una entrada al historial para capturar el botón atrás del móvil
    history.pushState({ modal: true }, "");
}

function cambiarFoto(id, dir) {
    const item = datosCompletos[id];
    if (!item) return;
    const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
    if (fotos.length <= 1) return;

    const imgElement = document.getElementById(`img-${id}`);
    const lbImgElement = document.getElementById('img-ampliada');
    const isThisIdOpenInLightbox = (idAbiertoLightbox === id);
    
    // Identificamos qué imágenes debemos actualizar y animar
    const targets = [];
    if (imgElement) targets.push(imgElement);
    if (isThisIdOpenInLightbox && lbImgElement) targets.push(lbImgElement);

    if (targets.length > 0) {
        targets.forEach(t => t.classList.add('img-changing'));
        
        setTimeout(() => {
            indicesFotos[id] = (indicesFotos[id] + dir + fotos.length) % fotos.length;
            const nuevaSrc = fotos[indicesFotos[id]];
            
            targets.forEach(target => {
                target.src = nuevaSrc;
                
                const finalizarAnimacion = () => target.classList.remove('img-changing');
                
                if (target.complete) {
                    finalizarAnimacion();
                } else {
                    target.onload = finalizarAnimacion;
                }
                // Seguridad por si falla el evento
                setTimeout(finalizarAnimacion, 400);
            });

            const countElement = document.getElementById(`count-${id}`);
            if (countElement) countElement.innerText = `${indicesFotos[id] + 1}/${fotos.length}`;
        }, 150);
    }
}

function abrirLightbox(id) {
    idAbiertoLightbox = id;
    const item = datosCompletos[id];
    const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
    const imgAmpliada = document.getElementById('img-ampliada');
    imgAmpliada.src = fotos[indicesFotos[id]];
    imgAmpliada.classList.remove('img-changing');
    document.getElementById('lightbox').style.display = 'flex';
    
    // Añadimos una entrada al historial para capturar el botón atrás del móvil
    history.pushState({ lightbox: true }, "");
}

function cerrarLightbox() { 
    if (idAbiertoLightbox === null) return;
    
    document.getElementById('lightbox').style.display = 'none'; 
    idAbiertoLightbox = null; 
    
    // Si el cierre es manual (click en X o fuera), volvemos atrás en el historial para limpiarlo
    if (history.state && history.state.lightbox) {
        history.back();
    }
}

// Escuchador para detectar cuando el usuario pulsa el botón "Atrás" del móvil
window.addEventListener('popstate', (event) => {
    if (idAbiertoLightbox !== null) {
        // Cerramos el lightbox visualmente
        document.getElementById('lightbox').style.display = 'none';
        idAbiertoLightbox = null;
    }
    
    // Cerramos el modal de detalles si está abierto
    const modal = document.getElementById('infoModal');
    if (modal && modal.style.display === 'flex') {
        modal.style.display = 'none';
    }
});

function cerrarModal() { 
    const modal = document.getElementById('infoModal');
    if (modal.style.display === 'none') return;

    modal.style.display = 'none'; 
    
    // Si el cierre es manual, volvemos atrás en el historial para limpiarlo
    if (history.state && history.state.modal) {
        history.back();
    }
}

function filterByCategory(cat, btn) {
    document.querySelectorAll('#filter-container .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    categoriaActual = cat;
    filtrarTodo();
}

function filterByStatus(status, btn) {
    document.querySelectorAll('#status-filter-container .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filtroEstadoActual = status;
    filtrarTodo();
}

function generarBotonesFiltro() {
    const container = document.getElementById('filter-container');
    const btnTodos = document.getElementById('btn-todos');
    
    if (btnTodos) {
        btnTodos.onclick = (e) => filterByCategory('todos', e.target);
    }

    const franquicias = [...new Set(datosCompletos.map(i => i.franquicia))].filter(Boolean).sort();
    franquicias.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = cat;
        btn.onclick = (e) => filterByCategory(cat, e.target);
        container.appendChild(btn);
    });
}

function filtrarTodo() {
    const searchVal = document.getElementById('search-bar').value.toLowerCase();
    const filtrados = datosCompletos.filter(item => {
        const matchesCat = (categoriaActual === 'todos' || item.franquicia === categoriaActual);
        
        // Lógica de estado: normalizamos para comparar
        const estadoItem = item.estadoPedido ? item.estadoPedido.toLowerCase().trim() : '';
        const estadoFiltro = filtroEstadoActual.toLowerCase().trim();
        
        let matchesStatus = (filtroEstadoActual === 'todos');
        if (!matchesStatus) {
            if (estadoFiltro === 'en tránsito') {
                matchesStatus = estadoItem.includes('transito') || estadoItem.includes('tránsito');
            } else {
                matchesStatus = (estadoItem === estadoFiltro);
            }
        }

        // Búsqueda en TODOS los campos del objeto
        const matchesText = Object.values(item).some(val => 
            val !== null && val !== undefined && 
            String(val).toLowerCase().includes(searchVal)
        );
        
        return matchesCat && matchesStatus && matchesText;
    });
    render(filtrados);
}

window.resetearFiltros = () => {
    document.getElementById('search-bar').value = '';
    filterByCategory('todos', document.getElementById('btn-todos'));
    filterByStatus('todos', document.getElementById('btn-status-todos'));
};

window.onclick = (e) => {
    if(e.target.id === 'infoModal') cerrarModal();
    if(e.target.id === 'lightbox') cerrarLightbox();
};

const lb = document.getElementById('lightbox');
lb.addEventListener('touchstart', (e) => { xDown = e.touches[0].clientX; }, {passive: true});
lb.addEventListener('touchmove', (e) => {
    if (xDown === null || idAbiertoLightbox === null) return;
    let xDiff = xDown - e.touches[0].clientX;
    if (Math.abs(xDiff) > 50) {
        cambiarFoto(idAbiertoLightbox, xDiff > 0 ? 1 : -1);
        xDown = null;
    }
}, {passive: true});

window.cambiarFotoLightbox = (dir) => { if(idAbiertoLightbox !== null) cambiarFoto(idAbiertoLightbox, dir); };
