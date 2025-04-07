import DyProp from './dyProp.js'
import engine from '../engine.js'
import MakeMoveable from '../components/makeMoveable.js';
import Portal from './portal.js'
import def from '../animations/propDefinitions.js';
import { dynamicPropDefinition } from '../atlasManager.js';

export default class Emote extends DyProp {

    constructor({ size, position, imageSize, texCoordOffset, texture, depth, src, childrens }) {
        super({ type: 'Emote', size, position, imageSize, texCoordOffset, texture, depth, src, childrens, shoudntEnable: true });

        this.move = new MakeMoveable(this, {});
        this.components.push(this.move);

        this.position.x = engine.canvas.width;
        Portal.spawnManager.makeSpawn('prop', this);
        this.enable();
    }

    onEnable() {
        super.onEnable();
        this.changeObjectSize({ width: this.size.width / 2, height: this.size.height / 2 });
        this.elements.forEach((x, i) => {
            x.changeObjectSize({ width: this.size.width / 2, height: this.size.height / 2 });
            x.position.x = this.objectSize.width * (i + 1);
        });

        const dino = "https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_dcd06b30a5c24f6eb871e8f5edbd44f7/default/light/2.0";
        if(this.texture == dino)
            this.naturalFlipX = true;

        this.elements.forEach(x => {
            if(x.texture == dino) x.naturalFlipX = true;
        })
    }
}