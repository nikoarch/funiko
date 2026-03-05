let datosCompletos = [];
let categoriaActual = 'todos';
let indicesFotos = {};
let idAbiertoLightbox = null;

async function cargarDatos() {
    try {
        const respuesta = await fetch('Funiko_BBDD.json?t=' + new Date().getTime());
        if (!respuesta.ok) throw new Error("JSON no encontrado");
        datosCompletos = await respuesta.json();
        generarBotonesFiltro();
        filtrarTodo();
    } catch (e) { console.error("Error crítico:", e); }
}

function render(items) {
    const grid = document.getElementById('collection-grid');
    const contadorDiv = document.getElementById('contador');
    grid.innerHTML = '';

    let totalInv = 0;
    let itemsConPrecio = 0;

    items.forEach(item => {
        const p = parseFloat(item.precio.replace('€','').replace(',','.').trim());
        if(!isNaN(p)) {
            totalInv += p;
            itemsConPrecio++;
        }
    });

    const promedio = itemsConPrecio > 0 ? (totalInv / itemsConPrecio).toFixed(2) : 0;

    contadorDiv.innerHTML = `
        <div class="stat-pill pill-count">📦 <b>${items.length}</b> Funkos</div>
        <div class="stat-pill pill-price">📊 Media: <b>${promedio}€</b></div>
        <div class="stat-pill pill-total">💰 Inversión: <b>${totalInv.toFixed(2)}€</b></div>
    `;

    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--muted); padding:50px;">Sin resultados.</p>';
        return;
    }

    items.forEach((item, index) => {
        const realID = datosCompletos.findIndex(d => d.nroSerie === item.nroSerie);
        const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
        if (!(realID in indicesFotos)) indicesFotos[realID] = 0;

        let claseEstado = 'estado-default';
        const estadoLimpio = item.estadoPedido ? item.estadoPedido.toLowerCase().trim() : '';

        if (estadoLimpio === 'recibido') {
            claseEstado = 'estado-recibido';
        } else if (estadoLimpio === 'en transito' || estadoLimpio === 'en tránsito') {
            claseEstado = 'estado-transito';
        } else if (estadoLimpio === 'preventa') {
            claseEstado = 'estado-preventa';
        }

        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${(index % 10) * 0.05}s`;
        
        card.innerHTML = `
            <div class="card-img-container" onclick="abrirLightbox(${realID})">
                <img id="img-${realID}" src="${fotos[indicesFotos[realID]]}" onerror="this.src='https://via.placeholder.com'">
                <div class="price-badge">${item.precio}</div>
                <div class="status-badge ${claseEstado}">${item.estadoPedido}</div>
                ${fotos.length > 1 ? `
                <div class="nav-overlay">
                    <button class="nav-btn" onclick="event.stopPropagation(); cambiarFoto(${realID}, -1)">❮</button>
                    <button class="nav-btn" onclick="event.stopPropagation(); cambiarFoto(${realID}, 1)">❯</button>
                </div>` : ''}
            </div>
            <div class="card-content">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                    <div style="display:flex; flex-direction:column;">
                        <span class="category-tag">${item.franquicia}</span>
                        <span class="tvshow-tag">${item.tvShow !== '-' ? item.tvShow : ''}</span>
                    </div>
                    <span class="nro-funko-tag">#${item.nroFunko}</span>
                </div>
                <h3>${item.personaje}</h3>
                <div class="btn-group">
                    <button class="btn-detail" onclick="verFichaTecnica(${realID})">📋 Detalles</button>
                    ${item.video && item.video !== '#' ? `<a href="${item.video}" target="_blank" class="btn-video">▶ Video</a>` : '<span></span>'}
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

function verFichaTecnica(id) {
    const item = datosCompletos[id];
    const sub = item.subtienda && item.subtienda !== '-' ? ` (${item.subtienda})` : '';
    const waveStyle = item.fullWave === 'Si' ? 'color:#6ee7b7; font-weight:800;' : '';
    
    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin:0 0 5px; color:white;">${item.personaje}</h2>
        <p style="color:var(--primary); font-weight:bold; margin-bottom:20px;">${item.franquicia} · ${item.linea} · ${item.tvShow}</p>
        
        <div class="modal-info-grid">
            <div class="info-item">Fecha Compra<b>${item.fecha}</b></div>
            <div class="info-item">Nº Serie<b>${item.nroSerie}</b></div>
            <div class="info-item">Tienda<b>${item.compradoEn}${sub}</b></div>
            <div class="info-item">Gastos Envío<b>${item.gastosEnvio}</b></div>
            <div class="info-item">Full Wave<b style="${waveStyle}">${item.fullWave}</b></div>
            <div class="info-item">Estado Pieza<b>${item.estado}</b></div>
            <div class="info-item">Estado Caja<b>${item.estadoCaja}</b></div>
            <div class="info-item" style="grid-column: 1 / -1;">Especial<b>${item.caracteristicasEspeciales}</b></div>
        </div>
        
        <div class="notes-box"><strong>📝 Notas:</strong><br>${item.notes || 'Sin notas.'}</div>
    `;
    document.getElementById('infoModal').style.display = 'flex';
}

function cambiarFoto(id, dir) {
    const item = datosCompletos[id];
    const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
    indicesFotos[id] = (indicesFotos[id] + dir + fotos.length) % fotos.length;
    const imgT = document.getElementById(`img-${id}`);
    if (imgT) imgT.src = fotos[indicesFotos[id]];
    if (idAbiertoLightbox === id) document.getElementById('img-ampliada').src = fotos[indicesFotos[id]];
}

function abrirLightbox(id) {
    idAbiertoLightbox = id;
    const item = datosCompletos[id];
    const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
    const lb = document.getElementById('lightbox');
    if(fotos.length <= 1) lb.classList.add('single-photo'); else lb.classList.remove('single-photo');
    document.getElementById('img-ampliada').src = fotos[indicesFotos[id]];
    lb.style.display = 'flex';
}

function cambiarFotoLightbox(dir) { if (idAbiertoLightbox !== null) cambiarFoto(idAbiertoLightbox, dir); }
function cerrarLightbox() { document.getElementById('lightbox').style.display = 'none'; idAbiertoLightbox = null; }
function cerrarModal() { document.getElementById('infoModal').style.display = 'none'; }

function generarBotonesFiltro() {
    const container = document.getElementById('filter-container');
    const franquicias = [...new Set(datosCompletos.map(i => i.franquicia))].filter(Boolean).sort();
    franquicias.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn'; btn.innerText = cat;
        btn.onclick = (e) => filterByCategory(cat, e.target);
        container.appendChild(btn);
    });
}

function filterByCategory(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    categoriaActual = cat; filtrarTodo();
}

function filtrarTodo() {
    const texto = document.getElementById('search-bar').value.toLowerCase();
    const filtrados = datosCompletos.filter(item => {
        const cCat = (categoriaActual === 'todos' || item.franquicia === categoriaActual);
        const cText = item.personaje.toLowerCase().includes(texto) || item.franquicia.toLowerCase().includes(texto);
        return cCat && cText;
    });
    render(filtrados);
}

function resetearFiltros() {
    document.getElementById('search-bar').value = '';
    filterByCategory('todos', document.getElementById('btn-todos'));
}

window.onkeydown = (e) => { 
    if(e.key === "Escape") { cerrarModal(); cerrarLightbox(); }
    if(idAbiertoLightbox !== null) {
        if(e.key === "ArrowLeft") cambiarFotoLightbox(-1);
        if(e.key === "ArrowRight") cambiarFotoLightbox(1);
    }
}

window.onclick = (e) => {
    if(e.target.id === 'infoModal') cerrarModal();
    if(e.target.id === 'lightbox') cerrarLightbox();
}

window.onload = cargarDatos;

