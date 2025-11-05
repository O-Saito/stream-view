//@ts-check
/** @import {TexOffset, Position, Size} from "./types/general.js" */
import sprites from './shader/sprites.js';
import background from './shader/background.js';
import cenario from './shader/cenario.js';
import rio from './shader/rio.js';
import raw from './shader/raw.js';
import luz from './shader/luz.js';
import atlasManager from './atlasManager.js';

/**
 * 
 * @typedef {Object} PartData
 * @property {string|null} Part.texture
 * @property {TexOffset} Part.texOffset
 * @property {Position} Part.posOffset
 * @property {number} [Part.rotation]
 * @property {boolean} [Part.isNotSpriteAnimated]
 * @property {Object} [Part.logicOffset]
 * @property {number} Part.logicOffset.x
 * @property {number} Part.logicOffset.y
 * @property {number} Part.currentFrame
 * 
 * @typedef {Object.<string, PartData>} Parts
 * 
 * @typedef {Object} CharShaderData
 * @property {number} index
 * @property {number} depth
 * @property {number} currentFrame
 * @property {boolean} isFlipedX
 * @property {Position} position
 * @property {Size} size
 * @property {Parts} parts
 * @property {number} [localGlobalId]
 * @property {boolean} [isLightSource]
 * @property {Object} [replaceColor]
 * @property {number} replaceColor.r
 * @property {number} replaceColor.g
 * @property {number} replaceColor.b
 */

export const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('gameCanvas'));
export const gl = /**@type {WebGL2RenderingContext} */ (canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false, imageSmoothingEnabled: false }));
export const uiCanvas = /** @type {HTMLCanvasElement} */ (document.getElementById('uiCanvas'));
export const uiCtx = /**@type {CanvasRenderingContext2D} */ (uiCanvas.getContext('2d', { alpha: true }));

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
//gl.enable(gl.FRAMEBUFFER_SRGB);

const propsDefinition = atlasManager.propsDefinition;
const dyPropsDefinition = atlasManager.dynamicPropDefinition;

const countOfLight = 10;
//const countOfCharProps = 1;
const countOfCharProps = 11;
const options = {
    charDepth: 0.10,
    currentCharDepth: 0,
    charNameOffset: 14,
};

/**
 * @type {Array<any>}
 */
const uiDraws = [];

const globalLight = { x: 1, y: 0, z: 0, run: true };

let lastLightIndex = 0;
/** @type {*} */
const lights = {};
/** @type {*} */
const textsFade = {};

let targetFramerate = 60;
/** @type {*} */
let on = {};
let framerate = 0;
let textureIndex = 0;
let fpsInterval = 1000 / targetFramerate + 1;
let then = Date.now();
let now = null, elapsed = null;
/** @type {*} */
export const programData = {};

/**
 * @param {number} newTarget 
 */
const changeTargetFramerate = (newTarget) => {
    targetFramerate = newTarget;
    fpsInterval = 1000 / targetFramerate + 1;
}

/**
 * @param {*} text 
 * @param {*} param1 
 * @returns 
 */
function textFade(text, { position, framesToFade, depth = 999, onFrameMoveDirection = {}, rgb = {}, style = {} } = {}) {
    let id = new Date().getTime();
    while (textsFade[id]) id = new Date().getTime() + 1;

    if (!onFrameMoveDirection.x) onFrameMoveDirection.x = 0;
    if (!onFrameMoveDirection.y) onFrameMoveDirection.y = 0;

    if (!rgb.r) rgb.r = 0;
    if (!rgb.g) rgb.g = 0;
    if (!rgb.b) rgb.b = 0;

    textsFade[id] = {
        text: text,
        startPosition: position,
        framesToFade: framesToFade,
        onFrameMoveDirection: onFrameMoveDirection,
        depth: depth,
        rgb: rgb,
        style: style,
    };
    return id;
}

/**
 * @param {*} param0 
 */
export const requestUIDraw = ({ depth, f }) => {
    if (!depth) depth = 999;
    if (!f) throw new Error("PASSA FUNÇÃO CARA");
    uiDraws.push({ depth, f });
}

/**
 * @param {*} width 
 * @param {*} height 
 * @param {*} floating 
 */
export const resizeCanvas = (width, height, floating) => {
    canvas.width = width;
    canvas.height = height;

    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    canvas.style.zoom = "1";
    canvas.style.imageRendering = 'pixelated';
    canvas.style.transform = 'scale(1)';
    canvas.style.transformOrigin = '0 0';
    canvas.style.willChange = 'transform';
    canvas.style.contain = 'strict';
    document.body.style.transform = 'translateZ(0)';
    document.body.style.willChange = 'transform';
    //document.body.style.contain = 'strict';
    document.body.style.zoom = "1";

    const ratio = Math.ceil(window.devicePixelRatio);
    uiCanvas.width = width;
    uiCanvas.height = height;

    uiCtx.imageSmoothingEnabled = true;
    uiCanvas.style.width = `${uiCanvas.width}px`;
    uiCanvas.style.height = `${uiCanvas.height}px`;
    uiCanvas.style.zoom = "1";
    uiCanvas.style.imageRendering = 'auto';
    //uiCanvas.style.imageRendering = 'pixelated';
    // uiCanvas.style.transform = 'scale(1)';
    // uiCanvas.style.transformOrigin = '0 0';
    // uiCanvas.style.willChange = 'transform';
    // uiCanvas.style.contain = 'strict';
    if (floating) uiCanvas.style.top = `-${height + 1}px`;
    document.body.style.transform = 'translateZ(0)';
    document.body.style.willChange = 'transform';
    //document.body.style.contain = 'strict';
    document.body.style.zoom = "1";

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

/**
 * @param {*} param0 
 * @returns 
 */
export const setupProgram = ({ vertexSource, fragmentSource, getUniforms, getAttributes, setup, addToTransform, updateTransformPart, removeTransformPart }) => {

    const program = gl.createProgram();

    const vertexShader = /**@type {CanvasRenderingContext2D} */ (gl.createShader(gl.VERTEX_SHADER));
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    gl.attachShader(program, vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        throw new Error("shader not linked");
    }

    const fragmentShader = /**@type {CanvasRenderingContext2D} */ (gl.createShader(gl.FRAGMENT_SHADER));
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    gl.attachShader(program, fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(fragmentShader));
        throw new Error("shader not linked");
    }

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
        console.log(gl.getProgramInfoLog(program));
        throw new Error("Program not linked");
    }

    const locals = {
        u: getUniforms ? getUniforms(program) : {},
        a: getAttributes ? getAttributes(program) : {}
    };

    return {
        program: program,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        locals: locals,
        addToTransform,
        updateTransformPart,
        removeTransformPart,
    }
};

/**
 * @param {*} pointers 
 */
export const vertexAttribPointer = (pointers) => {
    const byteCount = pointers.reduce(/** @param {*} partialSum @param {*} x */(partialSum, x) => partialSum + (x.size * 4), 0);;
    let byteOffset = 0;
    for (let i = 0; i < pointers.length; i++) {
        const pointer = pointers[i];
        if (pointer.type == gl.FLOAT) gl.vertexAttribPointer(pointer.local, pointer.size, pointer.type, pointer.normalized, byteCount, byteOffset);
        else gl.vertexAttribIPointer(pointer.local, pointer.size, pointer.type, pointer.normalized, byteCount);
        byteOffset += pointer.size * 4;
    }
};

/**
 * @param {*} gl 
 * @param {*} type 
 * @returns 
 */
export const createTexture = (gl, type) => {
    const index = textureIndex;
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(type, texture);
    gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textureIndex++;
    return [texture, index];
}

/**
 * @param {*} param0 
 * @returns 
 */
export const submit2DArrayImage = ({ gl, width, height, imageHeight, layerCount, imgData }) => {

    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, width, imageHeight, layerCount);
    const pbo = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_UNPACK_BUFFER, imgData, gl.STATIC_DRAW);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, width);
    gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, height);

    for (let i = 0; i < layerCount; i++) {
        const row = i * imageHeight;
        // Assign that origin point to the PBO
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0);
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, row);
        // Tell webgl to use the PBO and write that texture at its own depth
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, width, imageHeight, 1, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    }

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return pbo;
}

/**
 * @param {*} param0 
 * @returns 
 */
export const update2DArrayImage = ({ gl, textureType, texture, textureIndex, width, height, imageHeight, layerCount, imgData }) => {

    gl.activeTexture(gl.TEXTURE0 + textureIndex);
    gl.bindTexture(textureType, texture);
    //gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, width, imageHeight, layerCount);
    const pbo = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_UNPACK_BUFFER, imgData, gl.STATIC_DRAW);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_ROW_LENGTH, width);
    gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, height);

    for (let i = 0; i < layerCount; i++) {
        const row = i * imageHeight;
        // Assign that origin point to the PBO
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0);
        gl.pixelStorei(gl.UNPACK_SKIP_ROWS, row);
        // Tell webgl to use the PBO and write that texture at its own depth
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, width, imageHeight, 1, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    }

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return pbo;
}

programData.char = setupProgram({
    vertexSource: sprites.vertexShaderSource,
    fragmentSource: sprites.fragmentShaderSource,
    /**
     * @param {*} program 
     * @param {*} locals 
     */
    setup: (program, locals) => {
    },
    /**
     * @param {*} p 
     * @returns 
     */
    getUniforms: (p) => { return sprites.getUniforms(gl, p); },
    /**
     * @param {*} p 
     * @returns 
     */
    getAttributes: (p) => { return sprites.getAttributes(gl, p); },
    /**
     * @param {*} o 
     * @param {*} countOfChars 
     * @returns 
     */
    addToTransform: (o, countOfChars) => {
        const dataLength = 17;
        const dataSize = dataLength * countOfCharProps;
        const pd = programData.char;
        if (dataSize * countOfChars <= pd.transformData.length) return;
        gl.useProgram(pd.program);
        gl.bindVertexArray(pd.vao1);
        //gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, pd.transformBuffer);
        // gl.drawArrays(gl.POINTS, 0, 4);

        const arr = [];

        for (let i = 0; i < countOfCharProps; i++) {
            arr.push(1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,);
        }

        pd.transformData = new Float32Array([
            ...pd.transformData,
            ...arr
        ]);
        gl.bufferData(gl.ARRAY_BUFFER, pd.transformData, gl.DYNAMIC_DRAW);
        gl.bindVertexArray(null);
    },
    /**
     * @param {CharShaderData} char 
     */
    updateTransformPart: (char) => {
        const charDefinitions = atlasManager.charDefinitions;
        const dataLength = 17;
        const dataSize = dataLength * countOfCharProps;
        const pd = programData['char'];

        let d = char.depth == options.charDepth ? options.currentCharDepth : char.depth;
        let skip = 0;
        /**
         * @param {number} i 
         * @param {string} type 
         */
        const setData = (i, type) => {
            const set = char.parts[type];
            i = i + skip;
            const pos = { x: char.position.x, y: char.position.y };
            const texCoordOffset = set ? { x: 0, y: 0 } : { x: -32, y: -32 };
            let rotation = 0;
            let animationLayer = 0;

            if (set) {
                animationLayer = set.texture == null ? 0 : charDefinitions.calcDepth(set.texture);
                rotation = set.rotation ?? 0;
                //const texOffset = set.texOffset;

                if (set.texture == undefined || set.texture == null) {
                    texCoordOffset.x = -char.size.width;
                    texCoordOffset.y = -char.size.height;
                } else {
                    pos.x += set.posOffset.x;
                    pos.y += set.posOffset.y;

                    texCoordOffset.x = set.texOffset.x;
                }

                /*if (texCoordOffset.x != -char.size.width) {
                    texCoordOffset.x = ((set.isNotSpriteAnimated ? 0 : set.currentFrame) * char.size.width) + (texOffset?.x ?? 0) + (charDefinitions.srcs[set.texture ?? ""]?.w ?? 0);
                }
                if (texOffset?.ax) pos.x += texOffset?.ax * (char.isFlipedX ? 1 : -1);
                if (texOffset?.ay) pos.y += texOffset?.ay;

                if (set.logicOffset) {
                    if (set.logicOffset.x) pos.x += set.logicOffset.x;
                    if (set.logicOffset.y) pos.y += set.logicOffset.y;
                }*/
            }

            //if (Number.isNaN(animationLayer)) alert(type + " " + set.texture);
            if (texCoordOffset.x == undefined) console.error(`${texCoordOffset.x} ${set.texture}`);
            if (texCoordOffset.y == undefined) console.error(`${texCoordOffset.y} ${set.texture}`);
            //if (texCoordOffset.x != -32)
                //console.log(texCoordOffset.x, texCoordOffset.y, animationLayer);

            if (Number.isNaN(animationLayer)) animationLayer = 0;
            pd.transformData[i + 0] = pos.x;
            pd.transformData[i + 1] = pos.y;
            pd.transformData[i + 2] = texCoordOffset.x;
            pd.transformData[i + 3] = texCoordOffset.y;
            pd.transformData[i + 4] = animationLayer;
            pd.transformData[i + 5] = d;
            pd.transformData[i + 6] = char.isFlipedX ? char.size.width : 0;
            pd.transformData[i + 7] = 0;
            pd.transformData[i + 8] = char.size.width;
            pd.transformData[i + 9] = char.size.height;
            pd.transformData[i + 10] = char.localGlobalId ?? 0;
            pd.transformData[i + 11] = char.isLightSource ? 1 : 0;
            pd.transformData[i + 12] = rotation;
            pd.transformData[i + 13] = char.replaceColor ? char.replaceColor.r / 255 : 0.0;
            pd.transformData[i + 14] = char.replaceColor ? char.replaceColor.g / 255 : 0.0;
            pd.transformData[i + 15] = char.replaceColor ? char.replaceColor.b / 255 : 0.0;
            pd.transformData[i + 16] = char.replaceColor ? 1.0 : 0.0;
            d -= 0.0001;
            options.currentCharDepth -= 0.0001;
            skip += dataLength;
        }

        //setData(char.index * dataSize, 'body');
        /**/
        setData(char.index * dataSize, 'capeBack');
        setData(char.index * dataSize, 'legs');
        setData(char.index * dataSize, 'pants');
        setData(char.index * dataSize, 'body');
        setData(char.index * dataSize, 'chest');
        setData(char.index * dataSize, 'weapon');
        setData(char.index * dataSize, 'head');
        setData(char.index * dataSize, 'face');
        setData(char.index * dataSize, 'helmet');
        setData(char.index * dataSize, 'capeFront');
        setData(char.index * dataSize, 'second_weapon');
    }
});

function everySecond() {
    if (on['everySecond']) {
        for (let i = 0; i < on['everySecond'].length; i++) {
            on['everySecond'][i]();
        }
    }
    framerate = 0;
}

function everyFrame() {
    now = Date.now();
    elapsed = now - then;
    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        options.currentCharDepth = options.charDepth;
        if (on['everyFrame']) {
            for (let i = 0; i < on['everyFrame'].length; i++) {
                on['everyFrame'][i]();
            }
        }
        uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
        uiDraws.sort((a, b) => a.depth - b.depth);
        for (let i = 0; i < uiDraws.length; i++) {
            const ui = uiDraws[i];
            ui.f({ c: uiCanvas, ctx: uiCtx });
        }
        uiDraws.length = 0;
        framerate++;
    }
    requestAnimationFrame(everyFrame);
}

setInterval(everySecond, 1000);
everyFrame();

export default {
    setupProgram,
    resizeCanvas,
    vertexAttribPointer,
    createTexture,
    submit2DArrayImage,
    /**
     * @param {*} action 
     * @param {*} func 
     */
    on: (action, func) => { if (!on[action]) on[action] = []; on[action].push(func); },
    getFramerate: () => framerate,
    textFade,
    options,
    programData,
    canvas,
    gl,
    countOfCharProps,
    globalLight,
    getLightCount: () => Object.getOwnPropertyNames(lights).length,
    //getLightPositions: () => [].concat(...Object.getOwnPropertyNames(lights).map(x => [lights[x].pos.x, lights[x].pos.y, lights[x].pos.z])),
    /**
     * @param {*} id 
     * @returns 
     */
    getLight: (id) => lights[id],
    getLights: () => lights,
    requestUIDraw,
    changeTargetFramerate
};
