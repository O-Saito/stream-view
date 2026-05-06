//@ts-check
/** @import {TexOffset, Position, Size} from "../types/general.js" */
/** @import {UserObject} from "../world.js" */
/** @import {ElementShaderData, PartData} from "../engine.js" */
/** @import {AnimationMainStruct, AnimationPartData, ExceptionsData} from "../types/animation.js" */
import engine from '../engine.js'
import world, { System } from '../world.js'
import { charDefinitions } from '../atlasManager.js';
/** @type {Object.<string, AnimationMainStruct>} */
import characterAnimations from '../sprites/character-animations.json' with { type: 'json' };

const characterParts = [
    "capeBack",
    "legs",
    "pants",
    "body",
    "chest",
    "head",
    "face",
    "helmet",
    "capeFront",
    "weapon",
    "second_weapon",
];

/**
 * @typedef {Object} SpriteData
 * @property {number} frameCount
 * @property {Object.<string, SpriteData>} [multiParts]
 */

/** @type {Object.<string, SpriteData>} */
let spritesData = {};

/** @type {Object.<string, AnimationMainStruct>} */
const animations = characterAnimations;

/**
 * @param {UserObject} user 
 * @returns {ElementShaderData}
 */
function getAnimationData(user) {

    const sprite = user.components.sprite;

    /** @type {Object.<string, PartData>}*/
    const parts = {};

    const animation = animations[sprite.animation];

    if (animation == null) throw new Error("Animation not found!");

    characterParts.forEach(partName => {
        const charPart = sprite.parts[partName];
        const animationPart = animation.parts[partName];
        if (!charPart || charPart.texture == null || charPart.texture == undefined || charPart.texture == "") {
            parts[partName] = {
                texture: "",
                posOffset: {
                    x: 0,
                    y: 0,
                },
                texOffset: {
                    x: -32,
                    y: 0,
                    ax: 0,
                    ay: 0,
                }
            }
            return;
        }

        let textureName = charPart.texture;
        let spriteOffsetComputed = false;
        let spriteOffset = { x: 0, y: 0 };
        let posOffset = { x: 0, y: 0 };
        let imageFrameCount = 1;
        let rotation = 0;
        let rotationPivot = { x: 0, y: 0 };

        const clearValues = () => {
            spriteOffset = { x: 0, y: 0 };
            posOffset = { x: 0, y: 0 };
            imageFrameCount = 1;
            spriteOffsetComputed = false;
            rotation = 0;
            rotationPivot = { x: 0, y: 0 };
        }

        // compute part data

        /** @param {AnimationPartData} currentPart */
        const compute = (currentPart) => {
            let subpartName = currentPart.texture ?? "/default.png";
            const currentSet = currentPart.sets.slice().sort((a, b) => b.keyframe - a.keyframe).find(x => sprite.currentFrame >= x.keyframe);
            if (currentSet?.texture) {
                subpartName = currentSet.texture;
            }

            if (currentPart.exceptions && currentPart.exceptions.length > 0) {
                /** @type {ExceptionsData | null} */
                let mostExcep = null;
                let excpKeysCount = 0;
                currentPart.exceptions.forEach(excp => {
                    let accept = 0;
                    const keys = Object.getOwnPropertyNames(excp.keys);
                    keys.forEach(key => {
                        if (sprite.parts[key] && excp.keys[key].find(x => x == sprite.parts[key].texture)) {
                            accept++;
                        }
                    });

                    if (keys.length == accept && excpKeysCount < accept) {
                        mostExcep = excp;
                        excpKeysCount = accept;
                    }
                });

                if (mostExcep != null) {
                    //@ts-ignore
                    if (mostExcep.replaceParent) {
                        clearValues();
                        //@ts-ignore
                        compute(mostExcep.part);
                        return;
                    }
                    //@ts-ignore
                    compute(mostExcep.part);
                }
            }

            if (currentSet?.posOffset) {
                if (currentSet.posOffset.x) posOffset.x += currentSet.posOffset.x;
                if (currentSet.posOffset.y) posOffset.y += currentSet.posOffset.y;
            }

            if (currentPart.posOffset) {
                if (currentPart.posOffset.x) posOffset.x += currentPart.posOffset.x;
                if (currentPart.posOffset.y) posOffset.y += currentPart.posOffset.y;
            }

            if (currentSet?.rotation) {
                rotation += currentSet.rotation;
            }

            if (currentPart.rotationPivot) {
                //console.log(currentPart.rotationPivot);
                if (currentPart.rotationPivot.x) rotationPivot.x = currentPart.rotationPivot.x;
                if (currentPart.rotationPivot.y) rotationPivot.y = currentPart.rotationPivot.y;
            }

            if (charPart.texture && spritesData[charPart.texture]) {
                if (spritesData[charPart.texture]?.multiParts) {
                    const multiParts = spritesData[charPart.texture]?.multiParts;
                    if (multiParts && multiParts[subpartName]) {
                        textureName = charPart.texture + subpartName;
                        imageFrameCount = multiParts[subpartName].frameCount;
                    }
                } else {
                    imageFrameCount = spritesData[textureName].frameCount;
                }
            } else if (spritesData[charPart.texture + subpartName]) {
                textureName = charPart.texture + subpartName;
                imageFrameCount = spritesData[textureName].frameCount;
            }

            if (currentSet && currentSet.useSpriteFrame == undefined) {
                currentSet.useSpriteFrame = 0;
            }
            if (currentSet?.useSpriteFrame != undefined && currentSet.useSpriteFrame <= imageFrameCount && !spriteOffsetComputed) {
                spriteOffset.x = currentSet.useSpriteFrame * 32;
                spriteOffsetComputed = true;
            }

        }

        compute(animationPart.default);

        if (partName == "helmet" || partName == "face") {
            posOffset.x += parts.head.posOffset.x;
            posOffset.y += parts.head.posOffset.y;
        }

        parts[partName] = {
            texture: textureName,
            rotation: rotation,
            rotationPivot: rotationPivot,
            posOffset: {
                x: posOffset.x,
                y: posOffset.y,
            },
            texOffset: {
                x: spriteOffset.x,
                y: spriteOffset.y,
                ax: 0,
                ay: 0,
            }
        }
    });

    return {
        index: sprite.index,
        depth: sprite.depth,
        position: { ...user.components.position },
        size: { ...user.components.size },
        isFlipedX: sprite.lookingDirection == 1,
        currentFrame: 0,
        parts: parts,
    };
}

class CharacterAnimatior extends System {
    constructor() { super(); }

    /** @param {UserObject} user */
    process(user) {
        if (user.type != 'char') return;
        const sprite = user.components.sprite;

        sprite.animation = 'idle';
        if (user.components.lastPosition && user.components.position.x != user.components.lastPosition?.x) {
            sprite.animation = 'walk';
        }

        if (sprite.animation == 'walk' && user.components.lastPosition) {
            sprite.lookingDirection = user.components.lastPosition.x > user.components.position.x ? 1 : -1;
        }

        const animation = animations[sprite.animation];
        if (animation == null) throw new Error("Animation not found!");

        /*if (sprite.lastAnimation != sprite.animation) {
            console.log('not equal');
            //reset data
            sprite.currentFrame = 0;
            sprite.freeze = false;
            sprite.lastAnimation = sprite.animation;
        }*/

        sprite.currentFrame++;
        if (sprite.currentFrame >= animation.duration) {
            sprite.currentFrame = 0;
        }

        const data = getAnimationData(user);

        if(engine.programData.char.updateTransformPart) 
            engine.programData.char.updateTransformPart(data, {});
    }
}

function loadSpritesData() {
    /**
     * @typedef {Object} tmp
     * @property {Object.<string, *>} body
     * @property {Object.<string, *>} prop
     * @property {Object.<string, *>} propEspecial
     */

    /**@type {tmp} */
    const spritesCategories = {
        body: {},
        prop: {},
        propEspecial: {}
    };

    Object.getOwnPropertyNames(charDefinitions.srcs).forEach(src => {
        const data = charDefinitions.srcs[src];

        let parts = src.split("/").filter(x => x != "");

        if (parts[1] == "body") {
            if (!spritesCategories.body[parts[2]]) spritesCategories.body[parts[2]] = { parts: {} };
            if (!spritesCategories.body[parts[2]].parts[parts[3]]) spritesCategories.body[parts[2]].parts[parts[3]] = [];

            spritesCategories.body[parts[2]].parts[parts[3]].push({ partName: `/${parts.slice(4).join('/')}`, frameCount: data.imageWidth / 32 });
        }

        if (parts[1] == "props") {
            if (!spritesCategories.prop[parts[2]]) spritesCategories.prop[parts[2]] = { parts: {} };
            if (!spritesCategories.prop[parts[2]].parts[parts[3]]) spritesCategories.prop[parts[2]].parts[parts[3]] = [];

            spritesCategories.prop[parts[2]].parts[parts[3]].push({ partName: `/${parts.slice(4).join('/')}`, frameCount: data.imageWidth / 32 });
        }

        if (parts[1] == "props-especial") {
            if (!spritesCategories.propEspecial[parts[2]]) spritesCategories.propEspecial[parts[2]] = { parts: {} };
            if (!spritesCategories.propEspecial[parts[2]].parts[parts[3]]) spritesCategories.propEspecial[parts[2]].parts[parts[3]] = [];

            spritesCategories.propEspecial[parts[2]].parts[parts[3]].push({ partName: `/${parts.slice(4).join('/')}`, frameCount: data.imageWidth / 32 });
        }

    });

    Object.getOwnPropertyNames(spritesData).forEach(x => {
        delete spritesData[x];
    });

    Object.getOwnPropertyNames(spritesCategories.body).forEach(type => {
        Object.getOwnPropertyNames(spritesCategories.body[type].parts).forEach(part => {
            let path = `/char/body/${type}/${part}`;
            const d = spritesCategories.body[type].parts[part];
            if (d.length > 1) {
                spritesData[path] = { frameCount: 0, multiParts: {} }
                d.forEach((/** @type {{ partName: string | number; frameCount: any; }} */ x) => {
                    if (!spritesData[path].multiParts) return;
                    spritesData[path].multiParts[x.partName] = { frameCount: x.frameCount };
                });
                return;
            }

            spritesData[`${path}${d[0].partName == "/" ? "" : d[0].partName}`] = {
                frameCount: d[0].frameCount,
            }
        });
    });

    Object.getOwnPropertyNames(spritesCategories.prop).forEach(type => {
        Object.getOwnPropertyNames(spritesCategories.prop[type].parts).forEach(part => {
            let path = `/char/props/${type}/${part}`;
            const d = spritesCategories.prop[type].parts[part];
            if (d.length > 1) {
                spritesData[path] = { frameCount: 0, multiParts: {} }
                d.forEach((/** @type {{ partName: string | number; frameCount: any; }} */ x) => {
                    if (!spritesData[path].multiParts) return;
                    spritesData[path].multiParts[x.partName] = { frameCount: x.frameCount };
                });
                return;
            }

            spritesData[`${path}${d[0].partName == "/" ? "" : d[0].partName}`] = {
                frameCount: d[0].frameCount,
            }
        });
    });

    Object.getOwnPropertyNames(spritesCategories.propEspecial).forEach(type => {
        Object.getOwnPropertyNames(spritesCategories.propEspecial[type].parts).forEach(part => {
            let path = `/char/props-especial/${type}/${part}`;
            const d = spritesCategories.propEspecial[type].parts[part];
            if (d.length > 1) {
                spritesData[path] = { frameCount: 0, multiParts: {} }
                d.forEach((/** @type {{ partName: string | number; frameCount: any; }} */ x) => {
                    if (!spritesData[path].multiParts) return;
                    spritesData[path].multiParts[x.partName] = { frameCount: x.frameCount };
                });
                return;
            }

            spritesData[`${path}${d[0].partName == "/" ? "" : d[0].partName}`] = {
                frameCount: d[0].frameCount,
            }
        });
    });

    //console.log('done');
}

export default {
    spritesData,
    animations,
    getSpritesData: () => { return { ...spritesData } },
    getCharacterParts: () => [...characterParts],
    getAnimationData,
    loadSpritesData,
    CharacterAnimatior,
};
