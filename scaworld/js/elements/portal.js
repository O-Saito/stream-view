//@ts-check
/** @import { ElementObject } from '../world.js' */
import world, { System } from '../world.js';

/**
 * @typedef {ElementObject & {
 *  components: ElementObject["components"] & {
 *      portalData?: PortalData,
 *  },
 * }} PortalObject
 * 
 * @typedef PortalData 
 * @property {string} status
 * @property {number} closeTime
 * @property {Array<number>} usersToEnterWorld
 * @property {number | null} showingPart
 */

/** @type {Object.<string, Function>} */
export const emitters = {
    /** @param {PortalObject} prop */
    "portal::opened": (prop) => {
        if (prop.type != 'portal') {
            return;
        }
        prop.components.sprite.animation = "keep";
    },
    /** @param {PortalObject} prop */
    "portal::keep": (prop) => {
        if (prop.type != 'portal') {
            return;
        }
        const portalData = /** @type {PortalData} */ (prop.components.portalData);
        portalData.status = 'full-open';
    },
    /** @param {PortalObject} prop */
    "portal::closed": (prop) => {
        if (prop.type != 'portal') {
            return;
        }
        const portalData = /** @type {PortalData} */ (prop.components.portalData);
        portalData.status = 'closed';
    },
}

export default class PortalSystem extends System {
    constructor() { super(); }

    /** @param {ElementObject} prop */
    process(prop) {
        if (prop.type != 'portal') return;
        const portalData = /** @type {PortalData} */ (prop.components.portalData);
        if (!portalData) return;

        if (portalData.status == 'closed') {
            if (portalData.usersToEnterWorld.length > 0) {
                prop.components.sprite.animation = 'open';
                portalData.status = 'opening';
            }
            return;
        }

        if (prop.components.sprite.animation == "default") {
            prop.components.sprite.animation = 'open';
            return;
        }

        if (portalData.status == 'full-open') {
            if (portalData.showingPart) {
                const currentId = portalData.showingPart;
                if (!currentId) return;
                const el = world.getById(currentId);
                if (!el) {
                    portalData.usersToEnterWorld.splice(0, 1);
                    return;
                }

                const userBehaviour = /** @type {import('./character.js').Behaviour} */ (el.components.behaviour);
                if (userBehaviour) {
                    userBehaviour.busy = true;
                }

                const moveOptions = /** @type {import('../systems/mover.js').MoveOptions} */ (el.components.moveOptions);
                const position = /** @type {import('../types/general.js').Position} */ (el.components.position);
                if (!moveOptions || !position) {
                    portalData.usersToEnterWorld.splice(0, 1);
                    if (userBehaviour) userBehaviour.busy = false;
                    return;
                }

                if (!moveOptions.targetPosition) {
                    position.x = Math.floor(prop.components.position.x + (prop.components.size.width / 2));
                    position.y = world.getFloorY();
                    moveOptions.targetPosition = { x: Math.floor(prop.components.position.x - prop.components.size.width / 2), y: 0 };
                    return;
                }

                if (el.type == 'char') {
                    // show parts by time
                    const userData = /** @type {import('../world.js').UserData} */ (el.components.userData);
                    const sprite = /** @type {import('../world.js').SpriteData} */ (el.components.sprite);
                    if (!userData) return;
                    const firstNotShown = Object.getOwnPropertyNames(userData.preset).find(x => !sprite.parts[x] || !sprite.parts[x].texture || sprite.parts[x].texture == '');
                    if (!firstNotShown) {
                        portalData.usersToEnterWorld.splice(0, 1);
                        userBehaviour.busy = false;
                        portalData.showingPart = null;
                        return;
                    }
                    sprite.parts[firstNotShown] = {
                        currentFrame: 0,
                        texture: userData.preset[firstNotShown],
                    };
                    return;
                }

            }

            if (portalData.closeTime > 0) {
                portalData.closeTime--;
                return;
            }

            if (!portalData.closeTime || portalData.closeTime <= 0) {
                if (portalData.usersToEnterWorld.length == 0) {
                    prop.components.sprite.animation = 'close';
                    portalData.status = 'closing';
                    return;
                }

                portalData.closeTime = 30;
            }

            const currentId = portalData.usersToEnterWorld[0];
            if (!currentId) return;
            const el = world.getById(currentId);
            if (!el) {
                portalData.usersToEnterWorld.splice(0, 1);
                return;
            }

            const userBehaviour = /** @type {import('./character.js').Behaviour} */ (el.components.behaviour);
            if (userBehaviour) {
                userBehaviour.busy = true;
            }

            const moveOptions = /** @type {import('../systems/mover.js').MoveOptions} */ (el.components.moveOptions);
            const position = /** @type {import('../types/general.js').Position} */ (el.components.position);
            if (!moveOptions || !position) {
                portalData.usersToEnterWorld.splice(0, 1);
                if (userBehaviour) userBehaviour.busy = false;
                return;
            }

            if (!moveOptions.targetPosition) {
                position.x = Math.floor(prop.components.position.x + (prop.components.size.width / 2));
                position.y = world.getFloorY();
                moveOptions.targetPosition = { x: Math.floor(prop.components.position.x - prop.components.size.width / 2), y: 0 };
                return;
            }
            if (el.components.portal)
                //@ts-ignore
                el.components.portal.inside = false;

            if (el.type == 'char') {
                portalData.showingPart = currentId;
                // show parts by time
                const userData = /** @type {import('../world.js').UserData} */ (el.components.userData);
                const sprite = /** @type {import('../world.js').SpriteData} */ (el.components.sprite);
                if (!userData) return;
                const firstNotShown = Object.getOwnPropertyNames(userData.preset).find(x => !sprite.parts[x] || !sprite.parts[x].texture || sprite.parts[x].texture == '');
                if (!firstNotShown) {
                    portalData.usersToEnterWorld.splice(0, 1);
                    userBehaviour.busy = false;
                    return;
                }
                sprite.parts[firstNotShown] = {
                    currentFrame: 0,
                    texture: userData.preset[firstNotShown],
                };
                return;
            }

            portalData.usersToEnterWorld.splice(0, 1);

        }
    }
}
