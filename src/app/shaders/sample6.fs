#version 300 es

/**
* @see https://github.com/mdn/dom-examples/blob/main/webgl-examples/tutorial/sample8/webgl-demo.js
*/

// precision mediump int;
// precision mediump float;
// precision highp float;
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D uSampler;
in vec2 v_texcoord;

out vec4 FragColor;

void main() {
  FragColor = texture(uSampler, v_texcoord);
}
