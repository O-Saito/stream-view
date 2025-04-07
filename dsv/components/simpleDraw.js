import def from '../animations/propDefinitions.js'

function setPropByData(p, d) {
    if (d.skipFrames) p.frameDelay = d.skipFrames;
}

export default class SimpleDraw {
    constructor(parent, texture, onAnimationDone) {
        this.parent = parent;

        this.onAnimationDone = onAnimationDone;
        this.stopAnimation = false;
        this.frameDirection = 1;
        this.frameDelay = 0;
        this.reset();

        this.changeTexture(texture);
    }

    update() {
        if (this.stopAnimation) {
            this.checkIfFrameIsOnScope();
            return;
        }
        this.currentFrameDelay++;

        if (this.frameDelay > this.currentFrameDelay) return;

        this.currentFrameDelay = 0;
        this.parent.currentFrame += this.frameDirection;

        if (this.parent.currentFrame < 0) {
            if (this.onAnimationDone) if(this.onAnimationDone(this)) {
                this.checkIfFrameIsOnScope();
                return;
            }
            this.resetFrame();
        }
        if (this.parent.currentFrame * this.parent.size.width >= this.parent.imageSize.width) {
            if (this.onAnimationDone) if(this.onAnimationDone(this)) {
                this.checkIfFrameIsOnScope();
                return;
            }
            this.resetFrame();
        }
    }

    checkIfFrameIsOnScope() {
        if (this.parent.currentFrame < 0 || this.parent.currentFrame * this.parent.size.width >= this.parent.imageSize.width) {
            this.parent.currentFrame = this.frameDirection != 1 ? 0 : Math.floor(this.parent.imageSize.width / this.parent.size.width) - 1;
        }
    }

    resetFrame() {
        this.parent.currentFrame = this.frameDirection == 1 ? 0 : Math.floor(this.parent.imageSize.width / this.parent.size.width) -1;
    }

    reset() {
        this.resetFrame();
        this.currentFrameDelay = 0;
        this.stopAnimation = false;
    }

    changeTexture(texture, { frameDirection = 1 } = {}) {
        const type = this.parent.constructor.name;

        this.frameDirection = frameDirection;

        let ref = def.props;
        if (ref[type]) {
            setPropByData(this, ref[type]);
            ref = ref[type];
        }
        if (ref[texture]) {
            setPropByData(this, ref[texture]);
        }

        this.reset();
    }
}