const charAnimations = {
    animationGroup: {
        'walk': {
            group: { 'helmet': 'walk' },
            part: { 'helmet': 'idle' },
        }
    },
    groupToParts: {
        'head': ['head', 'face', 'helmet'],
        'body': ['body'],
        'legs': ['legs'],
        'back': ['capeBack']
    },
    groupToPartDefs: {
        '/char/body/skeleton/new_head.png' : {
            face: { x: -5, y: 1 }
        }, 
    },
    animationParts: {
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
        },
        head: {
            'idle': {
                frames: []
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
            }
        },
        face: {
            'idle': {
                defaultFrames: { ax: 2, ay: -4 },
                frames: [
                    { ax: 0, ay: 0 },
                ]
            },
            'walk': {
                defaultFrames: { ax: 2, ay: -4 },
                frameCount: 4,
                frames: [
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 0 },
                    { ax: 0, ay: 0 },
                ]
            }
        },
        body: {
            'idle': {
                frames: [
                    { x: 32 * 3, }
                ]
            },
            'walk': {
                frameCount: 4,
                frames: []
            }
        },
        legs: {
            'idle': {
                frames: []
            },
            'walk': {
                frameCount: 4,
                frames: []
            }
        },
        capeBack: {
            'default': {
                frameCount: 4,
                frames: []
            },
        }
    }
}

export default charAnimations;