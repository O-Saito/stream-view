//@ts-check
/** @import {TexOffset, Position, Size} from "./types/general.js" */
/** @import {UserObject} from "./world.js" */
/** @import {ElementShaderData, PartData} from "./engine.js" */
/** @import {AnimationMainStruct, AnimationPartData, ExceptionsData, AnimationParts, AnimationPartSet} from "./types/animation.js" */
import engine from './engine.js';
import world from './world.js';
import charAnimatior from './systems/characterAnimator.js';
import { charDefinitions } from './atlasManager.js';
import characterAnimator from './systems/characterAnimator.js';

let running = true;
/** @type {UserObject|null} */
let targetUser = null;
/** @type {AnimationMainStruct|null} */
let targetAnimation = null;

const rangeAnimationFrames = /** @type {HTMLInputElement} */ (document.getElementById('range-animation-frames'));
const chkPause = /** @type {HTMLInputElement} */ (document.getElementById('chk-pause'));
const ddlAnimations = /** @type {HTMLSelectElement} */ (document.getElementById('ddl-animations'));
const btnNewAnimation = /** @type {HTMLInputElement} */ (document.getElementById('btn-new-animation'));
const inputAnimationDuration = /** @type {HTMLInputElement} */ (document.getElementById('animation-duration'));
const htmlPartsData = /** @type {HTMLElement} */ (document.getElementById('parts-data'));
const aniamtionFramevalue = /** @type {HTMLElement} */ (document.getElementById('animation-frame-value'));
const btnBaixarJson = /** @type {HTMLElement} */ (document.getElementById('btn-baixar-json'));
const htmlTextureSelects = /** @type {HTMLElement} */ (document.getElementById('texture-selects-container'));

// Timeline node edit panel state
let nodeEditPanel = null;
let nodeEditPanelData = null;

/**
 * @type {Object.<string, { color: string, showPivot: boolean }>}
 */
const partPivotState = {
    "capeBack": { color: "#ff6b6b", showPivot: false },
    "legs": { color: "#4ecdc4", showPivot: false },
    "pants": { color: "#45b7d1", showPivot: false },
    "body": { color: "#96ceb4", showPivot: false },
    "chest": { color: "#feca57", showPivot: false },
    "head": { color: "#ff9ff3", showPivot: false },
    "face": { color: "#54a0ff", showPivot: false },
    "helmet": { color: "#5f27cd", showPivot: false },
    "capeFront": { color: "#1dd1a1", showPivot: false },
    "weapon": { color: "#ff6348", showPivot: false },
    "second_weapon": { color: "#e056a0", showPivot: false }
};

/**
 * Returns the color associated with a character part name
 * @param {string} partName
 * @returns {string}
 */
function getPartColor(partName) {
    return partPivotState[partName]?.color ?? "#888888";
}

const timelineNodes = /** @type {HTMLElement} */ (document.getElementById('timeline-nodes'));
const timelineRuler = /** @type {HTMLElement} */ (document.getElementById('timeline-ruler'));
const timelinePlayhead = /** @type {HTMLElement} */ (document.getElementById('timeline-playhead'));
const timelineWrapper = /** @type {HTMLElement} */ (document.getElementById('timeline-wrapper'));
const timelineFramesShow = /** @type {HTMLInputElement} */ (document.getElementById('timeline-frames-show'));
const chkScrollWithPlayhead = /** @type {HTMLInputElement} */ (document.getElementById('chk-scroll-with-playhead'));
const animationSpeed = /** @type {HTMLInputElement} */ (document.getElementById('animation-speed'));
const canvasZoom = /** @type {HTMLInputElement} */ (document.getElementById('canvas-zoom'));

/**
 * Calculates the available content width of the timeline wrapper
 * @returns {number}
 */
function getTimelineContentWidth() {
    if (!timelineWrapper) return 800;
    const computedStyle = window.getComputedStyle(timelineWrapper);
    const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
    const paddingRight = parseInt(computedStyle.paddingRight) || 0;
    return timelineWrapper.clientWidth - paddingLeft - paddingRight;
}

/**
 * Creates the singleton timeline node edit panel
 * @returns {HTMLElement}
 */
function createNodeEditPanel() {
    const panel = document.createElement('div');
    panel.className = 'timeline-node-panel';
    panel.innerHTML = `
        <div class="timeline-node-panel-header">
            <span class="timeline-node-panel-title">Edit Keyframe</span>
            <button type="button" class="timeline-node-panel-close">✕</button>
        </div>
        <div class="timeline-node-panel-content">
            <div class="control-row">
                <label>Keyframe:</label>
                <input type="number" class="edit-keyframe" min="0" />
            </div>
            <div class="control-row">
                <label>UseSpriteFrame:</label>
                <input type="number" class="edit-usespriteframe" min="1" />
            </div>
            <div class="control-row">
                <label>Pos X:</label>
                <input type="number" class="edit-posx" />
            </div>
            <div class="control-row">
                <label>Pos Y:</label>
                <input type="number" class="edit-posy" />
            </div>
            <div class="control-row">
                <label>Rotation (°):</label>
                <input type="number" class="edit-rotation" step="0.1" />
            </div>
            <div class="control-row texture-row">
                <label>Texture:</label>
                <select class="edit-texture"><option value="">None</option></select>
            </div>
            <div class="exception-keys-section" style="display: none;">
                <h4>Exception Keys</h4>
                <div class="exception-keys-container"></div>
                <button type="button" class="add-exception-key-btn" style="margin-top: 8px;">Add New Key</button>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // Close button
    panel.querySelector('.timeline-node-panel-close').onclick = () => {
        panel.style.display = 'none';
    };

    // Drag logic
    const header = panel.querySelector('.timeline-node-panel-header');
    let isDragging = false, startX, startY, startLeft, startTop;
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.timeline-node-panel-close')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = panel.offsetLeft;
        startTop = panel.offsetTop;
        document.body.style.cursor = 'move';
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        panel.style.left = (startLeft + e.clientX - startX) + 'px';
        panel.style.top = (startTop + e.clientY - startY) + 'px';
    });
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    return panel;
}

/**
 * Shows the edit panel for a timeline node's set data
 * @param {HTMLElement} node
 * @param {string} partName
 * @param {string} presetName
 * @param {number} setIndex
 * @param {Array<number>|null} exceptionPath
 */
function showNodeEditPanel(node, partName, presetName, setIndex, exceptionPath = null) {
    if (!nodeEditPanel) nodeEditPanel = createNodeEditPanel();

    // Get the correct set by traversing exceptions if needed
    let targetPart = targetAnimation?.parts[partName]?.[presetName];
    if (!targetPart) return;

    if (exceptionPath) {
        for (const excIdx of exceptionPath) {
            if (!targetPart.exceptions) return;
            targetPart = targetPart.exceptions[excIdx].part;
        }
    }

    const set = targetPart.sets?.[setIndex];
    if (!set) return;

    nodeEditPanelData = { partName, presetName, setIndex, exceptionPath };

    // Position panel near the node
    const rect = node.getBoundingClientRect();
    nodeEditPanel.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - 320) + 'px';
    nodeEditPanel.style.top = Math.min(rect.top + window.scrollY, window.innerHeight - 400) + 'px';

    // Populate title
    const titleText = exceptionPath
        ? `${partName}:${presetName} (Exception ${exceptionPath.join('.')})`
        : `${partName}:${presetName}`;
    nodeEditPanel.querySelector('.timeline-node-panel-title').textContent = titleText;

    // Populate fields
    nodeEditPanel.querySelector('.edit-keyframe').value = set.keyframe;
    nodeEditPanel.querySelector('.edit-usespriteframe').value = (set.useSpriteFrame ?? 0) + 1;
    nodeEditPanel.querySelector('.edit-posx').value = set.posOffset?.x ?? 0;
    nodeEditPanel.querySelector('.edit-posy').value = set.posOffset?.y ?? 0;
    nodeEditPanel.querySelector('.edit-rotation').value = (set.rotation ?? 0) * (180 / Math.PI);

    // Populate texture dropdown to match .ddl-skin-set behavior
    const textureRow = nodeEditPanel.querySelector('.texture-row');
    const textureSelect = nodeEditPanel.querySelector('.edit-texture');
    const userPart = targetUser?.components.sprite.parts[partName] ?? { texture: "" };
    const spriteInfo = charAnimatior.spritesData[userPart.texture ?? ""] ?? {};

    if (spriteInfo.multiParts) {
        textureRow.style.display = 'flex';
        const options = [
            ["", "Preset Selected"],
            ...Object.getOwnPropertyNames(spriteInfo.multiParts)
        ];
        textureSelect.innerHTML = options.map(opt => {
            if (Array.isArray(opt)) {
                const [value, text] = opt;
                return `<option value="${value}" ${set.texture === value ? 'selected' : ''}>${text}</option>`;
            }
            return `<option value="${opt}" ${set.texture === opt ? 'selected' : ''}>${opt}</option>`;
        }).join('');
    } else {
        textureRow.style.display = 'none';
    }

    // Handle exception keys section
    const exceptionSection = nodeEditPanel.querySelector('.exception-keys-section');
    const exceptionContainer = nodeEditPanel.querySelector('.exception-keys-container');

    if (exceptionPath && nodeEditPanelData) {
        // Traverse to the exception object
        let targetPart = targetAnimation?.parts[nodeEditPanelData.partName]?.[nodeEditPanelData.presetName];
        let exception = null;

        if (targetPart && targetPart.exceptions) {
            let current = targetPart;
            for (const excIdx of exceptionPath) {
                if (current.exceptions && current.exceptions[excIdx]) {
                    exception = current.exceptions[excIdx];
                    current = current.exceptions[excIdx].part;
                }
            }
        }

        if (exception) {
            exceptionSection.style.display = 'block';
            renderExceptionKeysSection(exception, exceptionContainer);
        } else {
            exceptionSection.style.display = 'none';
        }
    } else {
        exceptionSection.style.display = 'none';
    }

    // Show panel
    nodeEditPanel.style.display = 'block';

    // Bind change events for set data
    const inputs = nodeEditPanel.querySelectorAll('.control-row input, .control-row select');
    inputs.forEach(el => el.onchange = () => {
        if (!nodeEditPanelData) return;
        const { partName: p, presetName: pr, setIndex: si, exceptionPath: ep } = nodeEditPanelData;

        // Get the correct set
        let targetPart = targetAnimation?.parts[p]?.[pr];
        if (!targetPart) return;

        if (ep) {
            for (const excIdx of ep) {
                if (!targetPart.exceptions) return;
                targetPart = targetPart.exceptions[excIdx].part;
            }
        }

        const s = targetPart.sets?.[si];
        if (!s) return;

        s.keyframe = parseInt(nodeEditPanel.querySelector('.edit-keyframe').value);
        s.useSpriteFrame = parseInt(nodeEditPanel.querySelector('.edit-usespriteframe').value) - 1;
        if (!s.posOffset) s.posOffset = {};
        s.posOffset.x = parseInt(nodeEditPanel.querySelector('.edit-posx').value);
        s.posOffset.y = parseInt(nodeEditPanel.querySelector('.edit-posy').value);
        s.texture = nodeEditPanel.querySelector('.edit-texture').value || undefined;
        s.rotation = parseFloat(nodeEditPanel.querySelector('.edit-rotation').value) * (Math.PI / 180);

        updateTimeline();
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    // Delegate events for exception controls
    exceptionContainer.onchange = (e) => {
        if (e.target.classList.contains('edit-exception-key-value')) {
            const key = e.target.dataset.key;
            const newTexture = e.target.value;

            let targetPart = targetAnimation?.parts[nodeEditPanelData.partName]?.[nodeEditPanelData.presetName];
            let exception = null;

            if (targetPart && targetPart.exceptions) {
                let current = targetPart;
                for (const excIdx of nodeEditPanelData.exceptionPath) {
                    if (current.exceptions && current.exceptions[excIdx]) {
                        exception = current.exceptions[excIdx];
                        current = current.exceptions[excIdx].part;
                    }
                }
            }

            if (exception && exception.keys[key]) {
                // Replace the value - remove old, add new
                const arr = exception.keys[key];
                // For simplicity, just push the new value if not already there
                if (newTexture && !arr.includes(newTexture)) {
                    arr.push(newTexture);
                }

                renderExceptionKeysSection(exception, exceptionContainer);
                updateTimeline();
                ddlAnimations.dispatchEvent(new Event('change'));
            }
        }
    };

    // Use event delegation for buttons
    exceptionContainer.onclick = (e) => {
        const target = e.target;

        // Remove texture button
        if (target.classList.contains('remove-exception-texture-btn')) {
            const key = target.dataset.key;
            const texture = target.dataset.texture;

            let targetPart = targetAnimation?.parts[nodeEditPanelData.partName]?.[nodeEditPanelData.presetName];
            let exception = null;

            if (targetPart && targetPart.exceptions) {
                let current = targetPart;
                for (const excIdx of nodeEditPanelData.exceptionPath) {
                    if (current.exceptions && current.exceptions[excIdx]) {
                        exception = current.exceptions[excIdx];
                        current = current.exceptions[excIdx].part;
                    }
                }
            }

            if (exception && exception.keys[key]) {
                const arr = exception.keys[key];
                const idx = arr.indexOf(texture);
                if (idx > -1) arr.splice(idx, 1);

                renderExceptionKeysSection(exception, exceptionContainer);
                updateTimeline();
                ddlAnimations.dispatchEvent(new Event('change'));
            }
        }

        // Add texture button
        if (target.classList.contains('add-exception-texture-btn')) {
            const key = target.dataset.key;

            let targetPart = targetAnimation?.parts[nodeEditPanelData.partName]?.[nodeEditPanelData.presetName];
            let exception = null;

            if (targetPart && targetPart.exceptions) {
                let current = targetPart;
                for (const excIdx of nodeEditPanelData.exceptionPath) {
                    if (current.exceptions && current.exceptions[excIdx]) {
                        exception = current.exceptions[excIdx];
                        current = current.exceptions[excIdx].part;
                    }
                }
            }

            if (exception && exception.keys[key]) {
                const allTextures = Object.getOwnPropertyNames(charAnimatior.getSpritesData());
                const arr = exception.keys[key];
                let newTexture = null;

                // Find first available texture not in array
                for (const t of allTextures) {
                    if (!arr.includes(t)) {
                        newTexture = t;
                        break;
                    }
                }

                if (newTexture) {
                    arr.push(newTexture);
                    renderExceptionKeysSection(exception, exceptionContainer);
                    updateTimeline();
                    ddlAnimations.dispatchEvent(new Event('change'));
                }
            }
        }

        // Remove key button
        if (target.classList.contains('remove-exception-key-btn')) {
            const key = target.dataset.key;

            let targetPart = targetAnimation?.parts[nodeEditPanelData.partName]?.[nodeEditPanelData.presetName];
            let exception = null;

            if (targetPart && targetPart.exceptions) {
                let current = targetPart;
                for (const excIdx of nodeEditPanelData.exceptionPath) {
                    if (current.exceptions && current.exceptions[excIdx]) {
                        exception = current.exceptions[excIdx];
                        current = current.exceptions[excIdx].part;
                    }
                }
            }

            if (exception && exception.keys[key]) {
                delete exception.keys[key];
                renderExceptionKeysSection(exception, exceptionContainer);
                updateTimeline();
                ddlAnimations.dispatchEvent(new Event('change'));
            }
        }
    };

    // Add new key button
    const addKeyBtn = nodeEditPanel.querySelector('.add-exception-key-btn');
    addKeyBtn.onclick = () => {
        if (!nodeEditPanelData) return;

        let targetPart = targetAnimation?.parts[nodeEditPanelData.partName]?.[nodeEditPanelData.presetName];
        let exception = null;

        if (targetPart && targetPart.exceptions) {
            let current = targetPart;
            for (const excIdx of nodeEditPanelData.exceptionPath) {
                if (current.exceptions && current.exceptions[excIdx]) {
                    exception = current.exceptions[excIdx];
                    current = current.exceptions[excIdx].part;
                }
            }
        }

        if (!exception) return;

        // Find first available part name not already a key
        const characterParts = characterAnimator.getCharacterParts();
        let newKey = null;
        for (const part of characterParts) {
            if (!Object.getOwnPropertyNames(exception.keys).includes(part)) {
                newKey = part;
                break;
            }
        }

        if (newKey) {
            exception.keys[newKey] = [];
            renderExceptionKeysSection(exception, exceptionContainer);
            updateTimeline();
            ddlAnimations.dispatchEvent(new Event('change'));
        }
    };
}

btnNewAnimation.onclick = function () {
    const val = prompt("Informe o nome da animação!");
    if (val == "" || val == null) return;

    /** @type {Object.<string, AnimationParts>} */
    let parts = {};
    characterAnimator.getCharacterParts().reverse().forEach(x => {
        parts[x] = {
            default: {
                sets: []
            }
        };
    });

    charAnimatior.animations[val] = {
        duration: 0,
        parts: parts
    };
    updateDdlAnimations();
}

rangeAnimationFrames.onchange = function () {
    if (targetUser == null) return;
    targetUser.components.sprite.currentFrame = parseInt(this.value) - 1;
    editorProcessUserAnimation();
}

chkPause.onchange = function () {
    running = !chkPause.checked;
}

ddlAnimations.onchange = function () {
    targetAnimation = charAnimatior.animations[ddlAnimations.value];
    if (targetAnimation == null) return;
    if (targetUser) targetUser.components.sprite.animation = ddlAnimations.value;
    inputAnimationDuration.value = targetAnimation.duration.toString();
    const characterPartsName = characterAnimator.getCharacterParts().reverse();
    /**
     * @type {Array<string>}
     */
    const textureSelectsHTML = [];
    /**
     * @type {Array<string>}
     */
    const partsDataHTML = [];

    characterPartsName.forEach(x => {
        if (!targetAnimation) targetAnimation = { duration: 0, parts: {} };
        if (!targetAnimation.parts[x]) targetAnimation.parts[x] = { default: { sets: [] } }

        const p = targetAnimation.parts[x];
        const userPart = targetUser?.components.sprite.parts[x] ?? { texture: "" };
        const spriteInfo = charAnimatior.spritesData[userPart.texture ?? ""] ?? {};

        /**
         * @param {string} classname
         * @param {Array<Array<string>|string>} valueString
         * @param {string | undefined} current
         * @param {string} [align]
         * @returns {string}
         */
        const generateDDL = (classname, valueString, current, align = "") => {
            return `
            <select class="${classname}" ${align}>
            ${valueString.map(x => {
                if (Array.isArray(x)) return `<option value=${x[0]} ${current == x[0] ? "selected" : ""}>${x[1]}</option>`;
                return `<option value=${x} ${current == x ? "selected" : ""}>${x}</option>`;
            }).join('')}

            </select> `
        }

        /**
         * @param {string} name
         * @param {AnimationPartData} animationDataPart
         * @param {Array<number> | null} exceptionTree
         * @returns {string}
         */
        const generateMenu = (name, animationDataPart, exceptionTree) => {

            return `
<ul class="set-data" data-animation="${x}" data-name="${name}" data-exception="${exceptionTree?.join('.') ?? ""}">
    <li>Texture: ${spriteInfo.multiParts ? generateDDL("ddl-skin-part", Object.getOwnPropertyNames(spriteInfo.multiParts), animationDataPart.texture) : animationDataPart.texture ?? ""}</li>
    <li>Pos offset:
        x: <input type="number" class="main-pos-offset-x pos-input" value="${animationDataPart.posOffset?.x ?? "0"}" />
        y: <input type="number" class="main-pos-offset-y pos-input" value="${animationDataPart.posOffset?.y ?? "0"}" />
    </li>
    <li>Rotation Pivot:
        x: <input type="number" class="main-rotation-pivot-x pos-input" value="${animationDataPart.rotationPivot?.x ?? "0"}" />
        y: <input type="number" class="main-rotation-pivot-y pos-input" value="${animationDataPart.rotationPivot?.y ?? "0"}" />
    </li>
    <li>Sets: <button type="button" class="add-set">Add Set</button>
        <ul>
            ${animationDataPart.sets.map((set, i) => {
                return `
            <li class="per-set-data" data-index="${i}">
                <button type="button" class="remove-set">Remove Set</button>
                <label>
                    Keyframe: <input type="number" class="keyframe" data-index="${i}" value="${set.keyframe}" min="0" max="${targetAnimation?.duration}" />
                </label>    
                <label>
                    ${spriteInfo.multiParts ? `Replace Texture: ${generateDDL("ddl-skin-set", [["", "Preset Selected"], ...Object.getOwnPropertyNames(spriteInfo.multiParts)], set.texture)}` : ""}
                </label>        
                <label>
                    UseSpriteFrame: <input type="number" class="useSpriteFrame sprite-frame-input" data-index=${i} value=${set.useSpriteFrame ? set.useSpriteFrame + 1 : "1"} min="1" max=${spriteInfo?.multiParts && animationDataPart.texture && spriteInfo.multiParts[animationDataPart.texture] ? spriteInfo.multiParts[animationDataPart.texture].frameCount : spriteInfo.frameCount} />
                </label>                
                <label>
                Rotation (°): <input type="number" class="set-rotation" data-index=${i} value="${(set.rotation ?? 0) * (180 / Math.PI)}" step="0.1" />
                </label>
                <label>
                Pos offset: 
                x: <input type="number" class="posoffsetx pos-input" value="${set.posOffset?.x ?? "0"}" />
                y: <input type="number" class="posoffsety pos-input" value="${set.posOffset?.y ?? "0"}" />
                </label>
            </li>`;
            }).join('')}
        </ul>
    </li>
    <li>
        Exceção: <select>${animationDataPart.exceptions ? animationDataPart.exceptions.map((x, i) => `<option value="${i}">${Object.getOwnPropertyNames(x.keys).map(y => `${y}`).join('::')}</option>`).join('') : ""}</select>
        <button type="button" class="btn-new-exception">Nova Exceção</button>
        ${animationDataPart.exceptions ? animationDataPart.exceptions.map((excp, i) => {
                const newExceptionTree = [...(exceptionTree ?? []), i];
                const exceptionKeys = Object.getOwnPropertyNames(excp.keys);
                return `
                <div class="animation-exception" data-exception="${i}">
                    <button type="button" class="btn-remove-exception">Remover Exceção</button>
                    <span>Keys <button type="button" class="btn-new-exception-key">Nova Key</button>
                    <ul>
                        ${exceptionKeys.map(key => {
                    return `
                    <li class="exception-key-data" data-key="${key}">
                        ${generateDDL("ddl-exception-key", ["", ...characterPartsName.filter(partname => !exceptionKeys.includes(partname) || partname == key)], key, `data-last-selected="${key}"`)}
                        <button class="add-exception-key-value">Add</button>
                        <ul>
                            ${excp.keys[key].map(s => `
                            <li>
                            ${generateDDL("ddl-exception-key-value", ["", ...Object.getOwnPropertyNames(charAnimatior.getSpritesData()).filter(spritename => !excp.keys[key].includes(spritename) || spritename == s)], s, `data-last-selected="${s}"`)}
                            </li>`).join('')}
                        </ul>
                    </li>`
                }).join('')}</span>
                    </ul>
                    <span>Replace: ${excp.replaceParent}</span>
                    ${generateMenu(name, excp.part, newExceptionTree)}
                </div>
                `;
            }).join('') : ""}
    </li>
</ul>
            `;
        };

        if (!p || !userPart || !spriteInfo) return;

        // Texture select for right side container (mirror copy)
        textureSelectsHTML.push(`
            <label class="part-label" data-part="${x}">${x}: <select class="ddl-user-texture-mirror" data-part="${x}"><option value=""></option>${Object.getOwnPropertyNames(charAnimatior.spritesData).map(texName => { return `<option value="${texName}" ${texName == userPart.texture ? "selected" : ""}>${texName}</option>`; }).join('')}</select></label>
        `);

        // Full part data for left sidebar (includes original .ddl-user-texture)
        partsDataHTML.push(`
            <div class="set-data" >
                <div class="set-data-header">
                    <span class="set-data-title" style="color: ${getPartColor(x)}">${x}</span>
                    <span class="set-data-texture">Current: ${userPart.texture || 'None'}</span>
                    <button type="button" class="set-data-toggle">▼</button>
                </div>
                <div class="set-data-content">
                    <label>Texture: <select class="ddl-user-texture" data-part="${x}"><option value=""></option>${Object.getOwnPropertyNames(charAnimatior.spritesData).map(texName => { return `<option ${texName == userPart.texture ? "selected" : ""} >${texName}</option>`; }).join('')}</select></label>
                    <label>Pivot: <input type="color" class="part-pivot-color" data-part="${x}" value="${partPivotState[x]?.color ?? '#ff0000'}" />
                           <input type="checkbox" class="part-pivot-show" data-part="${x}" ${partPivotState[x]?.showPivot ? 'checked' : ''} />
                    </label>
                    ${Object.getOwnPropertyNames(p).map(presetName => { return generateMenu(presetName, p[presetName], null); }).join('')}
                </div>
            </div>
        `);
    });

    // Update right side container with texture selects
    if (htmlTextureSelects) {
        htmlTextureSelects.innerHTML = textureSelectsHTML.join('');
    }

    // Update left sidebar with part data
    htmlPartsData.innerHTML = partsDataHTML.join('');

    // Load and apply collapsed state
    const savedCollapsed = localStorage.getItem('editor-collapsed-parts');
    if (savedCollapsed) {
        try {
            const collapsedParts = JSON.parse(savedCollapsed);
            htmlPartsData.querySelectorAll('.set-data').forEach(setData => {
                const title = setData.querySelector('.set-data-title');
                if (title && collapsedParts.includes(title.textContent)) {
                    setData.classList.add('collapsed');
                    const toggle = setData.querySelector('.set-data-toggle');
                    if (toggle) toggle.textContent = '▶';
                }
            });
        } catch (e) {
            console.warn('Failed to parse saved collapsed state:', e);
        }
    }

    // Handle set-data collapse/expand
    const saveCollapsedState = () => {
        /**
         * @type {Array<string>}
         */
        const collapsedParts = [];
        htmlPartsData.querySelectorAll('.set-data.collapsed').forEach(el => {
            const title = el.querySelector('.set-data-title');
            if (title) collapsedParts.push(title.textContent);
        });
        localStorage.setItem('editor-collapsed-parts', JSON.stringify(collapsedParts));
    };

    /** @type {NodeListOf<HTMLDivElement>} */ (htmlPartsData.querySelectorAll('.set-data-header')).forEach(header => {
        header.onclick = (e) => {
            if (!e.target || (e.target instanceof Element && (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION' || e.target.tagName === 'BUTTON'))) return;
            const setData = header.closest('.set-data');
            if (setData) {
                setData.classList.toggle('collapsed');
                const toggle = header.querySelector('.set-data-toggle');
                if (toggle) toggle.textContent = setData.classList.contains('collapsed') ? '▶' : '▼';
                saveCollapsedState();
            }
        };
    });

    // Handle scroll position for #sidebar .panel-content
    const panelContent = document.querySelector('#sidebar .panel-content');
    if (panelContent) {
        // Load and apply scroll position
        const savedScroll = localStorage.getItem('editor-sidebar-scroll');
        if (savedScroll) {
            setTimeout(() => {
                panelContent.scrollTop = parseInt(savedScroll);
            }, 0);
        }

        // Save scroll position on scroll
        panelContent.addEventListener('scroll', () => {
            localStorage.setItem('editor-sidebar-scroll', panelContent.scrollTop.toString());
        });

        // Backup save on page unload
        window.addEventListener('beforeunload', () => {
            localStorage.setItem('editor-sidebar-scroll', panelContent.scrollTop.toString());
        });
    }

    // Update timeline
    updateTimeline();

    /**
     * @param {string} query
     * @param {string} action
     * @param {Function} func
     */
    const on = (query, action, func) => {
        const els = /** @type {NodeListOf<HTMLInputElement>} */(htmlPartsData.querySelectorAll(query));
        for (let i = 0; i < els.length; i++) {
            // @ts-ignore
            els[i][action] = (e) => {
                func(e);
                if (rangeAnimationFrames?.onchange) rangeAnimationFrames.onchange(new Event(""));
                updateTimeline();
            };
        }
    }

    /**
     * @param {HTMLInputElement | undefined} e
     * @returns {null|AnimationPartData}
     */
    const getSetOf = (e) => {
        if (!e) return null;
        const dataset = /** @type {HTMLElement} */(e.closest('.set-data'))?.dataset;
        if (!dataset || !targetAnimation || !dataset.animation || !dataset.name) return null;
        let set = targetAnimation.parts[dataset.animation][dataset.name];
        let exceptionlist = dataset.exception;
        if (exceptionlist) {
            const excps = exceptionlist.split('.');
            excps.forEach(excp => {
                if (excp == "" || !set.exceptions) return;
                set = set.exceptions[parseInt(excp)].part;
            });
        }
        return set;
    }

    /**
     * Updates a property of an animation set data entry based on the provided HTML element
     * @param {HTMLInputElement} htmlElement
     * @param {string | Array<string>} attribute
     * @param {*} value
     */
    const changesetdata = (htmlElement, attribute, value) => {
        const persetDataset = /** @type {HTMLElement} */(htmlElement.closest('.per-set-data'))?.dataset;
        if (!persetDataset.index) return;
        const set = getSetOf(htmlElement);
        if (Array.isArray(attribute)) {
            // @ts-ignore
            if (!set.sets[parseInt(persetDataset.index)][attribute[0]])
                // @ts-ignore
                set.sets[parseInt(persetDataset.index)][attribute[0]] = {};
            // @ts-ignore
            set.sets[parseInt(persetDataset.index)][attribute[0]][attribute[1]] = parseInt(htmlElement.value);
        }
        else
            // @ts-ignore
            set.sets[parseInt(persetDataset.index)][attribute] = value;
    }

    on('.btn-new-exception-key', 'onclick', function (/** @type {Event} */e) {
        const target = /** @type {HTMLInputElement} */(e.target);
        let set = getSetOf(/** @type {HTMLInputElement} */(e.target));
        if (set == null) return;
        let exception = /** @type {HTMLElement} */(target.closest('.animation-exception'))?.dataset?.exception;
        /** @type {ExceptionsData|null} */
        if (exception && set.exceptions) {
            const dataset = /** @type {HTMLElement} */(target.closest('.set-data'))?.dataset;
            let animation = dataset?.animation;
            let i = 0;
            const charAnimations = characterAnimator.getCharacterParts();
            do {
                if (!animation) animation = charAnimations[i];
                if (set.exceptions[parseInt(exception)].keys[animation]) {
                    i++;
                    animation = undefined;
                    continue;
                }
                set.exceptions[parseInt(exception)].keys[animation] = [];
                break;
            } while (i < charAnimations.length)
        }
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on('.btn-remove-exception', 'onclick', function (/** @type {Event} */e) {
        const target = /** @type {HTMLInputElement} */(e.target);
        let set = getSetOf(/** @type {HTMLInputElement} */(e.target));
        if (set == null) return;
        let exception = /** @type {HTMLElement} */(target.closest('.animation-exception'))?.dataset?.exception;
        if (exception && set.exceptions) {
            set.exceptions.splice(parseInt(exception), 1);
        }
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on('.btn-new-exception', 'onclick', function (/** @type {Event} */e) {
        const set = getSetOf(/** @type {HTMLInputElement} */(e.target));
        if (!set) return;
        if (!set.exceptions)
            set.exceptions = [];
        set.exceptions.push({
            keys: {},
            replaceParent: false,
            part: {
                sets: []
            }
        });
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on('.add-exception-key-value', 'onclick', function (/** @type {Event} */e) {
        const target = /** @type {HTMLInputElement} */(e.target);
        let set = getSetOf(/** @type {HTMLInputElement} */(e.target));
        if (set == null) return;
        let exception = /** @type {HTMLElement} */(target.closest('.animation-exception'))?.dataset?.exception;
        let exceptionKey = /** @type {HTMLElement} */ (target.closest('.exception-key-data'))?.dataset?.key;
        if (exception && set.exceptions && exceptionKey) {
            let i = 0;
            let spriteName = null;
            const sprites = Object.getOwnPropertyNames(charAnimatior.getSpritesData());
            const values = set.exceptions[parseInt(exception)].keys[exceptionKey];
            do {
                if (!spriteName) spriteName = sprites[i];
                if (values.includes(spriteName)) {
                    i++;
                    spriteName = null;
                    continue;
                }
                values.push(spriteName);
                break;
            } while (i < sprites.length)
        }
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on('.ddl-exception-key', 'onchange', function (/** @type {Event} */e) {
        const target = /** @type {HTMLInputElement} */(e.target);
        let set = getSetOf(/** @type {HTMLInputElement} */(e.target));
        if (set == null) return;
        let exception = /** @type {HTMLElement} */(target.closest('.animation-exception'))?.dataset?.exception;
        let lastSelected = target.dataset.lastSelected;
        if (!exception || !lastSelected || !set.exceptions) return;
        if (target.value != "") set.exceptions[parseInt(exception)].keys[target.value] = set.exceptions[parseInt(exception)].keys[lastSelected];
        delete set.exceptions[parseInt(exception)].keys[lastSelected];
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on('.ddl-exception-key-value', 'onchange', function (/** @type {Event} */e) {
        const target = /** @type {HTMLInputElement} */(e.target);
        let set = getSetOf(/** @type {HTMLInputElement} */(e.target));
        if (set == null) return;
        let exception = /** @type {HTMLElement} */(target.closest('.animation-exception'))?.dataset?.exception;
        let exceptionKey = /** @type {HTMLElement} */ (target.closest('.exception-key-data'))?.dataset?.key;
        let lastSelected = target.dataset.lastSelected;
        if (!exception || !lastSelected || !set.exceptions || !exceptionKey) return;
        const list = set.exceptions[parseInt(exception)].keys[exceptionKey];
        const item = list.find(x => x == lastSelected);
        if (item) list.splice(list.indexOf(item), 1);
        if (target.value != "") list.push(target.value);
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on('.add-set', 'onclick', function (/** @type {Event} */e) {
        const set = getSetOf(/** @type {HTMLInputElement} */(e.target));
        if (!set) return;
        set.sets.push({
            keyframe: 0,
            useSpriteFrame: 0,
        });
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on('.remove-set', 'onclick', function (/** @type {Event} */e) {
        const target = /** @type {HTMLInputElement} */(e.target);
        const set = getSetOf(target);
        const persetDataset = /** @type {HTMLElement} */(target.closest('.per-set-data'))?.dataset;
        if (!set || !persetDataset || !persetDataset.index) return;

        set.sets.splice(parseInt(persetDataset.index), 1);
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on(".keyframe", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;
        changesetdata(target, "keyframe", parseInt(target.value));
    });

    on(".useSpriteFrame", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;
        changesetdata(target, "useSpriteFrame", parseInt(target.value) - 1);
    });

    on(".posoffsetx", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;
        changesetdata(target, ["posOffset", "x"], parseInt(target.value));
    });

    on(".posoffsety", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;
        changesetdata(target, ["posOffset", "y"], parseInt(target.value));
    });

    on(".set-rotation", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;
        changesetdata(target, "rotation", parseFloat(target.value) * (Math.PI / 180));
    });

    on(".main-pos-offset-x", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        const part = getSetOf(target);// targetAnimation.parts[dataset.animation][dataset.name];
        if (!part) return;
        if (!part.posOffset) part.posOffset = {};
        part.posOffset.x = parseInt(target.value);
    });

    on(".main-pos-offset-y", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        const part = getSetOf(target);// targetAnimation.parts[dataset.animation][dataset.name];
        if (!part) return;
        if (!part.posOffset) part.posOffset = {};
        part.posOffset.y = parseInt(target.value);
    });

    on(".main-rotation-pivot-x", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        const part = getSetOf(target);
        if (!part) return;
        if (!part.rotationPivot) part.rotationPivot = { x: 0, y: 0 };
        part.rotationPivot.x = parseFloat(target.value);
    });

    on(".main-rotation-pivot-y", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        const part = getSetOf(target);
        if (!part) return;
        if (!part.rotationPivot) part.rotationPivot = { x: 0, y: 0 };
        part.rotationPivot.y = parseFloat(target.value);
    });

    on(".ddl-skin-part", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        const part = getSetOf(target);
        if (!part) return;
        if (part == undefined) return;
        part.texture = target.value;
    });

    on(".ddl-skin-set", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;
        changesetdata(target, "texture", target.value);
    });

    // Handle .ddl-user-texture from sidebar (left side) - sync to mirror and update texture
    on(".ddl-user-texture", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target);
        if (!target || !targetUser) return;
        const partName = target.dataset?.part;
        if (!partName) return;

        // Update the user's texture
        if (!targetUser.components.sprite.parts[partName]) {
            targetUser.components.sprite.parts[partName] = { texture: "", currentFrame: 0 };
        }
        targetUser.components.sprite.parts[partName].texture = target.value;

        // Update the mirror select (right side)
        const mirrorSelect = /** @type {HTMLInputElement} */ (htmlTextureSelects?.querySelector(`.ddl-user-texture-mirror[data-part="${partName}"]`));
        if (mirrorSelect) mirrorSelect.value = target.value;

        // Update the "Current:" display in the header
        const setData = target.closest('.set-data');
        if (setData) {
            const textureDisplay = setData.querySelector('.set-data-texture');
            if (textureDisplay) {
                textureDisplay.textContent = `Current: ${target.value || 'None'}`;
            }
        }

        // Trigger animation update
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on(".part-pivot-color", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target);
        const partName = target.dataset?.part;
        if (!partName || !partPivotState[partName]) return;
        partPivotState[partName].color = target.value;
    });

    on(".part-pivot-show", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target);
        const partName = target.dataset?.part;
        if (!partName || !partPivotState[partName]) return;
        partPivotState[partName].showPivot = target.checked;
    });

    // Handle .ddl-user-texture-mirror from texture-selects-container (right side)
    if (htmlTextureSelects) {
        const els = /** @type {NodeListOf<HTMLInputElement>} */(htmlTextureSelects.querySelectorAll('.ddl-user-texture-mirror'));
        for (let i = 0; i < els.length; i++) {
            els[i].onchange = (e) => {
                const target = /** @type {HTMLInputElement} */(e.target);
                if (!target || !targetUser) return;
                const partName = target.dataset?.part;
                if (!partName) return;

                // Update the corresponding .ddl-user-texture in the left sidebar
                const leftSelect = /** @type {HTMLInputElement} */ (htmlPartsData.querySelector(`.ddl-user-texture[data-part="${partName}"]`));
                if (leftSelect) leftSelect.value = target.value;

                // Apply the texture change
                if (!targetUser.components.sprite.parts[partName]) targetUser.components.sprite.parts[partName] = { texture: "", currentFrame: 0 }
                targetUser.components.sprite.parts[partName].texture = target.value;
                ddlAnimations.dispatchEvent(new Event('change'));
            };
        }
    }
}

animationSpeed.value = engine.getTargetFramerate()[0];
animationSpeed.onchange = function () {
    engine.changeTargetFramerate(parseInt(animationSpeed.value));
}

canvasZoom.value = "2";
canvasZoom.onchange = function () {
    const zoomVal = parseFloat(this.value);
    if (isNaN(zoomVal) || zoomVal <= 0) return;
    engine.canvas.style.setProperty('zoom', zoomVal, 'important');
    engine.uiCanvas.style.setProperty('zoom', zoomVal, 'important');
}

inputAnimationDuration.onchange = function () {
    if (targetAnimation == null) return;
    targetAnimation.duration = parseInt(inputAnimationDuration.value);
    updateTimeline();
}

btnBaixarJson.onclick = function () {
    downloadJsonFile(charAnimatior.animations, "character-animations.json");
}

/**
 * Advances the current animation frame and updates the user's sprite data
 */
function editorProcessUserAnimation() {
    if (targetUser == null) return;
    const sprite = targetUser.components.sprite;
    const animation = charAnimatior.animations[sprite.animation];
    if (animation == null) throw new Error("Animation not found!");

    if (running) {
        sprite.currentFrame++;
    }

    if (sprite.currentFrame >= animation.duration) {
        sprite.currentFrame = 0;
    }

    const data = charAnimatior.getAnimationData(targetUser);

    if (engine.programData.char.updateTransformPart)
        engine.programData.char.updateTransformPart(data, charDefinitions);

    const parts = data.parts;
    Object.getOwnPropertyNames(parts).forEach(partName => {
        const part = parts[partName];
        if (!part || !part.texture || part.texture === "") return;
        if (!partPivotState[partName]?.showPivot) return;

        const centerX = data.position.x + part.posOffset.x + (data.size.width / 2);
        const centerY = data.position.y + part.posOffset.y + (data.size.height / 2);
        const pivotX = centerX + (part.rotationPivot?.x ?? 0);
        const pivotY = engine.canvas.height - centerY - (part.rotationPivot?.y ?? 0);

        engine.requestUIDraw({
            depth: 0,
            f: ({ ctx }) => {
                ctx.save();
                ctx.imageSmoothingEnabled = false;
                ctx.fillStyle = partPivotState[partName].color;
                ctx.fillRect(Math.round(pivotX), Math.round(pivotY), 1, 1);
                ctx.restore();
            }
        });
    });
}

/**
 * Refreshes the animation dropdown list with all available animations
 */
function updateDdlAnimations() {
    ddlAnimations.innerHTML = Object.getOwnPropertyNames(charAnimatior.animations).map(x => `<option value="${x}" > ${x}</option> `).join('');
}

/**
 * Recursively collects all sets from a part and its nested exceptions
 * @param {AnimationPartData} partData
 * @param {string} partName
 * @param {string} presetName
 * @param {Array<number>} exceptionPath
 * @param {Array} allSets
 */
function collectSetsFromPart(partData, partName, presetName, exceptionPath, allSets) {
    // Collect sets from current part
    if (partData.sets) {
        partData.sets.forEach((set, setIndex) => {
            allSets.push({
                partName,
                presetName,
                set,
                setIndex,
                keyframe: set.keyframe,
                stackIndex: 0,
                exceptionPath: exceptionPath.length > 0 ? [...exceptionPath] : null
            });
        });
    }
    // Recurse into exceptions
    if (partData.exceptions) {
        partData.exceptions.forEach((exception, excIndex) => {
            collectSetsFromPart(
                exception.part,
                partName,
                presetName,
                [...exceptionPath, excIndex],
                allSets
            );
        });
    }
}

/**
 * Gets set data from a timeline node (handles exceptions)
 * @param {HTMLElement} node
 * @returns {Object|null}
 */
function getSetFromTimelineNode(node) {
    const partName = node.dataset.part;
    const presetName = node.dataset.preset;
    const setIndex = parseInt(node.dataset.setIndex ?? '0');
    const exceptionPath = node.dataset.exception ? node.dataset.exception.split('.').map(Number) : null;

    if (!targetAnimation || !partName || !presetName) return null;

    let currentPart = targetAnimation.parts[partName]?.[presetName];
    if (!currentPart) return null;

    // Traverse exception path
    if (exceptionPath && currentPart.exceptions) {
        for (const excIdx of exceptionPath) {
            const exc = currentPart.exceptions[excIdx];
            if (!exc) return null;
            currentPart = exc.part;
        }
    }

    if (!currentPart.sets) return null;
    const set = currentPart.sets[setIndex];
    return { set, partName, presetName, setIndex, exceptionPath };
}

/**
 * Renders exception keys section in edit panel
 * @param {ExceptionsData} exception
 * @param {HTMLElement} container
 */
function renderExceptionKeysSection(exception, container) {
    container.innerHTML = '';
    const keys = exception.keys;
    const keyNames = Object.getOwnPropertyNames(keys);

    keyNames.forEach(key => {
        const keyItem = document.createElement('div');
        keyItem.className = 'exception-key-item';
        keyItem.dataset.key = key;

        // Key header with remove button
        const keyHeader = document.createElement('div');
        keyHeader.className = 'exception-key-header';

        const keyLabel = document.createElement('span');
        keyLabel.textContent = `Key: ${key}`;
        keyLabel.style.flex = '1';

        const removeKeyBtn = document.createElement('button');
        removeKeyBtn.textContent = 'Remove Key';
        removeKeyBtn.type = 'button';
        removeKeyBtn.className = 'remove-exception-key-btn';
        removeKeyBtn.dataset.key = key;

        keyHeader.appendChild(keyLabel);
        keyHeader.appendChild(removeKeyBtn);
        keyItem.appendChild(keyHeader);

        // Texture values list (matches .ddl-exception-key-value)
        const valuesList = document.createElement('ul');
        valuesList.className = 'exception-key-values';

        keys[key].forEach(texture => {
            const li = document.createElement('li');

            // Texture dropdown (reuses generateDDL logic)
            const select = document.createElement('select');
            select.className = 'edit-exception-key-value';
            select.dataset.key = key;

            const allTextures = Object.getOwnPropertyNames(charAnimatior.getSpritesData());
            const options = [
                ["", "None"],
                ...allTextures.filter(t => !keys[key].includes(t) || t === texture)
            ];

            options.forEach(opt => {
                if (Array.isArray(opt)) {
                    const [value, text] = opt;
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = text;
                    option.selected = value === texture;
                    select.appendChild(option);
                } else {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    option.selected = opt === texture;
                    select.appendChild(option);
                }
            });

            // Remove texture button
            const removeTextureBtn = document.createElement('button');
            removeTextureBtn.textContent = 'X';
            removeTextureBtn.type = 'button';
            removeTextureBtn.className = 'remove-exception-texture-btn';
            removeTextureBtn.dataset.key = key;
            removeTextureBtn.dataset.texture = texture;

            li.appendChild(select);
            li.appendChild(removeTextureBtn);
            valuesList.appendChild(li);
        });

        keyItem.appendChild(valuesList);

        // Add texture button
        const addTextureBtn = document.createElement('button');
        addTextureBtn.textContent = 'Add Texture Value';
        addTextureBtn.type = 'button';
        addTextureBtn.className = 'add-exception-texture-btn';
        addTextureBtn.dataset.key = key;
        addTextureBtn.style.marginLeft = '16px';
        addTextureBtn.style.marginBottom = '8px';

        keyItem.appendChild(addTextureBtn);
        container.appendChild(keyItem);
    });
}

/**
 * Updates the timeline UI with keyframe nodes and ruler ticks
 */
function updateTimeline() {
    if (!targetAnimation || !timelineNodes || !timelineRuler) return;
    const duration = targetAnimation.duration;
    if (duration <= 0) return;

    // Get user-defined frames to show
    const framesToShow = Math.max(10, parseInt(timelineFramesShow?.value || '50'));
    const contentWidth = getTimelineContentWidth();
    const timelineWidth = Math.max(contentWidth, duration * (contentWidth / framesToShow));

    if (timelineNodes) timelineNodes.style.width = timelineWidth + 'px';
    if (timelineRuler) timelineRuler.style.width = timelineWidth + 'px';

    // Generate ruler ticks
    const tickInterval = duration <= 50 ? 1 : duration <= 100 ? 5 : 10;
    let rulerHTML = '';
    for (let f = 0; f <= duration; f += tickInterval) {
        const left = (f / duration) * 100;
        rulerHTML += `<div class="tick" style="left: ${left}%"></div><div class="tick-label" style="left: ${left}%">${f}</div>`;
    }
    if (timelineRuler) timelineRuler.innerHTML = rulerHTML;

    // Collect all sets with their stacking info (including exceptions)
    /**
     * @type {Array<{partName: string, presetName: string, set: AnimationPartSet, setIndex: number, keyframe: number, stackIndex: number, exceptionPath: Array<number>|null}>}
     */
    const allSets = [];
    const characterPartsName = characterAnimator.getCharacterParts().reverse();

    characterPartsName.forEach(partName => {
        if (!targetAnimation) return;
        const partData = targetAnimation.parts[partName];
        if (!partData) return;

        Object.getOwnPropertyNames(partData).forEach(presetName => {
            const preset = partData[presetName];
            if (!preset) return;
            // Recursively collect all sets from this preset and its exceptions
            collectSetsFromPart(preset, partName, presetName, [], allSets);
        });
    });

    // Calculate stacking: for same keyframe, increment stackIndex
    /**
     * @type {Object.<number, Array<{partName: string, presetName: string, set: AnimationPartSet, setIndex: number, keyframe: number, stackIndex: number}>>}
     */
    const keyframeGroups = {};
    allSets.forEach(item => {
        const kf = item.keyframe;
        if (!keyframeGroups[kf]) keyframeGroups[kf] = [];
        item.stackIndex = keyframeGroups[kf].length;
        keyframeGroups[kf].push(item);
    });

    // Generate node HTML using createTimelineNode()
    const fragment = document.createDocumentFragment();

    allSets.forEach(item => {
        let leftPercent = (item.keyframe / duration) * 100;
        const topPx = 20 + (item.stackIndex * 16);
        const color = getPartColor(item.partName);

        const tooltipText = item.exceptionPath
            ? `Exception (${item.exceptionPath.join('.')}): ${item.partName}:${item.presetName} [Frame ${item.keyframe}]`
            : `${item.partName}:${item.presetName} [Frame ${item.keyframe}]`;

        const node = createTimelineNode({
            keyframe: item.keyframe,
            tooltip: tooltipText,
            color: color,
            onMove: (newKeyframe, node) => {
                // Update the actual data (handles exceptions via getSetFromTimelineNode)
                const setInfo = getSetFromTimelineNode(node);
                if (setInfo && setInfo.set) {
                    setInfo.set.keyframe = newKeyframe;
                    // Trigger animation update
                    ddlAnimations.dispatchEvent(new Event('change'));
                }
            },
            onClick: (e, keyframe) => {
                if (targetUser) {
                    targetUser.components.sprite.currentFrame = keyframe;
                    rangeAnimationFrames.value = keyframe.toString();
                    aniamtionFramevalue.innerHTML = keyframe.toString().padStart(3, '0');
                    updatePlayhead();
                }
            },
            onRightClick: (e, keyframe, node) => {
                const setInfo = getSetFromTimelineNode(node);
                if (!setInfo) return;
                showNodeEditPanel(
                    node,
                    setInfo.partName,
                    setInfo.presetName,
                    setInfo.setIndex,
                    setInfo.exceptionPath
                );
            }
        });

        node.style.left = leftPercent + '%';
        node.style.top = topPx + 'px';
        node.dataset.part = item.partName;
        node.dataset.preset = item.presetName;
        node.dataset.setIndex = item.setIndex.toString();
        if (item.exceptionPath) {
            node.classList.add('exception');
            node.dataset.exception = item.exceptionPath.join('.');
        }

        // Determine tooltip class to avoid cutoff at edges
        leftPercent = (item.keyframe / duration) * 100;
        let tooltipClass = 'tooltip';
        if (leftPercent <= 5) {
            tooltipClass = 'tooltip tooltip-left';
        } else if (leftPercent >= 95) {
            tooltipClass = 'tooltip tooltip-right';
        }
        const tooltipEl = node.querySelector('.tooltip');
        if (tooltipEl) tooltipEl.className = tooltipClass;

        fragment.appendChild(node);
    });

    if (timelineNodes) {
        timelineNodes.innerHTML = '';
        timelineNodes.appendChild(fragment);
    }
    updatePlayhead();
}

/**
 * Creates a timeline node element
 * @param {Object} config - Configuration object
 * @param {number} config.keyframe - The frame number
 * @param {string} config.tooltip - Tooltip text
 * @param {string} config.color - Background color
 * @param {function(number, HTMLDivElement): void} [config.onMove] - Callback for drag move (receives newKeyframe, node)
 * @param {function(event, number, HTMLDivElement): void} [config.onClick] - Callback for click (receives event, keyframe, node)
 * @param {function(event, number, HTMLDivElement): void} [config.onRightClick] - Callback for right-click (receives event, keyframe, node)
 * @returns {HTMLDivElement} The created timeline node element
 */
function createTimelineNode({ keyframe, tooltip, color, onMove, onClick, onRightClick }) {
    const node = document.createElement('div');
    node.className = 'timeline-node';
    node.dataset.keyframe = keyframe.toString();
    node.style.background = color;

    // Tooltip
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'tooltip';
    tooltipEl.textContent = tooltip;
    node.appendChild(tooltipEl);

    // Click handler
    if (onClick) {
        node.addEventListener('click', (e) => {
            onClick(e, keyframe, node);
        });
    }

    // Right-click handler
    if (onRightClick) {
        node.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            onRightClick(e, keyframe, node);
        });
    }

    // Drag handler (for onMove)
    if (onMove) {
        let isDragging = false;
        let startX = 0;
        let startKeyframe = keyframe;

        node.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startKeyframe = keyframe;
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const diff = e.clientX - startX;
            const duration = targetAnimation?.duration ?? 1;
            const contentWidth = getTimelineContentWidth();
            const framesToShow = Math.max(10, parseInt(timelineFramesShow?.value || '50'));
            const pxPerFrame = contentWidth / framesToShow;
            const frameDelta = Math.round(diff / pxPerFrame);
            const newKeyframe = Math.max(0, Math.min(startKeyframe + frameDelta, duration - 1));

            // Update node position (percentage-based)
            node.style.left = ((newKeyframe / duration) * 100) + '%';
            node.dataset.keyframe = newKeyframe.toString();

            // Update tooltip
            if (tooltipEl) {
                tooltipEl.textContent = tooltip.replace(`Frame ${keyframe}`, `Frame ${newKeyframe}`);
            }
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                const newKeyframe = parseInt(node.dataset.keyframe ?? '0');
                onMove(newKeyframe, node);
            }
        });
    }

    return node;
}

/**
 * Updates the timeline playhead position to match the current animation frame
 */
function updatePlayhead() {
    if (!timelinePlayhead || !targetUser || !targetAnimation || !timelineNodes) return;
    const duration = targetAnimation.duration;
    const frame = targetUser.components.sprite.currentFrame;

    // Snap to frame position - use integer percentage to match ruler ticks
    const percent = Math.round((frame / duration) * 100);
    timelinePlayhead.style.left = percent + '%';

    // Auto-scroll only if "scroll with playhead" is checked
    const scrollWithPlayhead = chkScrollWithPlayhead?.checked ?? false;
    if (!scrollWithPlayhead || !timelineWrapper) return;

    // Auto-scroll to keep playhead visible
    const contentWidth = getTimelineContentWidth();
    const playheadLeftPx = (percent / 100) * contentWidth;
    const wrapperWidth = timelineWrapper.clientWidth;
    const wrapperScrollLeft = timelineWrapper.scrollLeft;

    if (playheadLeftPx < wrapperScrollLeft) {
        timelineWrapper.scrollLeft = Math.max(0, playheadLeftPx - 20);
    } else if (playheadLeftPx > wrapperScrollLeft + wrapperWidth) {
        timelineWrapper.scrollLeft = playheadLeftPx - wrapperWidth + 20;
    }
}

// Frames-to-show change - refresh timeline
if (timelineFramesShow) {
    timelineFramesShow.addEventListener('change', () => {
        updateTimeline();
    });
    updateTimeline();
}

// Timeline wrapper click - jump to frame (not on nodes)
if (timelineWrapper) {
    timelineWrapper.addEventListener('click', (e) => {
        const node = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('.timeline-node'));
        if (!targetAnimation || !timelineNodes) return;
        if (node) return;

        const rect = timelineWrapper.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(timelineWrapper);
        const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
        const paddingRight = parseInt(computedStyle.paddingRight) || 0;
        const clickX = e.clientX - rect.left + timelineWrapper.scrollLeft - paddingLeft;

        const duration = targetAnimation.duration;
        const wrapperWidth = timelineWrapper.clientWidth - paddingLeft - paddingRight;
        const frame = Math.round((clickX / wrapperWidth) * duration);

        if (targetUser) {
            targetUser.components.sprite.currentFrame = Math.max(0, Math.min(frame, targetAnimation.duration - 1));
            rangeAnimationFrames.value = targetUser.components.sprite.currentFrame.toString();
            aniamtionFramevalue.innerHTML = targetUser.components.sprite.currentFrame.toString().padStart(3, '0');
            updatePlayhead();
        }
    });

    // Prevent right-click context menu on timeline wrapper (nodes handle their own right-click)
    timelineWrapper.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Timeline node click - jump to that keyframe
if (timelineNodes) {
    timelineNodes.addEventListener('click', (e) => {
        const node = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('.timeline-node'));
        if (!node) return;

        const keyframe = parseInt(node.dataset?.keyframe ?? '0');

        if (targetUser) {
            targetUser.components.sprite.currentFrame = keyframe;
            rangeAnimationFrames.value = keyframe.toString();
            aniamtionFramevalue.innerHTML = keyframe.toString().padStart(3, '0');
            updatePlayhead();
        }
    });

    // Timeline node drag - change keyframe by dragging
    /**
     * @type {HTMLElement | null}
     */
    let draggedNode = null;
    let dragStartX = 0;
    let dragStartKeyframe = 0;

    /**
     * @param {MouseEvent} e
     */
    timelineNodes.addEventListener('mousedown', (e) => {
        const node = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (e.target).closest('.timeline-node'));
        if (!node) return;

        draggedNode = node;
        dragStartX = e.clientX;
        dragStartKeyframe = parseInt(node.dataset?.keyframe ?? '0');
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!draggedNode || !targetAnimation || !timelineNodes) return;

        const deltaX = e.clientX - dragStartX;
        const duration = targetAnimation.duration;
        const contentWidth = getTimelineContentWidth();
        const framesToShow = Math.max(10, parseInt(timelineFramesShow?.value || '50'));
        const pxPerFrame = contentWidth / framesToShow;
        const frameDelta = Math.round(deltaX / pxPerFrame);
        const newKeyframe = Math.max(0, Math.min(dragStartKeyframe + frameDelta, duration - 1));

        // Update node position (percentage-based)
        draggedNode.style.left = ((newKeyframe / duration) * 100) + '%';
        draggedNode.dataset.keyframe = newKeyframe.toString();

        // Update tooltip
        const tooltip = draggedNode.querySelector('.tooltip, .tooltip-left, .tooltip-right');
        if (tooltip) {
            const partName = draggedNode.dataset?.part ?? '';
            const presetName = draggedNode.dataset?.preset ?? '';
            tooltip.innerHTML = `${partName}:${presetName} [Frame ${newKeyframe}]`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (!draggedNode) return;

        // Save the new keyframe to the actual data
        const partName = draggedNode.dataset?.part;
        const presetName = draggedNode.dataset?.preset;
        const setIndex = parseInt(draggedNode.dataset?.setIndex ?? '0');
        const newKeyframe = parseInt(draggedNode.dataset?.keyframe ?? '0');

        if (targetAnimation && partName && presetName) {
            const set = targetAnimation.parts[partName]?.[presetName]?.sets?.[setIndex];
            if (set) {
                set.keyframe = newKeyframe;
                // Trigger animation update
                ddlAnimations.dispatchEvent(new Event('change'));
            }
        }

        draggedNode = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

/**
 * Downloads data as a JSON file
 * @param {Object} data - The data to serialize and download
 * @param {string} filename - The name of the downloaded file
 */
function downloadJsonFile(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "data.json"; // Default filename if not provided

    document.body.appendChild(a); // Append to body to ensure it's in the DOM for IE/Edge
    a.click();
    document.body.removeChild(a); // Remove after click

    URL.revokeObjectURL(url);
}


export default {
    register: () => {
        engine.on('everyFrame', () => {
            if (targetUser == null) return;
            const animation = charAnimatior.animations[targetUser.components.sprite.animation];
            rangeAnimationFrames.setAttribute('max', animation.duration.toString())
            if (!running) {
                rangeAnimationFrames.value = targetUser.components.sprite.currentFrame.toString();
            }
            aniamtionFramevalue.innerHTML = targetUser.components.sprite.currentFrame.toString().padStart(3, '0');
            updatePlayhead();
        });

        targetUser = world.getUsers()[0];
        editorProcessUserAnimation();
        updateDdlAnimations();
        ddlAnimations.dispatchEvent(new Event('change'));
        // Sidebar styles are now handled by CSS (.html-main class)
    },
    running: () => running,
    editorProcessUserAnimation
};
