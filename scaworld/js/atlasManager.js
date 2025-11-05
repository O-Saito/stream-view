//@ts-check
/**
 * @typedef {Array<string | [string, string]>} SpriteSrcs
*/
/**@type {SpriteSrcs} */
import charSprites from './sprites/charSprites.json' with { type: "json" };

/** @type {SpriteSrcs} prosSprites */
import propsSprites from './sprites/propsSprites.json' with { type: "json" };

/**
 * @typedef {Object} SpriteDefinitionSrcs 
 * @property {number} i - Index of layer
 * @property {number} o - Offset Y
 * @property {number} ow - Offset X
 * @property {number} w - Width
 * @property {number} h - Height
 * @property {number} imageWidth - Real image width
 * 
 * @typedef {Object} SpriteDefinition
 * @property {Object.<string, SpriteDefinitionSrcs>} srcs 
 * @property {number} size 
 * @property {Function} calcDepth 
 */

/**
 * @param {SpriteDefinition} def 
 * @param {string} src 
 * @returns {number} 
 */
const calcDepth = (def, src) => {
    return def.size - 1 - def.srcs[src]?.i;
}

/** @type {Object.<string, *>} */
export const atlases = {};

/**
 * @type {SpriteDefinition}
 */
export const charDefinitions = {
    srcs: {},
    size: 0,
    /**
     * @param {string} src 
     * @returns {number}
     */
    calcDepth: (src) => { return calcDepth(charDefinitions, src); }
};

export const propsDefinition = {
    srcs: {},
    size: 0,
    /**
     * @param {string} src 
     * @returns {number}
     */
    calcDepth: (src) => { return calcDepth(propsDefinition, src); }
}

export const dynamicPropDefinition = {
    srcs: {},
    size: 0,
    /**
     * @param {string} src 
     * @returns {number}
     */
    calcDepth: (src) => { return calcDepth(dynamicPropDefinition, src); }
}

/**
 * @param {string | HTMLImageElement} src 
 * @returns 
 */
function fixOrigin(src) {
    if (typeof src == 'string') return `/scaworld/sprites${src}`;
    return src.src.replace(`${location.origin}/scaworld/sprites`, '');
}

/**
 * @param {string} src 
 * @returns {Promise<HTMLImageElement>} 
 */
function returnWhenLoadedImage(src) {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = function () { resolve(image); }
        image.src = fixOrigin(src);
    });
}

/**
 * @typedef {Array<null | [HTMLImageElement, HTMLImageElement | null]>} TempImageArray
 * 
 * @param {string | [string, string] | string[]} data 
 * @param {TempImageArray} arr 
 * @returns 
 */
function loadImage(data, arr) {
    const { src, srcNormal } = Array.isArray(data) ? { src: data[0], srcNormal: data[1] } : { src: data, srcNormal: undefined };
    return new Promise((resolve) => {
        returnWhenLoadedImage(src).then(img => {
            if (srcNormal) {
                returnWhenLoadedImage(srcNormal).then(imgNormal => {
                    arr.push([img, imgNormal]);
                    resolve([img, imgNormal]);
                });
                return;
            }
            arr.push([img, null]);
            resolve(img);
        });
    });
}

/**
 * @param {number} width 
 * @param {number} height 
 * @param {*} options 
 * @returns {[OffscreenCanvas, OffscreenCanvasRenderingContext2D] | null}
 */
function createOffscreenCanvas(width, height, options = undefined) {
    if (!options) options = {};
    if (options.alpha == null || options.alpha == undefined) options.alpha = true;
    if (options.reverse == undefined) options.reverse = true;
    const c = new OffscreenCanvas(width, height);
    const ctx = c.getContext("2d", options);
    if (ctx == null) return null;
    if (options.notUseDefaultConfig) return [c, ctx];
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, c.width, c.height);
    if (options.reverse) {
        ctx.translate(0, c.height);
        ctx.scale(1, -1);
    }
    return [c, ctx];
}

export const createCharSpriteAtlas = async () => {
    const heightOfImage = 32;

    const n = Date.now();
    /** @type {TempImageArray} */
    const imgs = [];
    const promises = [];

    for (let i = 0; i < charSprites.length; i++) {
        const sprite = charSprites[i];
        promises.push(loadImage(sprite, imgs));
    }

    await Promise.all(promises);

    const maxWidth = Math.max(...imgs.map(x => Array.isArray(x) ? x[0].width : x.width));

    const [tmpC, tmpCtx] = createOffscreenCanvas(maxWidth, heightOfImage * imgs.length);
    const [tmpCNormal, tmpCtxNormal] = createOffscreenCanvas(maxWidth, heightOfImage * imgs.length);

    const draw = (img, index, x, normal = null) => {
        charDefinitions.srcs[fixOrigin(img)] = { i: index, o: 0, w: x, imageWidth: img.width };
        tmpCtx.drawImage(img, x, index * heightOfImage);
        if (normal) tmpCtxNormal.drawImage(normal, x, index * heightOfImage);
    };

    imgs.sort((a, b) => b.width - a.width);

    let fixI = -1;
    for (let i = 0; i < imgs.length; i++) {
        const { img, normal } = Array.isArray(imgs[i]) ? { img: imgs[i][0], normal: imgs[i][1] } : { img: imgs[i], normal: null };
        if (img == null) continue;
        fixI++;
        let currentWidth = img.width;
        draw(img, fixI, 0, normal);
        imgs[i] = null;
        while (currentWidth <= tmpC.width) {
            const freeWidth = tmpC.width - currentWidth;
            if (freeWidth == 0) break;
            const n = imgs.find(x => x != null && x.width <= freeWidth);
            if (n == undefined || n == null) break;
            const { newImg, newNormal } = Array.isArray(n) ? { newImg: n[0], newNormal: n[1] } : { newImg: n, newNormal: null };
            draw(newImg, fixI, currentWidth, normal);
            currentWidth += newImg.width;
            imgs[imgs.indexOf(newImg)] = null;
        }
    }
    fixI++;

    const countOfLayers = fixI;
    charDefinitions.size = fixI;
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
    const imgs = [];

    const promises = [];
    for (let i = 0; i < propsSprites.length; i++) {
        const sprite = propsSprites[i];
        promises.push(loadImage(sprite, imgs));
    }
    await Promise.all(promises);

    imgs.sort((a, b) => {
        const currentA = Array.isArray(a) ? a[0] : a;
        const currentB = Array.isArray(b) ? b[0] : b;
        if (currentA.width > data.maxWidth.size) {
            data.maxWidth.src = fixOrigin(currentA);
            data.maxWidth.size = currentA.width;
        }
        if (currentA.height > data.maxHeight.size) {
            data.maxHeight.src = fixOrigin(currentA);
            data.maxHeight.size = currentA.height;
        }
        if (currentB.width > data.maxWidth.size) {
            data.maxWidth.src = fixOrigin(currentB);
            data.maxWidth.size = currentB.width;
        }
        if (currentB.height > data.maxHeight.size) {
            data.maxHeight.src = fixOrigin(currentB);
            data.maxHeight.size = currentB.height;
        }
        if (currentB.width == currentA.width) return currentB.height - currentA.height;
        return currentB.width - currentA.width;
    });

    const [tmpC, tmpCtx] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * imgs.length);
    const [tmpCNormal, tmpCtxNormal] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * imgs.length);

    const draw = ({ img, index, xOffset, yOffset, normal = null, maxWidth = null, maxHeight = null, innerIndex = 0 }) => {
        propsDefinition.srcs[fixOrigin(img)] = {
            i: index,
            ow: xOffset,
            oh: data.maxHeight.size - (img.height + yOffset),
            w: img.width,
            h: img.height,
        };
        data.srcs[fixOrigin(img)] = fixOrigin(img);
        tmpCtx.drawImage(img, xOffset, yOffset + (index * data.maxHeight.size));
        if (normal) tmpCtxNormal.drawImage(normal, xOffset, yOffset + (index * data.maxHeight.size));
        imgs[normal ? imgs.indexOf(imgs.find(x => Array.isArray(x) && x[0] == img)) : imgs.indexOf(img)] = null;

        const freeWidth = maxWidth == null ? data.maxWidth.size - (xOffset + img.width) : maxWidth;
        const freeHeight = maxHeight == null ? data.maxHeight.size - currentHeight : maxHeight;
        console.log(innerIndex, index, img.src, { freeWidth, freeHeight }, { width: img.width, height: img.height });

        if (img.src == 'http://localhost:1601/teste.png') {
            drawCanvasForDebug(tmpC); console.log('here');
        }
        if (freeWidth > 0) {
            let n = imgs.find(x => { const a = x && Array.isArray(x) ? x[0] : x; return a != null && a.width <= freeWidth && a.height <= freeHeight; });
            if (n == undefined || n == null) return;
            const { newImg, newNormal } = Array.isArray(n) ? { newImg: n[0], newNormal: n[1] } : { newImg: n, newNormal: null };
            draw({ img: newImg, index, xOffset: xOffset + img.width, yOffset, normal: newNormal, maxWidth: maxWidth - newImg.width, innerIndex: innerIndex + 1 });
            currentHeight += newImg.height;
            if (!drawForHeight(newImg, xOffset + img.width)) currentHeight -= newImg.height;
        }
    };

    const drawForHeight = (img, cutWidth) => {
        let freeHeight = data.maxHeight.size - currentHeight;
        let offset = currentHeight;
        let hasDrawn = false;
        while (freeHeight > 0) {
            const n = imgs.find(x => { const a = x && Array.isArray(x) ? x[0] : x; return a != null && a.height <= freeHeight && a.width <= img.width; });
            if (n == undefined || n == null) break;
            const { newImg, newNormal } = Array.isArray(n) ? { newImg: n[0], newNormal: n[1] } : { newImg: n, newNormal: null };
            draw({ img: newImg, index: fixI, xOffset: cutWidth - img.width, yOffset: offset, normal: newNormal, maxWidth: img.width - newImg.width, innerIndex: 99 });
            currentHeight += newImg.height;
            offset += newImg.height;
            freeHeight -= newImg.height;
            hasDrawn = true;
        }
        return hasDrawn;
    }

    let currentHeight = 0;
    let currentWidth = 0;
    let fixI = -1;
    for (let i = 0; i < imgs.length; i++) {
        if (imgs[i] == null) continue;
        const { img, normal } = Array.isArray(imgs[i]) ? { img: imgs[i][0], normal: imgs[i][1] } : { img: imgs[i], normal: null };
        if (img == null) continue;
        fixI++;
        currentHeight = img.height;
        currentWidth = img.width;
        imgs[normal ? imgs.indexOf(imgs.find(x => Array.isArray(x) && x[0] == img)) : imgs.indexOf(img)] = null;
        drawForHeight(img, currentWidth);
        currentHeight = img.height;
        draw({ img, index: fixI, xOffset: 0, yOffset: 0, normal, maxWidth: data.maxWidth.size - img.width, maxHeight: data.maxHeight.size });
    }
    fixI++;

    const countOfLayers = fixI;
    propsDefinition.size = countOfLayers;
    const [c, ctx] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * countOfLayers, { reverse: false });
    const [cNormal, ctxNormal] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * countOfLayers, { reverse: false });

    ctx.drawImage(tmpC, 0, tmpC.height - c.height, tmpC.width, tmpC.height, 0, 0, c.width, tmpC.height);
    ctxNormal.drawImage(tmpCNormal, 0, tmpC.height - c.height, tmpC.width, tmpC.height, 0, 0, c.width, tmpC.height);

    const imageData = ctx.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * countOfLayers).data;
    const imageDataNormal = ctxNormal.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * countOfLayers).data;

    console.log('createPropsSpriteAtlas', Date.now() - n);
    atlases['world_prop'] = {
        canvas: c,
        tmpCanvas: tmpC,
        ctx: ctx,
        imageHeight: data.maxHeight.size,
        layersCount: countOfLayers,
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

            image.src = src;
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
        const img = imgs.find(x => x.src.replace(location.origin, '') == order[i]);
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
        const src = image.src.replace(location.origin, '');
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
        //createPropsSpriteAtlas(),
        //createBackgroundAtlas(),
        //createDynamictPropSpriteAtlas(),
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