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
in vec3 v_lighting;

out vec4 FragColor;

void main() {
  vec4 texColor = texture(uSampler, v_texcoord);
  FragColor = vec4(texColor.rgb * v_lighting, texColor.a);
}
