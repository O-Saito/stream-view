//@ts-check
/** @import {TexOffset, Position, Size} from "./types/general.js" */
/** @import {UserObject} from "./game.js" */
/** @import {CharShaderData, PartData} from "./engine.js" */
/** @import {AnimationMainStruct, AnimationParts} from "./characterAnimator.js" */
import engine from './engine.js';
import game from './game.js';
import charAnimatior from './characterAnimator.js';
import { charDefinitions } from './atlasManager.js';
import characterAnimator from './characterAnimator.js';

let running = false;
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
    running = chkPause.checked;
}

ddlAnimations.onchange = function () {
    targetAnimation = charAnimatior.animations[ddlAnimations.value];
    if (targetAnimation == null) return;
    if (targetUser) targetUser.components.sprite.animation = ddlAnimations.value;
    inputAnimationDuration.value = targetAnimation.duration.toString();
    const characterPartsName = characterAnimator.getCharacterParts().reverse();
    htmlPartsData.innerHTML = characterPartsName.map(x => {
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

        /** @param {string} name @param {import('./characterAnimator.js').AnimationPartData} animationDataPart @returns {string} @param {Array<number> | null} exceptionTree*/
        const generateMenu = (name, animationDataPart, exceptionTree) => {

            return `
<ul class="set-data" data-animation="${x}" data-name="${name}" data-exception="${exceptionTree?.join('.') ?? ""}">
    <li>Texture: ${spriteInfo.multiParts ? generateDDL("ddl-skin-part", Object.getOwnPropertyNames(spriteInfo.multiParts), animationDataPart.texture) : animationDataPart.texture ?? ""}</li>
    <li>Pos offset: <br/>
        x: <input type="number" class="main-pos-offset-x" value="${animationDataPart.posOffset?.x ?? "0"}" /> 
        y: <input type="number" class="main-pos-offset-y" value="${animationDataPart.posOffset?.y ?? "0"}" />
    </li>
    <li>Sets: <button type="button" class="add-set">Add Set</button>
        <ul>
            ${animationDataPart.sets.map((set, i) => {
                return `
            <li class="per-set-data" data-index="${i}" style="margin-bottom: 10px;">
                <button type="button" class="remove-set">Remove Set</button>
                Keyframe: <input type="number" class="keyframe" data-index="${i}" value="${set.keyframe}" min="0" max="${targetAnimation?.duration}" />
                <br/>
                ${spriteInfo.multiParts ? `Replace Texture: ${generateDDL("ddl-skin-set", [["", "Preset Selected"], ...Object.getOwnPropertyNames(spriteInfo.multiParts)], set.texture)}` : ""}
                <br/>
                UseSpriteFrame: <input type="number" class="useSpriteFrame" data-index=${i} value=${set.useSpriteFrame ? set.useSpriteFrame + 1 : "1"} min="1" max=${spriteInfo?.multiParts && animationDataPart.texture && spriteInfo.multiParts[animationDataPart.texture] ? spriteInfo.multiParts[animationDataPart.texture].frameCount : spriteInfo.frameCount} />
                <br/>
                Pos offset: <br/>
                x: <input type="number" class="posoffsetx" value="${set.posOffset?.x ?? "0"}" /> 
                y: <input type="number" class="posoffsety" value="${set.posOffset?.y ?? "0"}" />
            </li>`;
            }).join('')}
        </ul>
    </li>
    <li>
        Exception: <select>${animationDataPart.exceptions ? animationDataPart.exceptions.map((x, i) => `<option value="${i}">${Object.getOwnPropertyNames(x.keys).map(y => `${y}`).join('::')}</option>`).join('') : ""}</select> 
        <button type="button" class="btn-new-exception">Nova Exceção</button>
        <br/>
        ${animationDataPart.exceptions?.map((excp, i) => {
                const newExceptionTree = [...(exceptionTree ?? []), i];
                const exceptionKeys = Object.getOwnPropertyNames(excp.keys);
                return `
                <div class="animation-exception" data-exception="${i}" style="border: 1px solid grey;">
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
                    <br/>
                    <span>Replace: ${excp.replaceParent}</span>
                    ${generateMenu(name, excp.part, newExceptionTree)}
                </div>
                `;
            }).join('')}
    </li> 
</ul>
            `;
        };

        if (!p || !userPart || !spriteInfo) return '';
        return `
            <div style="padding-left: 10px;margin-bottom: 10px;border-bottom: 1px solid;padding-bottom: 5px;" >
    <label style="font-weight: bolder;">${x} : <select class="ddl-user-texture"><option value=""></option>${Object.getOwnPropertyNames(charAnimatior.spritesData).map(texName => { return `<option ${texName == userPart.texture ? "selected" : ""} >${texName}</option>`; }).join('')}</select></label> 
    <br/>
    ${Object.getOwnPropertyNames(p).map(presetName => { return generateMenu(presetName, p[presetName], null); }).join('')
            }
</div > `;
    }).join('');

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
            };
        }
    }

    /** @param {HTMLInputElement | undefined} e @returns {null|import('./characterAnimator.js').AnimationPartData} */
    const getSetOf = (e) => {
        if (!e) return null;
        const dataset = /** @type {HTMLElement} */(e.closest('.set-data'))?.dataset;
        if (!dataset || !targetAnimation || !dataset.animation || !dataset.name) return null;
        let set = targetAnimation.parts[dataset.animation][dataset.name];
        let exceptionlist = dataset.exception;
        //if (!exceptionlist || exceptionlist == "") {
        //    exceptionlist = /** @type {HTMLElement} */(e.closest('.animation-exception'))?.dataset?.exception;
        //}
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
        /** @type {import('./characterAnimator.js').ExceptionsData|null} */
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

    on(".ddl-user-texture", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;

        const dataset = /** @type {HTMLElement} */(target.closest("div")?.querySelector('.set-data'))?.dataset;
        if (!dataset.animation || !targetUser) return;
        if (!targetUser.components.sprite.parts[dataset.animation]) targetUser.components.sprite.parts[dataset.animation] = { texture: "", currentFrame: 0 }
        targetUser.components.sprite.parts[dataset.animation].texture = target.value;
        ddlAnimations.dispatchEvent(new Event('change'));
    });
}

inputAnimationDuration.onchange = function () {
    if (targetAnimation == null) return;
    targetAnimation.duration = parseInt(inputAnimationDuration.value);
}

btnBaixarJson.onclick = function () {
    downloadJsonFile(charAnimatior.animations, "character-animations.json");
}

function editorProcessUserAnimation() {
    if (targetUser == null) return;
    const sprite = targetUser.components.sprite;
    const animation = charAnimatior.animations[sprite.animation];
    if (animation == null) throw new Error("Animation not found!");

    sprite.currentFrame++;

    if (sprite.currentFrame >= animation.duration) {
        sprite.currentFrame = 0;
    }

    const data = charAnimatior.getAnimationData(targetUser);

    engine.programData.char.updateTransformPart(data, charDefinitions);
}

function updateDdlAnimations() {
    ddlAnimations.innerHTML = Object.getOwnPropertyNames(charAnimatior.animations).map(x => `<option value="${x}" > ${x}</option> `).join('');
}

/**
 * @param {Object} data 
 * @param {string} filename 
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
        });

        targetUser = game.game.users[1];
        charAnimatior.processUserAnimation(targetUser);
        updateDdlAnimations();
        ddlAnimations.dispatchEvent(new Event('change'));
        const htmlMain = /** @type {HTMLElement} */ (document.querySelector(".html-main"));
        htmlMain.style.height = "400px";
        htmlMain.style.width = "275px";
        htmlMain.style.position = "sticky";
        htmlMain.style.float = "right";
        htmlMain.style.top = "0";
        htmlMain.style.overflowX = "hidden";
    },
    running: () => running,
};
