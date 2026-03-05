let datosCompletos = [];
let categoriaActual = 'todos';
let indicesFotos = {}; // Para recordar en qué foto va cada tarjeta
let idAbiertoLightbox = null; // Para saber qué Funko estamos viendo en pantalla completa

// 1. CARGAR DATOS
async function cargarDatos() {
    try {
        const respuesta = await fetch('Funiko_BBDD.json?t=' + new Date().getTime());
        if (!respuesta.ok) throw new Error("Archivo JSON no encontrado");
        datosCompletos = await respuesta.json();
        
        generarBotonesFiltro();
        filtrarTodo();
    } catch (e) {
        console.error("Error crítico:", e);
        document.getElementById('collection-grid').innerHTML = 
            `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--accent);">
                <h2>⚠️ Error en la Base de Datos</h2>
                <p>${e.message}</p>
            </div>`;
    }
}

// 2. RENDERIZADO DE INTERFAZ
function render(items) {
    const grid = document.getElementById('collection-grid');
    const contadorDiv = document.getElementById('contador');
    grid.innerHTML = '';

    // Cálculos económicos
    let totalInvertido = 0;
    let itemsConPrecio = 0;

    items.forEach(item => {
        const precioLimpio = item.precio.replace('€', '').replace(',', '.').trim();
        const valor = parseFloat(precioLimpio);
        if (!isNaN(valor)) {
            totalInvertido += valor;
            itemsConPrecio++;
        }
    });

    const promedio = itemsConPrecio > 0 ? (totalInvertido / itemsConPrecio).toFixed(2) : 0;

    contadorDiv.innerHTML = `
        <div class="stat-pill pill-count">📦 <b>${items.length}</b> Funkos</div>
        <div class="stat-pill pill-price">📊 Media: <b>${promedio}€</b></div>
        <div class="stat-pill pill-total">💰 Inversión: <b>${totalInvertido.toFixed(2)}€</b></div>
    `;

    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--muted); padding:40px;">No hay resultados.</p>';
        return;
    }

    items.forEach((item, index) => {
        const realID = datosCompletos.findIndex(d => d.nroSerie === item.nroSerie);
        
        // Normalizar fotos (si es string, convertir a array de 1 elemento)
        const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
        if (!(realID in indicesFotos)) indicesFotos[realID] = 0;

        const card = document.createElement('div');
        card.className = 'card';
        card.style.animationDelay = `${(index % 15) * 0.04}s`;
        
        card.innerHTML = `
            <div class="card-img-container" onclick="abrirLightbox(${realID})">
                <img id="img-${realID}" src="${fotos[indicesFotos[realID]]}" onerror="this.src='https://via.placeholder.com'">
                <div class="price-badge">${item.precio}</div>
                
                ${fotos.length > 1 ? `
                    <div class="nav-overlay">
                        <button class="nav-btn" onclick="event.stopPropagation(); cambiarFoto(${realID}, -1)">❮</button>
                        <button class="nav-btn" onclick="event.stopPropagation(); cambiarFoto(${realID}, 1)">❯</button>
                    </div>
                ` : ''}
            </div>
            <div class="card-content">
                <span class="category-tag">${item.franquicia}</span>
                <h3>${item.personaje}</h3>
                <div class="btn-group">
                    <button class="btn-detail" onclick="verDetalles(${realID})">📋 Detalles</button>
                    ${item.video && item.video !== '#' ? 
                        `<a href="${item.video}" target="_blank" class="btn-video">▶ Video</a>` : '<span></span>'}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. LÓGICA DE CARRUSEL (SINCRONIZADA)
function cambiarFoto(id, dir) {
    const item = datosCompletos[id];
    const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
    
    // Actualizar índice circularmente
    indicesFotos[id] = (indicesFotos[id] + dir + fotos.length) % fotos.length;
    
    const nuevaRuta = fotos[indicesFotos[id]];

    // Actualizar imagen en la tarjeta
    const imgTarjeta = document.getElementById(`img-${id}`);
    if (imgTarjeta) imgTarjeta.src = nuevaRuta;

    // Actualizar imagen en el lightbox si está abierto para este Funko
    if (idAbiertoLightbox === id) {
        const imgGrande = document.getElementById('img-ampliada');
        if (imgGrande) imgGrande.src = nuevaRuta;
    }
}

// 4. LÓGICA DE LIGHTBOX (ZOOM)
function abrirLightbox(id) {
    idAbiertoLightbox = id;
    const item = datosCompletos[id];
    const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
    const lb = document.getElementById('lightbox');
    
    // Ocultar flechas si solo hay una foto
    if(fotos.length <= 1) lb.classList.add('single-photo');
    else lb.classList.remove('single-photo');

    document.getElementById('img-ampliada').src = fotos[indicesFotos[id]];
    lb.style.display = 'flex';
}

function cambiarFotoLightbox(dir) {
    if (idAbiertoLightbox !== null) {
        cambiarFoto(idAbiertoLightbox, dir);
    }
}

function cerrarLightbox() {
    document.getElementById('lightbox').style.display = 'none';
    idAbiertoLightbox = null;
}

// 5. DETALLES (MODAL)
function verDetalles(id) {
    const item = datosCompletos[id];
    const body = document.getElementById('modal-body');
    
    body.innerHTML = `
        <h2 style="margin:0; color:white;">${item.personaje}</h2>
        <p style="color:var(--primary); font-weight:bold; margin-bottom:20px; font-size:1.1rem;">${item.franquicia} · ${item.tvShow}</p>
        
        <div class="modal-info-grid">
            <div class="info-item">Nº Funko<b>#${item.nroFunko}</b></div>
            <div class="info-item">Nº Serie<b>${item.nroSerie}</b></div>
            <div class="info-item">Estado<b>${item.estado}</b></div>
            <div class="info-item">Caja<b>${item.estadoCaja}</b></div>
            <div class="info-item">Tienda<b>${item.compradoEn}</b></div>
            <div class="info-item">Precio<b>${item.precio}</b></div>
            <div class="info-item">Línea<b>${item.linea}</b></div>
            <div class="info-item">Fecha<b>${item.fecha}</b></div>
        </div>
        
        <div class="notes-box">
            <strong>📝 Notas:</strong><br>
            <span style="display:block; margin-top:5px; color:var(--muted)">${item.notas || 'Sin notas.'}</span>
        </div>
    `;
    document.getElementById('infoModal').style.display = 'flex';
}

function cerrarModal() { 
    document.getElementById('infoModal').style.display = 'none'; 
}

// 6. FILTROS Y EVENTOS GLOBALES
function generarBotonesFiltro() {
    const container = document.getElementById('filter-container');
    const franquicias = [...new Set(datosCompletos.map(i => i.franquicia))].filter(Boolean);
    
    franquicias.sort().forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = cat;
        btn.onclick = (e) => filterByCategory(cat, e.target);
        container.appendChild(btn);
    });
}

function filterByCategory(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    categoriaActual = cat;
    filtrarTodo();
}

function filtrarTodo() {
    const texto = document.getElementById('search-bar').value.toLowerCase();
    const filtrados = datosCompletos.filter(item => {
        const coincideCat = (categoriaActual === 'todos' || item.franquicia === categoriaActual);
        const coincideText = item.personaje.toLowerCase().includes(texto) || 
                             item.franquicia.toLowerCase().includes(texto);
        return coincideCat && coincideText;
    });
    render(filtrados);
}

function resetearFiltros() {
    document.getElementById('search-bar').value = '';
    const btnTodos = document.getElementById('btn-todos');
    filterByCategory('todos', btnTodos);
}

// Eventos de teclado y clics fuera
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

