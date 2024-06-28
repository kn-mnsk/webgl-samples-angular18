import { Injectable } from '@angular/core';
import { MeshBase } from './meshbase';

@Injectable({
  providedIn: 'root'
})
export class MeshCubeService extends MeshBase {

  override meshName = "Cube";

  constructor() {
    super();
  }

  override size = 0;
  // override attributesData = new Array();

  /**
   * Generate cube mesh consisting of position, normal, textcoord and facecolor
   * @param edgelength edge length of cube
  */
  override genAttributes(edgelength: number) {

    this.size = edgelength;

    const position: Float32Array = this.position;
    const normal: Float32Array = this.normal;
    const texcoord: Float32Array = this.texcoord;
    const colors: Float32Array = this.colors;

    for (let i = 0; i < 24; i++) {
      for (let j = 0; j < 3; j++) {
        this.attributesData.push(position[3 * i + j]);
      }
      for (let k = 0; k < 3; k++) {
        this.attributesData.push(normal[3 * i + k]);
      }
      for (let l = 0; l < 2; l++) {
        this.attributesData.push(texcoord[2 * i + l]);
      }
      for (let m = 0; m < 3; m++) {
        this.attributesData.push(colors[3 * i + m]);
      }
    }

  }

  override get position(): Float32Array {
    const len: number = this.size / 2.0;
    return new Float32Array([
      // Front face
      -len, -len, len, len, -len, len, len, len, len, -len, len, len,

      // Back face
      -len, -len, -len, -len, len, -len, len, len, -len, len, -len, -len,

      // Top face
      -len, len, -len, -len, len, len, len, len, len, len, len, -len,

      // Bottom face
      -len, -len, -len, len, -len, -len, len, -len, len, -len, -len, len,

      // Right face
      len, -len, -len, len, len, -len, len, len, len, len, -len, len,

      // Left face
      -len, -len, -len, -len, -len, len, -len, len, len, -len, len, -len,
    ]);
  }

  /**
   * return vec3 normal
   */
  override get normal(): Float32Array {
    return new Float32Array([
      // Front
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

      // Back
      0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

      // Top
      0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

      // Bottom
      0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

      // Right
      1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

      // Left
      -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
    ]);
  }

  /**
   * return ve2 texure coordinate
   */
  override get texcoord(): Float32Array {
    return new Float32Array([
      // Front
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Back
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Top
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Bottom
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Right
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
      // Left
      0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    ]);
  }

  override get colors(): Float32Array {

    const r = [1.0, 0.0, 0.0];
    const g = [0.0, 1.0, 0.0];
    const b = [0.0, 0.0, 1.0];
    const y = [1.0, 1.0, 0.0];
    const p = [1.0, 0.0, 1.0]; //purple
    const w = [1.0, 1.0, 1.0];
    const facecolors = [w, r, g, b, y, p];

    let colors = [] as number[];
    for (let side = 0; side < facecolors.length; side++) {
      for (let i = 0; i < 4; i++) {
        colors = colors.concat(facecolors[side]);
      }
    }

    return new Float32Array(colors);
  }

  override get indices(): Uint16Array {
    return new Uint16Array([
      // front
      0, 1, 2, 0, 2, 3,
      // back
      4, 5, 6, 4, 6, 7,
      // top
      8, 9, 10, 8, 10, 11,
      // bottom
      12, 13, 14, 12, 14, 15,
      // right
      16, 17, 18, 16, 18, 19,
      // left
      20, 21, 22, 20, 22, 23
    ])
  }

  override get verticesCount(): number {
    return this.position.length / 12;
  }

}
