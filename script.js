let datosCompletos = [];
let indicesFotos = {}; 
let idAbiertoLightbox = null;
let lightboxTouchStartX = 0;
let isZooming = false; // Nueva variable para bloquear el swipe durante el zoom
let lastSwipeTime = 0; // Candado de tiempo


document.addEventListener('DOMContentLoaded', cargarDatos);

async function cargarDatos() {
    try {
        const r = await fetch('Funiko_BBDD.json?t=' + Date.now());
        const json = await r.json();
        // Asignamos un ID numérico que NADIE más tenga
        datosCompletos = json.map((item, i) => ({ ...item, idInterno: i }));
        render(datosCompletos);
    } catch (e) { console.error("Error:", e); }
}

function render(items) {
    const grid = document.getElementById('collection-grid');
    const contadorDiv = document.getElementById('contador');
    if (!grid) return;

    grid.innerHTML = '';
    
    // --- Lógica de estadísticas (Media, Total, etc.) ---
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

    // --- Renderizado de tarjetas ---
    items.forEach((item) => {
        const uid = item.idInterno; // ID Único absoluto (posición en el JSON)
        const fotos = Array.isArray(item.foto) ? item.foto : [item.foto];
        if (!(uid in indicesFotos)) indicesFotos[uid] = 0;

        // Lógica de colores de estado
        let claseEstado = 'estado-default';
        const estadoLimpio = item.estadoPedido ? item.estadoPedido.toLowerCase().trim() : '';
        if (estadoLimpio === 'recibido') claseEstado = 'estado-recibido';
        else if (estadoLimpio.includes('transito')) claseEstado = 'estado-transito';
        else if (estadoLimpio === 'preventa') claseEstado = 'estado-preventa';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-img-container" id="img-cont-${uid}" style="touch-action: pan-y;">
                <img id="main-img-${uid}" src="${fotos[indicesFotos[uid]]}" onerror="this.src='https://via.placeholder.com'">
                <div class="price-badge">${item.precio}</div>
                <div class="status-badge ${claseEstado}">${item.estadoPedido}</div>
                ${fotos.length > 1 ? `
                <div class="nav-overlay">
                    <button class="nav-btn prev">❮</button>
                    <button class="nav-btn next">❯</button>
                </div>
                <div class="foto-counter" id="cnt-${uid}">${indicesFotos[uid] + 1}/${fotos.length}</div>
                ` : ''}
            </div>
            <div class="card-content">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                    <div>
                        <span class="category-tag">${item.franquicia}</span>
                        <span class="tvshow-tag">${item.tvShow !== '-' ? item.tvShow : ''}</span>
                    </div>
                    <span class="nro-funko-tag">#${item.nroFunko}</span>
                </div>
                <h3>${item.personaje}</h3>
                <div class="btn-group">
                    <button class="btn-detail">📋 Detalles</button>
                    ${item.video && item.video !== '#' ? `<a href="${item.video}" target="_blank" class="btn-video">▶ Video</a>` : '<span></span>'}
                </div>
            </div>`;

        // Eventos de botones de foto
        card.querySelector('.prev')?.addEventListener('click', (e) => { e.stopPropagation(); cambiarFotoManual(uid, -1); });
        card.querySelector('.next')?.addEventListener('click', (e) => { e.stopPropagation(); cambiarFotoManual(uid, 1); });
        
        // Evento Detalles
        card.querySelector('.btn-detail').onclick = () => verFichaTecnica(uid);

        // Evento Abrir Lightbox (Zoom)
        const imgCont = card.querySelector('.card-img-container');
        imgCont.onclick = (e) => { 
            if(!e.target.closest('.nav-btn')) abrirLightbox(uid); 
        };

        // --- GESTIÓN TÁCTIL (Móvil + Zoom) ---
        let touchStartX = 0;
        imgCont.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) { touchStartX = null; return; } // Bloqueo si hay zoom
            touchStartX = e.touches[0].clientX;
        }, {passive: true});

        imgCont.addEventListener('touchend', (e) => {
            if (touchStartX === null || e.touches.length > 0) return; 
            let touchEndX = e.changedTouches[0].clientX;
            let diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 60) cambiarFotoManual(uid, diff > 0 ? 1 : -1);
        }, {passive: true});

        grid.appendChild(card);
    });
}

function cambiarFotoManual(uid, dir) {
    const item = datosCompletos[uid];
    const fotos = item.foto;
    indicesFotos[uid] = (indicesFotos[uid] + dir + fotos.length) % fotos.length;

    document.getElementById(`main-img-${uid}`).src = fotos[indicesFotos[uid]];
    const c = document.getElementById(`cnt-${uid}`);
    if (c) c.innerText = `${indicesFotos[uid] + 1}/${fotos.length}`;

    if (idAbiertoLightbox === uid) {
        document.getElementById('img-ampliada').src = fotos[indicesFotos[uid]];
    }
}

function abrirLightbox(uid) {
    idAbiertoLightbox = uid;
    const item = datosCompletos.find(i => i.idUnicoInterno === uid || i.idInterno === uid);
    const fotos = item.foto;
    
    const lbImg = document.getElementById('img-ampliada');
    lbImg.src = fotos[indicesFotos[uid]];
    
    const lb = document.getElementById('lightbox');
    lb.style.display = 'flex';

    // Limpiamos eventos para evitar duplicados
    lb.ontouchstart = null;
    lb.ontouchend = null;

    lb.addEventListener('touchstart', (e) => {
        // Si hay más de un dedo (ZOOM), abortamos el inicio del swipe
        if (e.touches.length > 1) {
            lightboxTouchStartX = null;
            return;
        }
        lightboxTouchStartX = e.touches[0].clientX;
    }, {passive: true});

    lb.addEventListener('touchend', (e) => {
        const ahora = Date.now();
        // CONDICIONES PARA PASAR FOTO:
        // 1. No estar haciendo zoom (solo 1 dedo libre)
        // 2. Haber iniciado un toque válido (startX no null)
        // 3. Que haya pasado al menos 500ms desde el último swipe (CANDADO)
        if (lightboxTouchStartX === null || e.touches.length > 0 || (ahora - lastSwipeTime < 500)) return;

        let touchEndX = e.changedTouches[0].clientX;
        let diffX = lightboxTouchStartX - touchEndX;

        // Solo disparamos si el movimiento es largo (Swipe claro de 100px)
        if (Math.abs(diffX) > 100) {
            lastSwipeTime = ahora; // Cerramos el candado
            
            // SIMULAMOS EL CLIC DE LA FLECHA
            const direccion = diffX > 0 ? 1 : -1;
            cambiarFotoLightbox(direccion);
            
            lightboxTouchStartX = null; // Reset para el siguiente gesto
        }
    }, {passive: true});
}

function cambiarFotoLightbox(dir) {
    if (idAbiertoLightbox === null) return;
    
    // 1. Cambiamos el índice global del Funko
    cambiarFotoManual(idAbiertoLightbox, dir);
    
    // 2. Actualizamos la imagen del Lightbox con el nuevo índice
    const item = datosCompletos.find(i => i.idUnicoInterno === idAbiertoLightbox || i.idInterno === idAbiertoLightbox);
    const fotos = item.foto;
    document.getElementById('img-ampliada').src = fotos[indicesFotos[idAbiertoLightbox]];
}


function cerrarLightbox() { document.getElementById('lightbox').style.display = 'none'; idAbiertoLightbox = null; }
function cerrarModal() { document.getElementById('infoModal').style.display = 'none'; }

function verFichaTecnica(uid) {
    const item = datosCompletos[uid];
    document.getElementById('modal-body').innerHTML = `<h2>${item.personaje}</h2><p>${item.notas}</p>`;
    document.getElementById('infoModal').style.display = 'flex';
}

