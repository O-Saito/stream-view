//@ts-check
/** @import {TexOffset, Position, Size} from "../types/general.js" */
/** @import {ElementObject, SpriteData} from "../world.js" */
/** @import {ElementShaderData, PartData} from "../engine.js" */
/** @import {AnimationMainStruct, AnimationPartData, ExceptionsData} from "../types/animation.js" */
import engine from '../engine.js'
import world, { System } from '../world.js'
import { dynamicPropDefinition } from '../atlasManager.js';

/** @type {Object.<string, {maxFrameCount: number}>} */
const spritesData = {
};

/** @type {Object.<string, Object.<string, AnimationMainStruct>>} */
const animations = {
};

/** @type {Object.<string, Function>} */
const animationEmiters = {
    /** @param {ElementObject} prop */
    'freeze': (prop) => {
        if (prop.components.sprite)
            prop.components.sprite.freeze = true;
    }
}

/**
 * @param {ElementObject} prop 
 * @returns {Array<ElementShaderData>}
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
        shader.parts.default.texture = sprite.parts.main.texture;
        return [shader];
    }

    const partAnimation = animation[sprite.animation];

    shader.parts.default.texture = partAnimation.parts.main.main.texture ?? "";
    shader.maxFrames = spritesData[shader.parts.default.texture]?.maxFrameCount ?? 1;

    const currentSet = partAnimation.parts.main.main.sets.slice().sort((a, b) => b.keyframe - a.keyframe).find(x => sprite.currentFrame >= x.keyframe);

    if (currentSet?.texture) {
        shader.parts.default.texture = currentSet.texture;
    }

    if (currentSet?.posOffset) {
        if (currentSet.posOffset.x) shader.parts.default.posOffset.x += currentSet?.posOffset.x;
        if (currentSet.posOffset.y) shader.parts.default.posOffset.y += currentSet?.posOffset.y;
    }
    if (currentSet?.useSpriteFrame) shader.currentFrame = currentSet.useSpriteFrame;

    return [shader];
}

class DyElementAnimatior extends System {
    /** @param {import('../world.js').ElementObject} prop */
    process(prop) {
        if (!prop.type.startsWith('dyprop::')) return;
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
        const elementQuantity = world.getDyElements().map(x => Object.getOwnPropertyNames(x.components.sprite.parts).length).reduce((t, a) => t + a);

        data.forEach(x => {
            if (engine.templateElementData.length * elementQuantity > engine.programData.dyprop.transformData.length)
                if (engine.programData.dyprop.addToTransform)
                    engine.programData.dyprop.addToTransform(x, elementQuantity + 1);

            if (engine.programData.dyprop.updateTransformPart)
                engine.programData.dyprop.updateTransformPart(x, dynamicPropDefinition);
        });

    }
}


export default {
    getAnimationData,
    DyElementAnimatior,
};
