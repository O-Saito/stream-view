//@ts-check
/** @import {TexOffset, Position, Size} from "./types/general.js" */
/** @import {UserObject} from "./game.js" */
/** @import {CharShaderData, PartData} from "./engine.js" */
import engine from './engine.js'
import { charDefinitions } from './atlasManager.js';

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
 * @typedef {Object} AnimationPartSet
 * @property {number} keyframe
 * @property {number} [useSpriteFrame]
 * @property {Position} [posOffset]
 * 
 * @typedef {Object} AnimationPartData
 * @property {string} [texture]
 * @property {Array<AnimationPartSet>} sets
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
const animations = {
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
};

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
        if (!charPart) return;

        const currentSet = animationPart.default.sets.slice().sort((a, b) => b.keyframe - a.keyframe).find(x => sprite.currentFrame >= x.keyframe);
        let subpartName = animationPart.default.texture ?? "/default.png";

        let textureName = charPart.texture;
        let offsetX = 0;
        let posOffset = { x: currentSet?.posOffset?.x ?? 0, y: currentSet?.posOffset?.y ?? 0 };
        if (textureName != null) {

            let imageFrameCount = 1;

            if (spritesData[textureName]) {
                if (spritesData[textureName]?.multiParts) {
                    const multiParts = spritesData[textureName]?.multiParts;
                    if (multiParts && multiParts[subpartName]) {
                        textureName += subpartName;
                        imageFrameCount = multiParts[subpartName].frameCount;
                    }
                } else {
                    imageFrameCount = spritesData[textureName].frameCount;
                }
            } else if (spritesData[textureName + subpartName]) {
                textureName = textureName + subpartName;
                imageFrameCount = spritesData[textureName + subpartName].frameCount;
            } else {
                textureName = "";
            }

            if (currentSet?.useSpriteFrame && currentSet.useSpriteFrame <= imageFrameCount) {
                offsetX = currentSet.useSpriteFrame * 32;
            }

            if (partName == "helmet") {
                posOffset.x += parts.head.posOffset.x;
                posOffset.y += parts.head.posOffset.y;
            }
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
                x: offsetX,
                y: 0,
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
