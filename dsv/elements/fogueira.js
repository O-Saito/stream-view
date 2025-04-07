import Prop from './prop.js'
import game from '../game.js'
import SimpleDraw from '../components/simpleDraw.js';

export default class Fogueira extends Prop {
    constructor({ size, position, imageSize, texCoordOffset, texture, depth }) {
        super({ type: 'Fogueira', size, position, imageSize, texCoordOffset, texture, depth, shoudntEnable: true });

        this.isLightSource = true;
        this.components.push(new SimpleDraw(this, this.texture));
        this.enable();
    }
}