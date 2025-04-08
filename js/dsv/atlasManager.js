
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
    const loadCharImage = (src, arrs) => {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = function () {
                if (arrs.length > 1) {
                    const i = arrs[0].indexOf(arrs[1]);
                    charDefinitions.srcs[src] = { i: i == -1 ? arrs[0].length : i, o: arrs[1].length };

                    arrs[1].push(image);
                    if (arrs[1].length == 1) {
                        arrs[0].push(arrs[1]);
                        charDefinitions.size++;
                    }

                    resolve(image);
                    return;
                }

                charDefinitions.srcs[src] = { i: arrs[0].length, o: undefined };
                arrs[0].push(image);
                charDefinitions.size++;

                resolve(image);
            }
            image.src = src;
        });
    };


    const props1 = [];

    await Promise.all([
        loadCharImage('/stream-view/char/body/skeleton/new_legs.png', [imgs]),
        loadCharImage('/stream-view/char/body/skeleton/new_body.png', [imgs]),
        loadCharImage('/stream-view/char/body/skeleton/new_head.png', [imgs]),
        loadCharImage('/stream-view/char/body/skeleton/legs.png', [imgs]),
        loadCharImage('/stream-view/char/body/skeleton/body.png', [imgs]),
        loadCharImage('/stream-view/char/body/skeleton/head.png', [imgs]),
        loadCharImage('/stream-view/char/props-especial/face/moustache.png', [imgs]),
        loadCharImage('/stream-view/char/props-especial/cape/cape_front.png', [imgs]),
        loadCharImage('/stream-view/char/props-especial/cape/cape_back.png', [imgs]),
        loadCharImage('/stream-view/char/props/helmet/blackpower.png', [imgs, props1]),
        loadCharImage('/stream-view/char/props/helmet/bruxo.png', [imgs, props1]),
        loadCharImage('/stream-view/char/props/helmet/coroa.png', [imgs, props1]),
        loadCharImage('/stream-view/char/props/helmet/mugi.png', [imgs, props1]),
        loadCharImage('/stream-view/char/props/helmet/sjins.png', [imgs, props1]),
        loadCharImage('/stream-view/char/props/helmet/ninja.png', [imgs, props1]),
    ]);

    let width = imgs[1].width + 64;
    const countOfLayers = imgs.length;

    const [c, ctx] = createOffscreenCanvas(width, heightOfImage * countOfLayers);
    const [cNormal, ctxNormal] = createOffscreenCanvas(width, heightOfImage * countOfLayers);

    for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        if (Array.isArray(img)) {
            for (let x = 0; x < img.length; x++) {
                const image = img[x];
                ctx.drawImage(image, x * heightOfImage, i * heightOfImage);
            }
            continue;
        }
        ctx.drawImage(img, 0, i * heightOfImage);
    }

    const imageData = ctx.getImageData(0, 0, width, heightOfImage * countOfLayers).data;
    const imageDataNormal = ctxNormal.getImageData(0, 0, width, heightOfImage * countOfLayers).data;

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

                imageNormal.src = srcNormal;
            }

            image.src = src;
        });
    };

    await Promise.all([
        loadPropsImage('/stream-view/world/props/casa.png'),
        loadPropsImage('/stream-view/world/props/bonfas.png'),
        loadPropsImage('/stream-view/world/natural/arvore.png'),
        loadPropsImage('/stream-view/world/natural/chao.png'),
        loadPropsImage('/stream-view/world/natural/chao2.png'),
        loadPropsImage('/stream-view/world/natural/grama.png'),
        loadPropsImage('/stream-view/world/natural/moita.png'),
        //loadPropsImage('/world/natural/moita2.png'),
        loadPropsImage('/stream-view/world/natural/nuvem.png'),
        loadPropsImage('/stream-view/world/props/carroca.png', '/stream-view/world/props/carroca-normal.png'),
        //loadPropsImage('/stream-view/teste2.png', '/teste2-normalmap.png'),
        loadPropsImage('/stream-view/Atlas_new_parado.png'),
        loadPropsImage('/stream-view/Atlas_new_Braco_aberto.png'),
        loadPropsImage('/stream-view/portal/portal-atlas.png'),
        loadPropsImage('/stream-view/portal/portal-abrindo-sheet.png'),
        loadPropsImage('/stream-view/quadrado-normal.png', '/stream-view/quadrado-normal.png'),
        //loadPropsImage('/stream-view/teste.png', '/stream-view/teste-normalmap.png'),
        //loadPropsImage('/cone-normal.png', '/cone-normal.png'),
        //loadPropsImage('/circulo-normal.png', '/circulo-normal.png'),
        //loadPropsImage('/dunnot-normal.png', '/dunnot-normal.png'),
    ]);

    const reordered = imgs.sort((a, b) => b.height - a.height);
    const numOfLayers = Math.ceil(reordered.map(x => x.height).reduce((a, b) => a + b) / data.maxHeight.size) ;

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
        const src = img.src.replace(location.origin, '');
        if (data.srcs[src]) continue;

        if (currentHeight + img.height > data.maxHeight.size) {
            const heightEnabled = data.maxHeight.size - currentHeight;
            //console.log(`heightEnabled`, heightEnabled);

            let nImg = null;
            for (let y = 0; y < reordered.length; y++) {
                const r = reordered[y];
                const nSrc = r.src.replace(location.origin, '');
                if (data.srcs[nSrc] || r.height > heightEnabled) continue;
                nImg = r;
                break;
            }
            // const nImg = reordered.find(x => x.height <= heightEnabled);
            if (nImg) {
                drawSpriteAt(nImg, { src: nImg.src.replace(location.origin, ''), index: propsDefinition.size, offset: { w: 0, h: currentHeight } });
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

            image.src = src;
        });
    };

    await Promise.all([
        loadPropsImage('/stream-view/world/ceu/estrelas.png'),
        loadPropsImage('/stream-view/world/ceu/dia.png'),
        loadPropsImage('/stream-view/world/ceu/tarde.png'),
        loadPropsImage('/stream-view/world/ceu/noite2.png'),
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

    const getImageData = () => {
        return ctx.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * data.numOfLayers).data;
    }

    const draw = (image) => {
        const src=  image.src.replace(location.origin, '');
        if (dynamicPropDefinition.srcs[src]) return;
        ctx.drawImage(image, data.lastOffset.width, data.lastOffset.height);
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

        atlases['dyn_prop'].imgData = getImageData();
    }

    const [cNormal, ctxNormal] = createOffscreenCanvas(data.maxWidth.size, data.maxHeight.size * data.numOfLayers);

    const imageDataNormal = ctxNormal.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * data.numOfLayers).data;

    atlases['dyn_prop'] = {
        canvas: c,
        ctx: ctx,
        imageHeight: data.maxHeight.size,
        layersCount: data.numOfLayers,
        imgData: getImageData(),
        normalCanvas: cNormal,
        normalCtx: ctxNormal,
        normalImgData: imageDataNormal,
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