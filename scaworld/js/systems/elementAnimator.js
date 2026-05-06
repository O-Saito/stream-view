//@ts-check
/** @import {TexOffset, Position, Size} from "../types/general.js" */
/** @import {ElementObject, SpriteData} from "../world.js" */
/** @import {ElementShaderData, PartData} from "../engine.js" */
/** @import {AnimationMainStruct, AnimationPartData, ExceptionsData} from "../types/animation.js" */
import engine from '../engine.js'
import world, { System } from '../world.js'
import { propsDefinition } from '../atlasManager.js';
import { emitters as portalEmitters } from '../elements/portal.js';

/** @type {Object.<string, {maxFrameCount: number}>} */
const spritesData = {
    "/portal/portal-abrindo-sheet.png": {
        maxFrameCount: 5,
    },
    "/portal/portal-atlas.png": {
        maxFrameCount: 7,
    },
    "/world/props/bonfas.png": {
        maxFrameCount: 5,
    }
};

/** @type {Object.<string, Object.<string, AnimationMainStruct>>} */
const animations = {
    fogueira: {
        default: {
            duration: 50,
            parts: {
                main: {
                    default: {
                        texture: "/world/props/bonfas.png",
                        sets: [
                            { keyframe: 0, useSpriteFrame: 0 },
                            { keyframe: 10, useSpriteFrame: 1 },
                            { keyframe: 20, useSpriteFrame: 2 },
                            { keyframe: 30, useSpriteFrame: 3 },
                            { keyframe: 40, useSpriteFrame: 4 },
                        ]
                    },
                }
            }
        }
    },
    portal: {
        default: {
            duration: 0,
            parts: {
                main: {
                    default: {
                        texture: "",
                        sets: [
                        ],
                    }
                }
            }
        },
        open: {
            duration: 60,
            emitOnEnd: ["portal::opened"],
            parts: {
                main: {
                    default: {
                        texture: "/portal/portal-abrindo-sheet.png",
                        sets: [
                            { keyframe: 0, useSpriteFrame: 0 },
                            { keyframe: 20, useSpriteFrame: 1 },
                            { keyframe: 30, useSpriteFrame: 2 },
                            { keyframe: 40, useSpriteFrame: 3 },
                            { keyframe: 50, useSpriteFrame: 4 },
                        ],
                    }
                }
            }
        },
        keep: {
            duration: 70,
            emitOnEnd: ["portal::keep"],
            parts: {
                main: {
                    default: {
                        texture: "/portal/portal-atlas.png",
                        sets: [
                            { keyframe: 0, useSpriteFrame: 0 },
                            { keyframe: 10, useSpriteFrame: 1 },
                            { keyframe: 20, useSpriteFrame: 2 },
                            { keyframe: 30, useSpriteFrame: 3 },
                            { keyframe: 40, useSpriteFrame: 4 },
                            { keyframe: 50, useSpriteFrame: 5 },
                            { keyframe: 60, useSpriteFrame: 6 },
                        ],
                    }
                }
            }
        },
        close: {
            duration: 60,
            emitOnEnd: ['freeze', 'portal::closed'],
            parts: {
                main: {
                    default: {
                        texture: "/portal/portal-abrindo-sheet.png",
                        sets: [
                            { keyframe: 0, useSpriteFrame: 4 },
                            { keyframe: 20, useSpriteFrame: 3 },
                            { keyframe: 30, useSpriteFrame: 2 },
                            { keyframe: 40, useSpriteFrame: 1 },
                            { keyframe: 50, useSpriteFrame: 0 },
                        ],
                    }
                }
            }
        },
    }
};

/** @type {Object.<string, Function>} */
const animationEmiters = {
    ...portalEmitters,
    /** @param {ElementObject} prop */
    'freeze': (prop) => {
        if (prop.components.sprite)
            prop.components.sprite.freeze = true;
    }
}

/**
 * @param {ElementObject} prop 
 * @returns {ElementShaderData}
 */
function getAnimationData(prop) {
    const sprite = prop.components.sprite;

    /** @type {ElementShaderData} */
    const shader = {
        index: sprite.index,
        depth: sprite.depth,
        currentFrame: 0,
        maxFrames: 1,
        isLightSource: false,
        isFlipedX: sprite.lookingDirection == -1 ? true : false,
        position: { x: prop.components.position.x, y: prop.components.position.y },
        size: { width: prop.components.size.width, height: prop.components.size.height },
        parts: {
            default: {
                texture: '',
                texOffset: { x: 0, y: 0, ax: 0, ay: 0 },
                posOffset: { x: 0, y: 0 }
            }
        }
    }

    if (prop.components.light) {
        shader.isLightSource = true;
    }

    const animation = animations[prop.type];
    if (!animation || !sprite || !animation[sprite.animation]) {
        shader.parts.default.texture = sprite.parts.default.texture;
        return shader;
    }

    const partAnimation = animation[sprite.animation];

    shader.parts.default.texture = partAnimation.parts.main.default.texture ?? "";
    shader.maxFrames = spritesData[shader.parts.default.texture]?.maxFrameCount ?? 1;

    const currentSet = partAnimation.parts.main.default.sets.slice().sort((a, b) => b.keyframe - a.keyframe).find(x => sprite.currentFrame >= x.keyframe);

    if (currentSet?.texture) {
        shader.parts.default.texture = currentSet.texture;
    }

    if (currentSet?.posOffset) {
        if (currentSet.posOffset.x) shader.parts.default.posOffset.x += currentSet?.posOffset.x;
        if (currentSet.posOffset.y) shader.parts.default.posOffset.y += currentSet?.posOffset.y;
    }
    if (currentSet?.useSpriteFrame) shader.currentFrame = currentSet.useSpriteFrame;

    return shader;
}

class ElementAnimatior extends System {
    constructor() { super(); }

    /** @param {import('../world.js').ElementObject} prop */
    process(prop) {
        if (prop.type == 'char' || prop.type.startsWith("dyprop::")) return;
        if (!prop.components.sprite) return;

        const animation = animations[prop.type];
        const sprite = prop.components.sprite;
        if (animation && sprite) {

            if (!sprite.lastAnimation) sprite.lastAnimation = sprite.animation;
            if (sprite.lastAnimation != sprite.animation) {
                //reset data
                sprite.currentFrame = 0;
                sprite.freeze = false;
                sprite.lastAnimation = sprite.animation;

                if (animation[sprite.animation].emitOnStart) {
                    animation[sprite.animation].emitOnStart?.forEach(emition => {
                        if (animationEmiters[emition]) animationEmiters[emition](prop);
                    });
                }
            }

            if (!sprite.currentFrame) sprite.currentFrame = 0;
            if (!sprite.freeze) sprite.currentFrame++;
            if (sprite.currentFrame > animation[sprite.animation].duration) {
                if (animation[sprite.animation].emitOnEnd) {
                    animation[sprite.animation].emitOnEnd?.forEach(emition => {
                        if (animationEmiters[emition]) animationEmiters[emition](prop);
                    });
                }
                if (!sprite.freeze) sprite.currentFrame = 0;
            }
        }

        const data = getAnimationData(prop);

        const elementQuantity = world.getElements().length;
        if (engine.templateElementData.length * elementQuantity > engine.programData.prop.transformData.length)
            if (engine.programData.prop.addToTransform)
                engine.programData.prop.addToTransform(data, elementQuantity + 1);

        if (engine.programData.prop.updateTransformPart)
            engine.programData.prop.updateTransformPart(data, propsDefinition);
    }
}


function loadSpritesData() {

    //console.log('done');
}

export default {
    getAnimationData,
    loadSpritesData,
    ElementAnimatior,
};
