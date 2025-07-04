import charSprites from './cenario/charSprites.json' with { type: "json" };

const calcDepth = (def, src) => {
    return def.size - 1 - def.srcs[src]?.i ?? 0;
}

export const atlases = {};

export const charDefinitions = {
    srcs: {},
    size: 0,
    calcDepth: (src) => { return calcDepth(charDefinitions, src); }
};

export const propsDefinition = {
    srcs: {},
    size: 0,
    calcDepth: (src) => { return calcDepth(propsDefinition, src); }
}

export const dynamicPropDefinition = {
    srcs: {},
    size: 0,
    calcDepth: (src) => { return calcDepth(dynamicPropDefinition, src); }
}

function fixOrigin(src) {
  if (typeof src == 'string') return `${src}/stream-view`;
  return src.src.replace(`${location.origin}/stream-view`, '');
}

function createOffscreenCanvas(width, height, options) {
    if (!options) options = {};
    if (options.alpha == null || options.alpha == undefined) options.alpha = true;
    const c = new OffscreenCanvas(width, height);
    const ctx = c.getContext("2d", options);
    if (options.notUseDefaultConfig) return [c, ctx];
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.translate(0, c.height);
    ctx.scale(1, -1);
    return [c, ctx];
}

export const createCharSpriteAtlas = async () => {
    const heightOfImage = 32;

    const n = Date.now();
    const imgs = [];
    const loadCharImage = (src) => {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = function () {
                imgs.push(image);
                resolve(image);
            }
            image.src = fixOrigin(src);
        });
    };
    const promises = [];

    for (let i = 0; i < charSprites.length; i++) {
        const sprite = charSprites[i];
        promises.push(loadCharImage(sprite));
    }

    await Promise.all(promises);

    const maxWidth = Math.max(...imgs.map(x => x.width));

    const [tmpC, tmpCtx] = createOffscreenCanvas(maxWidth, heightOfImage * imgs.length);
    const [tmpCNormal, tmpCtxNormal] = createOffscreenCanvas(maxWidth, heightOfImage * imgs.length);

    const draw = (img, index, x, normal = null) => {
        charDefinitions.srcs[fixOrigin(img)] = { i: index, o: 0, w: x };
        tmpCtx.drawImage(img, x, index * heightOfImage);
        if (normal) tmpCtxNormal.drawImage(normal, x, index * heightOfImage);
    };

    imgs.sort((a, b) => b.width - a.width);

    let fixI = 0;
    for (let i = 0; i < imgs.length; i++) {
        const { img, normal } = Array.isArray(imgs[i]) ? { img: imgs[i][0], normal: imgs[i][1] } : { img: imgs[i], normal: null };
        if (img == null) continue;
        fixI++;
        let currentWidth = img.width;
        draw(img, fixI, 0, normal);
        imgs[fixI] = null;
        while (currentWidth <= tmpC.width) {
            const freeWidth = tmpC.width - currentWidth;
            if (freeWidth == 0) break;
            const newImg = imgs.find(x => x != null && x.width <= freeWidth);
            if (newImg == undefined || newImg == null) break;
            draw(newImg, fixI, currentWidth, normal);
            currentWidth += newImg.width;
            imgs[imgs.indexOf(newImg)] = null;
            break;
        }
    }
    fixI++;

    const countOfLayers = fixI;
    const [c, ctx] = createOffscreenCanvas(maxWidth, heightOfImage * countOfLayers, { reverse: false });
    const [cNormal, ctxNormal] = createOffscreenCanvas(maxWidth, heightOfImage * countOfLayers);

    ctx.drawImage(tmpC, 0, tmpC.height - c.height, tmpC.width, tmpC.height, 0, 0, c.width, tmpC.height);
    ctxNormal.drawImage(tmpCNormal, 0, tmpC.height - c.height, tmpC.width, tmpC.height, 0, 0, c.width, tmpC.height);

    const imageData = ctx.getImageData(0, 0, maxWidth, heightOfImage * countOfLayers).data;
    const imageDataNormal = ctxNormal.getImageData(0, 0, maxWidth, heightOfImage * countOfLayers).data;

    console.log('createCharSpriteAtlas', Date.now() - n);

    atlases['char'] = {
        canvas: c,
        ctx: ctx,
        imageHeight: heightOfImage,
        layersCount: countOfLayers,
        imgData: imageData,
        normalCanvas: cNormal,
        normalCtx: ctxNormal,
        normalImgData: imageDataNormal
    };
    return atlases['char'];
}

export const createPropsSpriteAtlas = async () => {
    const n = Date.now();

    const data = {
        maxHeight: { src: '', size: 0 },
        maxWidth: { src: '', size: 0 },
        srcs: {},
        size: 0,
    };
    const imgsNormal = {};
    const imgs = [];
    const loadPropsImage = (src, srcNormal) => {
        return new Promise((resolve) => {
            let ok = false;
            const image = new Image();
            image.onload = function () {
                if (image.width > data.maxWidth.size) {
                    data.maxWidth.src = src;
                    data.maxWidth.size = image.width;
                }
                if (image.height > data.maxHeight.size) {
                    data.maxHeight.src = src;
                    data.maxHeight.size = image.height;
                }
                data.size++;
                imgs.push(image);
                if (srcNormal && !ok) {
                    ok = true;
                    return;
                }
                resolve(image);
            }

            if (srcNormal) {
                const imageNormal = new Image();
                imageNormal.onload = function () {
                    imgsNormal[src] = imageNormal;
                    if (!ok) {
                        ok = true;
                        return;
                    }
                    resolve(image);
                }

                imageNormal.src = `/stream-view${srcNormal}`;
            }

            image.src = `/stream-view${src}`;
        });
    };

    await Promise.all([
        loadPropsImage('/world/props/casa.png'),
        loadPropsImage('/world/props/bonfas.png'),
        loadPropsImage('/world/natural/arvore.png'),
        loadPropsImage('/world/natural/chao.png'),
        loadPropsImage('/world/natural/chao2.png'),
        loadPropsImage('/world/natural/grama.png'),
        loadPropsImage('/world/natural/moita.png'),
        loadPropsImage('/world/natural/moita2.png'),
        loadPropsImage('/world/natural/nuvem.png'),
        loadPropsImage('/world/props/carroca.png', '/world/props/carroca-normal.png'),
        //loadPropsImage('/teste2.png', '/teste2-normalmap.png'),
        //loadPropsImage('/Atlas_new_parado.png'),
        //loadPropsImage('/Atlas_new_Braco_aberto.png'),
        loadPropsImage('/portal/portal-atlas.png'),
        loadPropsImage('/portal/portal-abrindo-sheet.png'),
        //loadPropsImage('/quadrado-normal.png', '/quadrado-normal.png'),
        //loadPropsImage('/teste.png', '/teste-normalmap.png'),
        //loadPropsImage('/Rodas_carroca.png'),
        //loadPropsImage('/Rodas_carroca.png'),
        loadPropsImage('/world/atk/flecha.png'),
        loadPropsImage('/world/effect/exhaust.png'),
        //loadPropsImage('/cone-normal.png', '/cone-normal.png'),
        //loadPropsImage('/circulo-normal.png', '/circulo-normal.png'),
        //loadPropsImage('/dunnot-normal.png', '/dunnot-normal.png'),
    ]);

    const reordered = imgs.sort((a, b) => b.height - a.height);
    const numOfLayers = Math.ceil(reordered.map(x => x.height).reduce((a, b) => a + b) / data.maxHeight.size) + 1;

    const [c, ctx] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * numOfLayers);
    const [cNormal, ctxNormal] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * numOfLayers);

    const drawSpriteAt = (img, { src, index, offset }) => {

        if (!offset.w) offset.w = 0;
        if (!offset.h) offset.h = 0;

        if (imgsNormal[src]) {
            ctxNormal.drawImage(imgsNormal[src], 0, (index * data.maxHeight.size) + offset.h);
        }

        ctx.drawImage(img, 0, (index * data.maxHeight.size) + offset.h);
        data.srcs[src] = src;
        propsDefinition.srcs[src] = {
            i: index,
            ow: offset.w,
            oh: data.maxHeight.size - (img.height + offset.h),
            w: img.width,
            h: img.height,
        };
    }

    //let offset = 0;
    let currentHeight = 0;
    let currentWidth = 0;
    for (let i = 0; i < data.size; i++) {
        const img = imgs[i];
        const src = img.src.replace(`${location.origin}/stream-view`, '');
        if (data.srcs[src]) continue;

        if (currentHeight + img.height > data.maxHeight.size) {
            const heightEnabled = data.maxHeight.size - currentHeight;
            //console.log(`heightEnabled`, heightEnabled);

            let nImg = null;
            for (let y = 0; y < reordered.length; y++) {
                const r = reordered[y];
                const nSrc = r.src.replace(`${location.origin}/stream-view`, '');
                if (data.srcs[nSrc] || r.height > heightEnabled) continue;
                nImg = r;
                break;
            }
            // const nImg = reordered.find(x => x.height <= heightEnabled);
            if (nImg) {
                drawSpriteAt(nImg, { src: nImg.src.replace(`${location.origin}/stream-view`, ''), index: propsDefinition.size, offset: { w: 0, h: currentHeight } });
            }

            currentHeight = 0;
            currentWidth = 0;
            propsDefinition.size++;
        }
        drawSpriteAt(img, { src: src, index: propsDefinition.size, offset: { w: currentWidth, h: currentHeight } });
        currentHeight += img.height;
        //currentWidth += img.width;
    }
    propsDefinition.size = numOfLayers;

    const imageData = ctx.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * numOfLayers).data;
    const imageDataNormal = ctxNormal.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * numOfLayers).data;

    console.log(data);
    console.log('createPropsSpriteAtlas', Date.now() - n);
    atlases['world_prop'] = {
        canvas: c,
        ctx: ctx,
        imageHeight: data.maxHeight.size,
        layersCount: numOfLayers,
        imgData: imageData,
        normalCanvas: cNormal,
        normalCtx: ctxNormal,
        normalImgData: imageDataNormal
    };
    return atlases['world_prop'];
}

export const createBackgroundAtlas = async () => {
    const n = Date.now();

    const data = {
        maxHeight: { src: '', size: 0 },
        maxWidth: { src: '', size: 0 },
        srcs: {},
        size: 0,
    };

    const imgsNormal = {};
    const imgs = [];

    const order = [

    ];
    const loadPropsImage = (src) => {
        order.push(src);
        return new Promise((resolve) => {
            let ok = false;
            const image = new Image();
            image.onload = function () {
                if (image.width > data.maxWidth.size) {
                    data.maxWidth.src = src;
                    data.maxWidth.size = image.width;
                }
                if (image.height > data.maxHeight.size) {
                    data.maxHeight.src = src;
                    data.maxHeight.size = image.height;
                }

                data.size++;
                imgs.push(image);
                resolve(image);
            }

            image.src = `/stream-view${src}`;
        });
    };

    await Promise.all([
        loadPropsImage('/world/ceu/estrelas.png'),
        loadPropsImage('/world/ceu/dia.png'),
        loadPropsImage('/world/ceu/tarde.png'),
        loadPropsImage('/world/ceu/noite2.png'),
    ]);

    const numOfLayers = data.size;

    const [c, ctx] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * numOfLayers);
    const [cNormal, ctxNormal] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * numOfLayers);

    //let offset = 0;
    let currentHeight = 0;
    for (let i = 0; i < data.size; i++) {
        const img = imgs.find(x => x.src.replace(`${location.origin}/stream-view`, '') == order[i]);
        ctx.drawImage(img, 0, currentHeight);
        currentHeight += data.maxHeight.size;
    }

    const imageData = ctx.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * numOfLayers).data;
    const imageDataNormal = ctxNormal.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * numOfLayers).data;

    console.log(data);
    console.log('createBackgroundAtlas', Date.now() - n);
    atlases['world_background'] = {
        canvas: c,
        ctx: ctx,
        imageHeight: data.maxHeight.size,
        layersCount: numOfLayers,
        imgData: imageData,
        normalCanvas: cNormal,
        normalCtx: ctxNormal,
        normalImgData: imageDataNormal
    };
    return atlases['world_background'];
}

export const createDynamictPropSpriteAtlas = async () => {
    const data = {
        maxHeight: { size: 512 },
        maxWidth: { size: 512 },
        lastOffset: { height: 0, width: 0 },
        numOfLayers: 1,
    }

    dynamicPropDefinition.size = 2;

    const [c, ctx] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * data.numOfLayers, { willReadFrequently: true });
    const [cNormal, ctxNormal] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * data.numOfLayers, { willReadFrequently: true });

    const getImageData = (canvasCtx) => {
        return canvasCtx.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * data.numOfLayers).data;
    }

    const draw = (image, normal) => {
        const src = image.src.replace(`${location.origin}/stream-view`, '');
        if (dynamicPropDefinition.srcs[src]) return;
        ctx.drawImage(image, data.lastOffset.width, data.lastOffset.height);
        if (normal) ctxNormal.drawImage(normal, data.lastOffset.width, data.lastOffset.height);
        dynamicPropDefinition.srcs[src] = {
            i: 1,
            ow: data.lastOffset.width,
            oh: data.maxHeight.size - (image.height + data.lastOffset.height),
            w: image.width,
            h: image.height,
        };

        data.lastOffset.width += image.width;
        if (data.lastOffset.width >= data.maxWidth.size) {
            data.lastOffset.width = 0;
            data.lastOffset.height += image.height;
        }

        atlases['dyn_prop'].imgData = getImageData(ctx);
        atlases['dyn_prop'].normalImgData = getImageData(ctxNormal);
    }

    atlases['dyn_prop'] = {
        imageHeight: data.maxHeight.size,
        layersCount: data.numOfLayers,
        canvas: c,
        ctx: ctx,
        imgData: getImageData(ctx),
        normalCanvas: cNormal,
        normalCtx: ctxNormal,
        normalImgData: getImageData(ctxNormal),
        draw,
    };
    return atlases['dyn_prop'];
}

export const createAllAtlas = async () => {
    return await Promise.all([
        createCharSpriteAtlas(),
        createPropsSpriteAtlas(),
        createBackgroundAtlas(),
        createDynamictPropSpriteAtlas(),
    ]);
};

export default {
    atlases,
    charDefinitions,
    propsDefinition,
    dynamicPropDefinition,
    createAllAtlas,
    createCharSpriteAtlas,
    createPropsSpriteAtlas,
};