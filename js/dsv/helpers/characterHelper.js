import engine from '../engine.js';
import Character from '../elements/character.js'
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

class Status {
    constructor() {
        
    }
}

export default {
    renderusername: (char) => {
        engine.requestUIDraw({
            depth: char.depth, f: ({ c, ctx }) => {
                try {
                    ctx.lineWidth = 0.5;
                    ctx.strokeStyle = 'black';

                    ctx.fillStyle = 'white';
                    ctx.font = "300 18px customFont";

                    let metrics = ctx.measureText(char.userData.name);
                    let textWidth = metrics.width;
                    const pos = {
                        x: char.position.x - ((textWidth - char.size.width) / 2),
                        y: engine.canvas.height - (char.position.y - engine.options.charNameOffset)
                    };

                    ctx.fillText(char.userData.name, pos.x, pos.y);
                } catch (error) {
                    console.error(error);
                }
            }
        });
    },
    renderHealth: (char) => {
        engine.requestUIDraw({
            depth: char.depth, f: ({ c, ctx }) => {
                const pos = {
                    x: char.position.x,
                    y: engine.canvas.height - (char.position.y + char.size.height + 25),
                };

                const size = {
                    w: char.objectSize.width,
                    h: 5,
                };

                try {
                    // cria a area
                    ctx.save();
                    ctx.fillStyle = 'black';
                    ctx.fillRect(pos.x, pos.y, size.w + 4, size.h + 4);
                    ctx.restore();

                    // cria o background
                    ctx.save();
                    ctx.fillStyle = 'red';
                    ctx.fillRect(pos.x + 2, pos.y + 2, size.w * (char.status.life.current / char.status.life.max), size.h);
                    ctx.restore();
                } catch (error) {
                    console.error(error);
                }
            }
        });
    },
    renderDialog: (char) => {
        engine.requestUIDraw({
            depth: 999, f: ({ c, ctx }) => {
                try {
                    ctx.font = "800 18px customFont";
                    if (typeof (char.userData.dialog) == 'string') {
                        let metrics = ctx.measureText(char.userData.dialog);
                        let textWidth = metrics.width;
                        let fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
                        let emotesOrder = [];

                        if (char.userData.dialog.includes("{EMOTE[")) {
                            Object.getOwnPropertyNames(Character.dialogs.emotes).forEach(x => {
                                const times = char.userData.dialog.split(x).length - 1;
                                if (times == 0) return;
                                char.userData.dialog = char.userData.dialog.replaceAll(x, "");
                            });
                            while (char.userData.dialog.indexOf('  ') != -1)
                                char.userData.dialog = char.userData.dialog.replaceAll('  ', ' ');

                            metrics = ctx.measureText(char.userData.dialog);
                            textWidth = metrics.width;
                            fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
                        }

                        let texts = [];
                        if (textWidth > 200) {
                            textWidth = 0;
                            const words = char.userData.dialog.split(' ');

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
                            texts.push(char.userData.dialog);
                        }

                        char.userData.dialog = {
                            text: [...texts],
                            height: Math.ceil(fontHeight),
                            width: Math.ceil(textWidth),
                            currentFrame: 0,
                            frames: metrics.width * 2,
                        };
                    }

                    const bounds = { rt: 10, rb: 0, lt: 10, lb: 10 };
                    const pos = { x: char.position.x + char.size.width, y: engine.canvas.height - (char.position.y + char.size.height + 5) };
                    const size = {
                        h: (char.userData.dialog.height) * char.userData.dialog.text.length + 5,
                        w: char.userData.dialog.width + 10
                    };

                    if (pos.x + size.w >= engine.canvas.width) {
                        pos.x -= size.w + char.size.width;
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
                    for (let i = 0; i < char.userData.dialog.text.length; i++) {
                        const text = char.userData.dialog.text[i];
                        ctx.fillStyle = 'black';
                        ctx.fillText(text, Math.ceil(pos.x + 5), Math.ceil(offset + pos.y + char.userData.dialog.height));
                        offset += char.userData.dialog.height
                    }

                    char.userData.dialog.currentFrame++;
                    if (char.userData.dialog.currentFrame >= char.userData.dialog.frames) char.userData.dialog = null;
                } catch (error) {
                    console.error(error);
                }
            }
        });
    },
    fixAnimation: (char) => {
        if (char.action == 'idle' || char.action == 'move_around') {
            char.changePresetByPart('weapon', 'default');
            char.changePresetByPart('second_weapon', 'default');
            char.changePresetByPart('head', 'default');
            char.changePresetByPart('body', 'default');
            char.changePresetByPart('legs', 'default');

            char.animationController.changeAnimationByGroup('head', 'idle');
            char.animationController.changeAnimationByGroup('body', 'idle');
            char.animationController.changeAnimationByGroup('legs', 'idle');
            char.animationController.changeAnimationByGroup('back', 'idle');

            if (char.lastPosition.x != char.position.x || char.lastPosition.y != char.lastPosition.y) {
                char.lastPosition.x = char.position.x;
                char.lastPosition.y = char.position.y;
                char.animationController.changeAnimationByGroup('head', 'walk');
                char.animationController.changeAnimationByGroup('body', 'walk');
                char.animationController.changeAnimationByGroup('legs', 'walk');
                char.animationController.changeAnimationByGroup('back', 'walk');
            }
        }

        if (char.action == 'attacking') {
            char.changePresetByPart('weapon', 'attack');
            char.changePresetByPart('second_weapon', 'attack');

            if (char.weapons.main == 'arco') {
                char.changePresetByPart('head', 'attackbow');
                char.changePresetByPart('body', 'attackbow');
                char.changePresetByPart('legs', 'attackbow');
                char.animationController.changeAnimationByGroup('head', 'attackbow');
                char.animationController.changeAnimationByGroup('body', 'attackbow');
                char.animationController.changeAnimationByGroup('legs', 'attackbow');
            } else {
                char.changePresetByPart('head', 'attack');
                char.changePresetByPart('body', 'attack');
                char.changePresetByPart('legs', 'attack');
                char.animationController.changeAnimationByGroup('head', 'attack');
                char.animationController.changeAnimationByGroup('body', 'attack');
                char.animationController.changeAnimationByGroup('legs', 'attack');
            }
        }

        if (char.action == 'defending') {
            char.changePresetByPart('weapon', 'def');
            char.changePresetByPart('second_weapon', 'def');
            char.changePresetByPart('head', 'def');
            char.changePresetByPart('body', 'def');
            char.changePresetByPart('legs', 'def');

            char.animationController.changeAnimationByGroup('head', 'defence');
            char.animationController.changeAnimationByGroup('body', 'defence');
            char.animationController.changeAnimationByGroup('legs', 'defence');
        }

        if (char.action == 'jumping') {
            char.changePresetByPart('weapon', 'jump');
            char.changePresetByPart('second_weapon', 'jump');
            char.changePresetByPart('head', 'jump');
            char.changePresetByPart('body', 'jump');
            char.changePresetByPart('legs', 'jump');

            char.animationController.changeAnimationByGroup('head', 'jump');
            char.animationController.changeAnimationByGroup('body', 'jump');
            char.animationController.changeAnimationByGroup('legs', 'jump');
        }

        if (char.action == 'die-with-drop') {
            char.changePresetByPart('weapon', 'drop');
            char.changePresetByPart('second_weapon', 'drop');
            char.changePresetByPart('head', 'bran');
            char.changePresetByPart('body', 'bran');
            char.changePresetByPart('legs', 'bran');

            char.animationController.changeAnimationByGroup('head', 'die_with_drop');
            char.animationController.changeAnimationByGroup('body', 'die_with_drop');
            char.animationController.changeAnimationByGroup('legs', 'die_with_drop');
        }
    },
    actionHandler: {
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
    },
    Dialog
};