//@ts-check
import world, { System } from '../world.js'
import engine from '../engine.js'
import charAnimatior from '../systems/characterAnimator.js';
import mover from '../systems/mover.js';

const defaultCharMoveSpeed = 1;
const idleDistance = 500;

/** 
 * @typedef {Function} BehaveTypeFunction
 * @param {import('../world.js').UserObject} char
 */

/** @type {Object.<string, BehaveTypeFunction>} */
const behaveByType = {
    /** @param {import('../world.js').UserObject} char */
    'idle': (char) => {
    }
}

/**
 * @typedef {Object} Behaviour
 * @property {boolean} [busy]
 * @property {string} [behaviorType]
 * @property {number} [forTime]
 * @property {number} [currentTime]
 */

/** @param {import('../world.js').UserObject} char */
function behave(char) {
    if (!char.components.behaviour) return;
    const behaviour = /** @type {Behaviour} */ (char.components.behaviour);
    if (behaviour.busy) {
        if (behaviour.forTime) {
            if (!behaviour.currentTime) behaviour.currentTime = 0;
            if (behaviour.forTime < behaviour.currentTime++) {
                delete behaviour.behaviorType;
                behaviour.forTime = 0;
                behaviour.busy = false;
                behaviour.currentTime = 0;
                return;
            }
        }
        if (behaviour.behaviorType) behaveByType[behaviour.behaviorType](char);
        return;
    }

    // idle
    if (!char.components.moveOptions?.targetPosition) {

        if (Math.random() > 0.7) {
            behaviour.busy = true;
            behaviour.forTime = Math.floor(Math.random() * 120) + 1;
            behaviour.behaviorType = 'idle';
            return;
        }

        if (!char.components.moveOptions) char.components.moveOptions = { speed: defaultCharMoveSpeed };

        let direction = 1;
        if (Math.random() > 0.5)
            direction = -1;

        let randomPos = char.components.position.x + (Math.floor(Math.random() * idleDistance) * direction);
        if (randomPos > engine.canvas.width - char.components.size.width) randomPos = engine.canvas.width - char.components.size.width;
        else if (randomPos <= 0) randomPos = 0;

        char.components.moveOptions.targetPosition = { x: randomPos, y: 0 };
    }
}

/** @param {number} id */
function tryEnterPortal(id) {
    const portal = world.getElements().find(x => x.type == 'portal');
    if (portal && portal.components.portalData) {
        //@ts-ignore
        portal.components.portalData.usersToEnterWorld.push(id);
    } else {
        setTimeout(() => {
            tryEnterPortal(id);
        }, 100);
    }
}

class CharacterSystem extends System {

    /** @param {import('../world.js').UserObject} char */
    process(char) {
        if (char.type != 'char') return;
        behave(char);
    }
}

export default {

    /** @param {{pos: import('../types/general.js').Position, userData: import('../world.js').UserData, enterPortal?: boolean}} param0 */
    addCharacter: ({ pos, userData, enterPortal }) => {
        const id = world.getUniqueId();
        const userQuantity = world.getUsers().length;
        if (engine.programData.char.addToTransform) 
            engine.programData.char.addToTransform(userQuantity + 1, {});

        if (!userData)
            userData = {
                userId: '',
                userName: '',
                name: '',
                isMod: false,
                isCitizen: false,
                isGuest: false,
                preset: {}
            };
        if (!userData.preset || Object.getOwnPropertyNames(userData.preset).length == 0)
            userData.preset = {
                body: '/char/body/skeleton/body',
                head: '/char/body/skeleton/head',
                legs: '/char/body/skeleton/legs',
                weapon: '/char/props/equip/espada',
                bow: '/char/props/equip/arco/default.png',
                second_weapon: '/char/props/equip/escudo_madeira',

                //helmet: '/char/props/helmet/coroa.png',
                //face: '/char/props-especial/face/moustache.png',
                //capeBack: '/char/props-especial/cape/cape_back.png',
                //capeFront: '/char/props-especial/cape/cape_front.png',
            };

        /** @type {import('../world.js').UserObject} */
        const data = {
            localGlobalId: id,
            type: "char",
            components: {
                behaviour: {},
                userData: userData,
                position: { x: pos.x, y: pos.y },
                moveOptions: {
                    speed: defaultCharMoveSpeed,
                    //targetPosition: { x: 10, y: 0 }
                },
                size: { width: 32, height: 32 },
                sprite: {
                    index: userQuantity,
                    depth: engine.options.charDepth,
                    currentFrame: 0,
                    animation: 'idle',
                    lookingDirection: 1,
                    parts: {}
                },
            }
        };
        if (enterPortal) {
            data.components.position.x = -50;
            //@ts-ignore
            data.components.behaviour.busy = true;
            tryEnterPortal(id);
        } else {
            const parts = data.components.sprite.parts;
            Object.getOwnPropertyNames(userData.preset).forEach(p => {
                parts[p] = {
                    texture: userData.preset[p],
                    currentFrame: 0,
                }
            });
        }
        world.addUser(data);
    },
    CharacterSystem,
};
