const vertexShaderSource = `#version 300 es
#define GLSL_FORCE_HIGHP 1
precision mediump float;

uniform vec2 uResolution;
uniform vec2 uTextureSize;

in vec2 aPosition;
in vec2 aPositionOffset;
in vec2 aTexCoord;

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

    vTexCoord = (aTexCoord) / uTextureSize;

    gl_Position = vec4(correctPos + correctOffset, 1.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;
precision mediump sampler2DArray;

uniform sampler2DArray uAtlas;
uniform float uTimeFactor;

in vec2 vTexCoord;

out vec4 fragColor;

void main()
{
    float starLayer = 3.0;
    float layerFloor = 0.0;//floor(u_layer);
    float layerCeil = 2.0;//ceil(u_layer);
    float blendFactor = uTimeFactor;//u_layer - layerFloor;
    
    vec4 tex1 = texture(uAtlas, vec3(vTexCoord, layerFloor));
    vec4 tex2 = texture(uAtlas, vec3(vTexCoord, layerCeil));

    vec4 color = mix(tex1, tex2, uTimeFactor);

    if(uTimeFactor < 0.5) {
        color += texture(uAtlas, vec3(vTexCoord, starLayer)) * (1.0 - (uTimeFactor + 0.5));
    }

    fragColor = color;
}`;

const getUniforms = (gl, p) => {
    return {
        resolution: gl.getUniformLocation(p, "uResolution"),
        textureSize: gl.getUniformLocation(p, 'uTextureSize'),
        atlas: gl.getUniformLocation(p, 'uAtlas'),
        timeFactor: gl.getUniformLocation(p, 'uTimeFactor'),
    };
}
const getAttributes = (gl, p) => {
    return {
        position: gl.getAttribLocation(p, "aPosition"),
        positionOffset: gl.getAttribLocation(p, "aPositionOffset"),
        texCoord: gl.getAttribLocation(p, "aTexCoord"),
    };
}

export default {
    vertexShaderSource,
    fragmentShaderSource,
    getUniforms,
    getAttributes
};