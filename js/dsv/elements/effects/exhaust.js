import Prop from '../prop.js'
import engine from '../../engine.js'
import SimpleDraw from '../../components/simpleDraw.js';

export default class Exhaust extends Prop {

    static defaultTexture = "/world/effect/exhaust.png";

    constructor({ position, effectId, parent }) {
        super({ type: 'Exhaust', size: parent.size, position, imageSize: parent.size, texture: Exhaust.defaultTexture, shoudntEnable: true });

        this.effectId = effectId;
        this.components.push(new SimpleDraw(this, this.texture, null, { frameDelay: 25 }));
        this.enable();
    }

    onEnable() {
        super.onEnable();
    }

    update() {
        super.update();

        this.depth = this.parent.depth - 0.2;
        this.position.x = this.parent.position.x + (this.parent.movingDirection > 0 ? 4 : 7 );
        this.position.y = this.parent.position.y;
    }
}