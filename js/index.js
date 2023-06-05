const canvas = document.querySelector('#c');
canvas.width = 800;
canvas.height = 600;
const gl = canvas.getContext('webgl');

if (!gl) 
    console.log('browser does not support WebGL');

//// initialization time

const vertexShaderSource = 
`
    attribute vec4 a_position;
    attribute vec2 a_tex_coord;

    uniform mat4 modelView;
    uniform mat4 projection;

    varying vec2 v_tex_coord;
    varying vec4 v_color;

    void main()
    {
        gl_Position = projection * modelView * a_position;
        v_tex_coord = a_tex_coord;
        v_color = (gl_Position + 1.0) / 2.0;
    }
`

const fragmentShaderSource = 
`
    precision mediump float;

    varying vec2 v_tex_coord;
    varying vec4 v_color;

    uniform sampler2D diffuse;

    void main()
    {
        vec4 diffuseColor = texture2D(diffuse, v_tex_coord);
        gl_FragColor = diffuseColor;
        //gl_FragColor = v_color;
    }
`

function CreateShader(type, source) {
    let shader = gl.createShader(type, source);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success)
        return shader;

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

const vertexShader = CreateShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = CreateShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

CreateProgram = function(vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success)
        return program;

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);    
};

const program = CreateProgram(vertexShader, fragmentShader);

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positions = [
    // front face
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, 0.5, 0.5,
    -0.5, 0.5, 0.5,

    // back face
    -0.5, -0.5, -0.5,
    0.5, -0.5, -0.5,
    0.5, 0.5, -0.5,
    -0.5, 0.5, -0.5,
    
    // right face
    0.5, -0.5, 0.5,
    0.5, -0.5, -0.5,
    0.5, 0.5, -0.5,
    0.5, 0.5, 0.5,

    // left face
    -0.5, -0.5, 0.5,
    -0.5, -0.5, -0.5,
    -0.5, 0.5, -0.5,
    -0.5, 0.5, 0.5,

    // top face
    -0.5, 0.5, 0.5,
    0.5, 0.5, 0.5,
    0.5, 0.5, -0.5,
    -0.5, 0.5, -0.5,

    // bottom face
    -0.5, -0.5, 0.5,
    0.5, -0.5, 0.5,
    0.5, -0.5, -0.5,
    -0.5, -0.5, -0.5,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

const texCoordAttributeLocation = gl.getAttribLocation(program, 'a_tex_coord');
const texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
const texCoords = [
    // front face
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,

    // back face
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,

    // right face
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,

    // left face
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,

    // top face
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0,

    // bottom face
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
const indices = [
    // front face
    0, 1, 2,
    2, 3, 0,
    
    // back face
    5, 4, 7, 
    7, 6, 5,
    
    // right face
    8, 9, 10,
    10, 11, 8,
    
    // left face
    13, 12, 15,
    15, 14, 13,

    // top face
    16, 17, 18,
    18, 19, 16,

    // bottom face
    21, 20, 23,
    23, 22, 21,
];
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

const makeTextCanvas = (text, width, height, color) => {
    const ctx = document.createElement('canvas').getContext('2d')
    ctx.canvas.width = width
    ctx.canvas.height = height
    ctx.font = `bold ${height * 5 / 6 | 0}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.fillText(text, width / 2, height / 2)
    return ctx.canvas
};

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(
    gl.TEXTURE_2D,
    0,                // mip level
    gl.RGBA,          // internal format
    gl.RGBA,          // format
    gl.UNSIGNED_BYTE, // type
    makeTextCanvas('L', 128, 128, 'blue')
);

gl.generateMipmap(gl.TEXTURE_2D);

const diffuseTextureLocation = gl.getUniformLocation(program, 'diffuse');

const projectionMatrixLocation = gl.getUniformLocation(program, 'projection');
const modelViewMatrixLocation = gl.getUniformLocation(program, 'modelView');

const webGLMatrix = new Learn_webgl_matrix();
const projectionMatrix = webGLMatrix.createPerspective(90, 3/2, 0.1, 100.0);

//// rendering time
let rotation = 0.0;

function Loop() {
    window.requestAnimationFrame(Loop);

    const modelViewMatrix = webGLMatrix.create();
    const rotationMatrix = webGLMatrix.create();
    const translationMatrix = webGLMatrix.create();
    webGLMatrix.rotate(rotationMatrix, rotation, 0.0, 1.0, 0.0);
    webGLMatrix.translate(translationMatrix, 0.0, 0.0, -2.0);
    webGLMatrix.multiply(modelViewMatrix, translationMatrix, rotationMatrix);

    rotation += 0.2;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    gl.uniformMatrix4fv(projectionMatrixLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLocation, false, modelViewMatrix);

    const texUnit = 6;
    gl.activeTexture(gl.TEXTURE0 + texUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(diffuseTextureLocation, texUnit);

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    {
        const size = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    }

    gl.enableVertexAttribArray(texCoordAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    {
        const size = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.vertexAttribPointer(texCoordAttributeLocation, size, type, normalize, stride, offset);
    }

    gl.enable(gl.DEPTH_TEST);
    //gl.enable(gl.CULL_FACE);

    //const primitiveType = gl.TRIANGLES;
    //const vertexOffset = 0;
    //const vertexCount = 3;
    //gl.drawArrays(primitiveType, vertexOffset, vertexCount);

    const primitiveType = gl.TRIANGLES;
    const indexCount = 36;
    const indexType = gl.UNSIGNED_SHORT;
    const indexOffset = 0;
    gl.drawElements(primitiveType, indexCount, indexType, indexOffset);
}

Loop();