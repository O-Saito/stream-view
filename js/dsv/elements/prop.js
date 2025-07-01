import Element from '../element.js';
import game from '../game.js';
import engine from '../engine.js';
import def from '../animations/propDefinitions.js';
import { propsDefinition } from '../atlasManager.js';

export default class Prop extends Element {
    constructor({ type, size, position, texture, depth, reverse, shoudntEnable }) {
        super({ type: type ?? 'Prop', index: game.getPropList().length, size: size, position: position, depth });
        this.texture = texture;
        this.vertexPositions = [];
        if(!this.texCoordOffset) this.texCoordOffset = { x: 0, y: 0 };
        if(!this.imageSize) this.imageSize = { width: 0, height: 0 };
        if(!this.objectSize) this.objectSize = { width: 0, height: 0 };
        this.reverse = reverse;

        this.changeTexture(texture);

        game.addProp(this, game.getPropList().length);
        if (!shoudntEnable) this.enable();
    }

    update() {
        super.update();
        engine.programData['prop'].updateTransformPart(this);
    }

    onEnable() {
        engine.programData['prop'].addToTransform(this);
    }

    onRemove() {
        game.removeProp(this);
    }

    changeTexture(texture) {
        let ref = def.props;
        let oSize = { width: 0, height: 0 };

        if (ref[this.type]) {
            const d = ref[this.type];
            ref = ref[this.type];
            if (d.size) {
                this.size.width = d.size.w;
                this.size.height = d.size.h;
            }

            if(d.objectSize) {
                oSize.width = d.objectSize.w;
                oSize.height = d.objectSize.h;
            }
        }
        if (ref[texture]) {
            const d = ref[texture];
            if (d.size) {
                this.size.width = d.size.w;
                this.size.height = d.size.h;
            }
            
            if(d.objectSize) {
                oSize.width = d.objectSize.w;
                oSize.height = d.objectSize.h;
            }
            
        }

        if(oSize.width == 0) oSize.width = this.size.width;
        if(oSize.height == 0) oSize.height = this.size.height;

        const prop = propsDefinition.srcs[texture];
        if(!prop) {
            console.log('prop not found! ' + texture);
        }
        this.texCoordOffset = { x: prop.ow, y: prop.oh };
        this.imageSize = { width: prop.w, height: prop.h };
        this.objectSize = { width: oSize.width, height: oSize.height };
        this.texture = texture;

        this.changeObjectSize({ width: oSize.width, height: oSize.height });
    }

    addEffect(effect, data) {
        if(!this.effects) this.effects = {};
        this.effects[effect] = data;
    }

    changeObjectSize({ width, height }) {
        this.objectSize = { width: width, height: height };
        this.vertexPositions = [
            0, 0, 0, 0,
            this.objectSize.width, 0, this.size.width, 0,
            0, this.objectSize.height, 0, this.size.height,
            this.objectSize.width, 0, this.size.width, 0,
            this.objectSize.width, this.objectSize.height, this.size.width, this.size.height,
            0, this.objectSize.height, 0, this.size.height,
        ];
    }

    flipedX() {
        return this.reverse && this.reverse.x ? !super.flipedX() : super.flipedX();
    }

    flipedY() {
        return this.reverse ? this.reverse.y : false;
    }

}