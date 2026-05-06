//@ts-check
/**
 * @typedef {Object} MoveOptions
 * @property {number} speed
 * @property {import('../types/general.js').Position} [targetPosition]
 */
import {System} from '../world.js'

export default class MoverSystem extends System {
    /** @param {import('../world.js').ElementObject} prop */
    process(prop) {
        if (!prop.components.position) return;

        const moveOptions =  /** @type {undefined | MoveOptions} */ (prop.components.moveOptions);

        if (!moveOptions?.targetPosition)
            return;

        if(!moveOptions.speed) moveOptions.speed = 1;

        const pos = { ...prop.components.position };
        const targetPos = moveOptions.targetPosition;

        const diff = Math.abs(targetPos.x - pos.x);
        if (diff <= moveOptions.speed) {
            delete prop.components.lastPosition;
            delete moveOptions.targetPosition;
            return;
        }
        const dir = targetPos.x < pos.x ? -1 : 1;
        prop.components.position.x += dir * moveOptions.speed;
        prop.components.lastPosition = pos;
    }
}
