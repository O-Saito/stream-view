//@ts-check
/** @import {TexOffset, Position, Size} from "./types/general.js" */
/** @import {UserObject} from "./game.js" */
/** @import {CharShaderData, PartData} from "./engine.js" */
/** @import {AnimationMainStruct} from "./characterAnimator.js" */
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

    charAnimatior.animations[val] = {
        duration: 0,
        parts: {}
    };
    updateDdlAnimations();
}

rangeAnimationFrames.onchange = function () {
    if (targetUser == null) return;
    targetUser.components.sprite.currentFrame = parseInt(this.value);
    editorProcessUserAnimation();
}

chkPause.onchange = function () {
    running = chkPause.checked;
}

ddlAnimations.onchange = function () {
    targetAnimation = charAnimatior.animations[ddlAnimations.value];
    if (targetAnimation == null) return;
    inputAnimationDuration.value = targetAnimation.duration.toString();
    htmlPartsData.innerHTML = characterAnimator.getCharacterParts().reverse().map(x => {
        const p = targetAnimation?.parts[x];
        const userPart = targetUser?.components.sprite.parts[x];
        const spriteInfo = charAnimatior.spritesData[userPart?.texture ?? ""];
        if (!p || !userPart || !spriteInfo) return '';
        return `
<div>
    <label>${x} : <select class="ddl-user-texture">${Object.getOwnPropertyNames(charAnimatior.spritesData).map(texName => { return `<option ${texName == userPart.texture ? "selected" : ""} >${texName}</option>`; }).join('')}</select></label> 
    <br/>
    ${Object.getOwnPropertyNames(p).map(presetName => {
            return `
            ${presetName}: 
    <ul class="set-data" data-animation="${x}" data-name="${presetName}">
        <li>Texture: ${spriteInfo.multiParts ? `<select class="ddl-skin-part">${Object.getOwnPropertyNames(spriteInfo.multiParts).map(spritePartName => {
                console.log(spriteInfo.multiParts);
                return `<option ${spritePartName == p[presetName].texture ? "selected" : ""} >${spritePartName}</option>`;
            }).join('')}</select>` : p[presetName].texture ?? ""}</li>
        <li>Sets: <button type="button" class="add-set">Add Set</button>
            <ul>
                ${p[presetName].sets.map((set, i) => {
                return `
                <li class="per-set-data" data-index="${i}">
                    <button type="button" class="remove-set">Remove Set</button>
                    Keyframe: <input type="number" class="keyframe" data-index="${i}" value="${set.keyframe}" min="0" max="${targetAnimation?.duration}" />
                    <br/>
                    UseSpriteFrame: <input type="number" class="useSpriteFrame" data-index=${i} value=${set.useSpriteFrame ?? "0"} />
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
            els[i][action] = func;
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
        targetAnimation.parts[dataset.animation][dataset.name].sets =  targetAnimation.parts[dataset.animation][dataset.name].sets.splice(parseInt(persetDataset.index) - 1, 1);
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
            part.sets[parseInt(persetDataset.index)][attribute] = parseInt(htmlElement.value);
    }

    const elementsKeyFrames = /** @type {NodeListOf<HTMLInputElement>} */ (htmlPartsData.querySelectorAll('.keyframe'));
    for (let i = 0; i < elementsKeyFrames.length; i++) {
        elementsKeyFrames[i].onchange = function (e) {
            const target = /** @type {HTMLInputElement} */(e.target)
            if (!target) return;
            changesetdata(target, "keyframe", parseInt(target.value));
        };
    }

    const elementsUseSpriteFrame = /** @type {NodeListOf<HTMLInputElement>} */ (htmlPartsData.querySelectorAll('.useSpriteFrame'));
    for (let i = 0; i < elementsUseSpriteFrame.length; i++) {
        elementsUseSpriteFrame[i].onchange = function (e) {
            const target = /** @type {HTMLInputElement} */(e.target)
            if (!target) return;
            changesetdata(target, "useSpriteFrame", parseInt(target.value));
        };
    }

    const elementsPosOffsetX = /** @type {NodeListOf<HTMLInputElement>} */ (htmlPartsData.querySelectorAll('.posoffsetx'));
    for (let i = 0; i < elementsPosOffsetX.length; i++) {
        elementsPosOffsetX[i].onchange = function (e) {
            const target = /** @type {HTMLInputElement} */(e.target)
            if (!target) return;
            changesetdata(target, ["posOffset", "x"], parseInt(target.value));
        };
    }

    const elementsPosOffsetY = /** @type {NodeListOf<HTMLInputElement>} */ (htmlPartsData.querySelectorAll('.posoffsety'));
    for (let i = 0; i < elementsPosOffsetY.length; i++) {
        elementsPosOffsetY[i].onchange = function (e) {
            const target = /** @type {HTMLInputElement} */(e.target)
            if (!target) return;
            changesetdata(target, ["posOffset", "y"], parseInt(target.value));
        };
    }


    const elementsDdlSkinPart = /** @type {NodeListOf<HTMLInputElement>} */ (htmlPartsData.querySelectorAll('.ddl-skin-part'));
    for (let i = 0; i < elementsDdlSkinPart.length; i++) {
        elementsDdlSkinPart[i].onchange = function (e) {
            const target = /** @type {HTMLInputElement} */(e.target)
            if (!target) return;

            const dataset = /** @type {HTMLElement} */(target.closest('.set-data'))?.dataset;
            if (!dataset.name || !dataset.animation) return;
            const skin = targetAnimation?.parts[dataset.animation][dataset.name];
            if (skin == undefined) return;
            skin.texture = target.value;
        };
    }

    const elementsDdlUserTexture = /** @type {NodeListOf<HTMLInputElement>} */ (htmlPartsData.querySelectorAll('.ddl-user-texture'));
    for (let i = 0; i < elementsDdlUserTexture.length; i++) {
        elementsDdlUserTexture[i].onchange = function (e) {
            const target = /** @type {HTMLInputElement} */(e.target)
            if (!target) return;

            const dataset = /** @type {HTMLElement} */(target.closest("div")?.querySelector('.set-data'))?.dataset;
            if (!dataset.animation || !targetUser) return;
            targetUser.components.sprite.parts[dataset.animation].texture = target.value;
            ddlAnimations.dispatchEvent(new Event('change'));
        };
    }
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

