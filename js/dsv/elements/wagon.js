import Prop from './prop.js'
import game from '../game.js'
import SimpleDraw from '../components/simpleDraw.js';
import MakeMoveableComponent from '../components/makeMoveable.js';

class SpawnManager {

    static Status = { waiting: 'waiting', ended: 'ended', moving: 'moving', waitingWagon: 'waitingWagon' };

    constructor() {
        this.currentId = 0;
        this.wagons = [];

        this.chars = [];

        window.spawnManager = this;
    }

    hasSomethingToSpawn() {
        return this.chars.length > 0;
    }

    register(wagon) {
        wagon.wagonId = this.currentId++;
        this.wagons[wagon.wagonId] = wagon;
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

export default class Wagon extends Prop {

    static spawnManager = new SpawnManager();

    constructor({ size, position, texture, depth }) {
        super({ type: 'Wagon', size, position, texture, depth, shoudntEnable: true });

        this.move = new MakeMoveableComponent(this, { precision: 5 });
        //this.components.push(new SimpleDraw(this, this.texture, (draw) => { return this.onAnimationDone(draw); }));
        this.components.push(this.move)
        this.naturalFlipX = true;
        this.onTheSpot = true;
        Wagon.spawnManager.register(this);
        this.closestFloor = null;
        this.enable();
    }

    onEnable() {
        super.onEnable();
        //this.close();
    }

    handleChar() {
        const center = (this.position.x + (this.objectSize.width / 2));
        const floor = game.getProp(this.closestFloor);
        let remove = [];

        for (let i = 0; i < Wagon.spawnManager.chars.length; i++) {
            const e = Wagon.spawnManager.chars[i];
            const char = game.getChar(e.id);
            if (!char) {
                remove.push(e.id);
                continue;
            }
            if (e.status == SpawnManager.Status.waiting) {
                char.position.x = center;
                char.position.y = this.position.y + 13;

                const cinId = char.startCinematic({
                    priority: 200,
                    rotine: {
                        action: (c, onDone) => {
                            c.move.setDestiny({
                                x: this.position.x + (this.objectSize.width),
                                cinematicId: cinId,
                                onDoneMoving: () => {
                                    e.status = SpawnManager.Status.ended;
                                    c.position.y = floor.position.y + floor.objectSize.height;
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
            const c = Wagon.spawnManager.chars.find(x => x.id == remove[i]);
            const index = Wagon.spawnManager.chars.indexOf(c);
            if (index == -1) continue;
            Wagon.spawnManager.chars.splice(index, 1);
        }

    }

    update() {
        super.update();

        console.log(Wagon.spawnManager.hasSomethingToSpawn());
        //const somethingToDespawn = Wagon.spawnManager.hasSomethingToDespawn(this);
        if (Wagon.spawnManager.hasSomethingToSpawn() && !this.onTheSpot) this.enter();
        if (!Wagon.spawnManager.hasSomethingToSpawn() && this.onTheSpot) this.exit();

        if (!this.onTheSpot) return;

        this.closestFloor = game.getFloorList()[0];

        this.handleChar();
    }

    changeTexture(texture, data) {
        super.changeTexture(texture, data);
        if (this.components[0]) this.components[0].changeTexture(texture, data);

        this.changeObjectSize({ width: this.objectSize.width, height: this.objectSize.height });
    }

    onAnimationDone(draw) {
        // if (this.texture == openPortalTexture) {
        //     if (draw.frameDirection == -1) {
        //         draw.stopAnimation = true;
        //         this.closed = true;
        //         return true;
        //     }

        //     this.closed = false;
        //     this.changeTexture(idlePortal);
        // }

        // if (this.texture == idlePortal) {
        //     this.onTheSpot = true;
        // }
    }

    enter() {
        //this.changeTexture(openPortalTexture);
        this.move.setDestiny({
            x: 500,
            onDoneMoving: () => {
                this.onTheSpot = true;
            }
        });
    }

    exit() {
        //this.changeTexture(openPortalTexture, { frameDirection: -1 });
        this.onTheSpot = false;
        this.move.setDestiny({
            x: -this.objectSize.width * 2,
            onDoneMoving: () => {
            }
        });
    }

}