const vertexShaderSource = `#version 300 es

uniform vec2 uResolution;

layout(location=0) in vec4 aPosition;
layout(location=1) in vec2 aTexCoord;

out vec2 vTexCoord;
out vec2 vResolution;
out vec2 vPixelSize;
out float vAspecRatio;

void main()
{
    gl_Position = aPosition;
    vTexCoord = aTexCoord;
    vResolution = uResolution;
    vPixelSize = vec2(1.0 / vResolution.x, 1.0 / vResolution.y);
    vAspecRatio =  vResolution.x / vResolution.y;
}`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

const float MIN_LIGHT = 0.4;
const float SOURCE_LIGHT = 0.8;

uniform sampler2D uSampler;
uniform sampler2D uSamplerNormal;
uniform sampler2D uObjectInfo;
uniform sampler2D uLightMap;
uniform sampler2D uBackground;

uniform vec3 uGlobalLightPosition;

in vec2 vResolution;
in vec2 vTexCoord;
in vec2 vPixelSize;
in float vAspecRatio;

out vec4 fragColor;

void main()
{
    vec4 tex = texture(uSampler, vTexCoord);
    vec4 texNormal = texture(uSamplerNormal, vTexCoord);
    vec4 objectinfo = texture(uObjectInfo, vTexCoord);
    vec4 texLight = texture(uLightMap, vTexCoord);
    vec4 texBG = texture(uBackground, vTexCoord);

    vec3 normal = normalize(vec3(0.5, 0.5, 1.0) * 2.0 - 1.0); // normalize(vec3(0.1, 0.1, 0.9));
    float brightness = 0.0;

    if(texNormal.a > 0.0){
        normal = normalize(texNormal.rgb * 2.0 - 1.0);
    }

    brightness = max(dot(uGlobalLightPosition, normal), 0.0);
    vec3 finalColor = texBG.rgb;
    float alpha = texBG.a;
    if(tex.a != 0.0) {
        finalColor = tex.rgb * mix(objectinfo.a == 1.0 ? SOURCE_LIGHT : MIN_LIGHT, 1.0, brightness);
        alpha = tex.a;
    }
    vec3 normalizedCoord = vec3((gl_FragCoord.xy / vResolution) * 2.0 - 1.0, gl_FragCoord.z);
    normalizedCoord.x *= vAspecRatio;

    // finalColor += texture(uSampler, vTexCoord + vec2(vPixelSize.x, 0.0)).rgb * 0.2;
    // finalColor += texture(uSampler, vTexCoord - vec2(vPixelSize.x, 0.0)).rgb * 0.2;
    // finalColor += texture(uSampler, vTexCoord + vec2(0.0, vPixelSize.y)).rgb * 0.2;
    // finalColor += texture(uSampler, vTexCoord - vec2(0.0, vPixelSize.y)).rgb * 0.2;

    if(texLight.a > 0.0) 
        finalColor += texLight.rgb;
    
    fragColor = vec4(finalColor, alpha);
}`;

const getUniforms = (gl, p) => {
    return {
        sampler: gl.getUniformLocation(p, 'uSampler'),
        samplerNormal: gl.getUniformLocation(p, 'uSamplerNormal'),
        objectInfo: gl.getUniformLocation(p, 'uObjectInfo'),
        lightMap: gl.getUniformLocation(p, 'uLightMap'),
        background: gl.getUniformLocation(p, 'uBackground'),
        resolution: gl.getUniformLocation(p, "uResolution"),
        globalLightPosition: gl.getUniformLocation(p, 'uGlobalLightPosition'),
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