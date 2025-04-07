import Prop from './prop.js'
import game from '../game.js'
import SimpleDraw from '../components/simpleDraw.js';

const openPortalTexture = '/portal/portal-abrindo-sheet.png';
const idlePortal = '/portal/portal-atlas.png';

class SpawnManager {

    static Status = { waiting: 'waiting', ended: 'ended', moving: 'moving', waitingPortal: 'waitingPortal' };

    constructor() {
        this.currentId = 0;
        this.portals = [];

        this.elements = [];
        this.chars = [];

        this.despawnChar = [];

        window.spawnManager = this;
    }

    hasSomethingToSpawn() {
        return this.elements.length > 0 || this.chars.length > 0;
    }

    hasSomethingToDespawn(portal) {
        if (this.despawnChar.length == 0) return false;
        for (let i = 0; i < this.despawnChar.length; i++) {
            const dsc = this.despawnChar[i];
            const char = game.getChar(dsc.id);
            if(!char) continue;
            if(dsc.status == SpawnManager.Status.waitingPortal) return true;
        }
        return false;
    }

    registerPortal(portal) {
        portal.portalId = this.currentId++;
        this.portals[portal.portalId] = portal;
    }

    makeSpawn(type, element) {
        if (type == 'char') {
            this.chars.push({ status: SpawnManager.Status.waiting, id: element.userData.userId });
            return true;
        }
        if (type == 'prop') {
            this.elements.push({ status: SpawnManager.Status.waiting, id: element.id });
            return true;
        }
    }

    makeDespawn(type, element) {
        if (type == 'char') {
            this.despawnChar.push({ status: SpawnManager.Status.waiting, id: element.userData.userId });
            return true;
        }
    }

}

export default class Portal extends Prop {

    static spawnManager = new SpawnManager();

    constructor({ size, position, texture, depth }) {
        super({ type: 'Portal', size, position, texture, depth, shoudntEnable: true });

        this.isLightSource = true;
        this.components.push(new SimpleDraw(this, this.texture, (draw) => { return this.onAnimationDone(draw); }));
        Portal.spawnManager.registerPortal(this);
        this.closestFloor = null;
        this.enable();
    }

    onEnable() {
        super.onEnable();
        this.close();
    }

    handleDespawnChar() {
        const portalCenter = (this.position.x + (this.objectSize.width / 2));
        let remove = [];

        for (let i = 0; i < Portal.spawnManager.despawnChar.length; i++) {
            const e = Portal.spawnManager.despawnChar[i];
            const char = game.getChar(e.id);
            if (!char) {
                remove.push(e.id);
                continue;
            }
            if (e.status == SpawnManager.Status.waiting) {
                //char.position.x = portalCenter;

                e.cinnematicId = char.startCinematic({
                    priority: 200,
                    rotine: {
                        action: (c, onDone) => {
                            c.move.setDestiny({
                                x: this.position.x - char.objectSize.width,
                                cinematicId: e.cinnematicId,
                                onDoneMoving: () => {
                                    e.cinematicDone = onDone;
                                    e.status = SpawnManager.Status.waitingPortal;
                                }
                            });
                        }
                    }
                });

                char.spawned = true;
                e.status = SpawnManager.Status.moving;
            }

            if (e.status == SpawnManager.Status.waitingPortal) {
                if(!this.fullOpen) continue;
                char.move.setDestiny({
                    x: portalCenter,
                    cinematicId: e.cinnematicId,
                    onDoneMoving: () => {
                        e.status = SpawnManager.Status.ended;
                        e.cinematicDone();
                        char.remove();
                    }
                });
            }

            if (e.status == SpawnManager.Status.ended) {
                remove.push(e.id);
            }
        }

        for (let i = 0; i < remove.length; i++) {
            const c = Portal.spawnManager.despawnChar.find(x => x.id == remove[i]);
            const index = Portal.spawnManager.despawnChar.indexOf(c);
            if (index == -1) continue;
            Portal.spawnManager.despawnChar.splice(index, 1);
        }
    }

    handleChar() {
        const portalCenter = (this.position.x + (this.objectSize.width / 2));
        const floor = game.getProp(this.closestFloor);
        let remove = [];

        for (let i = 0; i < Portal.spawnManager.chars.length; i++) {
            const e = Portal.spawnManager.chars[i];
            const char = game.getChar(e.id);
            if (!char) {
                remove.push(e.id);
                continue;
            }
            if (e.status == SpawnManager.Status.waiting) {
                char.position.x = portalCenter;
                char.position.y = floor.position.y + floor.objectSize.height;

                const cinId = char.startCinematic({
                    priority: 200,
                    rotine: {
                        action: (c, onDone) => {
                            c.move.setDestiny({
                                x: this.position.x - (this.size.width + c.size.width),
                                cinematicId: cinId,
                                onDoneMoving: () => {
                                    e.status = SpawnManager.Status.ended;
                                    onDone();
                                }
                            });
                        }
                    }
                });

                char.spawned = true;
                e.status = SpawnManager.Status.moving;
            }

            if (e.status == SpawnManager.Status.ended) {
                remove.push(e.id);
            }
        }

        for (let i = 0; i < remove.length; i++) {
            const c = Portal.spawnManager.chars.find(x => x.id == remove[i]);
            const index = Portal.spawnManager.chars.indexOf(c);
            if (index == -1) continue;
            Portal.spawnManager.chars.splice(index, 1);
        }

    }

    handleElements() {
        const floor = game.getProp(this.closestFloor);
        const portalCenter = (this.position.x + (this.objectSize.width / 2));
        let remove = [];

        for (let i = 0; i < Portal.spawnManager.elements.length; i++) {
            const e = Portal.spawnManager.elements[i];
            const el = game.getProp(e.id);
            if (!el) {
                remove.push(e.id);
                continue;
            }
            if (!el.isEnable) continue;
            if (e.status == SpawnManager.Status.waiting) {
                el.position.x = portalCenter;
                el.position.y = floor.position.y + floor.objectSize.height;

                const fullSize = el.fullObjectSize().width;
                el.move.setDestiny({
                    x: this.position.x - (this.size.width + fullSize),
                    onDoneMoving: () => {
                        e.status = SpawnManager.Status.ended;
                    }
                });
                e.status = SpawnManager.Status.moving;
                e.originalSize = el.objectSize.width;
            }

            if (e.status == SpawnManager.Status.moving) {
                el.addEffect('cut', { x: portalCenter });
                // let w =  portalCenter - el.position.x;
                // if (w <= 0) w = 1;
                // if (w >= e.originalSize) w = e.originalSize;
                //el.size.width = w * 2;
                //el.changeObjectSize({ width: w });
                if (el.elements) {
                    for (let z = 0; z < el.elements.length; z++) {
                        const element = el.elements[z];
                        element.addEffect('cut', { x: portalCenter });
                        // let w = portalCenter - (el.position.x + element.position.x);
                        // if (w <= 0) {
                        //     w = 0;
                        //     if(!e.originalSizeChild) e.originalSizeChild = {};
                        //     if(!e.originalSizeChild[element.index]) e.originalSizeChild[element.index] = element.objectSize.width;
                        // }
                        // if (w >= e.originalSizeChild[element.index]) w = e.originalSizeChild[element.index];
                        // element.changeObjectSize({ width: w });
                    }
                }
            }

            if (e.status == SpawnManager.Status.ended) {
                remove.push(e.id);
                const fullSize = el.fullObjectSize().width;
                el.move.setDestiny({
                    x: 0 - (fullSize + 10),
                    onDoneMoving: () => {
                        el.remove();
                    }
                });
            }
        }

        for (let i = 0; i < remove.length; i++) {
            const c = Portal.spawnManager.elements.find(x => x.id == remove[i]);
            const index = Portal.spawnManager.elements.indexOf(c);
            if (index == -1) continue;
            Portal.spawnManager.elements.splice(index, 1);
        }
    }

    update() {
        super.update();

        const somethingToDespawn = Portal.spawnManager.hasSomethingToDespawn(this);
        if ((Portal.spawnManager.hasSomethingToSpawn() || somethingToDespawn) && this.closed && !this.fullOpen) this.open();
        if ((!Portal.spawnManager.hasSomethingToSpawn() && !somethingToDespawn) && this.fullOpen) this.close();

        this.handleDespawnChar();

        if (!this.fullOpen) return;

        this.closestFloor = game.getFloorList()[0];

        this.handleChar();
        this.handleElements();
    }

    changeTexture(texture, data) {
        super.changeTexture(texture, data);
        if (this.components[0]) this.components[0].changeTexture(texture, data);

        this.changeObjectSize({ width: this.objectSize.width * 3, height: this.objectSize.height * 3 });
    }

    onAnimationDone(draw) {
        if (this.texture == openPortalTexture) {
            if (draw.frameDirection == -1) {
                draw.stopAnimation = true;
                this.closed = true;
                return true;
            }

            this.closed = false;
            this.changeTexture(idlePortal);
        }

        if (this.texture == idlePortal) {
            this.fullOpen = true;
        }
    }

    open() {
        this.changeTexture(openPortalTexture);
        this.fullOpen = false;
        this.closed = false;
    }

    close() {
        this.changeTexture(openPortalTexture, { frameDirection: -1 });
        this.fullOpen = false;
    }

}