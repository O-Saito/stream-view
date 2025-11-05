//@ts-check

/**
 * @typedef {Object} userData
 * 
 */

/**
 * @param {UserData} user 
 */
function processUserAnimation(user) {

    window['data'] = {
        index: 0,
        depth: 1,
        position: { ...user.position },
        size: { ...user.width },
        isFlipedX: false,
        currentFrame: 0,
        parts: {
            body: {
                texture: '/char/body/skeleton/body/default.png',
                currentFrame: 0,
                texOffset: [],
            },
            head: {
                texture: '/char/body/skeleton/head/default.png',
                currentFrame: 0,
                texOffset: [],
            },
            legs: {
                texture: '/char/body/skeleton/legs/default.png',
                currentFrame: 0,
                texOffset: [],
            },
            helmet: {
                texture: '/char/props/helmet/coroa.png',
                currentFrame: 0,
                texOffset: [],
            },
            pants: {
                texture: '/char/props/pants/leather/default.png',
                currentFrame: 0,
                texOffset: [],
            },
        },
    };
}

export default {
    process: () => {

    },
    processUserAnimation,
};
