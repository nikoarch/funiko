let datosCompletos = [];
let categoriaActual = 'todos';
let indicesFotos = {};
let idAbiertoLightbox = null;

// --- GESTIÓN DE DATOS ---
async function cargarDatos() {
    try {
        const r = await fetch('Funiko_BBDD.json?t=' + Date.now());
        datosCompletos = await r.json();
        generarBotonesFiltro();
        filtrarTodo();
        habilitarSwipe(document.getElementById('lightbox'), dir => cambiarFotoLightbox(dir));
    } catch (e) { console.error("Error cargando JSON", e); }
}

// --- RENDERIZADO ---
function render(items) {
    const grid = document.getElementById('collection-grid');
    const contador = document.getElementById('contador');
    grid.innerHTML = '';

    let total = 0;
    items.forEach(i => {
        const p = parseFloat(i.precio.replace('€','').replace(',','.').trim());
        if(!isNaN(p)) total += p;
    });

    contador.innerHTML = `
        <div class="stat-pill pill-count">📦 <b>${items.length}</b></div>
        <div class="stat-pill pill-total">💰 <b>${total.toFixed(2)}€</b></div>
    `;

    items.forEach((item, idx) => {
        const realID = datosCompletos.findIndex(d => d.nroSerie === item.nroSerie);
        const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
        if (indicesFotos[realID] === undefined) indicesFotos[realID] = 0;

        const estado = (item.estadoPedido || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        let clase = 'estado-default';
        if(estado.includes("recibido")) clase = 'estado-recibido';
        else if(estado.includes("transito")) clase = 'estado-transito';
        else if(estado.includes("preventa")) clase = 'estado-preventa';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img-container" onclick="abrirLightbox(${realID})">
                <img id="img-${realID}" src="${fotos[indicesFotos[realID]]}" onerror="this.src='https://via.placeholder.com'">
                <div class="price-badge">${item.precio}</div>
                <div class="status-badge ${clase}">${item.estadoPedido}</div>
                ${fotos.length > 1 ? `
                    <div class="nav-overlay">
                        <button class="nav-btn" onclick="event.stopPropagation(); cambiarFoto(${realID}, -1)">❮</button>
                        <button class="nav-btn" onclick="event.stopPropagation(); cambiarFoto(${realID}, 1)">❯</button>
                    </div>` : ''}
            </div>
            <div class="card-content">
                <div style="display:flex; justify-content:space-between;">
                    <span class="category-tag">${item.franquicia}</span>
                    <span class="nro-funko-tag">#${item.nroFunko}</span>
                </div>
                <h3>${item.personaje}</h3>
                <div class="btn-group">
                    <button class="btn-detail" onclick="verFichaTecnica(${realID})">📋 Detalles</button>
                    ${item.video && item.video !== '#' ? `<a href="${item.video}" target="_blank" class="btn-video">▶ Video</a>` : '<div></div>'}
                </div>
            </div>`;
        
        grid.appendChild(card);
        habilitarSwipe(card.querySelector('.card-img-container'), dir => cambiarFoto(realID, dir));
    });
}

// --- INTERACCIÓN ---
function cambiarFoto(id, dir) {
    const fotos = Array.isArray(datosCompletos[id].foto) ? datosCompletos[id].foto : [datosCompletos[id].foto];
    indicesFotos[id] = (indicesFotos[id] + dir + fotos.length) % fotos.length;
    const img = document.getElementById(`img-${id}`);
    if(img) img.src = fotos[indicesFotos[id]];
    if(idAbiertoLightbox === id) document.getElementById('img-ampliada').src = fotos[indicesFotos[id]];
}

function verFichaTecnica(id) {
    const i = datosCompletos[id];
    document.getElementById('modal-body').innerHTML = `
        <h2 style="margin:0">${i.personaje}</h2>
        <p style="color:var(--primary); font-size:0.9rem; margin:5px 0 15px;">${i.franquicia} · ${i.linea}</p>
        <div class="modal-info-grid">
            <div class="info-item">Nº Serie<b>${i.nroSerie}</b></div>
            <div class="info-item">Tienda<b>${i.compradoEn}</b></div>
            <div class="info-item">Estado Caja<b>${i.estadoCaja}</b></div>
            <div class="info-item">Full Wave<b>${i.fullWave}</b></div>
        </div>
        <div class="notes-box"><strong>Notas:</strong><br>${i.notas || 'Sin notas.'}</div>
    `;
    document.getElementById('infoModal').style.display = 'flex';
}

// --- SWIPE LOGIC ---
function habilitarSwipe(el, callback) {
    let sX = 0, sY = 0;
    el.addEventListener('touchstart', e => { sX = e.touches[0].clientX; sY = e.touches[0].clientY; }, {passive:true});
    el.addEventListener('touchend', e => {
        const dX = sX - e.changedTouches[0].clientX;
        const dY = sY - e.changedTouches[0].clientY;
        if(Math.abs(dX) > Math.abs(dY) && Math.abs(dX) > 40) callback(dX > 0 ? 1 : -1);
    }, {passive:true});
}

// --- FILTROS Y MODALES ---
function abrirLightbox(id) {
    idAbiertoLightbox = id;
    const fotos = Array.isArray(datosCompletos[id].foto) ? datosCompletos[id].foto : [datosCompletos[id].foto];
    document.getElementById('img-ampliada').src = fotos[indicesFotos[id]];
    document.getElementById('lightbox').style.display = 'flex';
}
function cerrarLightbox() { document.getElementById('lightbox').style.display = 'none'; idAbiertoLightbox = null; }
function cerrarModal() { document.getElementById('infoModal').style.display = 'none'; }
function cambiarFotoLightbox(dir) { if(idAbiertoLightbox !== null) cambiarFoto(idAbiertoLightbox, dir); }

function generarBotonesFiltro() {
    const f = [...new Set(datosCompletos.map(i => i.franquicia))].sort();
    const c = document.getElementById('filter-container');
    f.forEach(cat => {
        const b = document.createElement('button');
        b.className = 'filter-btn'; b.innerText = cat;
        b.onclick = (e) => filterByCategory(cat, e.target);
        c.appendChild(b);
    });
}
function filterByCategory(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); categoriaActual = cat; filtrarTodo();
}
function filtrarTodo() {
    const t = document.getElementById('search-bar').value.toLowerCase();
    const res = datosCompletos.filter(i => {
        const matchC = categoriaActual === 'todos' || i.franquicia === categoriaActual;
        const matchT = i.personaje.toLowerCase().includes(t) || i.franquicia.toLowerCase().includes(t);
        return matchC && matchT;
    });
    render(res);
}
function resetearFiltros() { 
    document.getElementById('search-bar').value = ''; 
    filterByCategory('todos', document.getElementById('btn-todos')); 
}

window.onload = cargarDatos;
window.onclick = e => { if(e.target.className === 'modal' || e.target.className === 'lightbox') { cerrarModal(); cerrarLightbox(); } };
window.onkeydown = e => { if(e.key === "Escape") { cerrarModal(); cerrarLightbox(); } };

