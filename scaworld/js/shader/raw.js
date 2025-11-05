const vertexShaderSource = `#version 300 es

in vec4 aPosition;
in vec2 aTexCoord;

out vec2 vTexCoord;

void main()
{
    gl_Position = aPosition;
    vTexCoord = aTexCoord;
}`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform sampler2D uSampler;

uniform vec2 uResolution;

in vec2 vTexCoord;

out vec4 fragColor;

void main()
{
    vec4 color = texture(uSampler, vTexCoord);
    fragColor = color;
}`;

const getUniforms = (gl, p) => {
    return {
        sampler: gl.getUniformLocation(p, 'uSampler'),
        resolution: gl.getUniformLocation(p, "uResolution"),
    };
}
const getAttributes = (gl, p) => {
    return {
        position: gl.getAttribLocation(p, 'aPosition'),
        texCoord: gl.getAttribLocation(p, 'aTexCoord'),
    };
}
export default {
    vertexShaderSource,
    fragmentShaderSource,
    getUniforms,
    getAttributes
};