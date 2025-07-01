import Prop from './prop.js'
import game from '../game.js'
import SimpleDraw from '../components/simpleDraw.js';
import engine from '../engine.js';

export default class Fogueira extends Prop {
    constructor({ size, position, imageSize, texCoordOffset, texture, depth }) {
        super({ type: 'Fogueira', size, position, imageSize, texCoordOffset, texture, depth, shoudntEnable: true });

        this.isLightSource = true;
        this.components.push(new SimpleDraw(this, this.texture));
        // this.lightId = engine.addLight({
        //     pos: {
        //         x: this.position.x + this.objectSize.width / 2,
        //         y: this.position.y - this.objectSize.height / 2,
        //         z: 1
        //     },
        //     color: { r: 1, g: 0, b: 0 },
        //     intensity: 1.0,
        //     radius: this.objectSize.width > this.objectSize.height ? this.objectSize.width : this.objectSize.height,
        //     objectId: this.localGlobalId,
        // });
        this.lightId = engine.addLight({
            pos: { x: this.position.x + Math.ceil(this.objectSize.width / 2), y: this.position.y, z: 1 },
            color: { r: 214/255, g: 136/255, b: 0/255 }, 
            intensity: 2.0, 
            radius: 250.0, 
            objectId: this.localGlobalId,
        });
        this.enable();
    }

    update() {
        super.update();
        const  l = engine.getLight(this.lightId);
        if(!l) return;
        l.pos.x = this.position.x+ Math.ceil(this.objectSize.width / 2);
        l.pos.y = this.position.y;
    }
}