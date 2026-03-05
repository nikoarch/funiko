// CONFIGURACIÓN DE METAS (Ajusta estos valores a tu gusto)
const METAS = {
    "Stargate": 10,
    "Star Wars": 15,
    "Marvel": 20,
    "Todos": 50
};

let datosCompletos = [];
let categoriaActual = 'todos';
let indicesFotos = {};
let idAbiertoLightbox = null;

// Variables para gestos táctiles
let touchStartX = 0;
let touchEndX = 0;

async function cargarDatos() {
    try {
        const respuesta = await fetch('Funiko_BBDD.json?t=' + new Date().getTime());
        datosCompletos = await respuesta.json();
        generarBotonesFiltro();
        filtrarTodo();
    } catch (e) { console.error("Error cargando JSON", e); }
}

function render(items) {
    const grid = document.getElementById('collection-grid');
    const contadorDiv = document.getElementById('contador');
    grid.innerHTML = '';

    let totalInv = 0;
    items.forEach(item => {
        const p = parseFloat(item.precio.replace('€','').replace(',','.'));
        if(!isNaN(p)) totalInv += p;
    });

    const meta = METAS[categoriaActual] || 0;
    const progreso = meta > 0 ? Math.min((items.length / meta) * 100, 100) : 0;

    contadorDiv.innerHTML = `
        <div class="stats-container">
            <div class="stat-pill pill-count">📦 <b>${items.length}</b> Funkos</div>
            <div class="stat-pill pill-total">💰 <b>${totalInv.toFixed(2)}€</b></div>
        </div>
        ${meta > 0 ? `
        <div class="progress-wrapper">
            <div class="progress-text">${categoriaActual}: ${items.length} de ${meta}</div>
            <div class="progress-bg"><div class="progress-fill" style="width:${progreso}%"></div></div>
        </div>` : ''}`;

    items.forEach((item, index) => {
        const realID = datosCompletos.findIndex(d => d.nroSerie === item.nroSerie);
        const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
        if (!(realID in indicesFotos)) indicesFotos[realID] = 0;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img-container" 
                 onclick="abrirLightbox(${realID})"
                 ontouchstart="handleTouchStart(event)" 
                 ontouchend="handleTouchEnd(event, ${realID}, 'card')">
                <img id="img-${realID}" src="${fotos[indicesFotos[realID]]}" onerror="this.src='https://via.placeholder.com'">
                <div class="price-badge">${item.precio}</div>
                ${fotos.length > 1 ? `
                <div class="nav-overlay">
                    <button class="nav-btn" onclick="event.stopPropagation(); cambiarFoto(${realID}, -1)">❮</button>
                    <button class="nav-btn" onclick="event.stopPropagation(); cambiarFoto(${realID}, 1)">❯</button>
                </div>` : ''}
            </div>
            <div class="card-content">
                <span class="category-tag">${item.franquicia}</span>
                <h3>${item.personaje}</h3>
                <div class="btn-group">
                    <button class="btn-detail" onclick="verDetalles(${realID})">📋 Detalles</button>
                    ${item.video && item.video !== '#' ? `<a href="${item.video}" target="_blank" class="btn-video">▶ Video</a>` : '<span></span>'}
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// LÓGICA TÁCTIL (Swipe)
function handleTouchStart(e) { touchStartX = e.changedTouches[0].screenX; }

function handleTouchEnd(e, id, modo) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) { // Umbral de 50px para evitar clics accidentales
        if (diff > 0) modo === 'card' ? cambiarFoto(id, 1) : cambiarFotoLightbox(1);
        else modo === 'card' ? cambiarFoto(id, -1) : cambiarFotoLightbox(-1);
        e.stopPropagation();
    }
}

// CARRUSEL
function cambiarFoto(id, dir) {
    const item = datosCompletos[id];
    const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
    indicesFotos[id] = (indicesFotos[id] + dir + fotos.length) % fotos.length;
    const imgT = document.getElementById(`img-${id}`);
    if (imgT) imgT.src = fotos[indicesFotos[id]];
    if (idAbiertoLightbox === id) document.getElementById('img-ampliada').src = fotos[indicesFotos[id]];
}

// LIGHTBOX
function abrirLightbox(id) {
    idAbiertoLightbox = id;
    const fotos = Array.isArray(datosCompletos[id].foto) ? datosCompletos[id].foto : [datosCompletos[id].foto];
    const lb = document.getElementById('lightbox');
    if(fotos.length <= 1) lb.classList.add('single-photo'); else lb.classList.remove('single-photo');
    document.getElementById('img-ampliada').src = fotos[indicesFotos[id]];
    lb.style.display = 'flex';
}

function cambiarFotoLightbox(dir) { if (idAbiertoLightbox !== null) cambiarFoto(idAbiertoLightbox, dir); }
function cerrarLightbox() { document.getElementById('lightbox').style.display = 'none'; idAbiertoLightbox = null; }

// DETALLES
function verDetalles(id) {
    const item = datosCompletos[id];
    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin:0">${item.personaje}</h2>
        <p style="color:var(--primary); font-weight:bold; margin-bottom:15px;">${item.franquicia} · ${item.tvShow}</p>
        <div class="modal-info-grid">
            <div class="info-item">Nº Funko<b>#${item.nroFunko}</b></div>
            <div class="info-item">Nº Serie<b>${item.nroSerie}</b></div>
            <div class="info-item">Estado<b>${item.estado}</b></div>
            <div class="info-item">Tienda<b>${item.compradoEn}</b></div>
        </div>
        <div class="notes-box"><strong>Notas:</strong><br>${item.notas || 'Sin notas.'}</div>`;
    document.getElementById('infoModal').style.display = 'flex';
}

// FILTROS
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
        const cText = item.personaje.toLowerCase().includes(texto);
        return cCat && cText;
    });
    render(filtrados);
}

function resetearFiltros() {
    document.getElementById('search-bar').value = '';
    filterByCategory('todos', document.getElementById('btn-todos'));
}

// EVENTOS
function cerrarModal() { document.getElementById('infoModal').style.display = 'none'; }
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

// Configurar swipe en el lightbox al cargar
window.onload = () => {
    cargarDatos();
    const lb = document.getElementById('lightbox');
    lb.ontouchstart = handleTouchStart;
    lb.ontouchend = (e) => handleTouchEnd(e, idAbiertoLightbox, 'lightbox');
};

