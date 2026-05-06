//@ts-check
/** @import {Position, RGBA} from '../types/general.js' */
import engine from "../engine.js";
import { System } from "../world.js";

/**
 * @typedef {Object} Light
 * @property {number} index
 * @property {Position} posOffset
 * @property {number} z
 * @property {RGBA} color
 * @property {number} intensity
 * @property {number} radius
 */

export default class LightSystem extends System {
    /** @param {import("../world").GameObject} prop */
    process(prop) {
        const light = /** @type {Light} */ (prop.components.light);
        const position =  /** @type {import("../types/general.js").Position} */ (prop.components.position);
        if (!light) return;
        //console.log(light);
        const dataSize = 9;
        const pdLight = engine.programData.light;

        if (pdLight.transformData.length < (light.index + 1) * dataSize)
            pdLight.transformData = new Float32Array([...pdLight.transformData, ...(new Array(dataSize))]);

        const index = light.index * dataSize;

        pdLight.transformData[index + 0] = position.x + light.posOffset.x;
        pdLight.transformData[index + 1] = position.y + light.posOffset.y;
        pdLight.transformData[index + 2] = light.z;
        pdLight.transformData[index + 3] = light.color.r;
        pdLight.transformData[index + 4] = light.color.g;
        pdLight.transformData[index + 5] = light.color.b;
        pdLight.transformData[index + 6] = light.intensity;
        pdLight.transformData[index + 7] = light.radius;
        pdLight.transformData[index + 8] = prop.localGlobalId;

    }
}
