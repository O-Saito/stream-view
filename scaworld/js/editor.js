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
    htmlPartsData.innerHTML = characterAnimator.getCharacterParts().reverse().map(x => {
        if (!targetAnimation) targetAnimation = { duration: 0, parts: {} };
        if (!targetAnimation.parts[x]) targetAnimation.parts[x] = { default: { sets: [] } }

        const p = targetAnimation.parts[x];
        const userPart = targetUser?.components.sprite.parts[x] ?? { texture: "" };
        const spriteInfo = charAnimatior.spritesData[userPart.texture ?? ""] ?? {};


        if (!p || !userPart || !spriteInfo) return '';
        return `
<div style="padding-left: 10px;margin-bottom: 10px;border-bottom: 1px solid;padding-bottom: 5px;">
    <label style="font-weight: bolder;">${x} : <select class="ddl-user-texture"><option value=""></option>${Object.getOwnPropertyNames(charAnimatior.spritesData).map(texName => { return `<option ${texName == userPart.texture ? "selected" : ""} >${texName}</option>`; }).join('')}</select></label> 
    <br/>
    ${Object.getOwnPropertyNames(p).map(presetName => {
            return `
            ${presetName}: 
    <ul class="set-data" data-animation="${x}" data-name="${presetName}">
        <li>Texture: ${spriteInfo.multiParts ? `<select class="ddl-skin-part">${Object.getOwnPropertyNames(spriteInfo.multiParts).map(spritePartName => {
                return `<option ${spritePartName == p[presetName].texture ? "selected" : ""} value="${spritePartName}" >${spritePartName}</option>`;
            }).join('')}</select>` : p[presetName].texture ?? ""}</li>
        <li>Pos offset: x: <input type="number" class="main-pos-offset-x" value="${p[presetName].posOffset?.x ?? "0"}" /> y: <input type="number" class="main-pos-offset-y" value="${p[presetName].posOffset?.y ?? "0"}" /></li>
        <li>Sets: <button type="button" class="add-set">Add Set</button>
            <ul>
                ${p[presetName].sets.map((set, i) => {
                return `
                <li class="per-set-data" data-index="${i}" style="margin-bottom: 10px;">
                    <button type="button" class="remove-set">Remove Set</button>
                    Keyframe: <input type="number" class="keyframe" data-index="${i}" value="${set.keyframe}" min="0" max="${targetAnimation?.duration}" />
                    <br/>
                    ${spriteInfo.multiParts ? `Replace Texture: 
                        <select class="ddl-skin-set">
                            <option value="">Preset Selected</option>
                            ${Object.getOwnPropertyNames(spriteInfo.multiParts).map(spritePartName => {
                    return `<option ${spritePartName == set.texture ? "selected" : ""} value="${spritePartName}" >${spritePartName}</option>`;
                }).join('')}
                        </select>` : ""}
                    <br/>
                    UseSpriteFrame: <input type="number" class="useSpriteFrame" data-index=${i} value=${set.useSpriteFrame ? set.useSpriteFrame + 1 : "1"} min="1" max=${spriteInfo?.multiParts && p[presetName].texture && spriteInfo.multiParts[p[presetName].texture] ? spriteInfo.multiParts[p[presetName].texture].frameCount : spriteInfo.frameCount} />
                    <br/>
                    Pos offset: x: <input type="number" class="posoffsetx" value="${set.posOffset?.x ?? "0"}" /> y: <input type="number" class="posoffsety" value="${set.posOffset?.y ?? "0"}" />
                </li>`;
            }).join('')}
            </ul>
        </li>
    </ul>
        `;
        }).join('')}
    
    <!--<hr/>
    ${JSON.stringify(p)}}
    <hr/>-->
</div>`;
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

    on('.add-set', 'onclick', function (/** @type {Event} */e) {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;
        const dataset = /** @type {HTMLElement} */(target.closest('.set-data'))?.dataset;
        if (!dataset || !dataset.animation || !dataset.name) return;
        targetAnimation?.parts[dataset.animation][dataset.name].sets.push({
            keyframe: 0,
        });
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    on('.remove-set', 'onclick', function (/** @type {Event} */e) {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;
        const dataset = /** @type {HTMLElement} */(target.closest('.set-data'))?.dataset;
        const persetDataset = /** @type {HTMLElement} */(target.closest('.per-set-data'))?.dataset;

        if (!dataset || !dataset.animation || !dataset.name || !persetDataset || !persetDataset.index || !targetAnimation) return;
        targetAnimation.parts[dataset.animation][dataset.name].sets.splice(parseInt(persetDataset.index), 1);
        ddlAnimations.dispatchEvent(new Event('change'));
    });

    /**
     * @param {HTMLInputElement} htmlElement 
     * @param {string | Array<string>} attribute
     * @param {*} value
     */
    const changesetdata = (htmlElement, attribute, value) => {
        const dataset = /** @type {HTMLElement} */(htmlElement.closest('.set-data'))?.dataset;
        const persetDataset = /** @type {HTMLElement} */(htmlElement.closest('.per-set-data'))?.dataset;
        if (!dataset.name || !dataset.animation || !persetDataset.index) return;
        if (targetAnimation?.parts[dataset.animation][dataset.name]?.sets == undefined) return;
        const part = targetAnimation.parts[dataset.animation][dataset.name];
        if (Array.isArray(attribute)) {
            // @ts-ignore
            if (!part.sets[parseInt(persetDataset.index)][attribute[0]])
                // @ts-ignore
                part.sets[parseInt(persetDataset.index)][attribute[0]] = {};
            // @ts-ignore
            part.sets[parseInt(persetDataset.index)][attribute[0]][attribute[1]] = parseInt(htmlElement.value);
        }
        else
            // @ts-ignore
            part.sets[parseInt(persetDataset.index)][attribute] = value;
    }


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
        if (!target) return;
        const dataset = /** @type {HTMLElement} */(target.closest('.set-data'))?.dataset;
        if (!dataset.name || !dataset.animation) return;
        if (targetAnimation?.parts[dataset.animation][dataset.name]?.sets == undefined) return;
        const part = targetAnimation.parts[dataset.animation][dataset.name];
        if (!part.posOffset) part.posOffset = {};
        part.posOffset.x = parseInt(target.value);
    });

    on(".main-pos-offset-y", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;
        const dataset = /** @type {HTMLElement} */(target.closest('.set-data'))?.dataset;
        if (!dataset.name || !dataset.animation) return;
        if (targetAnimation?.parts[dataset.animation][dataset.name]?.sets == undefined) return;
        const part = targetAnimation.parts[dataset.animation][dataset.name];
        if (!part.posOffset) part.posOffset = {};
        part.posOffset.y = parseInt(target.value);
    });

    on(".ddl-skin-part", "onchange", (/** @type {Event} */e) => {
        const target = /** @type {HTMLInputElement} */(e.target)
        if (!target) return;

        const dataset = /** @type {HTMLElement} */(target.closest('.set-data'))?.dataset;
        if (!dataset.name || !dataset.animation) return;
        const skin = targetAnimation?.parts[dataset.animation][dataset.name];
        if (skin == undefined) return;
        skin.texture = target.value;
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
    ddlAnimations.innerHTML = Object.getOwnPropertyNames(charAnimatior.animations).map(x => `<option value="${x}">${x}</option>`).join('');
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
        htmlMain.style.height = "200px";
        htmlMain.style.width = "500px";
        htmlMain.style.position = "sticky";
        htmlMain.style.float = "right";
        htmlMain.style.top = "0";
    },
    running: () => running,
};
