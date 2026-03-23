let monitorData = [];
let categoriaActual = 'todos';

function renderMonitor(items) {
    const grid = document.getElementById('monitor-grid');
    const contadorDiv = document.getElementById('contador');
    if (!grid) return;

    // Renderizar contador
    if (contadorDiv) {
        contadorDiv.innerHTML = `
            <div class="stat-pill pill-count">
                <span><img src="imagenes/funkoIcon.png" alt="Icono" class="stat-icon"></span>
                <span><b>${items.length}</b></span>
                <span>Funkos</span>
            </div>
        `;
    }

    grid.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card monitor-card';
        
        // Formatear valores (ya no convertimos '-' en 'N/A' por petición del usuario)
        const f = (v) => (v === '' || v === null || v === undefined) ? 'N/A' : v;
        
        // Lógica para alerta de vendedor
        const alertaVendedor = (item.alertaVendedor || '').toString().trim().toLowerCase() === 'si';
        const vendedorStyle = alertaVendedor ? 'color: #ef4444; font-weight: 800;' : '';
        
        card.innerHTML = `
            <div class="card-content">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <div style="display:flex; flex-direction:column;">
                        <span class="category-tag">${f(item.franquicia)}</span>
                        <span class="tvshow-tag" style="${vendedorStyle}">${f(item.vendedor)}</span>
                    </div>
                    <span class="nro-funko-tag">#${f(item.nroFunko)}</span>
                </div>
                
                <h3 style="margin-bottom: 15px; color: var(--primary);">${f(item.personaje)}</h3>
                
                <div class="price-info">
                    <div class="price-row" style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2);">
                        <span class="price-label">Precio Visto:</span>
                        <span class="price-value" style="color: var(--primary); font-size: 1.1rem;">${f(item.vistoA)}</span>
                    </div>
                    <div class="price-row" style="background: rgba(6, 78, 59, 0.2); border: 1px solid rgba(5, 150, 105, 0.3);">
                        <span class="price-label">Mínimo Histórico:</span>
                        <span class="price-value min-price" style="font-size: 1.1rem;">${f(item.minimoHistorico)}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 5px;">
                        <div class="price-row" style="flex-direction: column; align-items: flex-start; gap: 2px; padding: 6px;">
                            <span class="price-label" style="font-size: 0.6rem;">Fecha Visto:</span>
                            <span class="price-value" style="font-size: 0.75rem;">${f(item.fechaPrecioVisto)}</span>
                        </div>
                        <div class="price-row" style="flex-direction: column; align-items: flex-start; gap: 2px; padding: 6px;">
                            <span class="price-label" style="font-size: 0.6rem;">Fecha Mínimo:</span>
                            <span class="price-value" style="font-size: 0.75rem;">${f(item.fechaMinimo)}</span>
                        </div>
                    </div>

                    ${item.caracteristica !== undefined && item.caracteristica !== null && item.caracteristica !== '' ? `
                    <div style="margin-top: 15px; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.85rem; color: var(--muted); border-left: 3px solid var(--primary);">
                        <span style="display:block; font-size: 0.7rem; text-transform: uppercase; font-weight: 800; margin-bottom: 4px; color: var(--primary);">Característica:</span>
                        ${item.caracteristica}
                    </div>` : ''}

                    ${item.link && item.link !== '#' && item.link !== '-' ? `
                    <div style="margin-top: 15px; text-align: center;">
                        <a href="${item.link}" target="_blank" style="color: var(--primary); font-size: 0.8rem; text-decoration: underline; font-weight: 600;">Abrir enlace de oferta ↗</a>
                    </div>` : ''}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function filtrarMonitorizacion() {
    const searchVal = document.getElementById('search-bar').value.toLowerCase().trim();
    
    const filtrados = monitorData.filter(item => {
        const matchesCat = (categoriaActual === 'todos' || item.franquicia === categoriaActual);
        
        // Búsqueda en TODOS los campos del objeto
        const matchesText = Object.values(item).some(val => 
            val !== null && val !== undefined && 
            String(val).toLowerCase().includes(searchVal)
        );
        
        return matchesCat && matchesText;
    });
    
    renderMonitor(filtrados);
}

function filterByCategoryMonitor(cat, btn) {
    document.querySelectorAll('#filter-container .filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    categoriaActual = cat;
    filtrarMonitorizacion();
}

function generarBotonesFiltroMonitorizacion() {
    console.log('Generando botones de filtro...');
    const container = document.getElementById('filter-container');
    if (!container) {
        console.error('No se encontró el contenedor de filtros');
        return;
    }

    if (!Array.isArray(monitorData) || monitorData.length === 0) {
        console.warn('No hay datos para generar botones de filtro');
        return;
    }

    // Obtenemos franquicias únicas, manejando posibles variaciones de nombre de campo
    const franquicias = [...new Set(monitorData.map(i => {
        const val = i.franquicia || i.Franquicia || i.linea || i.Linea || '';
        return String(val).trim();
    }))].filter(f => f !== '').sort();
    
    console.log('Franquicias detectadas:', franquicias.length, franquicias);

    // Limpiamos botones previos excepto el de "Todas"
    const btnTodos = document.getElementById('btn-todos');
    container.innerHTML = '';
    if (btnTodos) {
        container.appendChild(btnTodos);
    } else {
        // Si por alguna razón no está, lo creamos
        const btn = document.createElement('button');
        btn.id = 'btn-todos';
        btn.className = 'filter-btn active';
        btn.innerText = 'Todas las Franquicias';
        btn.onclick = (e) => filterByCategoryMonitor('todos', e.target);
        container.appendChild(btn);
    }

    franquicias.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = cat;
        btn.onclick = (e) => filterByCategoryMonitor(cat, e.target);
        container.appendChild(btn);
    });
}

function resetSearch() {
    document.getElementById('search-bar').value = '';
    categoriaActual = 'todos';
    document.querySelectorAll('#filter-container .filter-btn').forEach(b => b.classList.remove('active'));
    const btnTodos = document.getElementById('btn-todos');
    if (btnTodos) btnTodos.classList.add('active');
    filtrarMonitorizacion();
}

async function init() {
    // El modo secreto se activa por sesión (se borra al cerrar la pestaña)
    const esModoSecreto = (sessionStorage.getItem('modoSecreto') === 'true');
    const sesionIniciada = (sessionStorage.getItem('sesionIniciada') === 'true');

    // Solo mostramos el modal si es la primera vez que entramos en esta sesión
    if (!sesionIniciada) {
        const modal = document.getElementById('passwordModal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('passwordInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') verificarPassword();
            });
        }
    }

    console.log('Iniciando monitorización...');
    try {
        const response = await fetch('Monitorizacion_BBDD.json?t=' + new Date().getTime());
        if (!response.ok) throw new Error('No se pudo cargar el JSON');
        
        const data = await response.json();
        
        // Manejar tanto si es un array directo como si está envuelto en un objeto
        if (Array.isArray(data)) {
            monitorData = data;
        } else if (data && Array.isArray(data.data)) {
            monitorData = data.data;
        } else if (data && typeof data === 'object') {
            const firstArrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
            if (firstArrayKey) {
                monitorData = data[firstArrayKey];
            } else {
                throw new Error('El formato del JSON no es un array válido');
            }
        } else {
            throw new Error('Formato de datos no reconocido');
        }

        console.log('Datos cargados:', monitorData.length);
        generarBotonesFiltroMonitorizacion();
        renderMonitor(monitorData);
    } catch (error) {
        console.error('Error cargando monitorización:', error);
        const grid = document.getElementById('monitor-grid');
        if (grid) grid.innerHTML = `<p style="color: white; text-align: center; grid-column: 1/-1;">Error al cargar los datos: ${error.message}</p>`;
    }
}

function verificarPassword() {
    const pass = document.getElementById('passwordInput').value;
    
    // Marcamos que la sesión ha iniciado para que no vuelva a pedir la clave al navegar
    sessionStorage.setItem('sesionIniciada', 'true');

    // Contraseña: 1
    if (pass === '1') {
        sessionStorage.setItem('modoSecreto', 'true');
        renderMonitor(monitorData);
    } else {
        sessionStorage.removeItem('modoSecreto');
    }
    
    cerrarPasswordModal();
}

function cerrarPasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

// Ejecutar init si el DOM ya está listo, o esperar al evento
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
