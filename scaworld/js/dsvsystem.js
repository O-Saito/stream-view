//@ts-check
import world, { System } from './world.js'
import elementAnimator from './systems/elementAnimator.js';
import dyElementAniamtor from './systems/dyElementAnimator.js';
import characterAnimator from './systems/characterAnimator.js';
import PortalSystem from './elements/portal.js';
import character from './elements/character.js';
import MoverSystem from './systems/mover.js';
import LightAnimator from './systems/lightAnimatior.js';
import UserUI from './systems/userUI.js';

class ChangeOutfitSystem extends System {
    /** @param {import('./world.js').UserObject} user */
    process(user) {
        if (!user.components.outfitrequest) return;
        const outfit = /** @type {Object.<string, string>} */ (user.components.outfitrequest);
        user.components.userData.preset = { ...user.components.userData.preset, ...outfit };
        if (!user.components.sprite) return;

        Object.getOwnPropertyNames(outfit).forEach(key => {
            if (!user.components.sprite.parts[key]) user.components.sprite.parts[key] = { texture: "", currentFrame: 0 }
            user.components.sprite.parts[key].texture = outfit[key];
        });

        delete user.components.outfitrequest;
    }
}

class PassBySystem extends System {
    /** @param {import('./world.js').GameObject} obj */
    process(obj) {
        if (!obj.components.passByCanvas) return;
        if (!obj.components.moveOptions) return;
        const passby = /** @type {{x: Number, moving: Boolean}} */ (obj.components.passByCanvas);
        const moveOptions = /** @type {import('./systems/mover.js').MoveOptions} */ (obj.components.moveOptions);

        if (passby.moving) {
            //@ts-ignore
            if (passby.x == -1 && (!obj.components.position || obj.components.position.x <= -(obj.components.size?.width ?? 100))) {
                world.removeById(obj.localGlobalId);
            }
            return;
        }

        //@ts-ignore
        if (obj.components.portal && obj.components.portal.inside) return;
        if (moveOptions.targetPosition) return;
        if (passby.x == -1) {
            // @ts-ignore
            moveOptions.targetPosition = { x: -(obj.components.size?.width ?? 100), y: 0 };
            passby.moving = true;
        }
    }
}

export default {
    register: () => {
        world
            .registerSystem(new MoverSystem())
            .registerSystem(new PortalSystem())
            .registerSystem(new character.CharacterSystem())
            .registerSystem(new elementAnimator.ElementAnimatior())
            .registerSystem(new characterAnimator.CharacterAnimatior())
            .registerSystem(new dyElementAniamtor.DyElementAnimatior())
            .registerSystem(new LightAnimator())
            .registerSystem(new UserUI())
            .registerSystem(new ChangeOutfitSystem())
            .registerSystem(new PassBySystem())
            ;
    },
}