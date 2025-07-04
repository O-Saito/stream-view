import sprites from './shader/sprites.js';
import background from './shader/background.js';
import cenario from './shader/cenario.js';
import rio from './shader/rio.js';
import raw from './shader/raw.js';
import luz from './shader/luz.js';
import atlasManager from './atlasManager.js';

export const canvas = document.getElementById('gameCanvas');
export const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false, imageSmoothingEnabled: false });
export const uiCanvas = document.getElementById('uiCanvas');
export const uiCtx = uiCanvas.getContext('2d', { alpha: true });

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
//gl.enable(gl.FRAMEBUFFER_SRGB);

const propsDefinition = atlasManager.propsDefinition;
const dyPropsDefinition = atlasManager.dynamicPropDefinition;

const countOfLight = 10;
const countOfCharProps = 11;
const options = {
  charDepth: 0.10,
  currentCharDepth: 0,
  charNameOffset: 14,
};

const uiDraws = [];

const globalLight = { x: 1, y: 0, z: 0, run: true };

let lastLightIndex = 0;
const lights = {};
const textsFade = {};

let targetFramerate = 60;
let on = {};
let framerate = 0;
let textureIndex = 0;
let fpsInterval = 1000 / targetFramerate + 1;
let then = Date.now();
let now = null, elapsed = null;
export const programData = {};

const changeTargetFramerate = (newTarget) => {
  targetFramerate = newTarget;
  fpsInterval = 1000 / targetFramerate + 1;
}

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

export const requestUIDraw = ({ depth, f }) => {
  if (!depth) depth = 999;
  if (!f) throw new Error("PASSA FUNÇÃO CARA");
  uiDraws.push({ depth, f });
}

export const resizeCanvas = (width, height, floating) => {
  canvas.width = width;
  canvas.height = height;

  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  canvas.style.zoom = 1;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.transform = 'scale(1)';
  canvas.style.transformOrigin = '0 0';
  canvas.style.willChange = 'transform';
  canvas.style.contain = 'strict';
  document.body.style.transform = 'translateZ(0)';
  document.body.style.willChange = 'transform';
  //document.body.style.contain = 'strict';
  document.body.style.zoom = 1;

  const ratio = Math.ceil(window.devicePixelRatio);
  uiCanvas.width = width;
  uiCanvas.height = height;

  uiCtx.imageSmoothingEnabled = true;
  uiCanvas.style.width = `${uiCanvas.width}px`;
  uiCanvas.style.height = `${uiCanvas.height}px`;
  uiCanvas.style.zoom = 1;
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
  document.body.style.zoom = 1;

  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.viewport(0, 0, canvas.width, canvas.height);
}

export const setupProgram = ({ vertexSource, fragmentSource, getUniforms, getAttributes, setup, addToTransform, updateTransformPart, removeTransformPart }) => {

  const program = gl.createProgram();

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);
  gl.attachShader(program, vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(vertexShader));
    throw new Error("shader not linked");
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
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

export const vertexAttribPointer = (pointers) => {
  const byteCount = pointers.reduce((partialSum, x) => partialSum + (x.size * 4), 0);;
  let byteOffset = 0;
  for (let i = 0; i < pointers.length; i++) {
    const pointer = pointers[i];
    if (pointer.type == gl.FLOAT) gl.vertexAttribPointer(pointer.local, pointer.size, pointer.type, pointer.normalized, byteCount, byteOffset);
    else gl.vertexAttribIPointer(pointer.local, pointer.size, pointer.type, pointer.normalized, byteCount, byteOffset);
    byteOffset += pointer.size * 4;
  }
};

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

function addLight({ pos, color, radius, intensity, objectId }) {
  const lightId = lastLightIndex++;

  lights[lightId] = {
    pos: { x: pos.x, y: pos.y, z: pos.z },
    color: { r: color.r, g: color.g, b: color.b, a: color.a },
    radius,
    intensity,
    objectId,
  };

  return lightId;
}

programData['char'] = setupProgram({
  vertexSource: sprites.vertexShaderSource,
  fragmentSource: sprites.fragmentShaderSource,
  setup: (program, locals) => {
  },
  getUniforms: (p) => { return sprites.getUniforms(gl, p); },
  getAttributes: (p) => { return sprites.getAttributes(gl, p); },
  addToTransform: (o, countOfChars) => {
    const dataLength = 17;
    const dataSize = dataLength * countOfCharProps;
    const pd = programData['char'];
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
  updateTransformPart: (char, charDefinitions) => {
    const dataLength = 17;
    const dataSize = dataLength * countOfCharProps;
    const pd = programData['char'];

    let d = char.depth == options.charDepth ? options.currentCharDepth : char.depth;
    let skip = 0;
    const setData = (i, type) => {
      const preset = char.getCurrentPreset(type);

      i = i + skip;
      const pos = { x: char.position.x, y: char.position.y };
      const texCoordOffset = { x: 0, y: 0 };
      let rotation = 0;
      let animationLayer = preset == undefined ? 0 : charDefinitions.calcDepth(preset);

      if (preset == undefined) {
        texCoordOffset.x = -char.size.width;
        texCoordOffset.y = -char.size.height;
      }

      if (char.animationController.partsName.find(x => x == type)) {
        const part = char.animationController.parts[type];
        rotation = part.rotation ?? 0;
        const texOffset = part.currentFrame >= part.texOffset.length ? part.texOffset[0] : part.texOffset[part.currentFrame];
        if (texCoordOffset.x != -char.size.width) {
          texCoordOffset.x = ((part.isNotSpriteAnimated ? 0 : part.currentFrame) * char.size.width) + (texOffset?.x ?? 0) + (charDefinitions.srcs[char.preset[type]]?.w ?? 0);
        }
        if (texOffset?.ax) pos.x += texOffset?.ax * (char.flipedX() ? 1 : -1);
        if (texOffset?.ay) pos.y += texOffset?.ay;

        if (part.logicOffset) {
          if (part.logicOffset.x) pos.x += part.logicOffset.x;
          if (part.logicOffset.y) pos.y += part.logicOffset.y;
        }
      } else {
        if (char.currentFrame != undefined && char.currentFrame != null) {
          texCoordOffset.x = (char.currentFrame ?? 0) * char.size.width;
        }
      }
      pd.transformData[i + 0] = pos.x;
      pd.transformData[i + 1] = pos.y;
      pd.transformData[i + 2] = texCoordOffset.x;
      pd.transformData[i + 3] = texCoordOffset.y;
      pd.transformData[i + 4] = animationLayer;
      pd.transformData[i + 5] = d;
      pd.transformData[i + 6] = char.flipedX() ? char.size.width : 0;
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

programData['prop'] = setupProgram({
  vertexSource: sprites.vertexShaderSource,
  fragmentSource: sprites.fragmentShaderSource,
  setup: (program, locals) => {
  },
  getUniforms: (p) => { return sprites.getUniforms(gl, p); },
  getAttributes: (p) => { return sprites.getAttributes(gl, p); },
  addToTransform: (p, countOfProp) => {// (url, { pos, size }) => {
    const prop = propsDefinition.srcs[p.texture];

    const pos = { x: p.position.x, y: p.position.y };
    const size = { w: p.size.width, h: p.size.height };
    pos.w = size.w;
    pos.h = size.h;
    pos.xw = pos.x + pos.w;
    pos.yh = pos.y + pos.h;

    const pd = programData['prop'];
    gl.useProgram(pd.program);
    gl.bindVertexArray(pd.vao1);
    gl.bindBuffer(gl.ARRAY_BUFFER, pd.transformBuffer);

    const tc = {
      x: 0, y: 0,
      w: size.w, h: size.h,
    }
    tc.xw = tc.x + tc.w;
    tc.yh = tc.y + tc.h;

    const imageLayer = propsDefinition.calcDepth(p.texture);

    const data = [
      0, 0, tc.x, tc.y, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      pos.w, 0, tc.xw, tc.y, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      0, pos.h, tc.x, tc.yh, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      pos.w, 0, tc.xw, tc.y, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      pos.w, pos.h, tc.xw, tc.yh, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      0, pos.h, tc.x, tc.yh, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,];

    if (data.length * countOfProp <= pd.transformData.length) return;
    pd.transformData = new Float32Array([
      ...pd.transformData, ...data
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, pd.transformData, gl.DYNAMIC_DRAW);
    gl.bindVertexArray(null);

  },
  updateTransformPart: (prop) => {
    const pd = programData['prop'];
    let d = 1;

    let skip = 4;
    let attrib = 17;
    let vertex = 6;
    let i = prop.index * ((skip + attrib) * vertex);
    const pos = { x: prop.position.x, y: prop.position.y };
    const texCoordOffset = { x: prop.texCoordOffset.x, y: prop.texCoordOffset.y };
    let animationLayer = propsDefinition.calcDepth(prop.texture);

    for (let z = 0; z < vertex; z++) {
      const atual = i + (z * (skip + attrib)) + skip;

      pd.transformData[atual - 4] = prop.vertexPositions[z * skip + 0];
      pd.transformData[atual - 3] = prop.vertexPositions[z * skip + 1];
      pd.transformData[atual - 2] = prop.vertexPositions[z * skip + 2];
      pd.transformData[atual - 1] = prop.vertexPositions[z * skip + 3];

      pd.transformData[atual + 0] = pos.x;
      pd.transformData[atual + 1] = pos.y;
      pd.transformData[atual + 2] = texCoordOffset.x + ((prop.currentFrame ?? 0) * prop.size.width);
      pd.transformData[atual + 3] = texCoordOffset.y;
      pd.transformData[atual + 4] = animationLayer;
      pd.transformData[atual + 5] = prop.depth;
      pd.transformData[atual + 6] = prop.flipedX() ? 1 : 0;
      pd.transformData[atual + 7] = prop.flipedY() ? 1 : 0;
      pd.transformData[atual + 8] = prop.size.width;
      pd.transformData[atual + 9] = prop.size.height;
      pd.transformData[atual + 10] = prop.localGlobalId ?? 0;
      pd.transformData[atual + 11] = prop.isLightSource ? 1 : 0;
      pd.transformData[atual + 12] = 0; // rotation
      pd.transformData[atual + 13] = 0; // replaceColor
      pd.transformData[atual + 14] = 0; // replaceColor
      pd.transformData[atual + 15] = 0; // replaceColor
      pd.transformData[atual + 16] = 0; // replaceColor
    }
    d -= 0.0001;
  }
});

programData['dyprop'] = setupProgram({
  vertexSource: sprites.vertexShaderSource,
  fragmentSource: sprites.fragmentShaderSource,
  setup: (program, locals) => {
  },
  getUniforms: (p) => { return sprites.getUniforms(gl, p); },
  getAttributes: (p) => { return sprites.getAttributes(gl, p); },
  addToTransform: (p) => {// (url, { pos, size }) => {
    const prop = dyPropsDefinition.srcs[p.texture];

    const pos = { x: p.position.x, y: p.position.y };
    const size = { w: p.size.width, h: p.size.height };
    pos.w = size.w;
    pos.h = size.h;
    pos.xw = pos.x + pos.w;
    pos.yh = pos.y + pos.h;

    const pd = programData['dyprop'];
    gl.useProgram(pd.program);
    gl.bindVertexArray(pd.vao1);
    gl.bindBuffer(gl.ARRAY_BUFFER, pd.transformBuffer);

    const tc = {
      x: 0, y: 0,
      w: size.w, h: size.h,
    }
    tc.xw = tc.x + tc.w;
    tc.yh = tc.y + tc.h;

    const imageLayer = dyPropsDefinition.calcDepth(p.texture);
    pd.transformData = new Float32Array([
      ...pd.transformData,
      0, 0, tc.x, tc.y, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      pos.w, 0, tc.xw, tc.y, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      0, pos.h, tc.x, tc.yh, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      pos.w, 0, tc.xw, tc.y, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      pos.w, pos.h, tc.xw, tc.yh, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
      0, pos.h, tc.x, tc.yh, pos.x, pos.y, prop.ow, prop.oh, imageLayer, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0,
    ]);
    // pd.transformData = new Float32Array([
    //   ...pd.transformData,
    //   0, 0, tc.x, tc.y, pos.x, pos.y, 1, 1, imageLayer, 1, 0, 0, 1, 1,
    //   pos.w, 0, tc.xw, tc.y, pos.x, pos.y, 1, 1, imageLayer, 1, 0, 0, 1, 1,
    //   0, pos.h, tc.x, tc.yh, pos.x, pos.y, 1, 1, imageLayer, 1, 0, 0, 1, 1,
    //   pos.w, 0, tc.xw, tc.y, pos.x, pos.y, 1, 1, imageLayer, 1, 0, 0, 1, 1,
    //   pos.w, pos.h, tc.xw, tc.yh, pos.x, pos.y, 1, 1, imageLayer, 1, 0, 0, 1, 1,
    //   0, pos.h, tc.x, tc.yh, pos.x, pos.y, 1, 1, imageLayer, 1, 0, 0, 1, 1,
    // ]);
    gl.bufferData(gl.ARRAY_BUFFER, pd.transformData, gl.DYNAMIC_DRAW);
    gl.bindVertexArray(null);

  },
  updateTransformPart: (prop) => {
    const pd = programData['dyprop'];
    let d = 1;

    let skip = 4;
    let attrib = 17;
    let vertex = 6;
    let i = (prop.parent ? prop.parent.index + prop.index : prop.index) * ((skip + attrib) * vertex);
    const pos = { x: prop.position.x, y: prop.position.y };
    const texCoordOffset = { x: prop.texCoordOffset.x, y: prop.texCoordOffset.y };
    let animationLayer = dyPropsDefinition.calcDepth(prop.texture) ?? 0;

    // if(prop.effects) {
    //   if(prop.effects.cut) {
    //     if(prop.effects.cut.x) 
    //   }
    // }

    for (let z = 0; z < vertex; z++) {
      const atual = i + (z * (skip + attrib)) + skip;

      pd.transformData[atual - 4] = prop.vertexPositions[z * skip + 0];
      pd.transformData[atual - 3] = prop.vertexPositions[z * skip + 1];
      pd.transformData[atual - 2] = prop.vertexPositions[z * skip + 2];
      pd.transformData[atual - 1] = prop.vertexPositions[z * skip + 3];

      pd.transformData[atual + 0] = pos.x + (prop.parent ? prop.parent.position.x : 0);
      pd.transformData[atual + 1] = pos.y + (prop.parent ? prop.parent.position.y : 0);
      pd.transformData[atual + 2] = texCoordOffset.x + ((prop.currentFrame ?? 0) * prop.size.width);
      pd.transformData[atual + 3] = texCoordOffset.y;
      pd.transformData[atual + 4] = animationLayer;
      pd.transformData[atual + 5] = prop.depth;
      pd.transformData[atual + 6] = prop.flipedX() ? 1 : 0;
      pd.transformData[atual + 7] = prop.flipedY() ? 1 : 0;
      pd.transformData[atual + 8] = prop.size.width;
      pd.transformData[atual + 9] = prop.size.height;
      pd.transformData[atual + 10] = prop.localGlobalId ?? 0;
      pd.transformData[atual + 11] = prop.isLightSource ? 1 : 0;
      pd.transformData[atual + 12] = 0; // rotation
      pd.transformData[atual + 13] = 0; // replaceColor
      pd.transformData[atual + 14] = 0; // replaceColor
      pd.transformData[atual + 15] = 0; // replaceColor
      pd.transformData[atual + 16] = 0; // replaceColor
    }
    d -= 0.0001;
  },
  removeTransformPart: (prop) => {
    const pd = programData['dyprop'];

    let skip = 4;
    let attrib = 17;
    let vertex = 6;
    let i = 1 * ((skip + attrib) * vertex);

    const t = pd.transformData.slice(0, pd.transformData.length - i);
    pd.transformData = new Float32Array(t);
  }
});

programData['background'] = setupProgram({
  vertexSource: background.vertexShaderSource,
  fragmentSource: background.fragmentShaderSource,
  setup: (program, locals) => {
  },
  getUniforms: (p) => { return background.getUniforms(gl, p); },
  getAttributes: (p) => { return background.getAttributes(gl, p); }
});

programData['cenario'] = setupProgram({
  vertexSource: cenario.vertexShaderSource,
  fragmentSource: cenario.fragmentShaderSource.replaceAll('[COUNTOFLIGHT]', countOfLight),
  getUniforms: (p) => { return cenario.getUniforms(gl, p); },
  getAttributes: (p) => { return cenario.getAttributes(gl, p); }
});

programData['rio'] = setupProgram({
  vertexSource: rio.vertexShaderSource,
  fragmentSource: rio.fragmentShaderSource,
  getUniforms: (p) => { return rio.getUniforms(gl, p); },
  getAttributes: (p) => { return rio.getAttributes(gl, p); }
});

programData['raw'] = setupProgram({
  vertexSource: raw.vertexShaderSource,
  fragmentSource: raw.fragmentShaderSource,
  getUniforms: (p) => { return raw.getUniforms(gl, p); },
  getAttributes: (p) => { return raw.getAttributes(gl, p); }
});

programData['light'] = setupProgram({
  vertexSource: luz.vertexShaderSource,
  fragmentSource: luz.fragmentShaderSource,
  getUniforms: (p) => { return luz.getUniforms(gl, p); },
  getAttributes: (p) => { return luz.getAttributes(gl, p); }
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

    Object.getOwnPropertyNames(textsFade).forEach(id => {
      const text = textsFade[id];

      if (!text.currentPosition) text.currentPosition = { x: text.startPosition.x, y: text.startPosition.y };
      if (text.currentFrame == undefined) text.currentFrame = -1;
      text.currentFrame++;

      if (text.currentFrame > text.framesToFade) {
        delete textsFade[id];
        return;
      }

      text.currentPosition.x += text.onFrameMoveDirection.x;
      text.currentPosition.y += text.onFrameMoveDirection.y;

      requestUIDraw({
        depth: text.depth, f: ({ c, ctx }) => {
          try {
            ctx.save();
            ctx.lineWidth = text.style.lineWidth ?? 0.1;
            ctx.fillStyle = `rgba(${text.rgb.r}, ${text.rgb.g}, ${text.rgb.b}, ${1 - (text.currentFrame / text.framesToFade)})`;
            ctx.font = `${text.style.fontWeight ?? '300'} ${text.style.fontSize ?? '18px'} customFont`;

            let metrics = ctx.measureText(text.text);
            let textWidth = metrics.width;
            const pos = {
              x: text.currentPosition.x - (textWidth / 2),
              y: canvas.height - (text.currentPosition.y)
            };

            ctx.fillText(text.text, pos.x, pos.y);
            if (text.style.strokeStyle) {
              ctx.strokeStyle = text.style.strokeStyle ?? 'white';
              ctx.strokeText(text.text, pos.x, pos.y);
            }
            ctx.restore();
          } catch (error) {
            console.error(error);
          }
        }
      });
    });

    const pdLight = programData['light'];
    const lightIndexes = Object.getOwnPropertyNames(lights);
    for (let i = 0; i < lightIndexes.length; i++) {
      const light = lights[lightIndexes[i]];
      const dataSize = 9;
      const index = i * dataSize;

      if (pdLight.transformData.length < (i + 1) * dataSize)
        pdLight.transformData = new Float32Array([...pdLight.transformData, ...(new Array(dataSize))]);

      pdLight.transformData[index + 0] = light.pos.x;
      pdLight.transformData[index + 1] = light.pos.y;
      pdLight.transformData[index + 2] = light.pos.z;
      pdLight.transformData[index + 3] = light.color.r;
      pdLight.transformData[index + 4] = light.color.g;
      pdLight.transformData[index + 5] = light.color.b;
      pdLight.transformData[index + 6] = light.intensity;
      pdLight.transformData[index + 7] = light.radius;
      pdLight.transformData[index + 8] = light.objectId ?? 0;
    }

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
  on: (action, func) => { if (!on[action]) on[action] = []; on[action].push(func); },
  getFramerate: () => framerate,
  addLight,
  textFade,
  options,
  programData,
  canvas,
  gl,
  countOfCharProps,
  globalLight,
  getLightCount: () => Object.getOwnPropertyNames(lights).length,
  getLightPositions: () => [].concat(...Object.getOwnPropertyNames(lights).map(x => [lights[x].pos.x, lights[x].pos.y, lights[x].pos.z])),
  getLight: (id) => lights[id],
  getLights: () => lights,
  requestUIDraw,
  changeTargetFramerate
};
