let monitorData = [];

function renderMonitor(items) {
    const grid = document.getElementById('monitor-grid');
    if (!grid) return;

    grid.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card monitor-card';
        
        // Formatear valores
        const f = (v) => (v === '-' || v === '' || v === null || v === undefined) ? 'N/A' : v;
        
        card.innerHTML = `
            <div class="card-content">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <div style="display:flex; flex-direction:column;">
                        <span class="category-tag">${f(item.franquicia)}</span>
                        <span class="tvshow-tag">${f(item.vendedor)}</span>
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
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px;">
                        <div class="price-row" style="flex-direction: column; align-items: flex-start; gap: 2px;">
                            <span class="price-label" style="font-size: 0.7rem;">Fecha Visto:</span>
                            <span class="price-value" style="font-size: 0.85rem;">${f(item.fechaPrecioVisto)}</span>
                        </div>
                        <div class="price-row" style="flex-direction: column; align-items: flex-start; gap: 2px;">
                            <span class="price-label" style="font-size: 0.7rem;">Fecha Mínimo:</span>
                            <span class="price-value" style="font-size: 0.85rem;">${f(item.fechaMinimo)}</span>
                        </div>
                    </div>

                    ${item.caracteristica && item.caracteristica !== '-' ? `
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
        const personaje = (item.personaje || '').toLowerCase();
        const franquicia = (item.franquicia || '').toLowerCase();
        const vendedor = (item.vendedor || '').toLowerCase();
        
        return personaje.includes(searchVal) || 
               franquicia.includes(searchVal) || 
               vendedor.includes(searchVal);
    });
    
    renderMonitor(filtrados);
}

function resetSearch() {
    document.getElementById('search-bar').value = '';
    renderMonitor(monitorData);
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log('Iniciando monitorización...');
    try {
        const response = await fetch('Monitorizacion_BBDD.json');
        if (!response.ok) throw new Error('No se pudo cargar el JSON');
        monitorData = await response.json();
        console.log('Datos cargados:', monitorData.length);
        renderMonitor(monitorData);
    } catch (error) {
        console.error('Error cargando monitorización:', error);
        const grid = document.getElementById('monitor-grid');
        if (grid) grid.innerHTML = `<p style="color: white; text-align: center; grid-column: 1/-1;">Error al cargar los datos: ${error.message}</p>`;
    }
}
