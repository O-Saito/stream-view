import shaders from './shader/spriteArray.js';

export const canvas = document.getElementById('gameCanvas');
export const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false, imageSmoothingEnabled: false });

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
// gl.enable(gl.DEPTH_TEST);
// gl.depthFunc(gl.LEQUAL);
//gl.enable(gl.FRAMEBUFFER_SRGB);

let on = {};
let framerate = 0;
let textureIndex = 0;
let fpsInterval = 1000 / 61;
let then = Date.now();
let now = null, elapsed = null;
export const programData = {};

export const resizeCanvas = (width, height) => {
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

  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.viewport(0, 0, canvas.width, canvas.height);
}

export const setupProgram = ({ vertexSource, fragmentSource, getUniforms, getAttributes, setup }) => {

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
  }
};

export const vertexAttribPointer = (pointers) => {
  const byteCount = pointers.reduce((partialSum, x) => partialSum + (x.size * 4), 0);;
  let byteOffset = 0;
  for (let i = 0; i < pointers.length; i++) {
    const pointer = pointers[i];
    gl.vertexAttribPointer(pointer.local, pointer.size, pointer.type, pointer.normalized, byteCount, byteOffset);
    byteOffset += pointer.size * 4;
  }
};

export const createTexture = (gl, type) => {
  const index = textureIndex;
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + index);
  gl.bindTexture(type, texture);
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

programData['char'] = setupProgram({
  vertexSource: shaders.vertexShaderSource,
  fragmentSource: shaders.fragmentShaderSource,
  setup: (program, locals) => {
  },
  getUniforms: (p) => { return shaders.getSpriteSheetUniforms(gl, p); },
  getAttributes: (p) => { return shaders.getSpriteSheetAttributes(gl, p); }
});

programData['prop'] = setupProgram({
  vertexSource: shaders.vertexShaderSource,
  fragmentSource: shaders.fragmentShaderSource,
  setup: (program, locals) => {
  },
  getUniforms: (p) => { return shaders.getSpriteSheetUniforms(gl, p); },
  getAttributes: (p) => { return shaders.getSpriteSheetAttributes(gl, p); }
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
    if (on['everyFrame']) {
      for (let i = 0; i < on['everyFrame'].length; i++) {
        on['everyFrame'][i]();
      }
    }
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
  getFramerate: () => framerate,
  on: (action, func) => { if (!on[action]) on[action] = []; on[action].push(func); },
  programData,
  canvas,
  gl,
};
