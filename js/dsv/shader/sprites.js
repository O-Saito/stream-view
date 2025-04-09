
const vertexShaderSource = `#version 300 es
#define GLSL_FORCE_HIGHP 1
precision mediump float;

uniform vec2 uResolution;
uniform vec2 uTextureSize;

in vec2 aPosition;
in vec2 aTexCoord;
in vec2 aPositionOffset;
in vec2 aFrameOffset;
in float aAnimationLayer;
in float aDepth;
in vec2 aFlipImage;
in vec2 aSpriteSize;
in float aObjectId;
in float aIsLightSource;

out vec2 vResolution;
out float vAnimationLayer;
out vec2 vTexCoord;
out vec2 vFlipImage;
out vec2 vTextureSize;
flat out int vObjectId;
out float vIsLightSource;

const float ROTATION_ANGLE = 0.0; 
vec2 snap_to_pixel(vec2 pos, vec2 res) {
    return round(pos * res) / res; 
}
    
vec2 apply_rotation(vec2 pos, vec2 center, float angle) {
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    return rot * (pos - center) + center; 
}

vec2 pixel_to_shader_pos(vec2 pixels, vec2 res) {
    vec2 zeroToOne = pixels / res;
    vec2 clipSpace = zeroToOne * 2.0 - 1.0;
    return round(clipSpace * res) / res; 
}

void main()
{   
    vec2 spriteCenter = aSpriteSize * 0.5;

    vec2 localPos = aPosition - spriteCenter;
    vec2 rotatedPos = apply_rotation(localPos, vec2(0.0), ROTATION_ANGLE);
    vec2 finalPos = rotatedPos + spriteCenter + aPositionOffset;
    vec2 snappedPos = snap_to_pixel(finalPos, uResolution);
    vec2 correctPos = pixel_to_shader_pos(snappedPos, uResolution);
    vec2 correctTexCoord = (aTexCoord + aFrameOffset) / uTextureSize;

    if(aFlipImage.x > 0.0) {
        correctTexCoord.x = (aSpriteSize.x - aTexCoord.x) / uTextureSize.x;
        correctTexCoord.x += aFrameOffset.x / uTextureSize.x;
    }
    if(aFlipImage.y > 0.0) {
        correctTexCoord.y = (aSpriteSize.y - aTexCoord.y) / uTextureSize.y;
        correctTexCoord.y += aFrameOffset.y / uTextureSize.y;
    }

    vAnimationLayer = aAnimationLayer;
    vTexCoord = correctTexCoord;
    vFlipImage = aFlipImage;
    vResolution = uResolution;
    vTextureSize = uTextureSize;
    vObjectId = int(aObjectId);
    vIsLightSource = aIsLightSource;

    gl_Position = vec4(correctPos, aDepth, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
precision mediump sampler2DArray;

uniform sampler2DArray uAtlas;
uniform sampler2DArray uNormalAtlas;

in vec2 vFlipImage;
in float vAnimationLayer;
in vec2 vTexCoord;
in vec2 vResolution;
in vec2 vTextureSize;
flat in int vObjectId;
in float vIsLightSource;

layout(location=0) out vec4 fragColor;
layout(location=1) out vec4 fragColorNormal;
layout(location=2) out vec4 objectData;
layout(location=3) out int objectID;

void main()
{
    vec4 tex = texture(uAtlas, vec3(vTexCoord, vAnimationLayer));
    vec4 texNormal = texture(uNormalAtlas, vec3(vTexCoord, vAnimationLayer));
    if(tex.rgb == vec3(0.0) && tex.a < 0.001) {
        discard;
    }

    if(tex.a > 0.5) tex.a = 1.0;

    vec4 normal = vec4(0.0);//vec4(0.5, 0.5, 1.0, 1.0);

    if(texNormal.a > 0.0){
        normal = texNormal.rgba;
        if(vFlipImage.x > 0.0) normal.r = 1.0 - normal.r;
        if(vFlipImage.y > 0.0) normal.g = 1.0 - normal.g;
    }

    fragColor = tex;
    fragColorNormal = normal;
    objectData = vec4(float(vObjectId) / 100.0, 0.0, 0.0, vIsLightSource);
    objectID = vObjectId;
}`;

const getUniforms = (gl, p) => {
    return {
        resolution: gl.getUniformLocation(p, "uResolution"),
        textureSize: gl.getUniformLocation(p, 'uTextureSize'),
        atlas: gl.getUniformLocation(p, 'uAtlas'),
        normalAtlas: gl.getUniformLocation(p, 'uNormalAtlas'),
    };
};

const getAttributes = (gl, p) => {
    return {
        position: gl.getAttribLocation(p, "aPosition"),
        positionOffset: gl.getAttribLocation(p, "aPositionOffset"),
        texCoord: gl.getAttribLocation(p, "aTexCoord"),
        frameOffset: gl.getAttribLocation(p, "aFrameOffset"),
        animationLayer: gl.getAttribLocation(p, "aAnimationLayer"),
        depth: gl.getAttribLocation(p, "aDepth"),
        flipImage: gl.getAttribLocation(p, 'aFlipImage'),
        spriteSize: gl.getAttribLocation(p, 'aSpriteSize'),
        objectId: gl.getAttribLocation(p, 'aObjectId'),
        isLightSource: gl.getAttribLocation(p, 'aIsLightSource'),
    }
};

export default {
    vertexShaderSource,
    fragmentShaderSource,
    getUniforms,
    getAttributes,
};
