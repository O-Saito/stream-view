//@ts-check

import world from './world.js'
import engine from './engine.js'
import mover from './systems/mover.js';
import elementAnimator from './systems/elementAnimator.js';
import { atlases } from './atlasManager.js';
//import { processor as portalProcessor } from './elements/portal.js';

export default {
    /** @param {{type: string, size: import('./types/general.js').Size, position: import('./types/general.js').Position, texture: string, depth: number}} param0 */
    addDynamic: ({ type, size, position, texture, depth }) => {

        /** @param {string} src  @returns */
        const load = async (src) => {
            return new Promise((resolve) => {
                const image = new Image();
                image.setAttribute('crossOrigin', '');
                image.onload = function () {
                    atlases['dyn_prop'].draw(image);
                    world.getDrawers()['dyprop'].updatePbo();
                    resolve(image);
                }
                image.src = src;
            });
        };

        load(texture).then(x => {
            const elementQuantity = world.getDyElements().length;
            /** @type {Object.<string, import('./world.js').PartData>} */
            const parts = {
                main: { currentFrame: 0, texture: texture },
            };
            const el = world.addDyElement({
                localGlobalId: 0,
                type: `dyprop::${type}`,
                components: {
                    position: { x: position.x, y: position.y },
                    size: { width: size.width, height: size.height },
                    moveOptions: {

                    },
                    sprite: {
                        index: elementQuantity,
                        depth: depth,
                        animation: 'default',
                        currentFrame: 0,
                        lookingDirection: 1,
                        parts: parts
                    }
                }
            });

            el.components.passByCanvas = { x: -1 };

            const portal = world.getElements().find(x => x.type == 'portal');
            if (portal && portal.components.portalData) {
                //@ts-ignore
                portal.components.portalData.usersToEnterWorld.push(el.localGlobalId);
                el.components.portal = { inside: true };
            }
        });

    },
    /** @param {{type: string, size: import('./types/general.js').Size, position: import('./types/general.js').Position, texture: string | null, depth: number}} param0 */
    addElement: ({ type, size, position, texture, depth }) => {
        const elementQuantity = world.getElements().length;
        const el = world.addElement({
            localGlobalId: 0,
            type: type,
            components: {
                position: { x: position.x, y: position.y },
                size: { width: size.width, height: size.height },
                sprite: {
                    index: elementQuantity,
                    depth: depth,
                    animation: 'default',
                    currentFrame: 0,
                    lookingDirection: 1,
                    parts: {
                        default: {
                            currentFrame: 0,
                            texture: texture
                        }
                    }
                }
            }
        });

        switch (type) {
            case 'portal':
                /** @type {import('./elements/portal.js').PortalData} */
                const portalData = { status: 'closed', showingPart: null, closeTime: 0, usersToEnterWorld: [] }
                el.components.portalData = portalData;
                break;
            case 'wagon':
                break;
            case 'fogueira':
                /** @type {import('./systems/lightAnimatior.js').Light} */
                const light = {
                    index: 0,
                    posOffset: { x: Math.ceil(el.components.size.width / 2), y: Math.ceil(el.components.size.height / 2) },
                    z: 1,
                    color: { r: 214 / 255, g: 136 / 255, b: 0 / 255, a: 0 },
                    intensity: 2.0,
                    radius: 250.0
                };
                el.components.light = light;
                break;
        }

    },
}
