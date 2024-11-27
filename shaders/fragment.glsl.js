export const fragmentShaderX = `
precision highp float;
precision highp isampler3D;

uniform isampler3D map; 
uniform int sliceX;
uniform int textureHeight;
uniform int textureDepth;
uniform float uHuMin;
uniform float uHuMax;

in vec2 vUv;

out vec4 fragColor;

float linearTransform(float hu) {

    if (hu <= uHuMin) {
        return 0.0;
    } else if (hu >= uHuMax) {
        return 1.0;
    } else {
        return (hu - uHuMin) / (uHuMax - uHuMin);
    }
}

void main() {
    // Получаем координаты по Y и Z
    float z = vUv.x; // Отражение вдоль оси Y
    float y = vUv.y; // Отражение вдоль оси Z

    // Преобразуем в целочисленные координаты
    int yInt = int(round(y * float(textureHeight - 1)));
    int zInt = int(round(z * float(textureDepth - 1)));

    // Получаем значение текстуры по срезу Z
    ivec4 texel = texelFetch(map, ivec3(sliceX, yInt, zInt), 0); 

    float hu = float(texel.r);
    float pixelValue = linearTransform(hu);

    fragColor = vec4(pixelValue, pixelValue, pixelValue, 1.0);
}
`;

export const fragmentShaderY = `
precision highp float;
precision highp isampler3D;

uniform isampler3D map; 
uniform int sliceY;
uniform int textureWidth;
uniform int textureDepth;
uniform float uHuMin;
uniform float uHuMax;

in vec2 vUv;

out vec4 fragColor;

float linearTransform(float hu) {

    if (hu <= uHuMin) {
        return 0.0;
    } else if (hu >= uHuMax) {
        return 1.0;
    } else {
        return (hu - uHuMin) / (uHuMax - uHuMin);
    }
}

void main() {
    // Получаем координаты по X и Z
    float x = vUv.x;
    float z = vUv.y;

    // Преобразуем в целочисленные координаты
    int xInt = int(round(x * float(textureWidth - 1)));
    int zInt = int(round(z * float(textureDepth - 1)));

    // Получаем значение текстуры по срезу Z
    ivec4 texel = texelFetch(map, ivec3(xInt, sliceY, zInt), 0); 

    float hu = float(texel.r);
    float pixelValue = linearTransform(hu);

    fragColor = vec4(pixelValue, pixelValue, pixelValue, 1.0);
}
`;

export const fragmentShaderZ = `
precision highp float;
precision highp isampler3D;

uniform isampler3D map; 
uniform int sliceZ;
uniform int textureWidth;
uniform int textureHeight;
uniform float uHuMin;
uniform float uHuMax;

in vec2 vUv;

out vec4 fragColor;

float linearTransform(float hu) {

    if (hu <= uHuMin) {
        return 0.0;
    } else if (hu >= uHuMax) {
        return 1.0;
    } else {
        return (hu - uHuMin) / (uHuMax - uHuMin);
    }
}

void main() {
    // Получаем координаты по X и Y
    float x = vUv.x;
    float y = vUv.y;

    // Преобразуем в целочисленные координаты
    int xInt = int(round(x * float(textureWidth - 1)));
    int yInt = int(round(y * float(textureHeight - 1)));

    // Получаем значение текстуры по срезу Z
    ivec4 texel = texelFetch(map, ivec3(xInt, yInt, sliceZ), 0); 

    float hu = float(texel.r);
    float pixelValue = linearTransform(hu);

    fragColor = vec4(pixelValue, pixelValue, pixelValue, 1.0);
}
`;
