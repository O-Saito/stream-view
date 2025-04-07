import Element from '../element.js';
import game from '../game.js';
import engine from '../engine.js';
import def from '../animations/propDefinitions.js';
import { dynamicPropDefinition } from '../atlasManager.js';
import { atlases } from '../atlasManager.js';

export default class DyProp extends Element {
    constructor({ type, size, position, texture, depth, reverse, shoudntEnable, childrens, parent }) {
        super({ type: type ?? 'DyProp', index: game.getDyPropList().length, size: size, position: position, depth });
        this.texture = texture;
        this.vertexPositions = [];
        if (!this.texCoordOffset) this.texCoordOffset = { x: 0, y: 0 };
        if (!this.imageSize) this.imageSize = { width: 0, height: 0 };
        if (!this.objectSize) this.objectSize = { width: 0, height: 0 };
        this.reverse = reverse;

        if (parent) this.parent = parent;
        else game.addDyProp(this);

        this.changeTexture(texture);

        if (childrens)
            for (let i = 0; i < childrens.length; i++) {
                const c = childrens[i];
                const el = new DyProp({ type, size, position: { x: 0, y: 0 }, texture: c, depth, reverse, parent: this });
                this.addElement(el);
            }

        if (!shoudntEnable) this.enable();
    }

    addEffect(effect, data) {
        if(!this.effects) this.effects = {};
        this.effects[effect] = data;
    }

    update() {
        super.update();

        if (this.effects?.cut) {
            if (!this.noeffect) this.noeffect = {
                objectSize: { width: this.objectSize.width, height: this.objectSize.height },
                size: { width: this.size.width, height: this.size.height },
                texCoordOffset: { x: this.texCoordOffset.x, y: this.texCoordOffset.y }
            }
            let w = this.effects.cut.x - (this.position.x + (this.parent?.position.x ?? 0));
            if (w <= 0) w = 0;
            if (w >= this.noeffect.objectSize.width) {
                w = this.noeffect.objectSize.width;
                this.effects.cut = undefined;
            }
            this.size.width = this.noeffect.size.width * (w / this.noeffect.objectSize.width);
            if (this.flipedX()) this.texCoordOffset.x = this.noeffect.texCoordOffset.x + (this.noeffect.size.width - this.size.width);
            this.changeObjectSize({ width: w });
        }

        engine.programData['dyprop'].updateTransformPart(this);
    }

    onEnable() {
        engine.programData['dyprop'].addToTransform(this);
    }

    onRemove() {
        engine.programData['dyprop'].removeTransformPart(this);
        if(!this.parent) game.removeDyProp(this);
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

            if (d.objectSize) {
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

            if (d.objectSize) {
                oSize.width = d.objectSize.w;
                oSize.height = d.objectSize.h;
            }

        }

        if (oSize.width == 0) oSize.width = this.size.width;
        if (oSize.height == 0) oSize.height = this.size.height;

        const prop = dynamicPropDefinition.srcs[texture];
        // if(!prop) {
        //     setTimeout(() => { this.changeTexture(texture) }, 500);
        //     return;
        // }
        this.texCoordOffset = { x: prop.ow, y: prop.oh };
        this.imageSize = { width: prop.w, height: prop.h };
        this.objectSize = { width: oSize.width, height: oSize.height };
        this.texture = texture;

        this.changeObjectSize({ width: oSize.width, height: oSize.height });
    }

    changeObjectSize({ width, height }) {
        if (!width && width != 0) width = this.objectSize.width;
        if (!height && height != 0) height = this.objectSize.height;
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