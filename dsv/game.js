import engine from './engine.js';
import drawer from './drawers.js';
import { createAllAtlas } from './atlasManager.js';

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

const charsProxy = new Proxy(chars, {
    // Interceptando leituras de propriedades (como array[0], array[1], etc.)
    get(target, prop, value) {
        //console.log(target, prop, value);
        if (prop in target) {
            //console.log(`Lendo o valor de ${prop}: ${target[prop]}`);
            return target[prop];
        }
        console.log(`Propriedade ${prop} não encontrada!`);
        return undefined;
    },

    // Interceptando escrita de propriedades (como array[0] = 10, array[1] = 20, etc.)
    set(target, prop, value) {
        console.log(`Alterando o valor de ${prop} para ${value}`);
        console.log(new Error().stack);
        target[prop] = value;
        return true;  // Retorna true para indicar que a operação foi bem-sucedida
    },

    // Interceptando a operação de exclusão de propriedades
    deleteProperty(target, prop) {
        console.log(`Deletando a propriedade ${prop}`);
        return delete target[prop];
    }
});

let timePassed = 0;
let secondToMinute = 0;
const time = {
    running: false,
    hour: 0,
    day: { init: 6 * 60, end: 18 * 60 },
};

function updateEveryMinute() {

}

engine.on('everySecond', () => {

    // secondToMinute++;
    // if(secondToMinute < 60) {
    //     return;
    // }

    secondToMinute = 0;
    if (timeElement) timeElement.innerHTML = time.hour;
    if (time.running) {
        // if (time.hour >= 6 && time.hour <= 18) {
        //     if (time.hour == 6) engine.globalLight.x = 1;
        //     engine.globalLight.x -= 2 / 12;
        // }
        // if (time.hour > 18 || time.hour < 6) {
        //     engine.globalLight.x += 2 / 12;
        // }
        // if (time.hour >= 4 && time.hour <= 10) {
        //     engine.globalLight.y += 1 / 6;
        //     engine.globalLight.z += 1 / 6;
        // }
        // if (time.hour >= 14 && time.hour <= 18) {
        //     engine.globalLight.y -= 1 / 4;
        //     engine.globalLight.z -= 1 / 4;
        // }

        // if (time.hour >= 24) {
        //     time.hour = 0;
        //     engine.globalLight.y = 0;
        //     engine.globalLight.z = 0;
        // }
        //time.hour++;
    }
});

engine.on('everyFrame', () => {
    if(time.running) {
        timePassed++;
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

    //if(timePassed > 1000) timePassed = 0;
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
    getTimePassed: () => timePassed,
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
