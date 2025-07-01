import { gl, createTexture, submit2DArrayImage, vertexAttribPointer } from './engine.js';
import { atlases } from './atlasManager.js';

function getPosition({ pos, tc },) {
    pos.xw = pos.x + pos.w;
    pos.yh = pos.y + pos.h;

    tc.xw = tc.x + tc.w;
    tc.yh = tc.y + tc.h;

    return [
        pos.x, pos.y,   tc.x, tc.y,   //   tc.xw, tc.y, 
        pos.xw, pos.y,  tc.xw, tc.y,   //   tc.x, tc.y,  
        pos.x, pos.yh,  tc.x, tc.yh,   //   tc.xw, tc.yh,
        pos.xw, pos.y,  tc.xw, tc.y,   //   tc.x, tc.y,  
        pos.xw, pos.yh, tc.xw, tc.yh,   //   tc.x, tc.yh, 
        pos.x, pos.yh,  tc.x, tc.yh,   //   tc.xw, tc.yh,
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
    ]);

    gl.vertexAttribDivisor(pd.locals.a.positionOffset, 1);
    gl.vertexAttribDivisor(pd.locals.a.frameOffset, 1);
    gl.vertexAttribDivisor(pd.locals.a.animationLayer, 1);
    gl.vertexAttribDivisor(pd.locals.a.depth, 1);

    gl.enableVertexAttribArray(pd.locals.a.positionOffset);
    gl.enableVertexAttribArray(pd.locals.a.frameOffset);
    gl.enableVertexAttribArray(pd.locals.a.animationLayer);
    gl.enableVertexAttribArray(pd.locals.a.depth);

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

    pd.transformData = new Float32Array([
        //600, 0, 0, 0, 2, 1,
    ]);

    pd.data = new Float32Array([
        // ...getPosition({
        //     pos: { x: 0, y: 0, w: 264, h: 142 },
        //     tc: { x: 0, y: 0, w: 264, h: 142 },
        //     //ts: { w: atlas.canvas.width, h: atlas.canvas.height }
        // }),
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
    ]);

    gl.enableVertexAttribArray(pd.locals.a.position);
    gl.enableVertexAttribArray(pd.locals.a.texCoord);
    gl.enableVertexAttribArray(pd.locals.a.positionOffset);
    gl.enableVertexAttribArray(pd.locals.a.frameOffset);
    gl.enableVertexAttribArray(pd.locals.a.animationLayer);
    gl.enableVertexAttribArray(pd.locals.a.depth);

    // const dataBuffer = gl.createBuffer();
    // pd.dataBuffer = dataBuffer;
    // gl.bindBuffer(gl.ARRAY_BUFFER, dataBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, pd.data, gl.STATIC_DRAW);

    // vertexAttribPointer([
    //     { local: pd.locals.a.position, size: 2, type: gl.FLOAT, normalized: false },
    //     { local: pd.locals.a.texCoord, size: 2, type: gl.FLOAT, normalized: false },
    // ]);
    // gl.enableVertexAttribArray(pd.locals.a.position);
    // gl.enableVertexAttribArray(pd.locals.a.texCoord);

    // const transformBuffer = gl.createBuffer();
    // pd.transformBuffer = transformBuffer;
    // gl.bindBuffer(gl.ARRAY_BUFFER, transformBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, pd.transformData, gl.STATIC_DRAW);

    // vertexAttribPointer([
    //     { local: pd.locals.a.positionOffset, size: 2, type: gl.FLOAT, normalized: false },
    //     { local: pd.locals.a.frameOffset, size: 2, type: gl.FLOAT, normalized: false },
    //     { local: pd.locals.a.animationLayer, size: 1, type: gl.FLOAT, normalized: false },
    //     { local: pd.locals.a.depth, size: 1, type: gl.FLOAT, normalized: false },
    // ]);

    // gl.vertexAttribDivisor(pd.locals.a.positionOffset, 1);
    // gl.vertexAttribDivisor(pd.locals.a.frameOffset, 1);
    // gl.vertexAttribDivisor(pd.locals.a.animationLayer, 1);
    // gl.vertexAttribDivisor(pd.locals.a.depth, 1);

    // gl.enableVertexAttribArray(pd.locals.a.positionOffset);
    // gl.enableVertexAttribArray(pd.locals.a.frameOffset);
    // gl.enableVertexAttribArray(pd.locals.a.animationLayer);
    // gl.enableVertexAttribArray(pd.locals.a.depth);

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

export default {
    setupCharDrawer,
    setupPropDrawer,
    getPosition
};
