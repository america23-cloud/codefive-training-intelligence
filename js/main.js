
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { catalog, categories, normalize } from './catalog.js';
import { SessionManager } from './session.js';
import { ActivityLogger } from './logger.js';
import { TrainingAnalytics } from './analytics.js';
import { TrainingAssistant } from './assistant.js';
import { Telemetry } from './telemetry.js';
import { ToolManager } from './tools.js';
import { InteractionEngine } from './interaction.js';
import { Glove } from './glove.js';
import { HandTracking } from './hand-tracking.js';
import { Simulation } from './simulation.js';
import { AudioMonitor } from './audio.js';
import { VoiceEngine } from './voice.js';
import { commandGroups } from './commands.js';

const $ = id => document.getElementById(id);

const session = new SessionManager();

session.start();

const logger = new ActivityLogger(session);

const analytics = new TrainingAnalytics(logger, session);
const telemetry = new Telemetry(logger, analytics);

logger.activity('SESSION_STARTED', 'Sesión de entrenamiento iniciada');

logger.addEventListener('storage-error', () => {
    $('storageStatus').textContent = 'Error de almacenamiento';
});

// ESCENA 3D

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    38, 1, 0.1, 100
);

camera.position.set(0, 0.9, 9);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

$('scene').appendChild(renderer.domElement);

const controls = new OrbitControls(
    camera, renderer.domElement
);

controls.enableDamping = true;
controls.minDistance = 2;
controls.maxDistance = 18;

controls.target.set(0, 0.2, 0);

scene.add(
    new THREE.HemisphereLight('#ffffff', '#8191a2', 2.5)
);

const keyLight = new THREE.DirectionalLight('#ffffff', 3);

keyLight.position.set(4, 7, 6);
keyLight.castShadow = true;

keyLight.shadow.mapSize.set(1024, 1024);

scene.add(keyLight);

const fill = new THREE.DirectionalLight('#b9d9ff', 1.6);

fill.position.set(-5, 3, -3);

scene.add(fill);

const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.12 })
);

floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.48;
floor.receiveShadow = true;

scene.add(floor);

const grid = new THREE.GridHelper(
    30, 60, '#9aafc3', '#d1dbe5'
);

grid.position.y = -1.47;

scene.add(grid);

// MÓDULOS DE INTERACCIÓN

const gloves = [
    new Glove(scene, 0),
    new Glove(scene, 1)
];

const simulation = new Simulation(scene);

const tools = new ToolManager(scene);

const interaction = new InteractionEngine(
    tools, simulation, logger, session
);

const tracking = new HandTracking(
    $('video'), $('overlay'), gloves, logger
);

let manualAngle = 0;
let manualGrip = false;
let manualAtBolt = false;

function message(text) {

    $('sceneMessage').textContent = text;
}

function resetHands() {

    manualAngle = 0;
    manualGrip = false;
    manualAtBolt = false;

    gloves.forEach((glove, index) => {

        glove.setVisible(true);

        glove.positionTarget.set(
            index === 0 ? -1.55 : 1.55,
            -0.1,
            0
        );

        glove.pose(false, 0);
    });
}

function resetView() {

    camera.position.set(0, 0.9, 9);

    controls.target.set(0, 0.2, 0);

    controls.update();
}

function view(x, y, z) {

    const distance = camera.position.distanceTo(
        controls.target
    );

    camera.position.copy(
        new THREE.Vector3(x, y, z)
            .normalize()
            .multiplyScalar(distance)
            .add(controls.target)
    );

    controls.update();
}

function zoom(factor) {

    const direction = camera.position.clone()
        .sub(controls.target);

    const distance = THREE.MathUtils.clamp(
        direction.length() * factor, 2, 18
    );

    camera.position.copy(
        direction.normalize()
            .multiplyScalar(distance)
            .add(controls.target)
    );
}

// INVENTARIO

function renderInventory(query = '') {

    const container = $('toolList');

    container.replaceChildren();

    const search = normalize(query);

    let total = 0;

    categories.forEach(category => {

        const items = catalog.filter(tool =>
            tool.category === category.id &&
            normalize(
                [tool.name, ...tool.aliases].join(' ')
            ).includes(search)
        );

        if (!items.length) return;

        total += items.length;

        const details = document.createElement('details');

        details.className = 'tool-category';
        details.open = Boolean(search) || category.id === 'mechanical';

        details.style.setProperty(
            '--category-color', category.color
        );

        const summary = document.createElement('summary');

        summary.textContent =
            `${category.icon} ${category.name} (${items.length})`;

        details.appendChild(summary);

        const list = document.createElement('div');

        list.className = 'category-items';

        items.forEach(tool => {

            const button = document.createElement('button');

            button.className = 'tool-button';
            button.dataset.tool = tool.id;
            button.title = tool.description;

            button.style.setProperty('--tool-color', tool.color);

            const dot = document.createElement('span');

            dot.className = 'tool-dot';

            const name = document.createElement('span');

            name.textContent = tool.name;

            button.append(dot, name);

            button.classList.toggle(
                'selected', tools.selected?.id === tool.id
            );

            button.onclick = () =>
                execute('select-tool', tool.id, 'interface');

            list.appendChild(button);
        });

        details.appendChild(list);
        container.appendChild(details);
    });

    $('inventoryCount').textContent = `${total} herramientas`;
}

$('toolSearch').addEventListener('input', event =>
    renderInventory(event.target.value)
);

renderInventory();

// COMANDOS

function renderCommands() {

    const container = $('commandList');

    container.replaceChildren();

    commandGroups.forEach(group => {

        const details = document.createElement('details');

        details.className = 'command-category';

        const summary = document.createElement('summary');

        summary.textContent = group.name;

        details.appendChild(summary);

        group.commands.forEach(([id, name]) => {

            const button = document.createElement('button');

            button.className = 'command-button';
            button.textContent = name;

            button.onclick = async () => {

                const response = await execute(id);

                $('voiceResponse').textContent = response;
            };

            details.appendChild(button);
        });

        container.appendChild(details);
    });

    const toolsGroup = document.createElement('details');

    toolsGroup.className = 'command-category';

    const summary = document.createElement('summary');

    summary.textContent = 'Selección de herramientas (60)';

    toolsGroup.appendChild(summary);

    catalog.forEach(tool => {

        const button = document.createElement('button');

        button.className = 'command-button';

        button.textContent = `Seleccionar ${tool.name}`;

        button.onclick = () => execute('select-tool', tool.id);

        toolsGroup.appendChild(button);
    });

    container.appendChild(toolsGroup);
}

renderCommands();

async function execute(id, value = null, source = 'interface') {

    logger.activity(
        'COMMAND_EXECUTED',
        `Comando: ${id}`,
        {
            inputMethod: source,
            metadata: { value }
        }
    );

    switch (id) {

        case 'select-tool': {

            manualAtBolt = false;

            const tool = interaction.select(value, source);

            if (!tool) return 'Herramienta no disponible.';

            document.querySelectorAll('[data-tool]').forEach(button => {

                button.classList.toggle(
                    'selected',
                    button.dataset.tool === value
                );
            });

            $('toolDescription').textContent =
                session.mode === 'evaluation'
                    ? 'Herramienta disponible.'
                    : tool.description;

            message(`${tool.name} disponible`);

            return `${tool.name} disponible en la estación.`;
        }

        case 'zoom-in':
            zoom(0.83);
            return 'Vista acercada.';

        case 'zoom-out':
            zoom(1.2);
            return 'Vista alejada.';

        case 'front':
            view(0, 0.1, 1);
            return 'Vista frontal.';

        case 'back':
            view(0, 0.1, -1);
            return 'Vista posterior.';

        case 'left':
            view(-1, 0.1, 0);
            return 'Vista izquierda.';

        case 'right':
            view(1, 0.1, 0);
            return 'Vista derecha.';

        case 'top':
            view(0, 1, 0.001);
            return 'Vista superior.';

        case 'reset-view':
            resetView();
            return 'Vista restablecida.';

        case 'inventory':
            $('inventory').open = true;
            return 'Inventario abierto.';

        case 'close-inventory':
            $('inventory').open = false;
            return 'Inventario cerrado.';

        case 'help':
            $('voiceHelp').open = true;
            return 'Biblioteca de comandos disponible.';

        case 'close-help':
            $('voiceHelp').open = false;
            return 'Biblioteca de comandos cerrada.';

        case 'light-on':
            return tools.setLight(true)
                ? 'Iluminación virtual encendida.'
                : 'Primero selecciona una linterna o lámpara.';

        case 'light-off':
            return tools.setLight(false)
                ? 'Iluminación virtual apagada.'
                : 'No hay una linterna seleccionada.';

        case 'release':

            interaction.release();
            manualAtBolt = false;

            return 'Herramienta liberada.';

        case 'status': {

            const data = analytics.calculate();

            return `Tu progreso es del ${Math.round(interaction.progress)} por ciento. Tienes ${data.errors} errores registrados y ${data.help} solicitudes de ayuda.`;
        }

        case 'training':
        case 'evaluation':

            session.setMode(id);

            $('mode').value = id;

            $('toolDescription').textContent =
                id === 'evaluation'
                    ? 'Modo evaluación: orientación técnica desactivada.'
                    : tools.selected?.description || 'Selecciona una herramienta.';

            return id === 'training'
                ? 'Modo entrenamiento activado.'
                : 'Modo evaluación activado. No proporcionaré pistas técnicas.';

        case 'restart':

            manualAtBolt = false;
            interaction.reset();

            return 'Práctica reiniciada.';

        case 'export':

            await logger.export();

            return 'Archivo de resultados generado.';

        case 'stop':

            stopVoice();

            return 'Reconocimiento desactivado.';

        default:

            return 'Acción no disponible.';
    }
}

document.querySelectorAll('[data-command]').forEach(button => {

    button.onclick = () =>
        execute(button.dataset.command);
});

$('mode').onchange = event =>
    execute(event.target.value);

// ASISTENTE

const assistant = new TrainingAssistant({
    execute, logger, session, analytics
});

function addChat(role, text) {

    const item = document.createElement('div');

    item.className = `chat-message ${role}`;

    const label = document.createElement('strong');

    label.textContent =
        role === 'technician' ? 'TÉCNICO' : 'CODEFIVE';

    const content = document.createElement('p');

    content.textContent = text;

    item.append(label, content);

    $('chatHistory').appendChild(item);

    while ($('chatHistory').children.length > 40) {

        $('chatHistory').firstElementChild.remove();
    }

    $('chatHistory').scrollTop =
        $('chatHistory').scrollHeight;
}

async function processRequest(text, fromVoice = false) {

    $('transcript').textContent = text;

    const response = await assistant.handle(
        text,
        fromVoice && $('wakeWord').checked
    );

    if (!response) {

        $('voiceResponse').textContent =
            'Di Hola, Volvo para activar el asistente.';

        return;
    }

    addChat('technician', text);
    addChat('assistant', response);

    $('voiceResponse').textContent = response;

    if ($('voiceFeedback').checked && voice.enabled) {

        voice.speak(response);
    }
}

$('chatForm').onsubmit = async event => {

    event.preventDefault();

    const text = $('chatInput').value.trim();

    if (!text) return;

    $('chatInput').value = '';

    try {

        await processRequest(text);

    } catch (error) {

        $('voiceResponse').textContent = error.message;
    }
};

// AUDIO Y VOZ

let lastAudioUpdate = 0;

const audio = new AudioMonitor(
    $('waveform'),
    db => {

        if (performance.now() - lastAudioUpdate < 100) return;

        lastAudioUpdate = performance.now();

        $('audioLevel').textContent =
            `${Math.round(db)} dBFS`;

        $('audioSignal').textContent =
            db > -45 ? 'Sonido detectado' : 'Entrada baja';
    }
);

const voice = new VoiceEngine({

    onState: state => {

        $('voiceState').textContent = state;
    },

    onInterim: text => {

        $('transcript').textContent = text;
    },

    onResult: async (text, confidence) => {

        logger.system(
            'VOICE_RECOGNIZED',
            'Reconocimiento de voz recibido',
            { metadata: { confidence } }
        );

        await processRequest(text, true);
    },

    onError: error => {

        audio.stop();

        $('micBtn').classList.remove('active');

        $('voiceState').textContent = 'Error de reconocimiento';
        $('voiceResponse').textContent = error;

        logger.system(
            'VOICE_ERROR',
            error,
            { level: 'ERROR' }
        );
    }
});

let voiceStarting = false;

async function startVoice() {

    if (voiceStarting) return;

    if (!voice.supported) {

        $('voiceResponse').textContent =
            'Este navegador no ofrece reconocimiento de voz. Prueba Chrome.';

        return;
    }

    voiceStarting = true;

    try {

        $('voiceState').textContent = 'Solicitando micrófono';

        const settings = await audio.start();

        if (!voice.start()) {

            audio.stop();
            return;
        }

        $('micBtn').classList.add('active');

        $('noiseStatus').textContent =
            settings.noiseSuppression
                ? 'Filtro del monitor activo'
                : 'Filtro no verificado';

        logger.system(
            'MICROPHONE_STARTED',
            'Monitor de audio iniciado'
        );

    } catch (error) {

        audio.stop();

        $('voiceResponse').textContent = error.message;

        logger.system(
            'MICROPHONE_ERROR',
            error.message,
            { level: 'ERROR' }
        );

    } finally {

        voiceStarting = false;
    }
}

function stopVoice() {

    voice.stop();
    audio.stop();

    $('micBtn').classList.remove('active');

    $('audioLevel').textContent = '—';
    $('audioSignal').textContent = 'Sin captura';
}

$('micBtn').onclick = () => {

    if (voice.enabled) stopVoice();
    else startVoice();
};

// CÁMARA

let cameraStarting = false;

$('cameraBtn').onclick = async () => {

    if (cameraStarting) return;

    if (tracking.running) {

        tracking.stop();

        interaction.release();

        resetHands();

        $('cameraBtn').classList.remove('active');
        $('cameraStatus').textContent = 'Desactivada';

        $('cameraPlaceholder').hidden = false;

        document.querySelectorAll('[data-gesture]')
            .forEach(button => button.disabled = false);

        return;
    }

    cameraStarting = true;

    $('cameraStatus').textContent = 'Cargando MediaPipe';

    try {

        await tracking.start();

        interaction.release();

        manualAtBolt = false;

        $('cameraBtn').classList.add('active');
        $('cameraStatus').textContent = 'Seguimiento activo';

        $('cameraPlaceholder').hidden = true;

        document.querySelectorAll('[data-gesture]')
            .forEach(button => button.disabled = true);

    } catch (error) {

        $('cameraStatus').textContent = error.message;

    } finally {

        cameraStarting = false;
    }
};

$('swapHands').onchange = event => {

    tracking.swapHands = event.target.checked;

    interaction.release('hand-calibration');

    logger.system(
        'HAND_CALIBRATION',
        'Asignación de manos actualizada'
    );
};

// CONTROLES MANUALES

function moveHandTo(target) {

    const glove = gloves[0];

    const offset = glove.getState().position
        .sub(glove.root.position);

    glove.positionTarget.copy(
        target.clone().sub(offset)
    );
}

function alignBolt() {

    if (
        interaction.heldBy !== 0 ||
        tools.selected?.id !== 'ratchet'
    ) return;

    const hand = gloves[0].getState();

    const pose = interaction.calculatePose(hand);

    const offset = tools.object.userData.tip.clone()
        .sub(tools.object.userData.grip)
        .applyQuaternion(pose.quaternion);

    moveHandTo(
        simulation.getTarget().sub(offset)
    );
}

document.querySelectorAll('[data-gesture]').forEach(button => {

    button.onclick = () => {

        if (tracking.running) return;

        switch (button.dataset.gesture) {

            case 'open':

                manualGrip = false;
                manualAtBolt = false;
                break;

            case 'grip':

                manualGrip = true;
                break;

            case 'approach': {

                const target = interaction.getGripPosition();

                if (target) {

                    manualAtBolt = false;
                    moveHandTo(target);
                }

                break;
            }

            case 'bolt':

                if (interaction.heldBy === 0) {

                    manualAtBolt = true;
                    alignBolt();

                } else {

                    message('Primero sujeta la herramienta.');
                }

                break;

            case 'turn':

                manualAngle += 0.2;
                break;
        }

        gloves[0].pose(manualGrip, manualAngle);
    };
});

$('resetBtn').onclick = () => {

    interaction.reset();

    resetView();

    if (!tracking.running) resetHands();
};

// TAMAÑO DEL CANVAS

function resize() {

    const width = $('scene').clientWidth;
    const height = $('scene').clientHeight;

    if (!width || !height) return;

    renderer.setSize(width, height);

    camera.aspect = width / height;

    camera.fov = camera.aspect < 1 ? 48 : 38;

    camera.updateProjectionMatrix();
}

new ResizeObserver(resize).observe($('scene'));

resize();

// BUCLE PRINCIPAL

const clock = new THREE.Clock();

let lastTelemetry = 0;
let frames = 0;
let lastFPS = performance.now();

function animate() {

    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);

    if (tracking.running) {

        try {

            tracking.update();

        } catch (error) {

            tracking.stop();

            interaction.release('tracking-error');

            resetHands();

            $('cameraStatus').textContent = 'Error de seguimiento';

            $('cameraBtn').classList.remove('active');

            $('cameraPlaceholder').hidden = false;

            document.querySelectorAll('[data-gesture]')
                .forEach(button => button.disabled = false);

            logger.system(
                'TRACKING_ERROR',
                error.message,
                { level: 'ERROR' }
            );
        }
    }

    gloves.forEach(glove => glove.update(delta));

    if (manualAtBolt && !tracking.running) {

        alignBolt();
    }

    interaction.update(
        gloves.map(glove => glove.getState()),
        delta
    );

    if (performance.now() - lastTelemetry > 200) {

        lastTelemetry = performance.now();

        telemetry.update(
            gloves.map(glove => glove.getState()),
            interaction,
            tools
        );

        $('taskStatus').textContent =
            interaction.completed
                ? 'Práctica completada'
                : 'Práctica en curso';
    }

    controls.update();

    renderer.render(scene, camera);

    frames++;

    if (performance.now() - lastFPS >= 1000) {

        $('fps').textContent = `${frames} FPS`;

        frames = 0;
        lastFPS = performance.now();
    }
}

window.addEventListener('pagehide', () => {

    tracking.stop();
    voice.stop();
    audio.stop();

    session.finish();
});

animate();
