const charAnimations = {
    proxyAnimation: {
        '/char/props/equip/arco/attack.png': '/char/props/equip/arco/default.png',
        '/char/props/equip/arco/jump.png': '/char/props/equip/arco/default.png',
    },
    multisprite: {
        '/char/body/skeleton/head': {},
    },
    animationGroup: {
        'die_with_drop': {
            part: { 'weapon': 'drop', 'second_weapon': 'drop', 'helmet': 'drop', 'face': 'drop', 'capeFront': 'drop', 'capeBack': 'drop' },
        },
    },
    groupToParts: {
        'head': ['head', 'face', 'helmet'],
        'body': ['body', 'weapon', 'second_weapon', 'capeFront', 'chest'],
        'legs': ['legs', 'pants'],
        'back': ['capeBack']
    },
    groupToPartDefs: {
        byDefaults: {
            '/char/body/skeleton/head': {
                face: { ax: -5, ay: 0 }
            },
        },
        '/char/body/skeleton/head.png': {
            face: { ax: -5, ay: 0 }
        },
    },
    animationParts: {
        base: {
            'idle': {
                frameCount: 1,
                freezeFrameOnEnd: false,
                frames: []
            },
            'walk': {
                frameCount: 4,
                freezeFrameOnEnd: false,
                frames: []
            },
            'attack': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                skipFrame: 20,
                frames: [],
            },
            'attackbow': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                skipFrame: 20,
                frames: [],
            },
            'jump': {
                frameCount: 2,
                freezeFrameOnEnd: true,
                frames: [],
            },
            'defence': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                frames: [],
            },
            'drop': {
                frameCount: 4,
                freezeFrameOnEnd: true,
                skipFrame: 30,
                frames: [],
            },
            'die_with_drop': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                skipFrame: 30,
                frames: [],
            },
        },
        helmet: {
            'default': {
                defaultFrames: { ax: 0, ay: 15 },
                isNotSpriteAnimated: true,
                frames: [
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 1 },
                    { ax: 0, ay: 1 },
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 1 },
                    { ax: 0, ay: 1 },
                ]
            },
            'idle': {
                defaultFrames: { ax: 0, ay: 15 },
                isNotSpriteAnimated: true,
                frames: [
                    { ax: 0, ay: 0 },
                ]
            },
            'attack': {
                defaultFrames: { ax: 0, ay: 15 },
                isNotSpriteAnimated: true,
                frames: [
                    { ax: -1, ay: -2 },
                    { ax: -1, ay: -2 },
                    { ax: -1, ay: -1 },
                ]
            },
            'attackbow': {
                defaultFrames: { ax: 6, ay: 14 },
                isNotSpriteAnimated: true,
                frames: [
                    { ax: 0, ay: 0 },
                ]
            },
            'jump': {
                defaultFrames: { ax: 0, ay: 15 },
                isNotSpriteAnimated: true,
                frames: [
                    { ax: -2, ay: -2 },
                    { ax: 1, ay: 0 },
                ]
            },
            'drop': {
                frameCount: 4,
                isNotSpriteAnimated: true,
                freezeFrameOnEnd: true,
                frames: [
                    { ax: -2, ay: -2 },
                    { ax: -2, ay: -10 },
                    { ax: -2, ay: -15 },
                    { ax: -2, ay: -15 },
                ],
            },
        },
        head: {
            'idle': {
                frames: [
                ]
            },
            'walk': {
                frames: [
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 1 },
                    { ax: 0, ay: 1 },
                    { ax: 0, ay: 0 },
                    // { ax: 0, ay: 1 },
                    // { ax: 0, ay: 1 },
                ]
            },
            'attack': {
                frameCount: 3,
                frames: [],
            },
            'attackbow': {
                frameCount: 3,
                frames: [],
            },
            'jump': {
                frameCount: 2,
                frames: [],
            },
            'defence': {
                frameCount: 3,
                frames: [],
            },
            'die_with_drop': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                frames: [],
            },
        },
        face: {
            'idle': {
                defaultFrames: { ax: 1, ay: -3 },
                frames: [
                    { ax: 0, ay: 0 },
                ]
            },
            'walk': {
                defaultFrames: { ax: 1, ay: -3 },
                frameCount: 4,
                frames: [
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 0 },
                ]
            },
            'attack': {
                defaultFrames: { ax: 1, ay: -3 },
                frames: [
                    { ax: 0, ay: -2 },
                    { ax: 0, ay: -3 },
                    { ax: 0, ay: -2 },
                ]
            },
            'attackbow': {
                defaultFrames: { ax: 7, ay: -3 },
                isNotSpriteAnimated: true,
                frames: [
                    { ax: 0, ay: 0 },
                ]
            },
            'jump': {
                defaultFrames: { ax: 1, ay: -3 },
                frames: [
                    { ax: -1, ay: -2 },
                    { ax: 2, ay: 0 },
                ]
            },
            'defence': {
                frameCount: 3,
                frames: [],
            },
            'drop': {
                frameCount: 4,
                isNotSpriteAnimated: true,
                freezeFrameOnEnd: true,
                frames: [
                    { ax: -2, ay: -2 },
                    { ax: -2, ay: -10 },
                    { ax: -2, ay: -15 },
                    { ax: -2, ay: -20 },
                ],
            },
        },
        body: {
            'idle': {
                frames: [
                ]
            },
            'walk': {
                frameCount: 4,
                frames: []
            },
            'attack': {
                frameCount: 3,
                frames: [],
            },
            'attackbow': {
                frameCount: 3,
                frames: [],
            },
            'jump': {
                frameCount: 2,
                frames: [
                ],
            },
            'defence': {
                frameCount: 3,
                frames: [],
            },
            'die_with_drop': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                frames: [],
            },
        },
        chest: {
            'idle': {
                frames: [
                ]
            },
            'walk': {
                frameCount: 4,
                frames: []
            },
            'attack': {
                frameCount: 3,
                frames: [],
            },
            'attackbow': {
                frameCount: 3,
                frames: [],
            },
            'jump': {
                frameCount: 2,
                frames: [
                ],
            },
            'defence': {
                frameCount: 3,
                frames: [],
            },
            'die_with_drop': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                frames: [],
            },
        },
        legs: {
            'idle': {
                frames: []
            },
            'walk': {
                frameCount: 4,
                frames: []
            },
            'attack': {
                frameCount: 3,
                frames: [],
            },
            'attackbow': {
                frameCount: 3,
                frames: [],
            },
            'jump': {
                frameCount: 2,
                frames: [],
            },
            'defence': {
                frameCount: 3,
                frames: [],
            },
            'die_with_drop': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                frames: [],
            },
        },
        pants: {
            'idle': {
                frames: []
            },
            'walk': {
                frameCount: 4,
                frames: []
            },
            'attack': {
                frameCount: 3,
                frames: [],
            },
            'attackbow': {
                frameCount: 3,
                frames: [],
            },
            'jump': {
                frameCount: 2,
                frames: [],
            },
            'defence': {
                frameCount: 3,
                frames: [],
            },
            'die_with_drop': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                frames: [],
            },
        },
        capeBack: {
            'default': {
                frameCount: 4,
                frames: []
            },
            'attack': {
                defaultFrames: { ax: 5, ay: 0 },
                frames: []
            },
            'attackbow': {
                defaultFrames: { ax: 0, ay: 0 },
                frames: []
            },
            'drop': {
                frameCount: 4,
                isNotSpriteAnimated: true,
                freezeFrameOnEnd: true,
                frames: [
                    { ax: -2, ay: -2 },
                    { ax: -2, ay: -10 },
                    { ax: -2, ay: -15 },
                    { ax: -2, ay: -20 },
                ],
            },
        },
        capeFront: {
            'default': {
                defaultFrames: { ax: -4, ay: -2 },
                frameCount: 4,
                frames: [
                    { ax: 0, ay: 0 }
                ]
            },
            'attack': {
                defaultFrames: { ax: -5, ay: -5 },
                frames: [
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 0 },
                ]
            },
            'attackbow': {
                defaultFrames: { ax: 3, ay: -4 },
                frames: [
                    { ax: 0, ay: 0 },
                ]
            },
            'drop': {
                frameCount: 4,
                isNotSpriteAnimated: true,
                freezeFrameOnEnd: true,
                frames: [
                    { ax: -2, ay: -2 },
                    { ax: -2, ay: -10 },
                    { ax: -2, ay: -15 },
                    { ax: -2, ay: -20 },
                ],
            },
        },
        weapon: {
            'proxy': {
                'arco': {
                    shouldUse: (char) => {
                        const { main, second } = char.weapons;
                        return main == 'arco';
                    },
                    'default': {
                        frames: []
                    },
                    'walk': {
                        isNotSpriteAnimated: true,
                        frameCount: 4,
                        frames: [
                            { x: 32 * 4 },
                            { x: 32 * 4 },
                        ]
                    },
                    'idle': {
                        isNotSpriteAnimated: true,
                        frameCount: 1,
                        frames: [
                            { x: 32 * 4 },
                        ]
                    },
                    'attackbow': {
                        isNotSpriteAnimated: false,
                        frameCount: 5,
                        frames: [
                        ],
                    },
                    'jump': {
                        frameCount: 2,
                        frames: [
                            { x: 32 * 3 },
                            { x: 32 * 3 },
                        ],
                    },
                    'die_with_drop': {
                        frameCount: 3,
                        freezeFrameOnEnd: true,
                        frames: [],
                    },
                },
            },
            'default': {
                frameCount: 4,
                frames: []
            },
            'idle': {
                frames: []
            },
            'attack': {
                frameCount: 3,
                frames: [
                    { ax: -10, ay: 0 },
                ],
            },
            'jump': {
                frameCount: 2,
                frames: [
                    { ax: 0, ay: 5 },
                    { ax: 0, ay: 5 },
                ],
            },
            'defence': {
                frameCount: 3,
                frames: [
                ],
            },
            'drop': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                frames: [],
            },
        },
        second_weapon: {
            'default': {
                frameCount: 4,
                frames: []
            },
            'idle': {
                frames: []
            },
            'attack': {
                frameCount: 3,
                frames: [],
            },
            'jump': {
                frameCount: 2,
                frames: [],
            },
            'defence': {
                frameCount: 3,
                frames: [],
            },
            'drop': {
                frameCount: 3,
                freezeFrameOnEnd: true,
                frames: [],
            },
        }
    }
}

export default charAnimations;