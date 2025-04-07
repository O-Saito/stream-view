import engine from './engine.js';
import game from './game.js';
import { atlases, charDefinitions, propsDefinition, createAllAtlas } from './atlasManager.js';
import propConstruct from './propConstruct.js';
import charAnimations from './animations/charAnimation.js';

const debugCanvas = document.getElementById('debugCanvas');
const debugCtx = debugCanvas.getContext('2d', { alpha: true });
debugCtx.imageSmoothingEnabled = false;
const floatingMenu = document.getElementById('floating-menu');
const listProp = document.getElementById('listProp');
const charConfig = document.getElementById('charConfig');

engine.on('everySecond', () => {
    debugCanvas.style.top = `-${engine.canvas.height * 2 + 2}px`;
    debugCanvas.width = engine.canvas.width;
    debugCanvas.height = engine.canvas.height;
});

engine.on('everyFrame', () => {

    if (!window.t.showDebug) return;

    const props = game.getPropList();
    const chars = game.getCharList();
    const dyprops = game.getDyPropList();

    debugCtx.lineWidth = 1;
    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    debugCtx.strokeStyle = "black";
    for (let i = 0; i < props.length; i++) {
        const p = props[i];
        const fixY = debugCanvas.height - p.position.y;

        debugCtx.beginPath();
        debugCtx.rect(p.position.x, fixY, p.objectSize.width, -p.objectSize.height);
        debugCtx.stroke();
    }

    debugCtx.strokeStyle = "blue";
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const fixY = debugCanvas.height - char.position.y;

        debugCtx.beginPath();
        debugCtx.rect(char.position.x, fixY, char.size.width, -char.size.height);
        debugCtx.stroke();
    }

    debugCtx.strokeStyle = "red";
    for (let i = 0; i < dyprops.length; i++) {
        const p = dyprops[i];
        const fixY = debugCanvas.height - p.position.y;

        debugCtx.beginPath();
        debugCtx.rect(p.position.x, fixY, p.objectSize.width, -p.objectSize.height);
        debugCtx.stroke();
        if (p.elements) {
            for (let y = 0; y < p.elements.length; y++) {
                const e = p.elements[y];
                debugCtx.beginPath();
                debugCtx.rect(p.position.x + e.position.x, fixY, p.objectSize.width, -p.objectSize.height);
                debugCtx.stroke();
            }
        }
    }
    // if (window.images && window.images.length > 0) {
    //     debugCtx.drawImage(window.images[0], 0, 0, window.images[0].width, window.images[0].height);
    //     console.log(window.images[0].width, window.images[0].height);
    // }
});

document.getElementById('btn-add-prop').onclick = function (e) {
    floatingMenu.innerHTML = `
<div><label>Texture</label><select class="ddl-texture">${Object.getOwnPropertyNames(propsDefinition.srcs).map(x => `<option>${x}</option>`)}</select></div>
<div><label>Classee</label><select class="ddl-type">${Object.getOwnPropertyNames(propConstruct.classes).map(x => `<option>${x}</option>`)}</select></div>
<div><button class="btn-criar">Criar</button><button class="btn-cancelar">Cancelar</button></div>
    `;
    floatingMenu.querySelector('.btn-criar').onclick = function () {
        propConstruct.createProp(floatingMenu.querySelector('.ddl-type').value, {
            texture: floatingMenu.querySelector('.ddl-texture').value,
            position: { x: 0, y: 0 },
        });
        floatingMenu.innerHTML = '';
    }
    floatingMenu.querySelector('.btn-cancelar').onclick = function () {
        floatingMenu.innerHTML = '';
    }
}

document.getElementById('btn-salvar-cenario').onclick = function (e) {

    const json = { props: [] };
    const props = game.getPropList();
    for (let i = 0; i < props.length; i++) {
        const p = props[i];
        json.props.push({
            type: p.type,
            texture: p.texture,
            pos: { x: p.position.x, y: p.position.y },
            depth: p.depth
        });
    }
    console.log(JSON.stringify(json));
}

let picking = null;

debugCanvas.onmousedown = function (e) {
    charConfig.style.display = 'none';
    floatingMenu.innerHTML = ``;

    const pos = { x: e.offsetX, y: debugCanvas.height - e.offsetY };

    const p = (o) => {
        if (o) {
            onPick(o);
            picking = {
                offset: {
                    x: pos.x - o.position.x,
                    y: pos.y - o.position.y,
                },
                obj: o,
            }
        }
        console.log(o);
    }

    game.drawers['fbo']['propCenarioFBO'].bind();
    const data = new Int16Array(1);
    engine.gl.readBuffer(engine.gl.COLOR_ATTACHMENT3);
    engine.gl.readPixels(pos.x, pos.y, 1, 1,
        engine.gl.getParameter(engine.gl.IMPLEMENTATION_COLOR_READ_FORMAT),
        engine.gl.getParameter(engine.gl.IMPLEMENTATION_COLOR_READ_TYPE),
        data
    );
    game.drawers['fbo']['propCenarioFBO'].unbind();
    if (data[0] > -1) {
        p(game.getGlobal(data[0]));
        return;
    }


    const props = game.getPropList();
    const chars = game.getCharList();

    let toFind = null;

    if (ddlPickType.value == 'char') toFind = chars;
    if (ddlPickType.value == 'prop') toFind = props;

    let obj = toFind.reverse().find(x =>
        pos.x >= x.position.x && pos.x <= x.position.x + x.objectSize.width &&
        pos.y >= x.position.y && pos.y <= x.position.y + x.objectSize.height
    );

    p(obj);
};

debugCanvas.onmouseup = function (e) {
    picking = null;
}

debugCanvas.onmousemove = function (e) {
    const pos = { x: e.offsetX, y: debugCanvas.height - e.offsetY };

    if (!picking) return;
    picking.obj.position.x = Math.floor(pos.x - picking.offset.x);
    picking.obj.position.y = Math.floor(pos.y - picking.offset.y);
}

const showAtlasOnCanvas = (canvas) => {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d', { alpha: true });
    c.width = canvas.width;
    c.height = canvas.height;

    ctx.drawImage(canvas, 0, 0);

    debug.append(c);
}

const updateDDLAtlases = () => {
    ddlAtlas.innerHTML = Object.getOwnPropertyNames(atlases).map(x => `<option value="${x}">${x}</option>`);
    ddlAtlas.onchange();
};

ddlAtlas.onchange = function () {
    const atlas = atlases[ddlAtlas.value];

    ddlAtlasSection.onchange = function () {
        const cs = document.getElementById('debugAtlasSection');
        const section = {
            offset: { x: 0, y: 0, w: atlas.canvas.width, h: atlas.canvas.height },
        };
        if (ddlAtlasSection.value != "TODOS") {
            const layerOffset = parseInt(ddlAtlasSection.value);

            section.offset.y = layerOffset * atlas.imageHeight;
            section.offset.h = atlas.imageHeight;
        }

        cs.width = section.offset.w;// * 2 + 1;
        cs.height = section.offset.h;
        const ctxs = cs.getContext('2d', { alpha: true });

        if (ddlAtlasSection.value == "TODOS") {
            ctxs.clearRect(0, 0, cs.width, cs.height);
        }

        ctxs.drawImage(atlas.canvas,
            section.offset.x, section.offset.y, section.offset.w, section.offset.h,
            0, 0, section.offset.w, section.offset.h);
        ctxs.lineWidth = 1;
        ctxs.beginPath();
        ctxs.moveTo(atlas.canvas.width, 0);
        ctxs.lineTo(atlas.canvas.width, atlas.canvas.height);
        ctxs.stroke();
        if (atlas.normalCanvas)
            ctxs.drawImage(atlas.normalCanvas,
                section.offset.x, section.offset.y, section.offset.w, section.offset.h,
                0, 0, section.offset.w, section.offset.h);
    }

    ddlAtlasSection.innerHTML = `<option value="TODOS">Todos</option>`;
    for (let i = 0; i < atlas.layersCount; i++) {
        ddlAtlasSection.innerHTML += `<option value="${i}">Layer - ${i}</option>`;
    }
    ddlAtlasSection.onchange();

    const c = document.getElementById('debugAtlas');
    c.width = atlas.canvas.width;// * 2 + 1;
    c.height = atlas.canvas.height;
    const ctx = c.getContext('2d', { alpha: true });

    ctx.drawImage(atlas.canvas, 0, 0);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(atlas.canvas.width, 0);
    ctx.lineTo(atlas.canvas.width, atlas.canvas.height);
    ctx.stroke();
    if (atlas.normalCanvas)
        ctx.drawImage(atlas.normalCanvas, atlas.normalCanvas.width, 0);
}

function setupCharConfig(picked) {
    console.log(charAnimations);

    const createAnimationPart = (partName, part) => {
        return `
        <div class="animation-part">
            <label>${partName}</label>    
            <ul>
                ${Object.getOwnPropertyNames(part).map(x => {
            const p = part[x]; return `
                    <li class="char-animation-data-container"
                        data-part="${partName}" data-animation="${x}"
                    >
                        <label>${x}</label>
                        <p>
                            <span>defaultFrames</span> <br/>
                            X: <input type="number" data-attribute="defaultFrames" value="${p.defaultFrames ? p.defaultFrames.x ?? "0" : "0"}" />
                            Y: <input type="number" data-attribute="defaultFrames" value="${p.defaultFrames ? p.defaultFrames.y ?? "0" : "0"}" />
                            AX: <input type="number" data-attribute="defaultFrames" value="${p.defaultFrames ? p.defaultFrames.x ?? "0" : "0"}" />
                            AY: <input type="number" data-attribute="defaultFrames" value="${p.defaultFrames ? p.defaultFrames.y ?? "0" : "0"}" />
                        <p>
                        <p>
                            <span>isNotSpriteAnimated</span> 
                            <select data-attribute="isNotSpriteAnimated">
                                <option value="true" ${p.isNotSpriteAnimated ? "selected" : ""}>Sim</option>
                                <option value="false" ${p.isNotSpriteAnimated ? "" : "selected"}>Não</option>
                            </select>
                        <p>
                        <p>
                            <span>frames</span><br/>
                            ${p.frames.map((y, i) => {
                return `<span>frames [${i}]</span><br/>
                                X: <input type="number" value="${y ? y.x ?? "0" : "0"}" />
                                Y: <input type="number" value="${y ? y.y ?? "0" : "0"}" />
                                AX: <input type="number" value="${y ? y.ax ?? "0" : "0"}" />
                                AY: <input type="number" value="${y ? y.ay ?? "0" : "0"}" />
                                <br/>
                                `;
            }).join('')}
                        <p>
                    </li>
                `}).join('')}
            </ul>
        </div>`;
    }
    charConfig.innerHTML = `
        <div class="animation-group">
            <label>
                <span>Head: </span>
                <select id="ddlAnimationHead">
                    <option value="idle">Idle</option>
                    <option value="walk">Walking</option>
                </select>
            </label>
            <label>
                <span>Body: </span>
                <select id="ddlAnimationBody">
                    <option value="idle">Idle</option>
                    <option value="walk">Walking</option>
                </select>
            </label>
            <label>
                <span>Legs: </span>
                <select id="ddlAnimationLegs">
                    <option value="idle">Idle</option>
                    <option value="walk">Walking</option>
                </select>
            </label>
            <label>
                <span>Back: </span>
                <select id="ddlAnimationBack">
                    <option value="idle">Idle</option>
                    <option value="walk">Walking</option>
                </select>
            </label>
        </div>
        ${Object.getOwnPropertyNames(charAnimations.animationParts).map(x => createAnimationPart(x, charAnimations.animationParts[x])).join('')}
    `;
    charConfig.style.display = 'block';

    const inputs = charConfig.querySelectorAll('.animation-part input, .animation-part select')
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        input.onchange = (e) => {
            e.preventDefault();
            const data = e.target.closest(".char-animation-data-container").dataset;
            const newValue = e.target.value;
            const attribute = e.target.dataset.attribute;

            const part = charAnimations.animationParts[data.part];
            const anime = part[data.animation];
            anime[attribute] = newValue;
        }
    }

    const ddlAnimationHead = document.getElementById('ddlAnimationHead');
    ddlAnimationHead.onchange = function () {
        console.log(ddlAnimationHead.value);
        picked.animationController.changeAnimationByGroup('head', ddlAnimationHead.value);
    }
    const ddlAnimationBody = document.getElementById('ddlAnimationBody');
    ddlAnimationBody.onchange = function () {
        console.log(ddlAnimationBody.value);
        picked.animationController.changeAnimationByGroup('body', ddlAnimationBody.value);
    }
    const ddlAnimationLegs = document.getElementById('ddlAnimationLegs');
    ddlAnimationLegs.onchange = function () {
        picked.animationController.changeAnimationByGroup('legs', ddlAnimationLegs.value);
    }
    const ddlAnimationBack = document.getElementById('ddlAnimationBack');
    ddlAnimationBack.onchange = function () {
        picked.animationController.changeAnimationByGroup('back', ddlAnimationBack.value);
    }
}

function setupPropConfig(prop) {
    console.log(prop);
    floatingMenu.innerHTML = `
<div><label>Depth</label><input type="range" value="${prop.depth}" class="range-depth" max="1" min="0" step="0.01" /></div>
    `;

    floatingMenu.querySelector('.range-depth').onchange = function (e) {
        prop.depth = e.target.value;
    }
}

function onPick(pick) {
    lblPicking.innerHTML = pick.constructor.name == 'Object' ? pick.type : pick.constructor.name;

    if (pick.constructor.name == "Character") {
        setupCharConfig(pick);
        return;
    }

    setupPropConfig(pick);
}

function updatePropList() {
    listProp.innerHTML = `${props.map((x, i) => `
        <li>
            <button class="btn-move-back-prop" data-dir="up" data-index="${i}">/\\</button>
            <button class="btn-move-back-prop"  data-dir="down" data-index="${i}">\\/</button>
            ${i} - ${x.type}
        </li>
    `).join('')}`;

    const btns = document.getElementsByClassName('btn-move-back-prop');
    for (let i = 0; i < btns.length; i++) {
        btns[i].onclick = function (e) {
            if (e.target.dataset.index == '0' && e.target.dataset.dir == 'up') return;

            let index = parseInt(e.target.dataset.index);
            const dir = e.target.dataset.dir;
            const obj = props.splice(index, 1)[0];
            if (dir == 'up') index--;
            if (dir == 'down') index++;

            props.splice(index, 0, obj);
            updatePropList();
        }
    }

}

const rangeLight = document.getElementsByClassName('rangeLight');
for (let i = 0; i < rangeLight.length; i++) {
    rangeLight[i].onchange = function (e) {
        globalLight[e.target.dataset.dir] = e.target.value;
        document.getElementsByClassName(`lbl-range-${e.target.dataset.dir}-value`)[0].innerHTML = e.target.value;
    }
}

const range = document.getElementsByClassName('range');
for (let i = 0; i < range.length; i++) {
    range[i].onchange = function (e) {
        abcr[e.target.dataset.dir] = e.target.value;
        document.getElementsByClassName(`lbl-range-${e.target.dataset.dir}-value`)[0].innerHTML = e.target.value;
    }
}

const rangePos = document.getElementsByClassName('range-pos');
for (let i = 0; i < rangePos.length; i++) {
    rangePos[i].onchange = function (e) {
        lightPositions[e.target.dataset.dir] = e.target.value;
        document.getElementsByClassName(`lbl-range-0-${e.target.dataset.dir}-value`)[0].innerHTML = e.target.value;
    }
}

export default {
    updateDDLAtlases
};