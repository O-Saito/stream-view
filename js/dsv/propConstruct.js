import { propsDefinition } from './atlasManager.js';
import { atlases } from './atlasManager.js';
import Prop from './elements/prop.js';
import DyProp from './elements/dyProp.js';
import Fogueira from './elements/fogueira.js';
import Portal from './elements/portal.js';
import Nuvem from './elements/nuvem.js';
import Emote from './elements/emote.js';
import Wagon from './elements/wagon.js';

const classes = {
    'Portal': Portal,
    'Fogueira': Fogueira,
    'Nuvem': Nuvem,
    'Prop': Prop,
    'DyProp': DyProp,
    'Emote': Emote,
    'Wagon': Wagon,
}

function createProp(type, data) {
    if (!classes[type]) type = "Prop";
    if (!data.texture) data.texture = classes[type].defaultTexture;
    data.texture = `/stream-view${data.texture}`;
    const prop = propsDefinition.srcs[data.texture];
    if (prop && !data.size) data.size = { width: prop.w, height: prop.h };
    return new (classes[type])(data);
}

async function createDynamic(type, data, drawer) {
    const load = async (src) => {
        return new Promise((resolve) => {
            const image = new Image();
            image.setAttribute('crossOrigin', '');
            image.onload = function () {
                atlases['dyn_prop'].draw(image);
                drawer.updatePbo();
                resolve(image);
            }
            image.src = src;
        });
    };

    const img = await load(data.texture);
    if (!data.size) data.size = { width: img.width, height: img.height };
    if(data.childrens) {
        await Promise.all(data.childrens.map(x => load(x)));
    }
    return createProp(type, data);
}

export default {
    loadByList: (propList) => {
        for (let i = 0; i < propList.length; i++) {
            const prop = propList[i];
            createProp(prop.type, {
                texture: prop.texture,
                position: { x: prop.pos.x, y: prop.pos.y },
                reverse: { x: false, y: false },
                depth: prop.depth,
                shoudntEnable: false
            });
        }
    },
    createProp: createProp,
    createDynamic,
    classes,
}