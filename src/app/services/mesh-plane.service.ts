import { Injectable } from '@angular/core';
import { MeshBase } from './meshbase';

@Injectable({
  providedIn: 'root'
})
export class MeshPlaneService extends MeshBase {

  override meshName = "Plane";

  constructor() {
    super();
  }

  override size = 0;
  // override attributesData = new Array();

  /**
   * Generate plane mesh consisting of position and color
   * @param edgelength edge length of plane
  */
  override genAttributes(edgelength: number) {

    this.size = edgelength;

    const position = this.position;
    const colors = this.colors;

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 2; j++) {
        this.attributesData.push(position[2 * i + j]);
      }

      for (let k = 0; k < 3; k++) {
        this.attributesData.push(colors[3 * i + k]);
      }
    }
  }

  override get position(): Float32Array {
    const s: number = this.size;
    return new Float32Array([s, s, -s, s, s, -s, -s, -s]);
  }

  override get normal(): Float32Array {
    // no normal
    return new Float32Array();

  }

  override get texcoord(): Float32Array {
    // no texcoord
    return new Float32Array();

  }

  override get colors(): Float32Array {

    const r = [1.0, 0.0, 0.0];
    const g = [0.0, 1.0, 0.0];
    const b = [0.0, 0.0, 1.0];
    const y = [1.0, 1.0, 0.0];
    const p = [1.0, 0.0, 1.0]; //purple
    const w = [1.0, 1.0, 1.0];
    const squarecolors = [w, r, g, b];

    let colors = [] as number[];

    for (let i = 0; i < 4; i++) {
      colors = colors.concat(squarecolors[i]);
    }

    // console.log("Debug: model squareplane color ", colors);
    return new Float32Array(colors);
  }

  override get indices(): Uint16Array {
    return new Uint16Array([3, 1, 0, 0, 2, 3]);
  }

  override get verticesCount(): number {
    return this.position.length;
  }

}
