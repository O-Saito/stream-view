import engine from './engine.js';
import game from './game.js';
import { atlases, charDefinitions, propsDefinition, dynamicPropDefinition, createAllAtlas } from './atlasManager.js';
import propConstruct from './propConstruct.js';
import charAnimations from './animations/charAnimation.js';

const debugCanvas = document.getElementById('debugCanvas');
const debugCtx = debugCanvas.getContext('2d', { alpha: true });
debugCtx.imageSmoothingEnabled = false;
const floatingMenu = document.getElementById('floating-menu');
const charConfig = document.getElementById('charConfig');
const btnListLight = document.getElementById('btn-list-light');
const btnListProp = document.getElementById('btn-list-prop');
const chkDebugBox = document.getElementById('chk-debug-box');

let picking = null;

async function fileToImage(file, id) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        const img = new Image();
        reader.onload = function (event) {
            const imageDataURL = event.target.result;
            img.src = imageDataURL;
        }
        reader.readAsDataURL(file);
        img.onload = function () {
            resolve({ id, img });
        }
    });
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
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
<div><label>Type: ${prop.type}</label></div>
<div><label>Texture: ${prop.texture}</label></div>
<div>
    <label>Pos </label>
    <label>X: </label>
    <input type="number" value="${prop.position.x}" class="pos-x" />
    <label>Y: </label>
    <input type="number" value="${prop.position.y}" class="pos-y" />
</div>
<div>
    <label>Depth (<span class='lbl-depth'>${prop.depth}</span>): </label>
    <input type="range" value="${prop.depth}" class="range-depth" max="1" min="0" step="0.01" />
</div>
    `;

    floatingMenu.querySelector('.pos-x').onchange = function (e) {
        prop.position.x = parseInt(e.target.value);
    }
    floatingMenu.querySelector('.pos-y').onchange = function (e) {
        prop.position.y = parseInt(e.target.value);
    }
    floatingMenu.querySelector('.range-depth').onchange = function (e) {
        prop.depth = e.target.value;
        e.target.parentElement.querySelector('.lbl-depth').innerHTML = prop.depth;
    }

    debugCanvas.onkeydown = function (e) {
        e.preventDefault();
        console.log(e.code);
        if (e.code == 'ArrowUp' || e.code == 'KeyW') prop.position.y++;
        if (e.code == 'ArrowDown' || e.code == 'KeyS') prop.position.y--;
        if (e.code == 'ArrowRight' || e.code == 'KeyD') prop.position.x++;
        if (e.code == 'ArrowLeft' || e.code == 'KeyA') prop.position.x--;
        if (e.code == 'KeyQ') prop.depth -= 0.01;
        if (e.code == 'KeyE') prop.depth += 0.01;

        if (prop.depth < 0) prop.depth = 0;
        if (prop.depth > 1) prop.depth = 1;

        floatingMenu.querySelector('.pos-x').value = prop.position.x;
        floatingMenu.querySelector('.pos-y').value = prop.position.y;
        floatingMenu.querySelector('.range-depth').value = prop.depth;
        e.target.parentElement.querySelector('.lbl-depth').innerHTML = prop.depth;
    }
}

function onPick(pick) {
    //lblPicking.innerHTML = pick.constructor.name == 'Object' ? pick.type : pick.constructor.name;
    if (pick.constructor.name == "Character") {
        setupCharConfig(pick);
        return;
    }
    debugCanvas.focus();
    setupPropConfig(pick);
}

const updateDDLAtlases = () => {
    ddlAtlas.innerHTML = Object.getOwnPropertyNames(atlases).map(x => `<option value="${x}">${x}</option>`);
    ddlAtlas.onchange();
};

engine.on('everySecond', () => {
    debugCanvas.style.top = `-${engine.canvas.height * 2 + 2}px`;
    debugCanvas.width = engine.canvas.width;
    debugCanvas.height = engine.canvas.height;
});

engine.on('everyFrame', () => {

    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);
    if (!window.t.showDebug) return;

    const props = game.getPropList();
    const chars = game.getCharList();
    const dyprops = game.getDyPropList();

    debugCtx.lineWidth = 1;
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
    function isDyProp(c) {
        if (c.name == "DyProp") return true;
        let parent = Object.getPrototypeOf(c);
        while (parent) {
            if (parent.name == "Element") break;
            if (parent.name == "DyProp") return true;
            parent = Object.getPrototypeOf(parent);
        }
        return false;
    }

    floatingMenu.innerHTML = `
<div>
    <label>Texture</label>
    <select class="ddl-texture">${Object.getOwnPropertyNames(propsDefinition.srcs).map(x => `<option>${x}</option>`)}</select>
</div>
<div>
    <label>Classee</label>
    <select class="ddl-type">${Object.getOwnPropertyNames(propConstruct.classes).map(x => isDyProp(propConstruct.classes[x]) ? "" : `<option>${x}</option>`)}</select>
</div>
<div>
    <button class="btn-criar">Criar</button><button class="btn-cancelar">Cancelar</button>
</div>
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

document.getElementById('btn-add-dyprop').onclick = function (e) {
    function isDyProp(c) {
        if (c.name == "DyProp") return true;
        let parent = Object.getPrototypeOf(c);
        while (parent) {
            if (parent.name == "Element") break;
            if (parent.name == "DyProp") return true;
            parent = Object.getPrototypeOf(parent);
        }
        return false;
    }

    floatingMenu.innerHTML = `
<div>
    <label>Texture</label>
    <select class="ddl-texture">${Object.getOwnPropertyNames(dynamicPropDefinition.srcs).map(x => `<option>${x}</option>`)}</select>
</div>
<div>
    <label>Classee</label>
    <select class="ddl-type">${Object.getOwnPropertyNames(propConstruct.classes).map(x => !isDyProp(propConstruct.classes[x]) ? "" : `<option>${x}</option>`)}</select>
</div>
<div>
    <button class="btn-criar">Criar</button><button class="btn-cancelar">Cancelar</button>
</div>
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
    const json = { props: [], lights: [] };
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

document.getElementById('btn-add-texture').onclick = function (e) {
    floatingMenu.innerHTML = `
    <div>
        <label>Textura</label>
        <input type="file" id="file-texture" accept=".png" />
    </div>
    <div>
        <label>Normal</label>
        <input type="file" id="file-normal" accept=".png" />
    </div>
    <div>
        <button type="button" id="btn-salvar-textura" >Salvar</button>
    </div>
    `;

    floatingMenu.querySelector('#btn-salvar-textura').onclick = function () {
        const file = floatingMenu.querySelector('#file-texture').files[0];
        const fileNormal = floatingMenu.querySelector('#file-normal').files[0];

        console.log(file, fileNormal);
        let img = null, imgNormal = null;

        if(!file) return;

        Promise.all([ fileToImage(file, 'tex'), ...(fileNormal ? [fileToImage(fileNormal, 'normal')] : []) ]).then((data) => {
            img = data[0].id == 'tex' ? data[0].img : data[1].img;
            imgNormal = data[0].id == 'tex' ? data[1].img : data[0].img;

            if(imgNormal && (img.width != imgNormal.width || img.height != imgNormal.height)) {
                alert('Ow, a imagem tá no tamanho diferente do normal!');
                return;
            }

            atlases['dyn_prop'].draw(img, imgNormal);
            game.drawers['dyprop'].updatePbo();
            floatingMenu.innerHTML = '';
            ddlAtlas.onchange();
        });

    }
}

debugCanvas.onmousedown = function (e) {
    debugCanvas.onkeydown = null;
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

chkDebugBox.onchange = function () {
    window.t.showDebug = this.checked;
}

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

btnListProp.onclick = function () {
    floatingMenu.innerHTML = `
    <ul>
        ${game.getPropList().map(x => {
        return `
            <li>
                <div>
                    Local ID: ${x.localGlobalId} 
                    <button type='button' data-local-id="${x.localGlobalId}" class="btn-selecionar-editar-prop" >Editar</button>
                </div>
                <div>Type: ${x.type}</div>
                <div>Texture: ${x.texture}</div>
            </li>
            `;
    }).join('')}
    </ul>
    `;

    const btns = floatingMenu.getElementsByClassName('btn-selecionar-editar-prop');
    for (let i = 0; i < btns.length; i++) {
        const btn = btns[i];
        btn.onclick = function () {
            const prop = game.getGlobal(this.dataset.localId);
            if (!prop) return;
            onPick(prop);
        }
    }
}

btnListLight.onclick = function () {
    const lights = engine.getLights();
    floatingMenu.innerHTML = `
    <ul>
    ${Object.getOwnPropertyNames(lights).map(x => {
        const light = lights[x];
        const rex = rgbToHex(255 * light.color.r, 255 * light.color.g, 255 * light.color.b);
        return `
        <li class='dataset' data-id="${x}">
            <label>Luz ${x} - Fonte: ${light.objectId ? (game.getGlobal(light.objectId)?.type ?? "") : "Nenhuma"}</label>
            <div>
                <label>Pos</label>
                <label>X:</label>
                <input type="number" data-type='pos' data-inner='x' value="${light.pos.x}" />
                <label>Y:</label>
                <input type="number" data-type='pos' data-inner='y' value="${light.pos.y}" />
                <label>Z:</label>
                <input type="number" data-type='pos' data-inner='z' value="${light.pos.z}" />
            </div>
            <div>
                <label>Color</label>
                <input type="color" data-type='color' value="${rex}" />
            </div>
            <div>
                <label>Intensidade</label>
                <input type="number" data-type='intensity' value="${light.intensity}" />
                <label>Radius</label>
                <input type="number" data-type='radius' value="${light.radius}" />
            </div>
        </li>`;
    }).join('')}
    </ul>`;

    const inputs = floatingMenu.getElementsByTagName('input');
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        input.onchange = function () {
            const id = this.closest('.dataset').dataset.id;
            const light = engine.getLight(id);
            if (!light) return;

            const data = this.dataset;

            let value = this.value;
            if (data.type == 'color') {
                const rgb = hexToRgb(value);
                light.color = { r: rgb.r / 255, g: rgb.g / 255, b: rgb.b / 255 };
                return;
            }

            value = parseInt(value);
            if (data.inner) light[data.type][data.inner] = value;
            else light[data.type] = value;
        }
    }
}

export default {
    updateDDLAtlases
};