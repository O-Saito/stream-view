import charAnimation from '../animations/charAnimation.js';

const animationParts = charAnimation.animationParts;
const animationGroup = charAnimation.groupToParts;

const partsName = [
    'helmet', 'head', 'body', 'legs', 'face', 'capeBack',
];

function createPartData() {
    return {
        skippedFrame: 0,
        currentFrame: 0,
        skipFrame: 12,
        frames: 6,
        isNotSpriteAnimated: false,
        texOffset: [
            { x: 0 },
        ],
    };
}

class MakeMoveableComponent {
    constructor(parent) {
        this.parent = parent;
        this.destiny = null;
    }

    setDestiny({ x }) {
        this.destiny = { x: x };
    }

    update() {
        if (this.destiny == null) return;
        const diff = Math.abs(this.parent.position.x - this.destiny.x);
        if(diff <= 5) {
            this.destiny = null;
            return;
        }

        this.parent.movingDirection = this.parent.position.x > this.destiny.x ? -1 : 1;
        this.parent.position.x += this.parent.movingDirection;
    }
}

class AnimationControllerComponent {
    constructor(parent) {
        this.parent = parent;

        this.partsName = partsName;
        this.parts = {}
        for (let i = 0; i < partsName.length; i++) {
            const pn = partsName[i];
            this.parts[pn] = createPartData();
        }
    }

    update() {
        partsName.forEach(x => {
            const part = this.parts[x];
            part.skippedFrame++;
            if (part.skippedFrame >= part.skipFrame) {
                part.currentFrame++;
                part.skippedFrame = 0;
            }
            if (part.currentFrame >= part.frames)
                part.currentFrame = 0;
        });
    }

    changeAnimationByGroup(groupName, animationName) {
        const animeGroups = animationGroup[groupName];
        for (let i = 0; i < animeGroups.length; i++) {
            this.changeAnimation(animeGroups[i], animationName);
        }
    }

    changeAnimation(partName, animationName) {
        const animePart = animationParts[partName];
        const anime = animePart[animationName] ?? animePart['default'];
        const part = this.parts[partName];
        if (!anime) {
            console.log(anime);
        }
        part.skipFrame = anime.skipFrame ?? 12;
        part.frames = anime.frameCount ?? anime.frames.length;
        part.isNotSpriteAnimated = anime.isNotSpriteAnimated;
        part.texOffset = [];
        for (let i = 0; i < anime.frames.length; i++) {
            const animeFrames = anime.frames[i];
            part.texOffset.push({ ...animeFrames });
            if (anime.defaultFrames) {
                if (part.texOffset[i].x != null) part.texOffset[i].x += (anime.defaultFrames.x ?? 0);
                if (part.texOffset[i].y != null) part.texOffset[i].y += (anime.defaultFrames.y ?? 0);
                if (part.texOffset[i].ax != null) part.texOffset[i].ax += (anime.defaultFrames.ax ?? 0);
                if (part.texOffset[i].ay != null) part.texOffset[i].ay += (anime.defaultFrames.ay ?? 0);
            }
        }
    }

}

let index = 0;

export default class Character {
    constructor() {
        this.index = index++;
        this.currentFrame = 0;
        this.position = { x: 400, y: 0 };
        this.size = { width: 32, height: 32 };
        this.components = [];

        this.preset = {
            head: '/char/body/skeleton/new_head.png',
            body: '/char/body/skeleton/new_body.png',
            legs: '/char/body/skeleton/new_legs.png',
            //face: '/char/props-especial/face/moustache.png',
            capeBack: '/char/props-especial/cape/cape_back.png',
            capeFront: '/char/props-especial/cape/cape_front.png',
            helmet: '/char/props/helmet/coroa.png',
        };

        this.move = new MakeMoveableComponent(this);
        this.animationController = new AnimationControllerComponent(this);
        this.components.push(this.move);
        this.components.push(this.animationController);
    }

    update() {
        this.components.forEach(x => x.update());
    }
}
