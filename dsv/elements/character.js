import charAnimation from '../animations/charAnimation.js';
import Element from '../element.js';
import MakeMoveableComponent from '../components/makeMoveable.js';
import { charDefinitions } from '../atlasManager.js';
import engine from '../engine.js';
import game from '../game.js';
import Portal from './portal.js';
import Wagon from './wagon.js';

const animationParts = charAnimation.animationParts;
const animationGroup = charAnimation.groupToParts;
const groupToPartDefs = charAnimation.groupToPartDefs;

let cinematicId = 1;

const partsName = [
    'helmet', 'head', 'body', 'legs', 'face', 'capeBack',
];

const actionHandler = {
    'move_around': (char) => {
        if (char.move.destiny) return;
        if (char.userData.userId == '145590747') {
            if (Math.random() >= 0.5) {
                char.actionData.cd = 60;
                return;
            }
        }
        const maxPixel = 500;
        const half = (maxPixel / 2);
        let nextPos = char.position.x + Math.floor(Math.random() * maxPixel) - half;
        if (nextPos <= 0) nextPos += half;
        if (nextPos >= engine.canvas.width) nextPos -= half;
        char.move.setDestiny({ x: nextPos });
    }
};

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
        const groupByPart = Object.getOwnPropertyNames(animationGroup).find(x => animationGroup[x].find(y => y == partName));
        const groupToPart = groupToPartDefs[this.parent.preset[groupByPart]] ?? {};
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
                if (part.texOffset[i].ax != null) part.texOffset[i].ax += (anime.defaultFrames.ax ?? 0) + (groupToPart[partName]?.x ?? 0);
                if (part.texOffset[i].ay != null) part.texOffset[i].ay += (anime.defaultFrames.ay ?? 0) + (groupToPart[partName]?.y ?? 0);
            }
        }
    }

}

class Dialog {
    constructor() {
        this.dialogs = {};
        this.emotes = {};
    }

    add(userId, dialog, data) {
        if (!this.dialogs[userId]) this.dialogs[userId] = [];
        if (data?.emotes) {
            data.emotes.forEach(x => {
                if (x == null || this.emotes[x.identity]) return;
                this.emotes[x.identity] = new Image();
                this.emotes[x.identity].src = x.url;
                this.emotes[x.identity].name = x.name;
            });
        }
        this.dialogs[userId].push(data?.message ?? dialog);
    }

    getNext(userId) {
        return this.dialogs[userId]?.shift();
    }
}

export default class Character extends Element {

    static dialogs = new Dialog();
    static spawnType = { position: 0, portal: 1, wagon: 2 };

    constructor({ position, userData, spawnType }) {
        const index = game.getCharList().length;
        const depth = engine.options.charDepth;

        super({ type: 'Character', index: index, size: { width: 32, height: 32 }, position: position, depth: depth });

        if (!userData) userData = {};
        if (!userData.userId) userData.userId = `NotDefined${index}`;
        if (!userData.username) userData.username = 'Not Defined';
        if (!userData.name) userData.name = 'Not Defined';
        //userData.dialog = "Um teste bem testadinho";

        let preset = userData.preset;
        if (!preset) preset = {};

        if (!preset.head) preset.head = '/char/body/skeleton/new_head.png';
        if (!preset.body) preset.body = '/char/body/skeleton/new_body.png';
        if (!preset.legs) preset.legs = '/char/body/skeleton/new_legs.png';

        this.preset = preset;
        this.userData = userData;

        this.currentFrame = 0;
        this.move = new MakeMoveableComponent(this, { precision: 5 });
        this.movementSpeed = 1;
        this.animationController = new AnimationControllerComponent(this);
        this.components.push(this.move);
        this.components.push(this.animationController);
        this.spawned = false;

        this.lastPosition = { x: this.position.x, y: this.position.y };

        this.animation = null;

        this.currentCinematic = null;
        this.cinematics = [];

        this.controlledBy = 'ia';
        this.action = 'idle';
        this.actionData = { cd: 0 };

        game.addChar(this);

        if (spawnType != Character.spawnType.position) {
            if (spawnType == Character.spawnType.portal) {
                Portal.spawnManager.makeSpawn('char', this);
            }
            if (spawnType == Character.spawnType.wagon) {
                Wagon.spawnManager.makeSpawn('char', this);
            }
            this.position.x = engine.canvas.width;
            this.enable();
            return;
        }

        this.spawned = true;
        this.enable();
    }

    onEnable() {
        engine.programData['char'].addToTransform(this, game.getCharList().length);

        this.animationController.changeAnimationByGroup('head', 'idle');
        this.animationController.changeAnimationByGroup('body', 'idle');
        this.animationController.changeAnimationByGroup('legs', 'idle');
        this.animationController.changeAnimationByGroup('back', 'idle');
    }

    onRemove() {
        game.removeChar(this);
    }

    update() {
        super.update();
        engine.programData['char'].updateTransformPart(this, charDefinitions);

        this.animationController.changeAnimationByGroup('head', 'idle');
        this.animationController.changeAnimationByGroup('body', 'idle');
        this.animationController.changeAnimationByGroup('legs', 'idle');
        this.animationController.changeAnimationByGroup('back', 'idle');

        if (this.lastPosition.x != this.position.x || this.lastPosition.y != this.lastPosition.y) {
            this.lastPosition.x = this.position.x;
            this.lastPosition.y = this.position.y;

            this.animationController.changeAnimationByGroup('head', 'walk');
            this.animationController.changeAnimationByGroup('body', 'walk');
            this.animationController.changeAnimationByGroup('legs', 'walk');
            this.animationController.changeAnimationByGroup('back', 'walk');
        }

        if (!this.spawned) return;

        engine.requestUIDraw({
            depth: this.depth, f: ({ c, ctx }) => {
                try {
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = 'black';

                    ctx.fillStyle = 'white';
                    ctx.font = "300 18px customFont";

                    let metrics = ctx.measureText(this.userData.name);
                    let textWidth = metrics.width;
                    const pos = {
                        x: this.position.x - ((textWidth - this.size.width) / 2),
                        y: engine.canvas.height - (this.position.y - engine.options.charNameOffset)
                    };

                    ctx.fillText(this.userData.name, pos.x, pos.y);
                } catch (error) {
                    console.error(error);
                }
            }
        });

        if (!this.userData.dialog) this.userData.dialog = Character.dialogs.getNext(this.userData.userId);

        if (this.userData.dialog) {
            engine.requestUIDraw({
                depth: 999, f: ({ c, ctx }) => {
                    try {
                        ctx.font = "800 18px customFont";
                        if (typeof (this.userData.dialog) == 'string') {
                            let metrics = ctx.measureText(this.userData.dialog);
                            let textWidth = metrics.width;
                            let fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
                            let emotesOrder = [];

                            if (this.userData.dialog.includes("{EMOTE[")) {
                                // let i = this.userData.dialog.indexOf(x);
                                // while (i != -1) {
                                //     this.userData.dialog = this.userData.dialog.replace(x, "...");
                                //     i = this.userData.dialog.indexOf(x);
                                //     emotesOrder.push(emote);
                                // }
                                Object.getOwnPropertyNames(Character.dialogs.emotes).forEach(x => {
                                    const times = this.userData.dialog.split(x).length - 1;
                                    if (times == 0) return;
                                    this.userData.dialog = this.userData.dialog.replaceAll(x, "");
                                });
                                while (this.userData.dialog.indexOf('  ') != -1)
                                    this.userData.dialog = this.userData.dialog.replaceAll('  ', ' ');

                                metrics = ctx.measureText(this.userData.dialog);
                                textWidth = metrics.width;
                                fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
                            }

                            let texts = [];
                            if (textWidth > 200) {
                                textWidth = 0;
                                const words = this.userData.dialog.split(' ');

                                let text = '';
                                let lineSize = 0;
                                for (let i = 0; i < words.length; i++) {
                                    const word = words[i] + ' ';
                                    let w = ctx.measureText(word).width;
                                    lineSize += w;

                                    if (lineSize <= 200) {
                                        text += word;
                                    } else {
                                        text += word;
                                        texts.push(text);
                                        if (texts.length >= 3) {
                                            texts[2] += "..."
                                            break;
                                        }
                                        text = '';

                                        // pegando a maior linha
                                        if (textWidth < lineSize) textWidth = lineSize;

                                        lineSize = w;
                                    }
                                }

                                if (text != '' && texts.length <= 2) texts.push(text);

                            } else {
                                texts.push(this.userData.dialog);
                            }

                            this.userData.dialog = {
                                text: [...texts],
                                height: Math.ceil(fontHeight),
                                width: Math.ceil(textWidth),
                                currentFrame: 0,
                                frames: metrics.width * 2,
                            };
                        }

                        const bounds = { rt: 10, rb: 0, lt: 10, lb: 10 };
                        const pos = { x: this.position.x + this.size.width, y: engine.canvas.height - (this.position.y + this.size.height + 5) };
                        const size = {
                            h: (this.userData.dialog.height) * this.userData.dialog.text.length + 5,
                            w: this.userData.dialog.width + 10
                        };

                        if (pos.x + size.w >= engine.canvas.width) {
                            pos.x -= size.w + this.size.width;
                            bounds.rb = 10;
                            bounds.lb = 0;
                        }

                        pos.y -= size.h;

                        pos.x = Math.ceil(pos.x);
                        pos.y = Math.ceil(pos.y);

                        // cria a area
                        ctx.beginPath();
                        ctx.roundRect(pos.x, pos.y, size.w, size.h, [bounds.lt, bounds.rt, bounds.lb, bounds.rb]);
                        ctx.lineWidth = 4;
                        ctx.strokeStyle = "black";
                        ctx.stroke();

                        // cria o background
                        ctx.save();
                        ctx.clip();
                        ctx.fillStyle = 'white';
                        ctx.fillRect(pos.x, pos.y, size.w, size.h);
                        ctx.restore();

                        let offset = 0;
                        for (let i = 0; i < this.userData.dialog.text.length; i++) {
                            const text = this.userData.dialog.text[i];
                            ctx.fillStyle = 'black';
                            ctx.fillText(text, Math.ceil(pos.x + 5), Math.ceil(offset + pos.y + this.userData.dialog.height));
                            offset += this.userData.dialog.height
                        }

                        this.userData.dialog.currentFrame++;
                        if (this.userData.dialog.currentFrame >= this.userData.dialog.frames) this.userData.dialog = null;
                    } catch (error) {
                        console.error(error);
                    }
                }
            });
        }

        if (!this.currentCinematic) {
            this.currentCinematic = this.cinematics.sort((a, b) => a - b).shift();
        }

        if (this.currentCinematic) {
            if (!this.currentCinematic.rotine.started) {
                this.currentCinematic.rotine.started = true;
                this.currentCinematic.rotine.action(this, () => {
                    this.currentCinematic = null;
                });
            }
            return;
        }

        if (this.controlledBy == 'ia') {
            this.action = 'move_around';
        }

        if (this.actionData.cd >= 0) {
            this.actionData.cd -= 1;
            return;
        }
        if (actionHandler[this.action]) {
            actionHandler[this.action](this);
        }
    }

    flipedX() {
        return this.movingDirection == -1;
    }

    startCinematic({ priority, rotine }) {
        if (!priority) priority = 1;
        let id = cinematicId++;
        this.cinematics.push({ id: id, priority, rotine });
        return id;
    }

    changePreset(preset) {
        const apply = (item) => {
            if (!preset[item]) return;
            if (preset[item] == 'remove') {
                delete this.preset[item];
                return;
            }
            if (preset[item]) this.preset[item] = preset[item];
        }
        Object.getOwnPropertyNames(preset).forEach(x => {
            apply(x);
        });
    }

}
