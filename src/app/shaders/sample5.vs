#version 300 es

/**
* @see https://github.com/mdn/dom-examples/blob/main/webgl-examples/tutorial/sample8/webgl-demo.js
*/

layout(std140) uniform;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_color;

uniform mat4 model;
uniform mat4 projection;

out vec4 v_color;

void main() {
  gl_Position = projection * model * vec4(a_position, 1.0);

  v_color = vec4(a_color, 1.0);
}
