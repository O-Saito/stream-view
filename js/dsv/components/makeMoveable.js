import game from '../game.js'
import engine from '../engine.js';

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
        if (!this.parent.jumpForce) this.parent.jumpForce = 1;

        this.onDoneMoving = [];
        this.onAbort = [];
        this.onDoneJumping = [];
        this.onAbortJumping = [];
    }

    setDestiny({ x, y, onDoneMoving, onAbort, onDoneJumping, onAbortJumping, cinematicId }) {
        if(this.parent.userData?.userId == "443917743") {
            console.log('here');
        }
        if(this.parent.currentCinematic && this.parent.currentCinematic.id != cinematicId) return;
        if(this.destiny) {
            this.destiny = null;
            this.onDoneMoving.length = 0;
            for (let i = 0; i < this.onAbort.length; i++) {
                this.onAbort[i]();
            }
            this.onAbort.length = 0;
        }
        this.destiny = { x: x, y: y, origin : {...this.parent.position} };
        if (onDoneMoving) this.onDoneMoving.push(onDoneMoving);
        if (onAbort) this.onAbort.push(onAbort);
        if (onDoneJumping) this.onDoneJumping.push(onDoneJumping);
        if (onAbortJumping) this.onAbortJumping.push(onAbortJumping);
    }

    #tryClearDestiny(dir) {
        if(dir == 'x') this.destiny.x = null;
        if(dir == 'y') this.destiny.y = null;
        if(this.destiny.x == null && this.destiny.y == null) this.destiny = null;
    }

    update() {
        if (this.destiny == null) return;

        if(this.destiny.x) {
            if(this.parent.isOnArena) {
                if(this.destiny.x > game.arena.position.x + game.arena.size.width) this.destiny.x = game.arena.position.x + game.arena.size.width - this.parent.objectSize.width;
                if(this.destiny.x < game.arena.position.x) this.destiny.x = game.arena.position.x;
            }
            const diff = Math.abs(this.parent.position.x - this.destiny.x);
            if (diff <= this.precision) {
                this.#tryClearDestiny('x');
                this.onDoneMoving.forEach(x => x(this.parent));
                this.onDoneMoving.length = 0;
                return;
            }
    
            this.parent.movingDirection = this.parent.position.x > this.destiny.x ? -1 : 1;
            let nextPositionX = this.parent.movingDirection * this.parent.movementSpeed;
            //if(this.parent.position.x + nextPositionX <= 0) nextPositionX = 0;
            //if(this.parent.position.x + nextPositionX >= engine.canvas.width - this.parent.objectSize.width) nextPositionX = 0;
            if (!isBetween(this.parent.position.x + nextPositionX, this.destiny.x, this.parent.position.x)) 
                this.parent.position.x = this.destiny.x;
            else this.parent.position.x += nextPositionX;
        }

        if(this.destiny.y) {
            if(this.destiny.shouldFall) {
                if(!this.destiny.fallspeed) this.destiny.fallspeed = 1;
                //this.destiny.fallspeed += 1;
                this.parent.position.y -= this.destiny.fallspeed;
                if(this.parent.position.y <= this.destiny.origin.y) {
                    this.parent.position.y = this.destiny.origin.y;
                    this.#tryClearDestiny('y');
                    this.onDoneJumping.forEach(x => x(this.parent));
                    this.onDoneJumping.length = 0;
                }
                return;
            }
            if (this.parent.position.y > this.destiny.origin.y + this.destiny.y) {
                this.destiny.shouldFall = true;
            }
            this.parent.position.y += 1;
        }

    }
}