//@ts-check
/** @import {TexOffset, Position, Size} from "./types/general.js" */
import engine from './engine.js';
import drawer from './drawers.js';
import { createAllAtlas } from './atlasManager.js';

let localGlobalId = 2;
/**
 * @type {Object.<string, *>} 
 */
const drawers = {};

/**
 * @typedef {Object} PartData
 * @property {number} currentFrame
 * @property {string|null} texture
 * 
 * @typedef {Object} SpriteData
 * @property {number} index
 * @property {number} depth
 * @property {number} currentFrame
 * @property {string} animation
 * @property {Object.<string, PartData>} parts
 * 
 * @typedef {Object} UserData
 * 
 * @typedef {Object} UserObject
 * @property {number} localGlobalId
 * @property {Object} components
 * @property {UserData} components.userData
 * @property {Position} components.position
 * @property {Size} components.size
 * @property {SpriteData} components.sprite
 * 
 * @typedef {Object} Game
 * @property {Object.<number, UserObject>} users
 * 
 */

/** @type {Game} */
const game = {
    users: {
        1: {
            localGlobalId: 1,
            components: {
                userData: {
                    // live specific data
                },
                position: { x: 100, y: 100 },
                size: { width: 32, height: 32 },
                sprite: {
                    index: 0,
                    depth: 1,
                    currentFrame: 0,
                    animation: 'idle',
                    parts: {
                        body: {
                            texture: '/char/body/skeleton/body',
                            currentFrame: 0,
                        },
                        head: {
                            texture: '/char/body/skeleton/head',
                            currentFrame: 0,
                        },
                        legs: {
                            texture: '/char/body/skeleton/legs',
                            currentFrame: 0,
                        },
                        helmet: {
                            texture: '/char/props/helmet/coroa.png',
                            currentFrame: 0,
                        },
                        pants: {
                            texture: '/char/props/pants/leather',
                            currentFrame: 0,
                        },
                    }
                }
            },
        },
    },
};

export default {
    game,
    /**
     * @param {*} gl 
     * @returns 
     */
    setup: async (gl) => {
        const programData = engine.programData;
        const canvas = engine.canvas;

        await createAllAtlas();

        const propCenarioFBO = drawer.setupPropCenarioFBO();
        const cenarioFBO = drawer.setupCenarioFBO();
        const lightFBO = drawer.setupLightFBO();
        const backgroundFBO = drawer.setupBackgroundFBO();

        gl.useProgram(programData['char'].program);
        gl.uniform2f(programData['char'].locals.u.resolution, canvas.width, canvas.height);
        const charDrawer = await drawer.setupCharDrawer(programData['char']);

        drawers['fbo'] = {};
        drawers['fbo'].propCenarioFBO = propCenarioFBO;

        return {
            propCenarioFBO,
            backgroundFBO,
            cenarioFBO,
            lightFBO,
            charDrawer,
        }
    }
};
