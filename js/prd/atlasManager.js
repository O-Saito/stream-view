
const calcDepth = (def, src) => {
    return def.size - 1 - def.srcs[src].i;
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
        loadCharImage('/char/body/skeleton/new_legs.png', [imgs]),
        loadCharImage('/char/body/skeleton/new_body.png', [imgs]),
        loadCharImage('/char/body/skeleton/new_head.png', [imgs]),
        loadCharImage('/char/body/skeleton/legs.png', [imgs]),
        loadCharImage('/char/body/skeleton/body.png', [imgs]),
        loadCharImage('/char/body/skeleton/head.png', [imgs]),
        loadCharImage('/char/props-especial/face/moustache.png', [imgs]),
        loadCharImage('/char/props-especial/cape/cape_front.png', [imgs]),
        loadCharImage('/char/props-especial/cape/cape_back.png', [imgs]),
        loadCharImage('/char/props/helmet/blackpower.png', [imgs, props1]),
        loadCharImage('/char/props/helmet/bruxo.png', [imgs, props1]),
        loadCharImage('/char/props/helmet/coroa.png', [imgs, props1]),
        loadCharImage('/char/props/helmet/mugi.png', [imgs, props1]),
        loadCharImage('/char/props/helmet/sjins.png', [imgs, props1]),
        loadCharImage('/char/props/helmet/ninja.png', [imgs, props1]),
    ]);

    let width = imgs[1].width + 64;
    const countOfLayers = imgs.length;

    const c = new OffscreenCanvas(width, heightOfImage * countOfLayers);
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.translate(0, c.height);
    ctx.scale(1, -1);
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

    console.log('createCharSpriteAtlas', Date.now() - n);

    atlases['char'] = {
        canvas: c,
        ctx: ctx,
        imageHeight: heightOfImage,
        layersCount: countOfLayers,
        imgData: imageData,
        normalCanvas: c,
        normalCtx: ctx,
        normalImgData: imageData
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
    const loadPropsImage = (src) => {
        return new Promise((resolve) => {
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

    const props1 = [];

    await Promise.all([
        loadPropsImage('/world/props/casa.png'),
        loadPropsImage('/world/props/bonfas.png'),
        loadPropsImage('/world/natural/arvore.png'),
        loadPropsImage('/world/natural/chao.png'),
        loadPropsImage('/world/natural/moita.png'),
        loadPropsImage('/world/natural/nuvem.png'),
    ]);

    const reordered = imgs.sort((a, b) => b.height - a.height);
    const numOfLayers = Math.ceil(reordered.map(x => x.height).reduce((a, b) => a + b) / data.maxHeight.size);

    const c = new OffscreenCanvas(data.maxWidth.size, data.maxHeight.size * numOfLayers);
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.translate(0, c.height);
    ctx.scale(1, -1);

    let offset = 0;
    let currentHeight = 0;
    for (let i = 0; i < data.size; i++) {
        const img = imgs[i];
        currentHeight += img.height;

        if (imgs[i + 1] && imgs[i + 1].height > data.maxHeight.size - currentHeight) {
            offset += data.maxHeight.size - currentHeight;
            currentHeight = 0;
            propsDefinition.size ++;
        }

        ctx.drawImage(img, 0, offset);
        propsDefinition.srcs[img.src.replace(location.origin, '')] = {
            i: Math.floor(offset / data.maxHeight.size),
            ow: 0,
            oh: currentHeight == 0 ? 0 : data.maxHeight.size - currentHeight,
            w: img.width,
            h: img.height,
        };
        offset += img.height;
    }
    propsDefinition.size ++;

    const imageData = ctx.getImageData(0, 0, data.maxWidth.size, data.maxHeight.size * numOfLayers).data;

    console.log(data);
    console.log('createPropsSpriteAtlas', Date.now() - n);
    atlases['world_prop'] = {
        canvas: c,
        ctx: ctx,
        imageHeight: data.maxHeight.size,
        layersCount: numOfLayers,
        imgData: imageData,
        normalCanvas: c,
        normalCtx: ctx,
        normalImgData: imageData
    };
    return atlases['world_prop'];
}

export const createAllAtlas = async () => {
    // await createCharSpriteAtlas();
    // await createPropsSpriteAtlas();
    return await Promise.all([
        createCharSpriteAtlas(),
        createPropsSpriteAtlas()
    ]);
};

export default {
    atlases,
    charDefinitions,
    propsDefinition,
    createAllAtlas,
    createCharSpriteAtlas,
    createPropsSpriteAtlas,
};