
import { normalize } from './catalog.js';

export const commandGroups = [

    {
        name: 'Navegación 3D',
        commands: [
            ['zoom-in', 'Acercar vista'],
            ['zoom-out', 'Alejar vista'],
            ['front', 'Vista frontal'],
            ['back', 'Vista posterior'],
            ['left', 'Vista izquierda'],
            ['right', 'Vista derecha'],
            ['top', 'Vista superior'],
            ['reset-view', 'Restablecer vista']
        ]
    },

    {
        name: 'Inventario y herramientas',
        commands: [
            ['inventory', 'Mostrar herramientas'],
            ['close-inventory', 'Ocultar herramientas'],
            ['light-on', 'Encender linterna'],
            ['light-off', 'Apagar linterna'],
            ['release', 'Soltar herramienta']
        ]
    },

    {
        name: 'Entrenamiento',
        commands: [
            ['status', 'Consultar progreso'],
            ['training', 'Modo entrenamiento'],
            ['evaluation', 'Modo evaluación'],
            ['restart', 'Reiniciar práctica'],
            ['export', 'Exportar resultados']
        ]
    },

    {
        name: 'Asistente',
        commands: [
            ['help', 'Mostrar comandos'],
            ['close-help', 'Ocultar comandos'],
            ['stop', 'Dejar de escuchar']
        ]
    }
];

const patterns = [

    ['zoom-in', /\b(acerca|acercar|acercame|amplia|zoom in|mas cerca)\b/],
    ['zoom-out', /\b(aleja|alejar|alejame|zoom out|mas lejos)\b/],

    ['front', /\b(vista frontal|vista de frente|ver de frente)\b/],
    ['back', /\b(vista posterior|vista trasera|ver por detras)\b/],
    ['left', /\b(vista izquierda|gira a la izquierda|girar a la izquierda)\b/],
    ['right', /\b(vista derecha|gira a la derecha|girar a la derecha)\b/],
    ['top', /\b(vista superior|vista desde arriba|ver desde arriba)\b/],

    ['reset-view', /\b(restablecer vista|centrar vista|reiniciar vista)\b/],

    ['close-inventory', /\b(oculta|ocultar|cierra|cerrar)\b.*\b(inventario|herramientas)\b/],
    ['inventory', /\b(muestra|mostrar|abre|abrir)\b.*\b(inventario|herramientas)\b/],

    ['light-off', /\b(apaga|apagar)\b.*\b(luz|linterna|lampara)\b/],
    ['light-on', /\b(enciende|encender|prende|prender)\b.*\b(luz|linterna|lampara)\b/],

    ['release', /\b(suelta|soltar|libera|liberar)\b.*\b(herramienta)\b/],

    ['status', /\b(progreso|avance|desempeno|indicadores|estado del sistema)\b/],

    ['training', /\b(modo entrenamiento|modo practica)\b/],
    ['evaluation', /\b(modo evaluacion|modo examen)\b/],

    ['restart', /\b(reinicia|reiniciar|repite|repetir)\b.*\b(practica|actividad)\b/],

    ['export', /\b(exportar|descargar|guardar)\b.*\b(resultados|registro|reporte)\b/],

    ['close-help', /\b(ocultar comandos|cerrar comandos)\b/],
    ['help', /\b(mostrar comandos|que puedo decir|que comandos)\b/],

    ['stop', /\b(dejar de escuchar|deja de escuchar|apaga el microfono)\b/]
];

export function findCommand(text) {

    const query = normalize(text);

    for (const [id, pattern] of patterns) {

        if (pattern.test(query)) {
            return id;
        }
    }

    return null;
}

export function stripWakeWord(text) {

    return normalize(text)
        .replace(/^(hola|oye|hey)\s+volvo\s*/, '')
        .trim();
}

export function hasWakeWord(text) {

    return /^(hola|oye|hey)\s+volvo\b/
        .test(normalize(text));
}
