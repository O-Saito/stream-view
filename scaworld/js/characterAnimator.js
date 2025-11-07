//@ts-check
/** @import {TexOffset, Position, Size} from "./types/general.js" */
/** @import {UserObject} from "./game.js" */
/** @import {CharShaderData, PartData} from "./engine.js" */
import engine from './engine.js'
import { charDefinitions } from './atlasManager.js';
/** @type {Object.<string, AnimationMainStruct>} */
import characterAnimations from './sprites/character-animations.json' with { type: 'json' };

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

/** 
 * @typedef {Object} PosOffset
 * @property {number} [x]
 * @property {number} [y] 
 * 
 * @typedef {Object} ExceptionsData
 * @property {boolean} replaceParent
 * @property {AnimationPartData} part
 * 
 * @typedef {Object} AnimationPartSet
 * @property {number} keyframe
 * @property {string} [texture]
 * @property {number} [useSpriteFrame]
 * @property {PosOffset} [posOffset]
 * 
 * @typedef {Object} AnimationPartData
 * @property {string} [texture]
 * @property {PosOffset} [posOffset]
 * @property {Array<AnimationPartSet>} sets
 * @property {Array<ExceptionsData>} [exceptions]
 * 
 * @typedef {Object.<string, AnimationPartData>} AnimationParts
 * 
 * 
 * @typedef {Object} AnimationMainStruct
 * @property {number} duration
 * @property {Object.<string, AnimationParts>} parts
 * 
 */

/**
 * @type {Object.<string, AnimationMainStruct>}
 */
const animations = characterAnimations;/*{
    idle: {
        duration: 60,
        parts: {
            helmet: {
                default: {
                    sets: [
                        { keyframe: 0, posOffset: { x: 0, y: 10 } },
                    ]
                }
            },
            face: {
                default: {
                    sets: [
                        { keyframe: 0, posOffset: { x: 0, y: 0 } },
                    ]
                }
            },
            head: {
                default: {
                    texture: "/default.png",
                    sets: [
                        { keyframe: 0, posOffset: { x: 0, y: 0 } },
                    ]
                }
            },
            body: {
                default: {
                    texture: "/default.png",
                    sets: [
                        { keyframe: 0, posOffset: { x: 0, y: 0 } },
                        { keyframe: 10, posOffset: { x: 0, y: 0 }, useSpriteFrame: 2 },
                    ]
                }
            },
            pants: {
                default: {
                    texture: "/default.png",
                    sets: [
                    ]
                }
            },
            legs: {
                default: {
                    texture: "/default.png",
                    sets: [
                        { keyframe: 0, posOffset: { x: 0, y: 0 } },
                    ]
                }
            },
        }
    },
};*/

/**
 * 
 * @param {UserObject} user 
 * @returns {CharShaderData}
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
                currentFrame: 0,
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
        let spriteOffset = { x: 0, y: 0 };
        let posOffset = { x: 0, y: 0 };
        let imageFrameCount = 1;

        // compute part data

        /** @param {AnimationPartData} currentPart */
        const compute = (currentPart) => {
            let subpartName = currentPart.texture ?? "/default.png";
            const currentSet = currentPart.sets.slice().sort((a, b) => b.keyframe - a.keyframe).find(x => sprite.currentFrame >= x.keyframe);
            if (currentSet?.texture) {
                subpartName = currentSet.texture;
            }
            if (currentSet?.posOffset) {
                if (currentSet.posOffset.x) posOffset.x += currentSet.posOffset.x;
                if (currentSet.posOffset.y) posOffset.y += currentSet.posOffset.y;
            }
            
            if (currentPart.posOffset) {
                if (currentPart.posOffset.x) posOffset.x += currentPart.posOffset.x;
                if (currentPart.posOffset.y) posOffset.y += currentPart.posOffset.y;
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

            if(partName == "capeBack") console.log('here');
            if (currentSet?.useSpriteFrame && currentSet.useSpriteFrame <= imageFrameCount) {
                spriteOffset.x = currentSet.useSpriteFrame * 32;
            }

        }

        compute(animationPart.default);


        if (partName == "helmet" || partName == "face") {
            posOffset.x += parts.head.posOffset.x;
            posOffset.y += parts.head.posOffset.y;
        }

        if (partName == 'body' && sprite.currentFrame >= 10) console.log('here');

        parts[partName] = {
            texture: textureName,
            currentFrame: 0,
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
        isFlipedX: false,
        currentFrame: 0,
        parts: parts,
    };
}

/**
 * @param {UserObject} user 
 */
function processUserAnimation(user) {
    const sprite = user.components.sprite;
    const animation = animations[sprite.animation];
    if (animation == null) throw new Error("Animation not found!");

    sprite.currentFrame++;

    if (sprite.currentFrame >= animation.duration) {
        sprite.currentFrame = 0;
    }

    const data = getAnimationData(user);

    engine.programData.char.updateTransformPart(data, charDefinitions);
}

function loadSpritesData() {

    //const type = 'body'; // prop | body | prop-especial
    //const src = `/char/${type}/`;

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

        console.log(parts);

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
                // multipart
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
                // multipart
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
                // multipart
                return;
            }

            spritesData[`${path}${d[0].partName == "/" ? "" : d[0].partName}`] = {
                frameCount: d[0].frameCount,
            }
        });
    });

    console.log('done');
}

export default {
    spritesData,
    animations,
    getCharacterParts: () => [...characterParts],
    getAnimationData,
    processUserAnimation,
    loadSpritesData,
};
