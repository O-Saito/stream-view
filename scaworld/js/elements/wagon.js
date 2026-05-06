//@ts-check
/** @import { ElementObject } from '../world.js' */
import world, { System } from '../world.js';

/**
 * @typedef {ElementObject & {
 *  components: ElementObject["components"] & {
 *      wagonData?:WagonData,
 *  },
 * }} WagonObject
 * 
 * @typedef WagonData 
 * @property {WagonStates} status
 * @property {Array<number>} usersToEnterWorld
 */

/** @readonly @enum {string} */
const WagonStates = { movingIn: 'mi', movingOut: 'mo', waiting: 'waiting', offscreen: 'off' };

/** @type {Object.<string, Function>} */
export const emitters = {
    /** @param {WagonObject} prop */
    "wagon::opened": (prop) => {
        if (prop.type != 'wagon') {
            return;
        }
        prop.components.sprite.animation = "keep";
    },
    /** @param {WagonObject} prop */
    "wagon::keep": (prop) => {
        if (prop.type != 'wagon') {
            return;
        }
        const wagonData = /** @type {WagonData} */ (prop.components.wagonData);
        wagonData.status = 'full-open';
    },
    /** @param {WagonObject} prop */
    "wagon::closed": (prop) => {
        if (prop.type != 'wagon') {
            return;
        }
        const wagonData = /** @type {WagonData} */ (prop.components.wagonData);
        wagonData.status = 'closed';
    },
}

export default class PortalSystem extends System {
    constructor() { super(); }

    /** @param {ElementObject} prop */
    process(prop) {
        if (prop.type != 'wagon') return;
        const wagonData = /** @type {WagonData} */ (prop.components.wagonData);
        if (!wagonData) return;

        if (wagonData.status == WagonStates.offscreen) {
            if (wagonData.usersToEnterWorld.length > 0){
                wagonData.status = WagonStates.movingIn;
            }
        }

        if (wagonData.status == 'closed') {
            if (wagonData.usersToEnterWorld.length > 0) {
                prop.components.sprite.animation = 'open';
                wagonData.status = 'opening';
            }
            return;
        }

        if (prop.components.sprite.animation == "default") {
            prop.components.sprite.animation = 'open';
            return;
        }
    }
}
