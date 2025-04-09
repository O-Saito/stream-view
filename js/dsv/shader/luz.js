
const vertexShaderSource = `#version 300 es

uniform vec2 uResolution;

in vec2 aPosition;
in vec3 aLightPos;
in vec3 aLightColor;
in float aLightIntensity;
in float aLightRadius;
in float aObjectId;

out vec2 vResolution;
out vec3 vLightPos;
out vec3 vLightColor;
out float vIntensity;
out float vRadius;
out float vObjectId;
//out float vAspectRatio;

void main() {
    vLightPos = aLightPos;
    vLightColor = aLightColor;
    vIntensity = aLightIntensity;
    vRadius = aLightRadius;
    vResolution = uResolution;
    vObjectId = aObjectId;
    //vAspectRatio = uResolution.x / uResolution.y;

    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentShaderSource = `#version 300 es
precision mediump float;

const float MIN_LIGHT = 0.4;
const float DIFFUSE_MAX = 0.6;
const float DIFFUSE_MIN = 0.2;


uniform sampler2D uSamplerNormal;
uniform sampler2D uObjectInfo;

in vec2 vResolution;
in vec3 vLightPos;
in vec3 vLightColor;
in float vIntensity;
in float vRadius;
in float vObjectId;

out vec4 fragColor;

bool low_equal(float a, float b) {
    return a > b - 0.001 && a < b + 0.001; 
}

void main() {
    // descarta onde vai ter agua
    if(gl_FragCoord.y < 25.0) discard;

    vec2 screenUV = gl_FragCoord.xy / vResolution;
    vec3 normalMap = texture(uSamplerNormal, screenUV).rgb;
    // obj.x recebe o id unico do sprite
    // obj.y não recebe nada ainda
    // obj.z não recebe nada ainda
    // obj.w recebe se o sprite é fonte de luz
    vec4 obj = texture(uObjectInfo, screenUV);

    vec3 offset = vLightPos - vec3(gl_FragCoord.xy, 1.0);
    vec3 lightDir = normalize(offset);
    float distance = length(offset);

    if (distance > vRadius) {
        fragColor = vec4(0.0);
        return;
    }

    // if(vObjectId != 0.0) {
    //     float fixId = vObjectId / 100.0;
    //     if(low_equal(obj.x, fixId)) {
    //         fragColor = vec4(vLightColor * 0.9, 0.1);
    //     }
    //     vec2 screen2UV = vec2(gl_FragCoord.x + 1.0 / vResolution.x, gl_FragCoord.y + 1 / vResolution.y);
    //     return;
    // }

    if(normalMap == vec3(0.0)) normalMap = vec3(0.5, 0.5, 1.0);
    vec3 normal = normalize(vec3(normalMap.rg * 2.0 - 1.0, normalMap.b));

    float diffuse = max(dot(normal, lightDir), 0.0);
    float attenuation = 1.0 - clamp(distance / vRadius, 0.0, 1.0);
    //attenuation *= attenuation;
    float lightAmount = vIntensity * mix(DIFFUSE_MIN, DIFFUSE_MAX, diffuse) * attenuation;
    fragColor = vec4(vLightColor * lightAmount, 1.0);
}`;

const getUniforms = (gl, p) => {
    return {
        samplerNormal: gl.getUniformLocation(p, 'uSamplerNormal'),
        objectInfo: gl.getUniformLocation(p, 'uObjectInfo'),
        resolution: gl.getUniformLocation(p, 'uResolution'),
    };
};

const getAttributes = (gl, p) => {
    return {
        position: gl.getAttribLocation(p, "aPosition"),
        lightPosition: gl.getAttribLocation(p, "aLightPos"),
        lightColor: gl.getAttribLocation(p, "aLightColor"),
        lightIntensity: gl.getAttribLocation(p, "aLightIntensity"),
        lightRadius: gl.getAttribLocation(p, "aLightRadius"),
        objectId: gl.getAttribLocation(p, "aObjectId"),
    }
};

export default {
    vertexShaderSource,
    fragmentShaderSource,
    getUniforms,
    getAttributes,
};
