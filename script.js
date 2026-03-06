let datosCompletos = [];
let categoriaActual = 'todos';
let indicesFotos = {};
let idAbiertoLightbox = null;
let xDown = null;                                                        
let yDown = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
});

async function cargarDatos() {
    try {
        const respuesta = await fetch('Funiko_BBDD.json?t=' + new Date().getTime());
        if (!respuesta.ok) throw new Error("JSON no encontrado");
        datosCompletos = await respuesta.json();
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

    grid.innerHTML = '';
    let totalInv = 0;
    let itemsConPrecio = 0;

    items.forEach(item => {
        const p = parseFloat(item.precio.replace('€','').replace(',','.').trim());
        if(!isNaN(p)) { totalInv += p; itemsConPrecio++; }
    });

    const promedio = itemsConPrecio > 0 ? (totalInv / itemsConPrecio).toFixed(2) : 0;
    if (contadorDiv) {
        contadorDiv.innerHTML = `
            <div class="stat-pill pill-count">📦 <b>${items.length}</b> Funkos</div>
            <div class="stat-pill pill-price">📊 Media: <b>${promedio}€</b></div>
            <div class="stat-pill pill-total">💰 Inversión: <b>${totalInv.toFixed(2)}€</b></div>
        `;
    }

    items.forEach((item, index) => {
        const realID = datosCompletos.findIndex(d => d.nroSerie === item.nroSerie);
        const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
        if (!(realID in indicesFotos)) indicesFotos[realID] = 0;

        let claseEstado = 'estado-default';
        const estadoLimpio = item.estadoPedido ? item.estadoPedido.toLowerCase().trim() : '';
        if (estadoLimpio === 'recibido') claseEstado = 'estado-recibido';
        else if (estadoLimpio.includes('transito') || estadoLimpio.includes('tránsito')) claseEstado = 'estado-transito';
        else if (estadoLimpio === 'preventa') claseEstado = 'estado-preventa';

        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <div class="card-img-container" style="touch-action: pan-y;">
                <img id="img-${realID}" src="${fotos[indicesFotos[realID]]}" onerror="this.src='https://via.placeholder.com'">
                <div class="price-badge">${item.precio}</div>
                <div class="status-badge ${claseEstado}">${item.estadoPedido}</div>
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
                        <span class="category-tag">${item.franquicia}</span>
                        <span class="tvshow-tag">${item.tvShow !== '-' ? item.tvShow : ''}</span>
                    </div>
                    <span class="nro-funko-tag">#${item.nroFunko}</span>
                </div>
                <h3>${item.personaje}</h3>
                <div class="btn-group">
                    <button class="btn-detail btn-detail-trigger">📋 Detalles</button>
                    ${item.video && item.video !== '#' ? `<a href="${item.video}" target="_blank" class="btn-video">▶ Video</a>` : '<span></span>'}
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
    const sub = item.subtienda && item.subtienda !== '-' ? ` (${item.subtienda})` : '';
    const waveStyle = (item.fullWave === 'Si' || item.fullWave === 'So') ? 'color:#6ee7b7; font-weight:800;' : '';
    
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
        <div class="notes-box"><strong>📝 Notas:</strong><br>${item.notas || 'Sin notas.'}</div>
    `;
    document.getElementById('infoModal').style.display = 'flex';
}

function cambiarFoto(id, dir) {
    const item = datosCompletos[id];
    const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
    if (fotos.length <= 1) return;
    indicesFotos[id] = (indicesFotos[id] + dir + fotos.length) % fotos.length;
    const imgElement = document.getElementById(`img-${id}`);
    const countElement = document.getElementById(`count-${id}`);
    if (imgElement) imgElement.src = fotos[indicesFotos[id]];
    if (countElement) countElement.innerText = `${indicesFotos[id] + 1}/${fotos.length}`;
    if (idAbiertoLightbox === id) document.getElementById('img-ampliada').src = fotos[indicesFotos[id]];
}

function abrirLightbox(id) {
    idAbiertoLightbox = id;
    const item = datosCompletos[id];
    const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
    document.getElementById('img-ampliada').src = fotos[indicesFotos[id]];
    document.getElementById('lightbox').style.display = 'flex';
}

function cerrarLightbox() { document.getElementById('lightbox').style.display = 'none'; idAbiertoLightbox = null; }
function cerrarModal() { document.getElementById('infoModal').style.display = 'none'; }

function filterByCategory(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    categoriaActual = cat;
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
        const matchesText = item.personaje.toLowerCase().includes(searchVal) || item.franquicia.toLowerCase().includes(searchVal);
        return matchesCat && matchesText;
    });
    render(filtrados);
}

window.resetearFiltros = () => {
    document.getElementById('search-bar').value = '';
    filterByCategory('todos', document.getElementById('btn-todos'));
};

window.onclick = (e) => {
    if(e.target.id === 'infoModal') cerrarModal();
    if(e.target.id === 'lightbox') cerrarLightbox();
};

const lb = document.getElementById('lightbox');
lb.addEventListener('touchstart', (e) => { xDown = e.touches[0].clientX; }, {passive: true});
lb.addEventListener('touchmove', (e) => {
    if (!xDown || idAbiertoLightbox === null) return;
    let xDiff = xDown - e.touches[0].clientX;
    if (Math.abs(xDiff) > 40) {
        cambiarFoto(idAbiertoLightbox, xDiff > 0 ? 1 : -1);
        xDown = null;
    }
}, {passive: true});

window.cambiarFotoLightbox = (dir) => { if(idAbiertoLightbox !== null) cambiarFoto(idAbiertoLightbox, dir); };

