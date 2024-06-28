#version 300 es

/**
* @see https://github.com/mdn/dom-examples/blob/main/webgl-examples/tutorial/sample8/webgl-demo.js
*/

layout(std140) uniform;

layout(location = 0) in vec2 a_position;

uniform mat4 model;
uniform mat4 projection;


void main() {
  gl_Position = projection * model * vec4(a_position, 0.0, 1.0);
}
