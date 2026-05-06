//@ts-check
/** @import {Position, Size} from "./types/general.js" */
import engine from './engine.js';
import drawer from './drawers.js';
import { createAllAtlas } from './atlasManager.js';

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
 * @property {1|-1} lookingDirection
 * @property {boolean} [freeze]
 * @property {string} [lastAnimation]
 * @property {Object.<string, PartData>} parts
 * 
 * @typedef {Object.<string, string>} UserDataPreset
 * 
 * @typedef {Object} UserData
 * @property {string} userId
 * @property {string} userName
 * @property {string} name
 * @property {boolean} isMod
 * @property {boolean} isGuest
 * @property {boolean} isCitizen
 * @property {UserDataPreset} preset
 * 
 * @typedef {Object} GameObject
 * @property {number} localGlobalId
 * @property {string} type
 * @property {Object.<string, Object>} components
 * 
 * @typedef {GameObject & {
 *   components: GameObject["components"] & {
 *     userData: UserData,
 *     position: Position,
 *     size: Size,
 *     sprite: SpriteData
 *     moveOptions: import('./systems/mover.js').MoveOptions
 *     lastPosition?: Position
 *   }
 * }} UserObject
 * 
 * @typedef {GameObject & {
 *  components: GameObject['components'] & {
 *      position: Position,
 *      size: Size,
 *      sprite: SpriteData
 *  }
 * }} ElementObject
 * 
 */

export class System {
    constructor() {

    }

    /** @param {GameObject} go */
    process(go) { };

    getEmissions() {
        return {};
    }
}

class World {
    // for sync
    /** @type {number} */
    localGlobalId = 1;
    /** @type {{hour: number, running: boolean}} */
    time = { hour: 19, running: true };
    /** @type {Array<UserObject>} */
    users = [];
    /** @type {Array<ElementObject>} */
    elements = [];
    /** @type {Array<ElementObject>} */
    dyelements = [];

    // per source
    /** @type {Array<System>} */
    systems = [];
    lastLightCount = 0;

    constructor() { };

    /** @param {World} w  */
    load(w) {
        this.localGlobalId = w.localGlobalId;
        this.time = w.time;
        this.users = w.users;
        this.elements = w.elements;
        this.dyelements = w.dyelements;
    }

    getDrawers() { return drawers; };

    getUniqueId() { return this.localGlobalId++; }

    getUsers() { return this.users; }
    getElements() { return this.elements; }
    getDyElements() { return this.dyelements; }
    getLightCount() { return this.lastLightCount; }

    getFloorY() { return 22; }

    /** @param {number} id @return {GameObject | undefined} */
    getById(id) { return this.users.find(x => x.localGlobalId == id) ?? this.elements.find(x => x.localGlobalId == id) ?? this.dyelements.find(x => x.localGlobalId == id); }

    /** @param {UserObject} data */
    addUser(data) {
        if (data.localGlobalId == 0) {
            data.localGlobalId = this.getUniqueId();
        }
        this.users.push(data)
        return data;
    }

    /** @param {ElementObject} element */
    addElement(element) {
        if (element.localGlobalId == 0) {
            element.localGlobalId = this.getUniqueId();
        }
        this.elements.push(element)
        return element;
    }

    /** @param {ElementObject} element */
    addDyElement(element) {
        if (element.localGlobalId == 0) {
            element.localGlobalId = this.getUniqueId();
        }
        this.dyelements.push(element)
        return element;
    }

    /** @param {number} id  */
    removeById(id) {

    }

    process() {

        let lightIndex = 0;
        this.elements.forEach((el, i) => {
            if (el.components.sprite) el.components.sprite.index = i;
            //@ts-ignore
            if (el.components.light) {
                //@ts-ignore
                el.components.light.index = lightIndex++;
            }
            this.systems.forEach(sys => {
                sys.process(el);
            });
        });

        this.users.forEach((el, i) => {
            if (el.components.sprite) el.components.sprite.index = i;
            if (el.components.light) {
                //@ts-ignore
                el.components.light.index = lightIndex++;
            }
            this.systems.forEach(sys => {
                sys.process(el);
            });
        });

        this.dyelements.forEach((el, i) => {
            if (el.components.sprite?.index) el.components.sprite.index = i;
            //@ts-ignore
            if (el.components.light?.index) el.components.light.index = lightIndex++;
            this.systems.forEach(sys => {
                sys.process(el);
            });
        });

        this.lastLightCount = lightIndex;

        /*const pdLight = engine.programData.light;
        const lightIndexes = Object.getOwnPropertyNames(lights);
        for (let i = 0; i < lightIndexes.length; i++) {
            const light = lights[lightIndexes[i]];
            const dataSize = 9;
            const index = i * dataSize;

            if (pdLight.transformData.length < (i + 1) * dataSize)
                pdLight.transformData = new Float32Array([...pdLight.transformData, ...(new Array(dataSize))]);

            pdLight.transformData[index + 0] = light.pos.x;
            pdLight.transformData[index + 1] = light.pos.y;
            pdLight.transformData[index + 2] = light.pos.z;
            pdLight.transformData[index + 3] = light.color.r;
            pdLight.transformData[index + 4] = light.color.g;
            pdLight.transformData[index + 5] = light.color.b;
            pdLight.transformData[index + 6] = light.intensity;
            pdLight.transformData[index + 7] = light.radius;
            pdLight.transformData[index + 8] = light.objectId ?? 0;
        }*/


        if (this.time.running) {
            //game.time.passed++;
            this.time.hour += parseFloat((((1000 / (engine.getFramerate() == 0 ? 1 : engine.getFramerate())) / 1000) / 60).toFixed(2));
            this.time.hour = parseFloat(this.time.hour.toFixed(2));
        }
        if (this.time.hour >= 24) {
            this.time.hour -= 24;
        }

        if (this.time.hour >= 6 && this.time.hour <= 18) engine.globalLight.x = (((this.time.hour - 6) * 2) / 12) - 1;
        else if (this.time.hour < 6) engine.globalLight.x = 1 - ((((this.time.hour + 12) - 6) * 2) / 12);
        else if (this.time.hour > 18) engine.globalLight.x = 1 - ((((this.time.hour - 12) - 6) * 2) / 12);

        if (this.time.hour > 10 && this.time.hour < 14) engine.globalLight.y = 1;
        else if (this.time.hour > 18 || this.time.hour < 4) engine.globalLight.y = -1;
        else if (this.time.hour >= 4 && this.time.hour <= 10) engine.globalLight.y = 1 - (((10 - this.time.hour) * 2) / 6);
        else if (this.time.hour >= 14 && this.time.hour <= 18) engine.globalLight.y = (((18 - this.time.hour) * 2) / 4) - 1;

        if (this.time.hour > 10 && this.time.hour < 14) engine.globalLight.z = 1;
        else if (this.time.hour > 18 || this.time.hour < 4) engine.globalLight.z = -1;
        else if (this.time.hour >= 4 && this.time.hour <= 10) engine.globalLight.z = 1 - (((10 - this.time.hour) * 2) / 6);
        else if (this.time.hour >= 14 && this.time.hour <= 18) engine.globalLight.z = (((18 - this.time.hour) * 2) / 4) - 1;
    }

    /** @param {*} gl */
    async setup(gl) {
        const programData = engine.programData;
        const canvas = engine.canvas;

        await createAllAtlas();

        const propCenarioFBO = drawer.setupPropCenarioFBO();
        const cenarioFBO = drawer.setupCenarioFBO();
        const lightFBO = drawer.setupLightFBO();
        const backgroundFBO = drawer.setupBackgroundFBO();

        gl.useProgram(programData['light'].program);
        gl.uniform2f(programData['light'].locals.u.resolution, canvas.width, canvas.height);
        const lightDrawer = await drawer.setupLightDrawer(programData['light'], propCenarioFBO);

        gl.useProgram(programData['char'].program);
        gl.uniform2f(programData['char'].locals.u.resolution, canvas.width, canvas.height);
        const charDrawer = await drawer.setupCharDrawer(programData['char']);

        gl.useProgram(programData['prop'].program);
        gl.uniform2f(programData['prop'].locals.u.resolution, canvas.width, canvas.height);
        const propDrawer = await drawer.setupPropDrawer(programData['prop']);

        console.log(programData['dyprop']);
        gl.useProgram(programData['dyprop'].program);
        gl.uniform2f(programData['dyprop'].locals.u.resolution, canvas.width, canvas.height);
        const dyPropDrawer = await drawer.setupDynamicPropDrawer(programData['dyprop']);

        gl.useProgram(programData['background'].program);
        gl.uniform2f(programData['background'].locals.u.resolution, canvas.width, canvas.height);
        const backgroundDrawer = await drawer.setupBackgroundDrawer(programData['background']);

        gl.useProgram(programData['cenario'].program);
        gl.uniform2f(programData['cenario'].locals.u.resolution, canvas.width, canvas.height);
        const cenarioDrawer = await drawer.setupCenarioDrawer(programData['cenario'], propCenarioFBO, lightFBO, backgroundFBO);

        gl.useProgram(programData['rio'].program);
        gl.uniform2f(programData['rio'].locals.u.resolution, canvas.width, canvas.height);
        const rioDrawer = await drawer.setupRioDrawer(programData['rio'], cenarioFBO);

        gl.useProgram(programData['raw'].program);
        gl.uniform2f(programData['raw'].locals.u.resolution, canvas.width, canvas.height);
        const rawDrawer = await drawer.setupRawDrawer(programData['raw'], cenarioFBO);

        drawers['dyprop'] = dyPropDrawer;
        drawers['fbo'] = {};
        drawers['fbo'].propCenarioFBO = propCenarioFBO;

        return {
            propCenarioFBO,
            backgroundFBO,
            cenarioFBO,
            lightFBO,
            charDrawer,
            propDrawer,
            backgroundDrawer,
            cenarioDrawer,
            rioDrawer,
            rawDrawer,
            dyPropDrawer,
            lightDrawer
        }
    }

    /** @param {System} system */
    registerSystem(system) {
        this.systems.push(system);
        return this;
    }

}

const world = new World();

export default world;