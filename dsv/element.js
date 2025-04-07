import { propsDefinition } from './atlasManager.js';

export default class Element {
    constructor({ index, size, position, type, depth }) {
        if (!size) size = {};
        if (!size.width) size.width = 0;
        if (!size.height) size.height = 0;
        if (!position) position = {};
        if (!position.x) position.x = 0;
        if (!position.y) position.y = 0;

        this.isEnable = false;
        this.index = index;
        this.movingDirection = 1;
        this.position = { x: position.x, y: position.y };
        this.size = { width: size.width, height: size.height };
        this.objectSize = { width: size.width, height: size.height };
        this.depth = depth ?? 1;
        this.isLightSource = false;
        this.naturalFlipX = false;

        this.type = type;
        this.components = [];
        this.elements = [];
    }

    enable() {
        this.isEnable = true;
        if (this.onEnable) this.onEnable();
    }

    remove() {
        this.elements.forEach(x => x.remove());
        if(this.onRemove) this.onRemove();
    }

    update() {
        this.components.forEach(x => x.update());
        this.elements.forEach(x => x.update());
    }

    addElement(el) {
        el.parent = this;
        el.index = this.elements.length + 1;
        this.elements.push(el);
    }

    flipedX() {
        return this.naturalFlipX == true;
    }

    fullObjectSize() {
        return {
            width: this.objectSize.width + (this.elements.length > 0 ? this.elements.map(x => x.objectSize.width).reduce((a, b) => a + b) : 0),
            height: this.objectSize.height + (this.elements.length > 0 ? this.elements.map(x => x.objectSize.height).reduce((a, b) => a + b) : 0),
        };
    }

}
