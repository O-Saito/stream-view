function isBetween(a, b, c) {
    if (b > c) {
        b = b ^ c;
        c = b ^ c;
        b = b ^ c;
    }
    return a >= b && a <= c;
}

export default class MakeMoveableComponent {
    constructor(parent, { precision }) {
        this.parent = parent;
        this.destiny = null;
        this.precision = precision ?? 5;

        this.parent.move = this;
        if (!this.parent.movementSpeed) this.parent.movementSpeed = 1;

        this.onDoneMoving = [];
        this.onAbort = [];
    }

    setDestiny({ x, onDoneMoving, onAbort, cinematicId }) {
        if(this.parent.currentCinematic && this.parent.currentCinematic.id != cinematicId) return;
        if(this.destiny) {
            this.destiny = null;
            this.onDoneMoving.length = 0;
            for (let i = 0; i < this.onAbort.length; i++) {
                this.onAbort[i]();
            }
            this.onAbort.length = 0;
        }
        this.destiny = { x: x };
        if (onDoneMoving) this.onDoneMoving.push(onDoneMoving);
        if (onAbort) this.onAbort.push(onAbort);
    }

    update() {
        if (this.destiny == null) return;
        const diff = Math.abs(this.parent.position.x - this.destiny.x);
        if (diff <= this.precision) {
            this.destiny = null;
            this.onDoneMoving.forEach(x => x(this.parent));
            this.onDoneMoving.length = 0;
            return;
        }

        this.parent.movingDirection = this.parent.position.x > this.destiny.x ? -1 : 1;
        let nextPositionX = this.parent.movingDirection * this.parent.movementSpeed;
        if (!isBetween(this.parent.position.x + nextPositionX, this.destiny.x, this.parent.position.x)) this.parent.position.x = this.destiny.x;
        else this.parent.position.x += nextPositionX;
    }
}