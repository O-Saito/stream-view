
const vertexShaderSource = `#version 300 es
#define GLSL_FORCE_HIGHP 1
precision mediump float;

uniform vec2 uResolution;
uniform vec2 uTextureSize;

in vec2 aPosition;
in vec3 aColor;
in vec2 aTexCoord;

in vec2 aPositionOffset;
in vec2 aFrameOffset;
in float aAnimationLayer;
in float aDepth;

out float vAnimationLayer;
out vec3 vColor;
out vec2 vTexCoord;

vec2 pixel_to_shader(vec2 pixels, vec2 res) {
    vec2 zeroToOne = pixels / res;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    return clipSpace;
}

void main()
{   
    vec2 correctOffset = (aPositionOffset/ uResolution) * 2.0;
    vec2 correctPos = pixel_to_shader(aPosition, uResolution);
    vec2 correctTexCoord = (aTexCoord + aFrameOffset) / uTextureSize;

    // flipa a imagem no X
    // vec2 aFrameSize = vec2(32.0, 0.0);
    // correctTexCoord.x = (aFrameSize.x - aTexCoord.x) / uTextureSize.x;
    // correctTexCoord.x += aFrameOffset.x / uTextureSize.x;

    vAnimationLayer = aAnimationLayer;
    vTexCoord = correctTexCoord;
    vColor = aColor;

    vec2 snapped = floor(correctPos * uResolution + 0.5) / uResolution;
    vec2 snappedOffset = floor(correctOffset * uResolution + 0.5) / uResolution;
    gl_Position = vec4(snapped + snappedOffset, aDepth, 1.0);
    //gl_Position = vec4(correctPos + correctOffset, 1.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
precision mediump sampler2DArray;

uniform sampler2DArray uAltas;
uniform sampler2DArray uNormalAtlas;

in float vAnimationLayer;
in vec2 vTexCoord;
in vec3 vColor;
out vec4 fragColor;

void main()
{
    fragColor = texture(uAltas, vec3(vTexCoord, vAnimationLayer));
    //fragColor.rgb = pow(fragColor.rgb, vec3(1.0 / 2.2)); // SRGB Gamma Correction
}`;

const getSpriteSheetUniforms = (gl, p) => {
    return {
        resolution: gl.getUniformLocation(p, "uResolution"),
        textureSize: gl.getUniformLocation(p, 'uTextureSize'),
        atlas: gl.getUniformLocation(p, 'uAltas'),
        normalAtlas: gl.getUniformLocation(p, 'uNormalAtlas'),
    };
};

const getSpriteSheetAttributes = (gl, p) => {
    return {
        position: gl.getAttribLocation(p, "aPosition"),
        positionOffset: gl.getAttribLocation(p, "aPositionOffset"),
        color: gl.getAttribLocation(p, "aColor"),
        texCoord: gl.getAttribLocation(p, "aTexCoord"),
        frameOffset: gl.getAttribLocation(p, "aFrameOffset"),
        animationLayer: gl.getAttribLocation(p, "aAnimationLayer"),
        depth: gl.getAttribLocation(p, "aDepth"),
    }
};

export default {
    vertexShaderSource,
    fragmentShaderSource,
    getSpriteSheetUniforms,
    getSpriteSheetAttributes
};
