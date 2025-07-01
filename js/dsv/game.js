import engine from './engine.js';
import drawer from './drawers.js';
import { createAllAtlas } from './atlasManager.js';
//import { getUser } from '../../../../SCaWorld.js';
import Character from './elements/character.js';
import audioManager from './audioManager.js';

const myId = "145590747";

const timeElement = document.getElementsByClassName('time')[0];

const drawers = {};

const localGlobal = {};

let localGlobalId = 1;
let pId = 1;
const charData = {};
const propData = {};
const chars = [];
const props = [];
const dyprops = [];
const floors = [];
let dyPropCount = 0;
let charsInCombat = [];

const defaultRotines = ['random', 'defaultRanged', 'defaultMelee', 'default'];

const combatRotine = {
    "145590747": {
        whenVaryClose: [
            { name: 'def' },
            { name: 'attack' },
            { name: 'move' },
        ],
        whenClose: [
            { name: 'jumpattack' },
            { name: 'move', args: ['r'] },
        ],
        whenFar: [
            { name: 'bowattack' },
        ],
        whenVeryFar: [
            { name: 'move' },
        ],
    },
    random: {
        whenVaryClose: [
            { name: 'random' },
            { name: 'random', args: ['r'] },
        ],
        whenClose: [
            { name: 'random' },
            { name: 'random', args: ['r'] },
        ],
        whenFar: [
            { name: 'random' },
        ],
        whenVeryFar: [
            { name: 'move' }
        ],
    },
    defaultRanged: {
        whenVaryClose: [
            { name: 'def' },
            { name: 'move', args: ['r'] },
            { name: 'def' },
            { name: 'move', args: ['r'] },
            { name: 'random' },
        ],
        whenClose: [
            { name: 'move', args: ['r'] },
            { name: 'bowattack' },
            { name: 'random' },
        ],
        whenFar: [
            { name: 'bowattack' },
            { name: 'random' },
        ],
        whenVeryFar: [
            { name: 'move' },
        ],
    },
    defaultMelee: {
        whenVaryClose: [
            { name: 'def' },
            { name: 'attack' },
            { name: 'move' },
            { name: 'random' },
        ],
        whenClose: [
            { name: 'jumpattack' },
            { name: 'def' },
            { name: 'move' },
            { name: 'attack' },
            { name: 'random' },
        ],
        whenFar: [
            { name: 'move' },
            { name: 'def' },
            { name: 'random' },
        ],
        whenVeryFar: [
            { name: 'move' },
        ],
    },
    default: {
        whenVaryClose: [
            { name: 'def' },
            { name: 'attack' },
            { name: 'def' },
            { name: 'move' },
            { name: 'random' },
        ],
        whenClose: [
            { name: 'jumpattack' },
            { name: 'move' },
            { name: 'attack' },
            { name: 'move', args: ['r'] },
            { name: 'bowattack' },
            { name: 'attack' },
            { name: 'move' },
            { name: 'random' },
        ],
        whenFar: [
            { name: 'move' },
            { name: 'bowattack' },
            { name: 'move' },
            { name: 'bowattack' },
            { name: 'move', args: ['r'] },
            { name: 'bowattack' },
            { name: 'move', args: ['r'] },
            { name: 'bowattack' },
            { name: 'random' },
        ],
        whenVeryFar: [
            { name: 'move' },
        ],
    },
};

/*
    Tipos de eventos:
        Combate - Boss
        Combate - Wave
*/
const eventManager = {
    runningEvent: null,
    toRespawn: [],
    events: {
        boss: {
            start: ({ target }) => {
                if (target == 'streamer') {
                    for (let i = 0; i < chars.length; i++) {
                        const char = chars[i];
                        if (char.userData.isGuest) continue;
                        char.isOnCombat = true;
                        if (char.userData.userId == myId) continue;
                        char.team = 'viewers';
                    }
                }
            },
            update: () => {
                if (chars.length == 1 || !chars.find(x => x.userData.userId == myId))
                    eventManager.runningEvent.end();
            },
            end: () => {
                for (let i = 0; i < chars.length; i++) {
                    const char = chars[i];
                    char.team = null;
                    char.isOnCombat = false;
                }
            },
            forceEnd: () => { }
        },
        wave: {
            start: ({ type, quantity, alias, boss }) => {
                for (let i = 0; i < chars.length; i++) {
                    const char = chars[i];
                    if (char.userData.isGuest) continue;
                    char.isOnCombat = true;
                    char.team = 'deff';
                }
                eventManager.runningEvent.toSpawn = quantity;
                eventManager.runningEvent.skipFrame = 20;
                eventManager.runningEvent.currentSkip = 0;
                eventManager.runningEvent.boss = boss;
                if (!type) {
                }
                if(type == 'stream-raid') {
                    audioManager.play('invasion');
                }
            },
            update: () => {
                const invasorQuantity = chars.filter(x => x.team == 'invasor').length;
                const defenderQuantity = chars.filter(x => x.team != 'invasor' && !x.userData.isGuest).length;

                if (defenderQuantity == 0) {
                    eventManager.respawnPlayers({ team: 'deff', isOnCombat: true });
                }

                if (invasorQuantity == 0 && eventManager.runningEvent.toSpawn <= 0) {
                    eventManager.runningEvent.end();
                }

                if (eventManager.runningEvent.boss && !eventManager.runningEvent.boss.element) {
                    const boss = eventManager.runningEvent.boss;
                    boss.element = new Character({
                        position: { x: 0, y: propData[floors[0]].position.y + propData[floors[0]].objectSize.height },
                        userData: {
                            username: `bosswave${boss.name}`,
                            name: boss.name,
                        },
                        spawnType: Character.spawnType.position,
                        isOnCombat: true,
                        team: 'invasor'
                    });
                    boss.element.status.life.changeMax((eventManager.runningEvent.toSpawn * 5) + 50, { shouldRegen: true });
                }

                if (eventManager.runningEvent.skipFrame <= eventManager.runningEvent.currentSkip) {
                    eventManager.runningEvent.currentSkip = 0;
                    if (eventManager.runningEvent.toSpawn) {
                        new Character({
                            position: { x: 0, y: propData[floors[0]].position.y + propData[floors[0]].objectSize.height },
                            userData: {
                                username: `invasor${eventManager.runningEvent.toSpawn + 1}`,
                                name: `Invasor ${eventManager.runningEvent.toSpawn + 1}`,
                            },
                            spawnType: Character.spawnType.position,
                            isOnCombat: true,
                            team: 'invasor'
                        });
                        eventManager.runningEvent.toSpawn -= 1;

                        if (invasorQuantity < 30) eventManager.runningEvent.skipFrame = 20;
                        if (invasorQuantity >= 30) eventManager.runningEvent.skipFrame = 60;
                        if (invasorQuantity >= 60) eventManager.runningEvent.skipFrame = 90;
                    }
                }
                eventManager.runningEvent.currentSkip++;
            },
            end: () => {
                for (let i = 0; i < chars.length; i++) {
                    const char = chars[i];
                    char.team = null;
                    char.isOnCombat = false;
                }
            },
            forceEnd: () => {

            }
        },
    },
    startEvent: (eventName, data) => {
        if (eventManager.runningEvent) return;
        eventManager.runningEvent = eventManager.events[eventName];
        if (!eventManager.runningEvent) return;
        for (let i = 0; i < chars.length; i++) {
            const char = chars[i];
            //if(char.isOnCombat) continue;
            char.regen({ source: 'event', qtd: char.status.life.max });
        }
        eventManager.runningEvent.start(data);
    },
    update: () => {
        if (!eventManager.runningEvent) return;
        eventManager.runningEvent.update();
    },
    endEvent: () => {
        if (!eventManager.runningEvent) return;
        if (eventManager.runningEvent.forceEnd) eventManager.runningEvent.forceEnd();
        eventManager.respawnPlayers();
    },
    whenPlayerDie: (char, { reason } = {}) => {
        if (!eventManager.runningEvent) return;
        if (reason == 'death' && char.team != 'invasor') eventManager.toRespawn.push({ userData: char.getNormalizedUserData() });
        //eventManager.respawnPlayers();
    },
    respawnPlayers: ({ team, isOnCombat }) => {
        eventManager.toRespawn.forEach(data => {
            new Character({ position: { x: 400, y: 40 }, userData: data.userData, spawnType: Character.spawnType.portal, team, isOnCombat });
        });
        eventManager.toRespawn.length = 0;
    },
};

const onUserCommand = {
    default: (userId, command, args = []) => {
        if (combatManager.turn == 'exec') return;
        combatManager.commands[userId] = { name: command.trim(), args: args };
    },
    'jump': (userId, command, args = []) => {
        charData[userId].jump();
    }
};

const attacks = {
    'ataque': {
        alias: ['ataque', 'attack', 'atk'],
        exhaus: 1,
        validate: (char) => {
            const d = combatManager.charAddIfDontExist(char);
            if (d.exhaust == 0) return true;
            return false;
        },
        onExecute: (char, { } = {}) => {
            char.attack({
                onAttackMiss: () => {
                    combatManager.applyExhaust(char, { toAdd: 1 });
                }
            });
            combatManager.applyExhaust(char, { toSet: 1 });
        }
    },
    'ataque_arco': {
        alias: ['bow', 'bowattack', 'botatk', 'arco'],
        exhaus: 1,
        validate: (char) => {
            const d = combatManager.charAddIfDontExist(char);
            if (d.exhaust == 0) return true;
            return false;
        },
        onExecute: (char, { } = {}) => {
            char.bowAttack({});
            combatManager.applyExhaust(char, { toSet: 1 });
        }
    },
    'jumpatk': {
        alias: ['jumpattack', 'jumpatk'],
        exhaus: 1,
        validate: (char) => {
            const d = combatManager.charAddIfDontExist(char);
            if (d.exhaust == 0) return true;
            return false;
        },
        onExecute: (char, { } = {}) => {
            char.jumpAttack({
                onAttackMiss: () => {
                    combatManager.applyExhaust(char, { toAdd: 1 });
                }
            });
            combatManager.applyExhaust(char, { toSet: 1 });
        }
    },
    'def': {
        alias: ['defesa', 'defence', 'def'],
        exhaus: 1,
        validate: (char) => {
            const d = combatManager.charAddIfDontExist(char);
            if (d.exhaust == 0) return true;
            return false;
        },
        onExecute: (char, { } = {}) => {
            char.defence();
            combatManager.applyExhaust(char, { toSet: 1 });
        }
    },
    'move': {
        alias: ['move'],
        exhaus: 1,
        validate: (char) => {
            return true;
        },
        onExecute: (char, { dir } = {}) => {
            let move = (50 * dir);
            if (char.position.x + move <= 0) move = 0;
            if (char.position.x + move >= engine.canvas.width - char.objectSize.width) move = 0;
            char.move.setDestiny({ x: char.position.x + move, });
        }
    },

};

function userCommand(userId = null, command = null) {
    if (!userId || !command) return;
    const commands = command.trim().toLowerCase().split(' ').map(x => x.trim());
    const cmd = onUserCommand[commands[0]] ?? onUserCommand.default;
    cmd(userId, commands[0], commands.length > 1 ? commands.slice(1) : []);
}

//combatManager turns => 'exec', 'strat'
const combatManager = {
    timing: { current: 0, target: 30 },
    timeToTurn: 30,
    timeout: null,
    turn: 'strat',
    commands: {
        //"443917743": { name: 'attack' },
        //"208462157": { name: 'defence' },
    },
    chars: {},
    applyExhaust: function (char, { toSet, toAdd }) {
        if (!char) return;
        const data = this.charAddIfDontExist(char);
        if (toSet) data.exhaust = toSet;
        if (toAdd) data.exhaust += toAdd;
        if (data.exhaust < 0) data.exhaust = 0;
        if (data.exhaust == 0) {
            if (data.exhaustId) char.removeEffect(data.exhaustId);
            data.exhaustId = null;
            return;
        }
        if (!data.exhaustId) data.exhaustId = char.applyEffect('exhaust', {});
    },
    charAddIfDontExist: function (char) {
        try {
            if (!this.chars[char.userData.userId])
                this.chars[char.userData.userId] = {
                    exhaust: 0,
                };
            return this.chars[char.userData.userId];
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    update: function () {
        charsInCombat = chars.filter(x => x.isOnCombat);
        this.timing.current++;
        if (this.timing.target < this.timing.current) {
            this.timing.current = 0;
            this.turn = this.turn == 'exec' ? 'strat' : 'set-default';
            if (this.turn == 'set-default') arena.chars.length > 0 ? this.timing.target = 60 * 3 : this.timing.target = 60;
            else this.timing.target = arena.chars.length > 0 ? 60 * 6 : this.timing.target = 60 * 2;
            if (this.turn == 'strat') {
                Object.getOwnPropertyNames(this.chars).forEach(x => {
                    const c = this.chars[x];
                    if (c.exhaust > 0) this.applyExhaust(charData[x], { toAdd: -1 });
                    // if (c.exhaust > 0) charData[x].effects['exhaust'] = true;
                    // else charData[x].effects['exhaust'] = false;
                });
            }
        }
        if (this.turn == 'strat') {
            this.strat();
        }
        if (this.turn == 'set-default') {
            this.setDefaults();
        }
        if (this.turn == 'exec') {
            this.exec();
        }
    },
    strat: function () {
        engine.requestUIDraw({
            depth: 9999, f: ({ c, ctx }) => {
                const pos = {
                    x: 0,
                    y: engine.canvas.height - 12,
                };

                const size = {
                    w: arena.size.width,
                    h: 5,
                };

                try {
                    // cria o background
                    ctx.save();
                    ctx.fillStyle = 'black';
                    ctx.fillRect(pos.x, pos.y, size.w + 4, size.h + 4);
                    ctx.restore();

                    // cria a area
                    ctx.save();
                    ctx.fillStyle = 'yellow';
                    ctx.fillRect(pos.x + 2, pos.y + 2, size.w * (this.timing.current / this.timing.target), size.h);
                    ctx.restore();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    },
    setDefaults: function () {
        const findClosestChar = (char) => {
            let closest = { char: null, dist: null, direction: 0 };
            charsInCombat.forEach(c => {
                if (char == c) return;
                if (!c.isOnCombat) return;
                if (char.isSameTeam(c)) return;

                let diff = 0;
                if (char.position.x < c.position.x) diff = c.position.x - (char.position.x + char.objectSize.width);
                else diff = char.position.x - (c.position.x + c.objectSize.width);

                if (closest.dist != null && closest.dist < diff) return;
                closest.direction = c.position.x > char.position.x ? 1 : -1;
                closest.dist = diff;
                closest.char = c;
            });

            return closest;
        };

        charsInCombat.forEach(char => {
            const userId = char.userData.userId;
            if (!char.isOnCombat) return;
            if (combatManager.commands[userId]) return;

            const chardata = combatManager.charAddIfDontExist(char);
            if (!chardata.rotine) chardata.rotine = { usingPreset: null, lastIndex: 0, lastParam: 'whenClose' };

            if (!chardata.rotine.usingPreset) {
                chardata.rotine.usingPreset = combatRotine[char.userData.userId] ?? combatRotine[defaultRotines[Math.floor(Math.random() * defaultRotines.length)]];
            }

            const closest = findClosestChar(char);

            if (closest.char) {
                let t = '';
                if (closest.dist < 60) t = 'whenVaryClose';
                else if (closest.dist < 100) t = 'whenClose';
                else if (closest.dist > 100 && closest.dist < 400) t = 'whenFar';
                else if (closest.dist < 600) t = 'whenVeryFar';
                else {
                    char.move.setDestiny({ x: closest.char.position.x });
                    return;
                }
                if (chardata.rotine.lastParam != t) {
                    chardata.rotine.lastParam = t;
                    chardata.rotine.lastIndex = 0;
                }
            }

            const rotine = chardata.rotine.lastParam;
            const preset = chardata.rotine.usingPreset;
            const rotineToUse = preset[rotine];
            if (chardata.rotine.lastIndex >= rotineToUse.length) chardata.rotine.lastIndex = 0;
            const index = chardata.rotine.lastIndex++;
            const action = rotineToUse[index];
            if (!action) return;
            const args = !action.args ? [] : [...action.args];
            if (args.length == 0) {
                args.push(char.movingDirection == -1 ? 'e' : 'd');
                if (closest.char) {
                    args[0] = closest.direction == -1 ? 'e' : 'd';
                }
            }
            if (args[0] == 'r') {
                if (closest.char) {
                    args[0] = closest.direction == -1 ? 'd' : 'e';
                }
                else {
                    args[0] = char.movingDirection == -1 ? 'd' : 'e';
                }
            }

            let name = action.name;
            if (name == 'random') {
                let list = Object.getOwnPropertyNames(attacks);
                name = attacks[list[Math.floor(Math.random() * list.length)]].alias[0];
            }

            combatManager.commands[userId] = { name: name, args: args };
        });

        this.timing.current = 0;
        this.turn = 'exec';
    },
    exec: function () {
        const users = Object.getOwnPropertyNames(this.commands);
        users.forEach(userId => {
            const char = charData[userId];
            if (!char || !char.isOnCombat) return;

            const command = this.commands[userId];
            let commandName = command.name;
            let secondCommand = command.args ? command.args[0] : null;
            let dir = char.movingDirection;

            if (secondCommand && secondCommand != '') {
                if (secondCommand == 'e') dir = -1;
                if (secondCommand == 'd') dir = 1;
            }

            char.movingDirection = dir;
            const atks = Object.getOwnPropertyNames(attacks);
            for (let i = 0; i < atks.length; i++) {
                const atk = attacks[atks[i]];
                if (atk.alias.find(x => x == commandName)) {
                    if (!atk.validate(char)) return;
                    atk.onExecute(char, { dir });
                    return;
                }
            }
        });

        this.commands = {};
    }
};

const arena = {
    position: { x: 400, y: 40 },
    size: { width: 200, height: 100 },
    chars: [],
    toRespawn: [],
    startDuel: function (users, duelId, onEnd) {
        if (arena.current == duelId) return ['duel-running'];

        const found = [];
        const notfound = [];
        users.forEach(user => {
            const char = chars.find(x => x.userData.username == user);
            if (!char) {
                notfound.push(user);
                return;
            }
            found.push(char);
        });

        if (notfound.length > 0) {
            return notfound;
        }

        arena.current = duelId;
        found.forEach(x => { arena.enter(x); });

        arena.onEndDuel = onEnd;
    },
    enter: function (char) {
        if (arena.chars.find(x => x == char)) return;
        if (char.userData.isGuest) return;
        arena.chars.push(char);

        char.isOnArena = true;
        char.isOnCombat = true;
        if (arena.chars.length % 2 == 0) {
            char.team = `arena1`;
            char.position.x = arena.position.x;
            char.movingDirection = 1;
        } else {
            char.team = `arena2`;
            char.position.x = arena.position.x + arena.size.width - char.objectSize.width;
            char.movingDirection = -1;
        }

        char.regen({ source: 'arena', qtd: char.status.life.max });
        char.controlledBy = 'arena';
        char.isOnCombat = true;
        char.action = 'idle';
        char.move.destiny = null;
        char.update();
    },
    leave: function (char, { reason } = {}) {
        const f = arena.chars.find(x => x == char);
        if (!f) return;
        arena.chars.splice(arena.chars.indexOf(char), 1)
        f.isOnArena = false;
        char.controlledBy = 'ia';
        char.isOnCombat = false;
        if (reason == 'death') arena.toRespawn.push({ userData: char.getNormalizedUserData(), });
    },
    update: () => {
        if (arena.chars.length > 0 && combatManager.turn == 'strat') {
            const users = Object.getOwnPropertyNames(combatManager.commands);
            users.forEach(userId => {
                const char = arena.chars.find(x => x.userData?.userId == userId);
                if (!char) return;
                if (!char.isEnable) {
                    arena.leave(char);
                    return;
                }
                engine.requestUIDraw({
                    depth: 9999, f: ({ c, ctx }) => {
                        const pos = {
                            x: arena.position.x,
                            y: engine.canvas.height - (arena.position.y + arena.size.height - 10),
                        };

                        const size = {
                            w: arena.size.width - 25,
                            h: 5,
                        };

                        try {
                            ctx.fillText(combatManager.commands[userId].name.substr(0, 3).toUpperCase(), char.arenaTeam == 1 ? pos.x : pos.x + size.w, pos.y);
                            ctx.fillText(combatManager.charAddIfDontExist({ userData: { userId: userId } }).exhaust, char.arenaTeam == 1 ? pos.x + 10 : pos.x + size.w - 10, pos.y);
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });
            });
            engine.requestUIDraw({
                depth: 9999, f: ({ c, ctx }) => {
                    const pos = {
                        x: arena.position.x,
                        y: engine.canvas.height - (arena.position.y + arena.size.height + 12),
                    };

                    const size = {
                        w: arena.size.width,
                        h: 5,
                    };

                    try {
                        // cria o background
                        ctx.save();
                        ctx.fillStyle = 'black';
                        ctx.fillRect(pos.x, pos.y, size.w + 4, size.h + 4);
                        ctx.restore();

                        // cria a area
                        ctx.save();
                        ctx.fillStyle = 'yellow';
                        ctx.fillRect(pos.x + 2, pos.y + 2, size.w * (combatManager.timing.current / combatManager.timing.target), size.h);
                        ctx.restore();
                    } catch (error) {
                        console.error(error);
                    }
                }
            });
        }

        if (arena.chars.length == 1 || arena.chars.length == 0) {
            arena.leave(arena.chars[0]);
            if (arena.onEndDuel) arena.onEndDuel(arena.chars[0] ? [arena.chars[0].userData.userId] : []);
            arena.toRespawn.forEach(data => {
                new Character({ position: { x: 400, y: 40 }, userData: data.userData, spawnType: Character.spawnType.portal });
            });
            arena.toRespawn.length = 0;
        }
    }
};

function addChar(char) {
    char.localGlobalId = localGlobalId++;
    charData[char.userData.userId] = char;
    chars.push(char);
    localGlobal[char.localGlobalId] = char;
}
function addProp(prop) {
    prop.localGlobalId = localGlobalId++;
    prop.id = pId++;
    propData[prop.id] = prop;
    props.push(prop);
    if (prop.texture.includes('chao')) {
        floors.push(prop.id);
    }
    localGlobal[prop.localGlobalId] = prop;
}
function removeProp(prop) {
    delete propData[prop.id]
    delete localGlobal[prop.localGlobalId];
    const i = props.indexOf(prop);
    if (i == -1) {
        console.log('index not found');
        return;
    }
    props.splice(i, 1);
}
function addDyProp(prop) {
    prop.localGlobalId = localGlobalId++;
    prop.id = pId++
    propData[prop.id] = prop;
    dyprops.push(prop);
    localGlobal[prop.localGlobalId] = prop;
}
function removeDyProp(prop) {
    delete propData[prop.id]
    delete localGlobal[prop.localGlobalId];
    const i = dyprops.indexOf(prop);
    if (i == -1) {
        console.log('index not found');
        return;
    }
    dyprops.splice(i, 1);
}
function removeChar(char) {
    if (charData[char]) {
        let index = chars.indexOf(charData[char]);
        if (index == -1) return false;
        chars.splice(index, 1);
        delete charData[char];
        delete localGlobal[char.localGlobalId];
        return true;
    }

    const c = chars.find(x => x == char);
    let index = chars.indexOf(c);
    if (index == -1) return false;
    delete charData[chars[index].userData.userId];
    delete localGlobal[char.localGlobalId];
    chars.splice(index, 1);
    return true;
}

const time = {
    passed: 0,
    running: true,
    hour: 0,
    day: { init: 6 * 60, end: 18 * 60 },
};

engine.on('everySecond', () => {
    if (timeElement) timeElement.innerHTML = time.hour;
});

engine.on('everyFrame', () => {
    if (time.running) {
        time.passed++;
        time.hour += parseFloat((((1000 / (engine.getFramerate() == 0 ? 1 : engine.getFramerate())) / 1000) / 60).toFixed(2));
        time.hour = parseFloat(time.hour.toFixed(2));
    }
    if (time.hour >= 24) {
        time.hour -= 24;
    }

    if (time.hour >= 6 && time.hour <= 18) engine.globalLight.x = (((time.hour - 6) * 2) / 12) - 1;
    else if (time.hour < 6) engine.globalLight.x = 1 - ((((time.hour + 12) - 6) * 2) / 12);
    else if (time.hour > 18) engine.globalLight.x = 1 - ((((time.hour - 12) - 6) * 2) / 12);

    if (time.hour > 10 && time.hour < 14) engine.globalLight.y = 1;
    else if (time.hour > 18 || time.hour < 4) engine.globalLight.y = -1;
    else if (time.hour >= 4 && time.hour <= 10) engine.globalLight.y = 1 - (((10 - time.hour) * 2) / 6);
    else if (time.hour >= 14 && time.hour <= 18) engine.globalLight.y = (((18 - time.hour) * 2) / 4) - 1;

    if (time.hour > 10 && time.hour < 14) engine.globalLight.z = 1;
    else if (time.hour > 18 || time.hour < 4) engine.globalLight.z = -1;
    else if (time.hour >= 4 && time.hour <= 10) engine.globalLight.z = 1 - (((10 - time.hour) * 2) / 6);
    else if (time.hour >= 14 && time.hour <= 18) engine.globalLight.z = (((18 - time.hour) * 2) / 4) - 1;

    combatManager.update();
    arena.update();
    eventManager.update();

    let dyPropIndex = 0;
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        char.index = i;
        if (!char.isEnable) continue;
        char.update();
    }
    for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        prop.index = i;
        if (!prop.isEnable) continue;
        prop.update();
    }
    for (let i = 0; i < dyprops.length; i++) {
        const prop = dyprops[i];
        prop.index = dyPropIndex;
        if (prop.elements.length > 0) dyPropIndex += prop.elements.length;
        dyPropIndex++;
        if (!prop.isEnable) continue;
        prop.update();
    }
    dyPropCount = dyPropIndex;
});

export default {
    time,
    drawers,
    arena,
    combatManager,
    eventManager,
    getDyPropCount: () => dyPropCount,
    getCharList: () => [...chars],
    getPropList: () => [...props],
    getDyPropList: () => [...dyprops],
    getFloorList: () => [...floors],
    getChar: (id) => charData[id],
    getProp: (id) => propData[id],
    getGlobal: (id) => localGlobal[id],
    addChar,
    addProp,
    addDyProp,
    removeDyProp,
    removeChar,
    removeProp,
    userCommand,
    getTimePassed: () => time.passed,
    setup: async (gl) => {
        const programData = engine.programData;
        const canvas = engine.canvas;

        await createAllAtlas();

        const propCenarioFBO = drawer.setupPropCenarioFBO();
        const cenarioFBO = drawer.setupCenarioFBO();
        const lightFBO = drawer.setupLightFBO();
        const backgroundFBO = drawer.setupBackgroundFBO();

        gl.useProgram(programData['light'].program);
        gl.uniform2f(programData['light'].locals.u.resolution, canvas.width, canvas.height);
        const lightDrawer = await drawer.setupLightDrawer(programData['light'], propCenarioFBO);

        gl.useProgram(programData['char'].program);
        gl.uniform2f(programData['char'].locals.u.resolution, canvas.width, canvas.height);
        const charDrawer = await drawer.setupCharDrawer(programData['char']);

        gl.useProgram(programData['prop'].program);
        gl.uniform2f(programData['prop'].locals.u.resolution, canvas.width, canvas.height);
        const propDrawer = await drawer.setupPropDrawer(programData['prop']);

        console.log(programData['dyprop']);
        gl.useProgram(programData['dyprop'].program);
        gl.uniform2f(programData['dyprop'].locals.u.resolution, canvas.width, canvas.height);
        const dyPropDrawer = await drawer.setupDynamicPropDrawer(programData['dyprop']);

        gl.useProgram(programData['background'].program);
        gl.uniform2f(programData['background'].locals.u.resolution, canvas.width, canvas.height);
        const backgroundDrawer = await drawer.setupBackgroundDrawer(programData['background']);

        gl.useProgram(programData['cenario'].program);
        gl.uniform2f(programData['cenario'].locals.u.resolution, canvas.width, canvas.height);
        const cenarioDrawer = await drawer.setupCenarioDrawer(programData['cenario'], propCenarioFBO, lightFBO, backgroundFBO);

        gl.useProgram(programData['rio'].program);
        gl.uniform2f(programData['rio'].locals.u.resolution, canvas.width, canvas.height);
        const rioDrawer = await drawer.setupRioDrawer(programData['rio'], cenarioFBO);

        gl.useProgram(programData['raw'].program);
        gl.uniform2f(programData['raw'].locals.u.resolution, canvas.width, canvas.height);
        const rawDrawer = await drawer.setupRawDrawer(programData['raw'], cenarioFBO);

        drawers['dyprop'] = dyPropDrawer;
        drawers['fbo'] = {};
        drawers['fbo']['propCenarioFBO'] = propCenarioFBO;

        return {
            propCenarioFBO,
            backgroundFBO,
            cenarioFBO,
            lightFBO,
            charDrawer,
            propDrawer,
            backgroundDrawer,
            cenarioDrawer,
            rioDrawer,
            rawDrawer,
            dyPropDrawer,
            lightDrawer
        }
    }
};
