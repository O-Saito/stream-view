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
uniform float uTime;

in vec2 vTexCoord;

out vec4 fragColor;

void main()
{
    float waveStrength = 0.005; 
    float frequency = 6.0;    
    float speed = 2.0;         
    
    float waveX = sin(vTexCoord.y * frequency + uTime * speed) * waveStrength;
    float waveY = cos(vTexCoord.x * frequency + uTime * speed) * waveStrength;

    vec2 distortedUV = vTexCoord + vec2(waveX, waveY);

    fragColor = texture(uSampler, distortedUV);
}`;

const getUniforms = (gl, p) => {
    return {
        sampler: gl.getUniformLocation(p, 'uSampler'),
        resolution: gl.getUniformLocation(p, "uResolution"),
        time: gl.getUniformLocation(p, 'uTime'),
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