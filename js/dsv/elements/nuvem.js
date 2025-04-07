import Prop from './prop.js'
import engine from '../engine.js'
import MakeMoveable from '../components/makeMoveable.js';

export default class Nuvem extends Prop {

    static defaultTexture = "/world/natural/nuvem.png";

    constructor({ size, position, imageSize, texCoordOffset, texture, depth }) {
        super({ type: 'Nuvem', size, position, imageSize, texCoordOffset, texture, depth, shoudntEnable: true });

        this.components.push(new MakeMoveable(this, {}));
        this.enable();
    }

    onEnable() {
        super.onEnable();
        this.changeObjectSize({ width: this.objectSize.width /2 , height: this.objectSize.height / 2 });

        this.move.setDestiny({
            x: engine.canvas.width + this.objectSize.width, 
            onDoneMoving: (o) => {
                o.remove();
            }
        });
    }
}