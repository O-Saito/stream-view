import Prop from '../prop.js'
import engine from '../../engine.js'
import game from '../../game.js'

export default class Arrow extends Prop {

    static defaultTexture = "/world/atk/flecha.png";

    constructor({ parent, force = 40 }) {
        super({ type: 'Arrow', size: parent.size, position: parent.position, imageSize: parent.size, texture: Arrow.defaultTexture, shoudntEnable: true });

        this.shoot = false;
        this.depth = parent.depth - 0.2;
        this.direction = parent.movingDirection;
        this.force = force;
        this.travelled = 0;
        if (this.direction == -1) this.naturalFlipX = true;
        this.enable();
    }

    onEnable() {
        super.onEnable();
    }

    update() {
        super.update();

        if (!this.shoot) return;

        const dist = 2;
        this.travelled += dist;
        this.position.x += (dist * this.direction);
        if (this.travelled >= this.force) {
            this.travelled = 0;
            this.position.y -= 1;
            if (this.position.y <= game.getProp(game.getFloorList()[0]).position.y - 2) {
                this.remove();
            }
        }

        game.getCharList().forEach(char => {
            if (char == this.parent || !char.isOnCombat) return;

            if (!this.parent.checkHitBox({ x: this.position.x, width: this.size.width }, char)) return;
            char.takeDamage({ source: this, damage: 1 });
            this.remove();
        });
    }

    onRemove() {
        super.onRemove();
        this.shoot = false;
    }

    onUse() {
        this.shoot = true;
    }

}