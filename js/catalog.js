
export const categories = [
    { id: 'mechanical', name: 'Herramientas mecánicas', color: '#2563eb', icon: '🔧' },
    { id: 'assembly', name: 'Ajuste y desmontaje', color: '#ea580c', icon: '🛠️' },
    { id: 'electrical', name: 'Electricidad y electrónica', color: '#ca8a04', icon: '⚡' },
    { id: 'diagnostic', name: 'Diagnóstico y medición', color: '#7c3aed', icon: '📟' },
    { id: 'powered', name: 'Herramientas motorizadas', color: '#dc2626', icon: '⚙️' },
    { id: 'inspection', name: 'Inspección y mantenimiento', color: '#059669', icon: '🔦' }
];

const tool = (id, name, category, model, color, aliases, description) => ({
    id, name, category, model, color, aliases, description
});

export const catalog = [

    // HERRAMIENTAS MECÁNICAS

    tool('ratchet', 'Matraca', 'mechanical', 'ratchet', '#2563eb',
        ['matraca', 'carraca', 'trinquete'],
        'Permite girar dados sin retirar continuamente la herramienta.'),

    tool('combination', 'Llave combinada', 'mechanical', 'wrench', '#64748b',
        ['llave combinada', 'llave mixta'],
        'Permite ajustar elementos de fijación con dos tipos de extremos.'),

    tool('adjustable', 'Llave ajustable', 'mechanical', 'adjustable', '#f97316',
        ['llave ajustable', 'llave inglesa', 'perico'],
        'Adapta su apertura a diferentes tamaños de tuercas.'),

    tool('open-wrench', 'Llave de boca', 'mechanical', 'wrench', '#94a3b8',
        ['llave de boca', 'llave abierta'],
        'Permite sujetar tuercas mediante una abertura fija.'),

    tool('ring-wrench', 'Llave de estrella', 'mechanical', 'ring', '#64748b',
        ['llave de estrella', 'llave cerrada'],
        'Rodea la cabeza de una tuerca para transmitir el giro.'),

    tool('allen', 'Llave Allen', 'mechanical', 'hex', '#334155',
        ['allen', 'llave allen', 'llave hexagonal'],
        'Se utiliza con tornillos de alojamiento hexagonal.'),

    tool('torx', 'Llave Torx', 'mechanical', 'hex', '#7c3aed',
        ['llave torx', 'torx'],
        'Se utiliza con tornillos de perfil Torx.'),

    tool('socket', 'Dado corto', 'mechanical', 'socket', '#94a3b8',
        ['dado corto', 'dado'],
        'Acopla una herramienta de giro a una cabeza de tornillo.'),

    tool('long-socket', 'Dado largo', 'mechanical', 'socket-long', '#64748b',
        ['dado largo', 'dado profundo'],
        'Facilita el acceso a elementos de fijación profundos.'),

    tool('breaker', 'Barra de fuerza', 'mechanical', 'ratchet', '#334155',
        ['barra de fuerza', 'maneral'],
        'Proporciona una palanca para aplicar fuerza de giro.'),

    // AJUSTE Y DESMONTAJE

    tool('flat-driver', 'Desarmador plano', 'assembly', 'driver', '#ef4444',
        ['desarmador plano', 'destornillador plano'],
        'Se utiliza con tornillos de ranura recta.'),

    tool('phillips', 'Desarmador Phillips', 'assembly', 'driver', '#2563eb',
        ['desarmador phillips', 'desarmador de cruz', 'destornillador de cruz'],
        'Se utiliza con tornillos de cabeza Phillips.'),

    tool('torx-driver', 'Desarmador Torx', 'assembly', 'driver', '#7c3aed',
        ['desarmador torx', 'destornillador torx'],
        'Permite girar tornillos con alojamiento Torx.'),

    tool('hammer', 'Martillo metálico', 'assembly', 'hammer', '#dc2626',
        ['martillo', 'martillo metalico'],
        'Permite aplicar impactos mecánicos controlados.'),

    tool('mallet', 'Mazo de goma', 'assembly', 'hammer', '#334155',
        ['mazo', 'mazo de goma', 'martillo de goma'],
        'Permite aplicar impactos reduciendo marcas superficiales.'),

    tool('pliers', 'Pinzas universales', 'assembly', 'pliers', '#16a34a',
        ['pinzas universales', 'alicates universales'],
        'Permiten sujetar y manipular diferentes elementos.'),

    tool('needle-pliers', 'Pinzas de punta', 'assembly', 'pliers', '#0891b2',
        ['pinzas de punta', 'pinzas largas'],
        'Facilitan la manipulación de componentes pequeños.'),

    tool('cutters', 'Pinzas de corte', 'assembly', 'pliers', '#dc2626',
        ['pinzas de corte', 'alicates de corte'],
        'Permiten cortar materiales compatibles con su capacidad.'),

    tool('locking-pliers', 'Pinzas de presión', 'assembly', 'pliers', '#64748b',
        ['pinzas de presion', 'pinzas de bloqueo'],
        'Permiten mantener una sujeción mecánica bloqueada.'),

    tool('puller', 'Extractor de rodamientos', 'assembly', 'puller', '#475569',
        ['extractor', 'extractor de rodamientos'],
        'Facilita la extracción controlada de determinados componentes.'),

    // ELECTRICIDAD

    tool('multimeter', 'Multímetro digital', 'electrical', 'meter', '#eab308',
        ['multimetro', 'multimetro digital', 'tester'],
        'Permite medir magnitudes eléctricas según su configuración.'),

    tool('clamp-meter', 'Pinza amperimétrica', 'electrical', 'clamp', '#ef4444',
        ['pinza amperimetrica', 'amperimetro'],
        'Permite medir corriente mediante una mordaza de medición.'),

    tool('continuity', 'Probador de continuidad', 'electrical', 'probe', '#f97316',
        ['probador de continuidad', 'continuidad'],
        'Comprueba la continuidad de un circuito en condiciones adecuadas.'),

    tool('voltage', 'Probador de voltaje', 'electrical', 'probe', '#eab308',
        ['probador de voltaje', 'detector de voltaje'],
        'Permite comprobar la presencia de tensión dentro de su rango.'),

    tool('oscilloscope', 'Osciloscopio', 'electrical', 'screen', '#2563eb',
        ['osciloscopio'],
        'Visualiza señales eléctricas en función del tiempo.'),

    tool('stripper', 'Pelacables', 'electrical', 'pliers', '#f97316',
        ['pelacables', 'pelador de cables'],
        'Retira aislamiento de conductores compatibles.'),

    tool('crimper', 'Crimpadora', 'electrical', 'pliers', '#2563eb',
        ['crimpadora', 'ponchadora'],
        'Permite realizar uniones mediante terminales compatibles.'),

    tool('solder', 'Cautín', 'electrical', 'driver', '#0891b2',
        ['cautin', 'soldador'],
        'Se utiliza para trabajos de soldadura electrónica.'),

    tool('test-leads', 'Puntas de prueba', 'electrical', 'probe', '#ef4444',
        ['puntas de prueba', 'puntas del multimetro'],
        'Conectan instrumentos de medición a puntos de prueba compatibles.'),

    tool('insulation', 'Medidor de aislamiento', 'electrical', 'meter', '#f59e0b',
        ['medidor de aislamiento', 'megometro'],
        'Evalúa la resistencia de aislamiento bajo procedimientos autorizados.'),

    // DIAGNÓSTICO

    tool('scanner', 'Escáner de diagnóstico', 'diagnostic', 'screen', '#2563eb',
        ['escaner', 'escaner de diagnostico', 'scanner'],
        'Permite consultar información de diagnóstico compatible.'),

    tool('digital-torque', 'Torquímetro digital', 'diagnostic', 'torque', '#0891b2',
        ['torquimetro digital', 'llave dinamometrica digital'],
        'Muestra valores de torque mediante una pantalla digital.'),

    tool('torque', 'Torquímetro mecánico', 'diagnostic', 'torque', '#64748b',
        ['torquimetro mecanico', 'llave dinamometrica'],
        'Permite aplicar torque según su ajuste y procedimiento.'),

    tool('caliper', 'Calibrador Vernier', 'diagnostic', 'caliper', '#94a3b8',
        ['vernier', 'calibrador', 'pie de rey'],
        'Permite medir dimensiones internas, externas y profundidades.'),

    tool('micrometer', 'Micrómetro', 'diagnostic', 'caliper', '#2563eb',
        ['micrometro'],
        'Permite realizar mediciones dimensionales de precisión.'),

    tool('pressure', 'Manómetro', 'diagnostic', 'gauge', '#64748b',
        ['manometro', 'medidor de presion'],
        'Permite medir presión dentro de su rango de operación.'),

    tool('temperature', 'Termómetro infrarrojo', 'diagnostic', 'gun', '#eab308',
        ['termometro', 'termometro infrarrojo'],
        'Estima temperaturas superficiales sin contacto directo.'),

    tool('thermal', 'Cámara térmica', 'diagnostic', 'screen', '#f97316',
        ['camara termica', 'termografica'],
        'Visualiza patrones de temperatura superficial.'),

    tool('vibration', 'Medidor de vibraciones', 'diagnostic', 'meter', '#16a34a',
        ['medidor de vibraciones', 'vibrometro'],
        'Permite medir parámetros de vibración mecánica.'),

    tool('depth', 'Medidor de profundidad', 'diagnostic', 'caliper', '#64748b',
        ['medidor de profundidad', 'profundimetro'],
        'Permite medir la profundidad de alojamientos.'),

    // MOTORIZADAS

    tool('impact', 'Llave de impacto eléctrica', 'powered', 'gun', '#dc2626',
        ['llave de impacto electrica', 'pistola de impacto electrica'],
        'Proporciona giro motorizado mediante impactos.'),

    tool('air-impact', 'Llave de impacto neumática', 'powered', 'gun', '#0891b2',
        ['llave de impacto neumatica', 'pistola neumatica'],
        'Utiliza aire comprimido para generar movimiento de impacto.'),

    tool('drill', 'Taladro inalámbrico', 'powered', 'gun', '#eab308',
        ['taladro', 'taladro inalambrico'],
        'Proporciona movimiento rotativo para accesorios compatibles.'),

    tool('electric-driver', 'Atornillador eléctrico', 'powered', 'gun', '#16a34a',
        ['atornillador electrico'],
        'Permite realizar operaciones de atornillado motorizado.'),

    tool('electric-ratchet', 'Matraca eléctrica', 'powered', 'ratchet', '#dc2626',
        ['matraca electrica'],
        'Proporciona giro motorizado a dados compatibles.'),

    tool('grinder', 'Esmeril angular', 'powered', 'grinder', '#2563eb',
        ['esmeril', 'amoladora'],
        'Permite operaciones de desbaste con accesorios autorizados.'),

    tool('air-gun', 'Pistola de aire', 'powered', 'gun', '#64748b',
        ['pistola de aire', 'sopladora'],
        'Proporciona un flujo dirigido de aire comprimido.'),

    tool('heat-gun', 'Pistola de calor', 'powered', 'gun', '#f97316',
        ['pistola de calor'],
        'Proporciona un flujo de aire caliente controlado.'),

    tool('electric-grease', 'Engrasadora eléctrica', 'powered', 'gun', '#eab308',
        ['engrasadora electrica'],
        'Permite suministrar lubricante mediante accionamiento eléctrico.'),

    tool('vacuum', 'Bomba de vacío', 'powered', 'pump', '#0891b2',
        ['bomba de vacio'],
        'Genera vacío para aplicaciones compatibles.'),

    // INSPECCIÓN

    tool('flashlight', 'Linterna de mano', 'inspection', 'flashlight', '#eab308',
        ['linterna de mano', 'linterna manual'],
        'Proporciona iluminación portátil dirigida.'),

    tool('headlamp', 'Linterna frontal', 'inspection', 'flashlight', '#2563eb',
        ['linterna frontal', 'linterna de cabeza'],
        'Proporciona iluminación dejando las manos disponibles.'),

    tool('magnetic-light', 'Linterna magnética', 'inspection', 'lamp', '#dc2626',
        ['linterna magnetica', 'magnetica'],
        'Puede sujetarse a superficies ferromagnéticas compatibles.'),

    tool('inspection-light', 'Lámpara de inspección', 'inspection', 'lamp', '#16a34a',
        ['lampara de inspeccion', 'lampara de taller'],
        'Ilumina zonas de trabajo durante una inspección.'),

    tool('articulated-light', 'Linterna articulada', 'inspection', 'lamp', '#f97316',
        ['linterna articulada', 'articulada'],
        'Permite orientar el elemento de iluminación.'),

    tool('mirror', 'Espejo de inspección', 'inspection', 'mirror', '#64748b',
        ['espejo', 'espejo de inspeccion'],
        'Facilita la observación de zonas de difícil acceso.'),

    tool('endoscope', 'Cámara endoscópica', 'inspection', 'screen', '#eab308',
        ['endoscopio', 'camara endoscopica', 'boroscopio'],
        'Permite visualizar espacios internos de difícil acceso.'),

    tool('grease', 'Engrasadora manual', 'inspection', 'driver', '#2563eb',
        ['engrasadora manual', 'grasera'],
        'Permite suministrar lubricante mediante accionamiento manual.'),

    tool('brush', 'Cepillo metálico', 'inspection', 'brush', '#f97316',
        ['cepillo metalico', 'cepillo de alambre'],
        'Permite limpiar determinadas superficies compatibles.'),

    tool('funnel', 'Embudo de servicio', 'inspection', 'funnel', '#dc2626',
        ['embudo', 'embudo de servicio'],
        'Facilita la transferencia de fluidos compatibles.')
];

export const getTool = id =>
    catalog.find(tool => tool.id === id);

export const getCategory = id =>
    categories.find(category => category.id === id);

export const getToolsByCategory = id =>
    catalog.filter(tool => tool.category === id);

export function normalize(text = '') {
    return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function searchTools(text) {
    const query = normalize(text);

    if (!query) return catalog;

    return catalog.filter(tool =>
        normalize([
            tool.name,
            ...tool.aliases,
            tool.description
        ].join(' ')).includes(query)
    );
}

export function matchTools(text) {
    const query = ` ${normalize(text)} `;

    const matches = catalog.flatMap(tool =>
        [tool.name, ...tool.aliases]
            .filter(alias =>
                query.includes(` ${normalize(alias)} `)
            )
            .map(alias => ({
                tool,
                score: normalize(alias).length
            }))
    );

    if (!matches.length) return [];

    const max = Math.max(...matches.map(m => m.score));

    return [...new Map(
        matches
            .filter(m => m.score === max)
            .map(m => [m.tool.id, m.tool])
    ).values()];
}
