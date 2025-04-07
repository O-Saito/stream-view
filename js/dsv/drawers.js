import { canvas, gl, createTexture, submit2DArrayImage, update2DArrayImage, vertexAttribPointer } from './engine.js';
import { atlases } from './atlasManager.js';

function getPosition({ pos, tc },) {
    pos.xw = pos.x + pos.w;
    pos.yh = pos.y + pos.h;

    tc.xw = tc.x + tc.w;
    tc.yh = tc.y + tc.h;

    return [
        pos.x, pos.y, tc.x, tc.y,
        pos.xw, pos.y, tc.xw, tc.y,
        pos.x, pos.yh, tc.x, tc.yh,
        pos.xw, pos.y, tc.xw, tc.y,
        pos.xw, pos.yh, tc.xw, tc.yh,
        pos.x, pos.yh, tc.x, tc.yh,
    ];
}

async function setupCharDrawer(pd) {
    gl.useProgram(pd.program);

    const charAtlas = atlases['char'];

    pd.transformData = new Float32Array([]);
    pd.data = new Float32Array([
        ...getPosition({ pos: { x: 0, y: 0, w: 32, h: 32 }, tc: { x: 0, y: 0, w: 32, h: 32 } }),
    ]);

    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.uniform2f(pd.locals.u.textureSize, charAtlas.canvas.width, charAtlas.imageHeight);

    // Create and bind textures
    const [atlasTexture, atlasIndex] = createTexture(gl, gl.TEXTURE_2D_ARRAY);
    gl.uniform1i(pd.locals.u.atlas, atlasIndex);
    const pbo = submit2DArrayImage({
        gl: gl,
        width: charAtlas.canvas.width,
        height: charAtlas.canvas.height,
        imageHeight: charAtlas.imageHeight,
        layerCount: charAtlas.layersCount,
        imgData: charAtlas.imgData
    });

    const [normalTexture, normalIndex] = createTexture(gl, gl.TEXTURE_2D_ARRAY);
    gl.uniform1i(pd.locals.u.normalAtlas, normalIndex);
    const pboNormal = submit2DArrayImage({
        gl: gl,
        width: charAtlas.canvas.width,
        height: charAtlas.canvas.height,
        imageHeight: charAtlas.imageHeight,
        layerCount: charAtlas.layersCount,
        imgData: charAtlas.normalImgData
    });

    // Create and bind data
    const vao = gl.createVertexArray();
    pd.vao = vao;
    gl.bindVertexArray(vao);

    const dataBuffer = gl.createBuffer();
    pd.dataBuffer = dataBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pd.data, gl.STATIC_DRAW);

    vertexAttribPointer([
        { local: pd.locals.a.position, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.texCoord, size: 2, type: gl.FLOAT, normalized: false },
    ]);
    gl.enableVertexAttribArray(pd.locals.a.position);
    gl.enableVertexAttribArray(pd.locals.a.texCoord);

    const transformBuffer = gl.createBuffer();
    pd.transformBuffer = transformBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pd.transformData, gl.DYNAMIC_DRAW);

    vertexAttribPointer([
        { local: pd.locals.a.positionOffset, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.frameOffset, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.animationLayer, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.depth, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.flipImage, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.spriteSize, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.objectId, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.isLightSource, size: 1, type: gl.FLOAT, normalized: false },
    ]);

    gl.vertexAttribDivisor(pd.locals.a.positionOffset, 1);
    gl.vertexAttribDivisor(pd.locals.a.frameOffset, 1);
    gl.vertexAttribDivisor(pd.locals.a.animationLayer, 1);
    gl.vertexAttribDivisor(pd.locals.a.depth, 1);
    gl.vertexAttribDivisor(pd.locals.a.flipImage, 1);
    gl.vertexAttribDivisor(pd.locals.a.spriteSize, 1);
    gl.vertexAttribDivisor(pd.locals.a.objectId, 1);
    gl.vertexAttribDivisor(pd.locals.a.isLightSource, 1);

    gl.enableVertexAttribArray(pd.locals.a.positionOffset);
    gl.enableVertexAttribArray(pd.locals.a.frameOffset);
    gl.enableVertexAttribArray(pd.locals.a.animationLayer);
    gl.enableVertexAttribArray(pd.locals.a.depth);
    gl.enableVertexAttribArray(pd.locals.a.flipImage);
    gl.enableVertexAttribArray(pd.locals.a.spriteSize);
    gl.enableVertexAttribArray(pd.locals.a.objectId);
    gl.enableVertexAttribArray(pd.locals.a.isLightSource);

    gl.bindVertexArray(null);

    return {
        atlasTexture: atlasTexture,
        atlasIndex: atlasIndex,
        normalTexture: normalTexture,
        normalIndex: normalIndex,
        vao: vao,
        dataBuffer: dataBuffer,
        transformBuffer: transformBuffer,
        pbo,
        pboNormal
    };
}

async function setupPropDrawer(pd) {
    gl.useProgram(pd.program);

    const atlas = atlases['world_prop'];

    pd.transformData = new Float32Array([]);
    pd.data = new Float32Array([]);

    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    gl.uniform2f(pd.locals.u.textureSize, atlas.canvas.width, atlas.imageHeight);

    // Create and bind textures
    const [atlasTexture, atlasIndex] = createTexture(gl, gl.TEXTURE_2D_ARRAY);
    gl.uniform1i(pd.locals.u.atlas, atlasIndex);
    const pbo = submit2DArrayImage({
        gl: gl,
        width: atlas.canvas.width,
        height: atlas.canvas.height,
        imageHeight: atlas.imageHeight,
        layerCount: atlas.layersCount,
        imgData: atlas.imgData
    });

    const [normalTexture, normalIndex] = createTexture(gl, gl.TEXTURE_2D_ARRAY);
    gl.uniform1i(pd.locals.u.normalAtlas, normalIndex);
    const pboNormal = submit2DArrayImage({
        gl: gl,
        width: atlas.canvas.width,
        height: atlas.canvas.height,
        imageHeight: atlas.imageHeight,
        layerCount: atlas.layersCount,
        imgData: atlas.normalImgData
    });

    // Create and bind data
    const vao = gl.createVertexArray();
    pd.vao = vao;
    gl.bindVertexArray(vao);

    const dataBuffer = null;
    pd.dataBuffer = dataBuffer;

    const transformBuffer = gl.createBuffer();
    pd.transformBuffer = transformBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pd.transformData, gl.STATIC_DRAW);

    vertexAttribPointer([
        { local: pd.locals.a.position, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.texCoord, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.positionOffset, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.frameOffset, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.animationLayer, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.depth, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.flipImage, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.spriteSize, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.objectId, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.isLightSource, size: 1, type: gl.FLOAT, normalized: false },
    ]);

    gl.enableVertexAttribArray(pd.locals.a.position);
    gl.enableVertexAttribArray(pd.locals.a.texCoord);
    gl.enableVertexAttribArray(pd.locals.a.positionOffset);
    gl.enableVertexAttribArray(pd.locals.a.frameOffset);
    gl.enableVertexAttribArray(pd.locals.a.animationLayer);
    gl.enableVertexAttribArray(pd.locals.a.depth);
    gl.enableVertexAttribArray(pd.locals.a.flipImage);
    gl.enableVertexAttribArray(pd.locals.a.spriteSize);
    gl.enableVertexAttribArray(pd.locals.a.objectId);
    gl.enableVertexAttribArray(pd.locals.a.isLightSource);

    gl.bindVertexArray(null);

    return {
        atlasTexture: atlasTexture,
        atlasIndex: atlasIndex,
        normalTexture: normalTexture,
        normalIndex: normalIndex,
        vao: vao,
        dataBuffer: dataBuffer,
        transformBuffer: transformBuffer,
        pbo,
        pboNormal
    };
}

async function setupDynamicPropDrawer(pd) {
    gl.useProgram(pd.program);

    const atlas = atlases['dyn_prop'];

    pd.transformData = new Float32Array([]);
    pd.data = new Float32Array([]);

    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    gl.uniform2f(pd.locals.u.textureSize, atlas.canvas.width, atlas.imageHeight);

    // Create and bind textures
    const [atlasTexture, atlasIndex] = createTexture(gl, gl.TEXTURE_2D_ARRAY);
    gl.uniform1i(pd.locals.u.atlas, atlasIndex);
    const pbo = submit2DArrayImage({
        gl: gl,
        width: atlas.canvas.width,
        height: atlas.canvas.height,
        imageHeight: atlas.imageHeight,
        layerCount: atlas.layersCount,
        imgData: atlas.imgData
    });

    const updatePbo = () => {
        update2DArrayImage({
            gl: gl,
            textureType: gl.TEXTURE_2D_ARRAY,
            texture: atlasTexture,
            textureIndex: atlasIndex,
            width: atlas.canvas.width,
            height: atlas.canvas.height,
            imageHeight: atlas.imageHeight,
            layerCount: atlas.layersCount,
            imgData: atlases['dyn_prop'].imgData
        });
    }

    // Create and bind data
    const vao = gl.createVertexArray();
    pd.vao = vao;
    gl.bindVertexArray(vao);

    const dataBuffer = null;
    pd.dataBuffer = dataBuffer;

    const transformBuffer = gl.createBuffer();
    pd.transformBuffer = transformBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pd.transformData, gl.STATIC_DRAW);

    vertexAttribPointer([
        { local: pd.locals.a.position, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.texCoord, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.positionOffset, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.frameOffset, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.animationLayer, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.depth, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.flipImage, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.spriteSize, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.objectId, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.isLightSource, size: 1, type: gl.FLOAT, normalized: false },
    ]);

    gl.enableVertexAttribArray(pd.locals.a.position);
    gl.enableVertexAttribArray(pd.locals.a.texCoord);
    gl.enableVertexAttribArray(pd.locals.a.positionOffset);
    gl.enableVertexAttribArray(pd.locals.a.frameOffset);
    gl.enableVertexAttribArray(pd.locals.a.animationLayer);
    gl.enableVertexAttribArray(pd.locals.a.depth);
    gl.enableVertexAttribArray(pd.locals.a.flipImage);
    gl.enableVertexAttribArray(pd.locals.a.spriteSize);
    gl.enableVertexAttribArray(pd.locals.a.objectId);
    gl.enableVertexAttribArray(pd.locals.a.isLightSource);

    gl.bindVertexArray(null);

    return {
        atlasTexture: atlasTexture,
        atlasIndex: atlasIndex,
        vao: vao,
        dataBuffer: dataBuffer,
        transformBuffer: transformBuffer,
        pbo,
        updatePbo,
    };
}

async function setupBackgroundDrawer(pd) {
    gl.useProgram(pd.program);

    const atlas = atlases['world_background'];

    const size = { w: atlas.canvas.width, h: atlas.imageHeight };

    gl.uniform2f(pd.locals.u.textureSize, size.w, size.h);

    pd.transformData = new Float32Array([
        0, 0,
        size.w, 0,
        size.w * 2, 0,
    ]);

    pd.data = new Float32Array([
        ...getPosition({ pos: { x: 0, y: canvas.height - (size.h - 5), w: size.w, h: size.h }, tc: { x: 0, y: 0, w: size.w, h: size.h - 3 } }),
    ]);

    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    gl.uniform2f(pd.locals.u.textureSize, atlas.canvas.width, atlas.imageHeight);

    // Create and bind textures
    const [atlasTexture, atlasIndex] = createTexture(gl, gl.TEXTURE_2D_ARRAY);
    gl.uniform1i(pd.locals.u.atlas, atlasIndex);
    const pbo = submit2DArrayImage({
        gl: gl,
        width: atlas.canvas.width,
        height: atlas.canvas.height,
        imageHeight: atlas.imageHeight,
        layerCount: atlas.layersCount,
        imgData: atlas.imgData
    });

    // Create and bind data
    const vao = gl.createVertexArray();
    pd.vao = vao;
    gl.bindVertexArray(vao);

    const dataBuffer = gl.createBuffer();
    pd.dataBuffer = dataBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pd.data, gl.STATIC_DRAW);

    vertexAttribPointer([
        { local: pd.locals.a.position, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.texCoord, size: 2, type: gl.FLOAT, normalized: false },
    ]);
    gl.enableVertexAttribArray(pd.locals.a.position);
    gl.enableVertexAttribArray(pd.locals.a.texCoord);

    const transformBuffer = gl.createBuffer();
    pd.transformBuffer = transformBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pd.transformData, gl.DYNAMIC_DRAW);

    vertexAttribPointer([
        { local: pd.locals.a.positionOffset, size: 2, type: gl.FLOAT, normalized: false },
        //{ local: pd.locals.a.frameOffset, size: 2, type: gl.FLOAT, normalized: false },
        //{ local: pd.locals.a.animationLayer, size: 1, type: gl.FLOAT, normalized: false },
        //{ local: pd.locals.a.depth, size: 1, type: gl.FLOAT, normalized: false },
    ]);

    gl.vertexAttribDivisor(pd.locals.a.positionOffset, 1);
    //gl.vertexAttribDivisor(pd.locals.a.frameOffset, 1);
    //gl.vertexAttribDivisor(pd.locals.a.animationLayer, 1);
    //gl.vertexAttribDivisor(pd.locals.a.depth, 1);

    gl.enableVertexAttribArray(pd.locals.a.positionOffset);
    //gl.enableVertexAttribArray(pd.locals.a.frameOffset);
    //gl.enableVertexAttribArray(pd.locals.a.animationLayer);
    //gl.enableVertexAttribArray(pd.locals.a.depth);

    gl.bindVertexArray(null);

    return {
        atlasTexture: atlasTexture,
        atlasIndex: atlasIndex,
        vao: vao,
        dataBuffer: dataBuffer,
        transformBuffer: transformBuffer,
        pbo,
    };
}

async function setupCenarioDrawer(pd, fbo, fboLight, backgroundFBO) {
    gl.useProgram(pd.program);

    const data = new Float32Array([
        // Pos (xy)         // UV coordinate
        -1, 1, 0, 1,
        -1, -1, 0, 0,
        1, 1, 1, 1,
        1, -1, 1, 0,
    ]);

    gl.uniform1i(pd.locals.u.sampler, fbo.textureIndex);
    gl.uniform1i(pd.locals.u.samplerNormal, fbo.normalIndex);
    gl.uniform1i(pd.locals.u.objectInfo, fbo.objectInfoIndex);
    gl.uniform1i(pd.locals.u.lightMap, fboLight.textureIndex);
    gl.uniform1i(pd.locals.u.background, backgroundFBO.textureIndex);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    vertexAttribPointer([
        { local: pd.locals.a.position, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.texCoord, size: 2, type: gl.FLOAT, normalized: false },
    ]);
    // gl.vertexAttribPointer(pd.locals.a.position, 2, gl.FLOAT, false, 16, 0);
    // gl.vertexAttribPointer(pd.locals.a.texCoord, 2, gl.FLOAT, false, 16, 8);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.bindVertexArray(null);

    return {
        dataBuffer: buffer,
        vao: vao,
        fbo: fbo,
    };
}

async function setupRioDrawer(pd, fbo) {
    gl.useProgram(pd.program);

    gl.uniform1i(pd.locals.u.sampler, fbo.textureIndex);

    const pos = {
        x: 0, w: 1920,
        y: 0, h: 25,
    };

    const image = {
        x: 0, w: 1920,
        y: 40, h: 100,
    }

    pos.x = (pos.x / canvas.width) * 2 - 1;
    pos.w = (pos.w / canvas.width) * 2 - 1;
    pos.y = (pos.y / canvas.height) * 2 - 1;
    pos.h = (pos.h / canvas.height) * 2 - 1;
    image.x = (image.x / canvas.width);
    image.w = (image.w / canvas.width);
    image.y = (image.y / canvas.height);
    image.h = (image.h / canvas.height);

    const data = new Float32Array([
        pos.x, pos.h, image.x, image.y,
        pos.x, pos.y, image.x, image.h,
        pos.w, pos.h, image.w, image.y,
        pos.w, pos.y, image.w, image.h,
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    vertexAttribPointer([
        { local: pd.locals.a.position, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.texCoord, size: 2, type: gl.FLOAT, normalized: false },
    ]);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.bindVertexArray(null);

    return {
        dataBuffer: buffer,
        vao: vao,
    };
}

async function setupRawDrawer(pd, fbo) {
    gl.useProgram(pd.program);

    gl.uniform1i(pd.locals.u.sampler, fbo.textureIndex);

    const pos = {
        x: 0, w: canvas.width,
        y: 0, h: canvas.height,
    };

    const image = {
        x: 0, w: canvas.width,
        y: 0, h: 0,
    }

    pos.x = (pos.x / canvas.width) * 2 - 1;
    pos.w = (pos.w / canvas.width) * 2 - 1;
    pos.y = (pos.y / canvas.height) * 2 - 1;
    pos.h = (pos.h / canvas.height) * 2 - 1;
    image.x = (image.x / canvas.width);
    image.w = (image.w / canvas.width);
    image.y = (image.y / canvas.height);
    image.h = (image.h / canvas.height);

    const data = new Float32Array([
        pos.x, pos.h, image.x, image.y,
        pos.x, pos.y, image.x, image.h,
        pos.w, pos.h, image.w, image.y,
        pos.w, pos.y, image.w, image.h,
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    vertexAttribPointer([
        { local: pd.locals.a.position, size: 2, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.texCoord, size: 2, type: gl.FLOAT, normalized: false },
    ]);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);

    gl.bindVertexArray(null);

    return {
        dataBuffer: buffer,
        vao: vao,
    };
}

async function setupLightDrawer(pd, fbo) {
    gl.useProgram(pd.program);

    gl.uniform1i(pd.locals.u.samplerNormal, fbo.normalIndex);
    gl.uniform1i(pd.locals.u.objectInfo, fbo.objectInfoIndex);

    pd.transformData = new Float32Array([200, canvas.height / 2, 1.0, 1.0, 0.5, 0.0, 1.0, 300.0,]);
    pd.data = new Float32Array([
        -1, -1, 1, -1, -1, 1,
        1, -1, 1, 1, -1, 1
    ]);

    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    //gl.uniform2f(pd.locals.u.textureSize, atlas.canvas.width, atlas.imageHeight);

    // Create and bind textures
    //const [texture, textureIndex] = createTexture(gl, gl.TEXTURE_2D_ARRAY);

    // Create and bind data
    const vao = gl.createVertexArray();
    pd.vao = vao;
    gl.bindVertexArray(vao);

    const dataBuffer = gl.createBuffer();
    pd.dataBuffer = dataBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pd.data, gl.STATIC_DRAW);

    vertexAttribPointer([
        { local: pd.locals.a.position, size: 2, type: gl.FLOAT, normalized: false },
    ]);
    gl.enableVertexAttribArray(pd.locals.a.position);

    const transformBuffer = gl.createBuffer();
    pd.transformBuffer = transformBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pd.transformData, gl.STATIC_DRAW);

    vertexAttribPointer([
        { local: pd.locals.a.lightPosition, size: 3, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.lightColor, size: 3, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.lightIntensity, size: 1, type: gl.FLOAT, normalized: false },
        { local: pd.locals.a.lightRadius, size: 1, type: gl.FLOAT, normalized: false },
    ]);

    gl.enableVertexAttribArray(pd.locals.a.lightPosition);
    gl.enableVertexAttribArray(pd.locals.a.lightColor);
    gl.enableVertexAttribArray(pd.locals.a.lightIntensity);
    gl.enableVertexAttribArray(pd.locals.a.lightRadius);

    gl.vertexAttribDivisor(pd.locals.a.lightPosition, 1);
    gl.vertexAttribDivisor(pd.locals.a.lightColor, 1);
    gl.vertexAttribDivisor(pd.locals.a.lightIntensity, 1);
    gl.vertexAttribDivisor(pd.locals.a.lightRadius, 1);

    gl.bindVertexArray(null);

    return {
        // texture: texture,
        // textureIndex: textureIndex,
        vao: vao,
        dataBuffer: dataBuffer,
        transformBuffer: transformBuffer,
    };
}

function setupPropCenarioFBO() {
    const [texture, textureIndex] = createTexture(gl, gl.TEXTURE_2D);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvas.width, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const [normal, normalIndex] = createTexture(gl, gl.TEXTURE_2D);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvas.width, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const [objectInfo, objectInfoIndex] = createTexture(gl, gl.TEXTURE_2D);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvas.width, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const [objectIdTexture, objectIdTextureIndex] = createTexture(gl, gl.TEXTURE_2D);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R16I, canvas.width, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normal, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, objectInfo, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT3, gl.TEXTURE_2D, objectIdTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("FBO is not complete!");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
        texture,
        textureIndex,
        normal,
        normalIndex,
        objectInfo,
        objectInfoIndex,
        objectIdTexture,
        objectIdTextureIndex,
        renderbuffer,
        fbo,
        bind: () => {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(true);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        },
        clearAndListen: () => {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(true);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.clearBufferfi(gl.DEPTH_STENCIL, 0, 1, 1);
            gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
            gl.clearBufferfv(gl.COLOR, 1, new Float32Array([0, 0, 0, 0]));
            gl.clearBufferfv(gl.COLOR, 2, new Float32Array([0, 0, 0, 0]));
            gl.clearBufferiv(gl.COLOR, 3, new Int16Array([-1, -1, -1, -1]));
        },
        unbind: () => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            //gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(false);
        }
    }
}

function setupBackgroundFBO() {
    const [texture, textureIndex] = createTexture(gl, gl.TEXTURE_2D);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvas.width, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("FBO is not complete!");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
        texture,
        textureIndex,
        renderbuffer,
        fbo,
        clearAndListen: () => {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(true);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        },
        unbind: () => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            //gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(false);
        }
    }
}

function setupCenarioFBO() {
    const [texture, textureIndex] = createTexture(gl, gl.TEXTURE_2D);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvas.width, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("FBO is not complete!");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
        texture,
        textureIndex,
        renderbuffer,
        fbo,
        clearAndListen: () => {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(true);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        },
        unbind: () => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            //gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(false);
        }
    }
}

function setupLightFBO() {
    const [texture, textureIndex] = createTexture(gl, gl.TEXTURE_2D);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, canvas.width, canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // const renderbuffer = gl.createRenderbuffer();
    // gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    // gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    // gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    //gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0/*, gl.COLOR_ATTACHMENT1 */]);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("FBO is not complete!");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
        texture,
        textureIndex,
        //renderbuffer,
        fbo,
        clearAndListen: () => {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(true);
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        },
        unbind: () => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            //gl.disable(gl.DEPTH_TEST);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(false);
        }
    }
}

export default {
    setupCharDrawer,
    setupPropDrawer,
    setupBackgroundDrawer,
    setupCenarioDrawer,
    setupRioDrawer,
    setupRawDrawer,
    setupDynamicPropDrawer,
    setupLightDrawer,
    setupPropCenarioFBO,
    setupCenarioFBO,
    setupLightFBO,
    setupBackgroundFBO,
    getPosition,
};
