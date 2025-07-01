import charAnimation from '../animations/charAnimation.js';
import Element from '../element.js';
import MakeMoveableComponent from '../components/makeMoveable.js';
import { charDefinitions } from '../atlasManager.js';
import engine from '../engine.js';
import game from '../game.js';
import Portal from './portal.js';
import Wagon from './wagon.js';
import Exhaust from './effects/exhaust.js';
import Arrow from './ammo/arrow.js';
import charHelpers from '../helpers/characterHelper.js';

const animationParts = charAnimation.animationParts;
const animationGroup = charAnimation.groupToParts;
const groupToPartDefs = charAnimation.groupToPartDefs;

let cinematicId = 1;
let effectId = 1;

const partsName = [
    'helmet', 'head', 'body', 'legs', 'face', 'capeFront', 'capeBack', 'weapon', 'second_weapon', 'chest', 'pants'
];

function createPartData() {
    return {
        skippedFrame: 0,
        currentFrame: 0,
        skipFrame: 12,
        frames: 6,
        isNotSpriteAnimated: false,
        freezeFrameOnEnd: false,
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
        const sameFrameCount = {};
        partsName.forEach(x => {
            const part = this.parts[x];
            part.skippedFrame++;
            if (part.skippedFrame >= part.skipFrame) {
                part.currentFrame++;
                part.skippedFrame = 0;
            }
            if (part.currentFrame >= part.frames)
                part.currentFrame = part.freezeFrameOnEnd ? part.frames - 1 : 0;

            if (sameFrameCount[part.frames]) {
                if (sameFrameCount[part.frames][0].skipFrame == part.skipFrame) {
                    //if(part.currentFrame != sameFrameCount[part.frames][0].currentFrame) console.log('diff')
                    part.currentFrame = sameFrameCount[part.frames][0].currentFrame;
                }

            }

            if (!sameFrameCount[part.frames]) sameFrameCount[part.frames] = [];
            sameFrameCount[part.frames].push(part);
        });
    }

    resetFrames() {
        partsName.forEach(x => {
            const part = this.parts[x];
            part.currentFrame = 0;
            part.skippedFrame = 0;
        });
    }

    changeAnimationByGroup(groupName, animationName) {
        const animeGroups = animationGroup[groupName];
        for (let i = 0; i < animeGroups.length; i++) {
            this.changeAnimation(animeGroups[i], animationName);
        }
    }

    changeAnimation(partName, animationName) {
        const applyByObject = (to, from) => {
            Object.getOwnPropertyNames(from).forEach(x => {
                if (x == 'frameCount' || x == 'frames') return;
                to[x] = from[x];
            });
        }

        if (charAnimation.animationGroup[animationName]) {
            if (charAnimation.animationGroup[animationName].part[partName]) {
                animationName = charAnimation.animationGroup[animationName].part[partName];
            }
        }

        const proxy = animationParts[partName].proxy == null ? null : (animationParts[partName].proxy[this.parent.defaultPreset[partName]] ??
            Object.getOwnPropertyNames(animationParts[partName].proxy)
                .map(x => animationParts[partName].proxy[x])
                .find(x => x.shouldUse && x.shouldUse(this.parent)));

        const groupByPart = Object.getOwnPropertyNames(animationGroup).find(x => animationGroup[x].find(y => y == partName));
        const groupToPartDefault = groupToPartDefs.byDefaults[this.parent.defaultPreset[groupByPart]] ?? {};
        const groupToPart = groupToPartDefs[this.parent.preset[groupByPart]] ?? {};

        const baseAnimation = animationParts.base[animationName];
        const animePart = proxy ?? animationParts[partName];
        const anime = structuredClone(animePart[animationName] ?? animePart['default']);
        const part = this.parts[partName];

        if (this.parent.userData.userId == "1317911354") {
            //console.log('b')
        }

        if (!baseAnimation) console.log('missing baseAnimation');
        if (!anime) console.log('missing anime');
        if (!part) {
            console.log('missing part');
            return;
        }
        if (!animePart) console.log('missing animepart');
        if (!baseAnimation.frames) baseAnimation.frames = [];
        if (!anime.frames) anime.frames = [];


        if (!baseAnimation?.skipFrame) part.skipFrame = 12;
        applyByObject(part, baseAnimation);
        applyByObject(part, anime);
        part.frames = 0;
        if (baseAnimation.frameCount || baseAnimation.frames.length)
            part.frames = baseAnimation.frameCount ?? baseAnimation.frames.length;
        if (anime.frameCount || anime.frames.length)
            part.frames = anime.frameCount ?? anime.frames.length;

        part.texOffset = [];
        for (let i = 0; i < anime.frames.length; i++) {
            const animeFrames = anime.frames[i];
            part.texOffset.push({ ...animeFrames });
            if (part.texOffset[i].x == null) part.texOffset[i].x = 0;
            if (part.texOffset[i].y == null) part.texOffset[i].y = 0;
            if (part.texOffset[i].ax == null) part.texOffset[i].ax = 0;
            if (part.texOffset[i].ay == null) part.texOffset[i].ay = 0;
            if (anime.defaultFrames) {
                if (anime.defaultFrames.x) part.texOffset[i].x += anime.defaultFrames.x;
                if (anime.defaultFrames.y) part.texOffset[i].y += anime.defaultFrames.y;
                if (anime.defaultFrames.ax) part.texOffset[i].ax += anime.defaultFrames.ax;
                if (anime.defaultFrames.ay) part.texOffset[i].ay += anime.defaultFrames.ay;
            }

            if (groupToPartDefault[partName]) {
                if (groupToPartDefault[partName].x) part.texOffset[i].x += groupToPartDefault[partName].x;
                if (groupToPartDefault[partName].y) part.texOffset[i].y += groupToPartDefault[partName].y;
                if (groupToPartDefault[partName].ax) part.texOffset[i].ax += groupToPartDefault[partName].ax;
                if (groupToPartDefault[partName].ay) part.texOffset[i].ay += groupToPartDefault[partName].ay;
            }

            if (groupToPart[partName]) {
                if (groupToPart[partName].x) part.texOffset[i].x += groupToPart[partName].x;
                if (groupToPart[partName].y) part.texOffset[i].y += groupToPart[partName].y;
                if (groupToPart[partName].ax) part.texOffset[i].ax += groupToPart[partName].ax;
                if (groupToPart[partName].ay) part.texOffset[i].ay += groupToPart[partName].ay;
            }
        }
    }

}

class StatusMinMax {
    constructor({ min, max, current, onChange, onUp, onDown, onReachMin, onReachMax }) {
        this.min = min;
        this.max = max;
        this.current = current;
        this.listWhenChanges = [];
        this.listWhenUp = [];
        this.listWhenDown = [];
        this.listWhenReachMin = [];
        this.listWhenReachMax = [];

        if (onChange) this.onChange(onChange);
        if (onUp) this.onUp(onUp);
        if (onDown) this.onDown(onDown);
        if (onReachMin) this.onReachMin(onReachMin);
        if (onReachMax) this.onReachMax(onReachMax);
    }

    add(value) {
        const current = this.current;
        this.current += value;

        this.whenChanges();
        const diff = this.current - current;
        if (diff < 0) this.whenDown(diff * -1);
        if (diff > 0) this.whenUp(diff);

        if (this.current >= this.max) {
            this.current = this.max;
            if (current != this.current)
                this.whenReachMax();
        }
        if (this.current <= this.min) {
            this.current = this.min;
            if (current != this.current)
                this.whenReachMin();
        }
    }

    changeMax(value, { shouldRegen = false, regenQuantity = undefined } = {}) {
        this.max = value;
        if (shouldRegen) {
            if (!regenQuantity) this.add(this.max);
            else this.add(regenQuantity);
        }
    }

    whenChanges(value) {
        this.listWhenChanges.forEach(x => x(value));
    }
    whenUp(value) {
        this.listWhenUp.forEach(x => x(value));
    }
    whenDown(value) {
        this.listWhenDown.forEach(x => x(value));
    }
    whenReachMin(value) {
        this.listWhenReachMin.forEach(x => x(value));
    }
    whenReachMax(value) {
        this.listWhenReachMax.forEach(x => x(value));
    }

    onChange(func) {
        this.listWhenChanges.push(func);
    }
    onUp(func) {
        this.listWhenUp.push(func);
    }
    onDown(func) {
        this.listWhenDown.push(func);
    }
    onReachMin(func) {
        this.listWhenReachMin.push(func);
    }
    onReachMax(func) {
        this.listWhenReachMax.push(func);
    }
}

class Status {
    constructor(parent, { life: { min, max, current } = {} }) {
        this.parent = parent;
        const onLifeUp = (value) => {
            engine.textFade(value, {
                position: {
                    x: this.parent.position.x + (this.parent.objectSize.width / 2),
                    y: this.parent.position.y + this.parent.size.height
                },
                onFrameMoveDirection: { y: 0.6, },
                framesToFade: 90,
                rgb: { g: 255 },
                style: { strokeStyle: 'black', fontSize: '25px', lineWidth: 1 }
            });
        }
        const onLifeDown = (value) => {
            engine.textFade(value, {
                position: {
                    x: this.parent.position.x + (this.parent.objectSize.width / 2),
                    y: this.parent.position.y + this.parent.size.height
                },
                onFrameMoveDirection: { y: 0.4, x: 0.1 },
                framesToFade: 90,
                rgb: { r: 255 },
                style: { strokeStyle: 'black', fontSize: '25px', lineWidth: 1 }
            });
        }
        this.life = new StatusMinMax({ min, max, current, onUp: onLifeUp, onDown: onLifeDown, });
    }


}

export default class Character extends Element {

    static dialogs = new charHelpers.Dialog();
    static spawnType = { position: 0, portal: 1, wagon: 2 };
    static weaponTypes = { bow: 'arco', swordnShield: 'espada-escudo', sword: 'espada' };

    constructor({ position, userData, spawnType, team = null, isOnCombat = false }) {
        const index = game.getCharList().length;
        const depth = engine.options.charDepth;

        super({ type: 'Character', index: index, size: { width: 32, height: 32 }, position: position, depth: depth });

        if (!userData) userData = {};
        if (!userData.userId) userData.userId = `NotDefined${index}`;
        if (!userData.username) userData.username = `Not Defined ${index}`;
        if (!userData.name) userData.name = `Not Defined ${index}`;
        if (!userData.isGuest) userData.isGuest = false;

        let preset = userData.preset;
        if (!preset) preset = {};

        if (!preset.head) preset.head = '/char/body/skeleton/head';
        if (!preset.body) preset.body = '/char/body/skeleton/body';
        if (!preset.legs) preset.legs = '/char/body/skeleton/legs';

        if(!userData.isGuest) {
            if (!preset.weapon) preset.weapon = '/char/props/equip/espada';
            if (!preset.second_weapon) preset.second_weapon = '/char/props/equip/escudo_madeira';
        }

        this.defaultPreset = { ...preset };
        this.preset = preset;

        Object.getOwnPropertyNames(this.defaultPreset).forEach(p => {
            this.preset[p] = this.defaultPreset[p].endsWith('.png') ? this.defaultPreset[p] : `${this.defaultPreset[p]}/default.png`;
        });

        this.userData = userData;

        this.currentFrame = 0;
        this.move = new MakeMoveableComponent(this, { precision: 5 });
        this.animationController = new AnimationControllerComponent(this);
        this.components.push(this.move);
        this.components.push(this.animationController);
        this.movementSpeed = 1;
        this.replaceColor = null;
        this.spawned = false;
        this.isOnCombat = false;
        this.attackSize = { width: 5, height: 5 };

        this.lastPosition = { x: this.position.x, y: this.position.y };

        this.animation = null;

        this.currentCinematic = null;
        this.cinematics = [];

        this.controlledBy = '';
        this.action = 'idle';
        this.actionData = { cd: 0 };

        this.effects = {};
        this.team = null;
        this.status = new Status(this, { life: { min: 0, max: 5, current: 5 } });
        // this.status = {
        //     life: { max: 5, current: 5 },
        // }
        this.status.life.current = this.status.life.max;

        this.weapons = {};
        this.changeWeapon(Character.weaponTypes.swordnShield);

        this.onFrame = [];

        game.addChar(this);

        this.onDoneSpawning = () => {
            this.team = team;
            this.isOnCombat = isOnCombat;
            this.controlledBy = 'ia';
            this.spawned = true;
        };

        if (spawnType != Character.spawnType.position) {
            if (spawnType == Character.spawnType.portal) {
                Portal.spawnManager.makeSpawn('char', this);
            }
            if (spawnType == Character.spawnType.wagon) {
                Wagon.spawnManager.makeSpawn('char', this);
            }
            this.position.x = engine.canvas.width + 200;
        }

        this.enable();
        if (spawnType == Character.spawnType.position) this.doneSpawning();
    }

    onEnable() {
        engine.programData['char'].addToTransform(this, game.getCharList().length);

        this.animationController.changeAnimationByGroup('head', 'idle');
        this.animationController.changeAnimationByGroup('body', 'idle');
        this.animationController.changeAnimationByGroup('legs', 'idle');
        this.animationController.changeAnimationByGroup('back', 'idle');

        this.status.life.onDown(() => {
            let count = 0;
            const toggle = () => {
                count++;
                if (count > 7) return;
                if (count % 2 == 0) this.replaceColor = { r: 255, g: 0, b: 0 };
                else this.replaceColor = null;
                this.executeOnFrame({ count: 10, func: () => { toggle(); } });
            }
            toggle();
        });
        this.status.life.onReachMin(() => {
            this.die();
        });
    }

    onRemove() {
        game.removeChar(this);
    }

    doneSpawning() {
        if (this.onDoneSpawning) this.onDoneSpawning();
    }

    flipedX() {
        return this.movingDirection == -1;
    }

    update() {
        super.update();
        engine.programData['char'].updateTransformPart(this, charDefinitions);

        charHelpers.fixAnimation(this);

        if (!this.spawned) return;

        if (this.userData.userId == '145590747') {
            const charCount = game.getCharList().length;
            const currentLife = (charCount == 0 ? 1 : charCount * 5) + 50;
            if (this.status.life.max != currentLife) {
                let toAdd = this.status.life.max - currentLife;
                this.status.life.max = currentLife;
                if (toAdd > 0 && this.status.life.current < this.status.life.max)
                    this.status.life.current += toAdd;
            }
        }

        let removeFromOnFrame = [];
        this.onFrame.forEach(on => {
            on.current++;
            if (on.current < on.frame) return;
            on.exec();
            removeFromOnFrame.push(on);
        });
        for (let i = 0; i < removeFromOnFrame.length; i++) {
            this.onFrame.splice(this.onFrame.indexOf(removeFromOnFrame[i]), 1);
        }

        charHelpers.renderusername(this);
        if (!this.userData.dialog) this.userData.dialog = Character.dialogs.getNext(this.userData.userId);

        if (this.userData.dialog) {
            charHelpers.renderDialog(this);
        }

        if (this.isOnCombat) {
            charHelpers.renderHealth(this);
        }

        if (!this.currentCinematic) {
            this.currentCinematic = this.cinematics.sort((a, b) => a - b).shift();
        }

        if (this.currentCinematic) {
            if (this.currentCinematic.rotine.started) {
                if (this.currentCinematic.rotine.onFrame)
                    this.currentCinematic.rotine.onFrame(this);
            }
            if (this.currentCinematic.rotine.ended) {
                this.currentCinematic = null;
                return;
            }
            if (!this.currentCinematic.rotine.started) {
                this.currentCinematic.rotine.started = true;
                this.currentCinematic.rotine.action(this, () => {
                    this.currentCinematic = null;
                });
            }
            return;
        }

        if (this.controlledBy == 'ia') {
            this.action = 'idle';
            if (!this.isOnCombat && this.action != 'jumping') {
                this.action = 'move_around';
            }
        }

        if (this.actionData.cd >= 0) {
            this.actionData.cd -= 1;
            return;
        }
        if (charHelpers.actionHandler[this.action]) {
            charHelpers.actionHandler[this.action](this);
        }
    }

    startCinematic({ priority, rotine }) {
        if (!priority) priority = 1;
        let id = cinematicId++;
        this.cinematics.push({ id: id, priority, rotine });
        return id;
    }

    getCurrentPreset(partName) {
        if (!this.preset[partName]) return undefined;
        let path = '';
        if (typeof this.preset[partName] == "object") {
            path = `${this.preset[partName].url}/${this.preset[partName].current}`;
        }
        path = this.preset[partName];
        if (charAnimation.proxyAnimation[path]) path = charAnimation.proxyAnimation[path];
        return path;
    }

    changePresetByPart(partName, newTexture) {
        if (newTexture == 'remove') {
            delete this.preset[partName];
            return;
        }
        if(!this.preset[partName] && this.userData.isGuest) return;
        this.preset[partName] = newTexture.endsWith('.png') ? newTexture : `${this.defaultPreset[partName]}/${newTexture}.png`;
        if(this.userData.isGuest) return;
        if (partName == 'weapon' || partName == 'second_weapon') {
            const { main, second } = this.weapons;
            if (main == 'arco') {
                delete this.preset['second_weapon'];
            }
            if (partName == 'weapon') {
                if (main == 'arco')
                    this.defaultPreset.weapon = '/char/props/equip/arco';
                else
                    this.defaultPreset.weapon = '/char/props/equip/espada';
                this.preset[partName] = newTexture.endsWith('.png') ? newTexture : `${this.defaultPreset[partName]}/${newTexture}.png`;
            }
            return;
        }
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

    changeWeapon(to) {
        if(this.userData.isGuest) return;
        if (to == Character.weaponTypes.bow) this.weapons = { main: "arco", second: null };
        //else if (to == Character.weaponTypes.staff) this.weapons = { main: "cajado", second: null };
        else this.weapons = { main: "espada", second: 'escudo' };
        this.changePresetByPart('weapon', 'default');
    }

    executeOnFrame({ count, func }) {
        this.onFrame.push({ frame: count, current: 0, exec: func });
    }

    applyEffect(name, { }) {
        if (name != 'exhaust') return;
        const id = effectId++;
        this.addElement(new Exhaust({ position: this.position, effectId: id, parent: this }));
        return id;
    }

    removeEffect(id) {
        const e = this.elements.find(x => x.effectId == id);
        if (!e) {
            console.error('effect not found!', id);
            return;
        }
        e.remove();
        this.elements.splice(this.elements.indexOf(e), 1);
    }

    regen({ source, qtd }) {
        this.status.life.add(qtd);
    }

    takeDamage({ source, damage }) {
        console.log(`${damage} damage taken by`, this);
        console.log('source', source);
        if (this.action == 'defending') return;
        this.status.life.add(damage * -1);
    }

    die({ reason } = {}) {
        let data = null;
        this.dead = true;

        const onDoneDying = () => {
            game.arena.leave(this, { reason: reason ?? 'death' });
            game.eventManager.whenPlayerDie(this, { reason: reason ?? 'death' });
            this.remove();
        }

        if (Math.random() > 0.5) {
            const cinnId = this.startCinematic({
                priority: 9999,
                rotine: {
                    action: (c, onDone) => {
                        this.animationController.resetFrames();
                        this.action = 'die-with-drop';
                        this.executeOnFrame({
                            count: 120, func: () => {
                                if (this.currentCinematic.id == cinnId) this.currentCinematic.rotine.ended = true;
                                onDoneDying();
                            }
                        });
                    },
                }
            });
            return;
        }

        const parts = Object.getOwnPropertyNames(this.animationController.parts);
        const cinnId = this.startCinematic({
            priority: 9999,
            rotine: {
                action: (c, onDone) => {
                    this.executeOnFrame({
                        count: 180, func: () => {
                            if (this.currentCinematic.id == cinnId) this.currentCinematic.rotine.ended = true;
                            onDoneDying();
                        }
                    });
                },
                onFrame: (c) => {
                    if (!data) {
                        data = {
                            frameskip: 5,
                            currentFrame: 0,
                            parts: {}
                        };

                        let last = Math.random() >= 0.5 ? 1 : -1;
                        parts.forEach(part => {
                            last = last * -1;
                            data.parts[part] = {
                                dir: last,
                                speed: Math.floor(Math.random() * 3)
                            };
                            c.animationController.parts[part].logicOffset = { x: 0, y: 0 };
                            c.animationController.parts[part].rotation = 0;
                        });

                    }

                    parts.forEach(part => {
                        c.animationController.parts[part].rotation += 0.1 * data.parts[part].dir;
                    });
                    data.currentFrame++;
                    if (data.frameskip >= data.currentFrame) {
                        return;
                    }
                    data.currentFrame = 0;
                    parts.forEach(part => {
                        c.animationController.parts[part].logicOffset.x += data.parts[part].dir * data.parts[part].speed;
                        c.animationController.parts[part].logicOffset.y -= 1;
                    });
                }
            }
        });
    }

    jumpAttack({ onAttackMiss } = {}) {
        this.changeWeapon(Character.weaponTypes.sword);
        this.jump({ force: 10, dir: 40 * this.movingDirection, attackOnEnd: true, onAttackMiss });
    }

    jump({ force = 10, dir = 0, attackOnEnd = false, onAttackMiss } = {}) {
        const cinnId = this.startCinematic({
            priority: 9000,
            rotine: {
                action: (c, onDone) => {
                    this.action = 'jumping';
                    this.animationController.resetFrames();
                    this.move.setDestiny({
                        y: force, x: this.position.x + dir, cinematicId: cinnId, onDoneJumping: () => {
                            if (attackOnEnd) this.attack({ onAttackMiss });
                            else this.action = 'idle';
                            if (this.currentCinematic.id == cinnId) this.currentCinematic.rotine.ended = true;
                        }
                    });
                },
                onFrame: (c) => {

                }
            }
        });
    }

    attack({ onAttackMiss } = {}) {
        this.changeWeapon(Character.weaponTypes.sword);
        const cinnId = this.startCinematic({
            priority: 9000,
            rotine: {
                action: (c, onDone) => {
                    this.action = 'attacking';
                    this.animationController.resetFrames();
                    this.executeOnFrame({
                        count: 60, func: () => {
                            if (this.currentCinematic.id == cinnId) this.currentCinematic.rotine.ended = true;
                            const attackPos = {
                                x: 0,
                                width: this.attackSize.width,
                            };

                            // -1 == esquerda
                            // 1 == direita
                            if (this.movingDirection == -1) {
                                attackPos.x = this.position.x - this.attackSize.width;
                            } else {
                                attackPos.x = this.position.x + this.objectSize.width + this.attackSize.width;
                            }

                            let attackMissed = true;
                            game.getCharList().forEach(char => {
                                if (char == this || !char.isOnCombat) return;

                                if (!this.checkHitBox(attackPos, char)) return;
                                // if (char.position.x + char.objectSize.width < attackPos.x) return;
                                // if (char.position.x > attackPos.x + attackPos.w) return;
                                char.takeDamage({ source: this, damage: 1 });
                                attackMissed = false;
                            });
                            this.action = 'idle';
                            if (attackMissed && onAttackMiss) onAttackMiss();
                        }
                    });
                },
                onFrame: (c) => {

                }
            }
        });
    }

    bowAttack({ onAttackMiss, onAttackHit } = {}) {
        this.move.destiny = null;
        this.changeWeapon(Character.weaponTypes.bow);
        const arrow = this.addElement(new Arrow({ parent: this }));
        let lastFrame = 0;
        const cinnId = this.startCinematic({
            priority: 9000,
            rotine: {
                action: (c, onDone) => {
                    this.action = 'attacking';
                    this.animationController.resetFrames();
                    this.executeOnFrame({
                        count: 60, func: () => {
                            if (this.currentCinematic.id == cinnId) this.currentCinematic.rotine.ended = true;
                            this.action = 'idle';
                        }
                    });
                },
                onFrame: (c) => {
                    if (lastFrame != c.animationController.parts.weapon.currentFrame) {
                        lastFrame = c.animationController.parts.weapon.currentFrame;
                        if (lastFrame == 1) {
                            arrow.position.x -= (1 * this.movingDirection);
                        }
                        if (lastFrame == 2) {
                            arrow.position.x += (18 * this.movingDirection);
                            arrow.onUse();
                        }
                    }
                }
            }
        });
    }

    defence({ } = {}) {
        this.move.destiny = null;
        this.changeWeapon(Character.weaponTypes.swordnShield);
        const cinnId = this.startCinematic({
            priority: 9000,
            rotine: {
                action: (c, onDone) => {
                    this.action = 'defending';
                    this.animationController.resetFrames();
                    this.executeOnFrame({
                        count: 120, func: () => {
                            if (this.currentCinematic.id == cinnId) this.currentCinematic.rotine.ended = true;
                            this.action = 'idle';
                        }
                    });
                },
                onFrame: (c) => {

                }
            }
        });
    }

    isSameTeam(target) {
        if (this.team != null && target.team != null && this.team == target.team) return true;
        return false;
    }

    checkHitBox(atk, target) {
        if (this.dead) return false;
        if (this.isSameTeam(target)) return false;
        if (target.position.x + target.objectSize.width < atk.x) return false;
        if (target.position.x > atk.x + atk.width) return false;
        return true;
    }

    getNormalizedUserData() {
        return { ...this.userData, preset: this.defaultPreset };
    }

}
