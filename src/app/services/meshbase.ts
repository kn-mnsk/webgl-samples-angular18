import { Directive } from '@angular/core';

/**
 * Abstract class for Mesh
 * The followings need to be implemented;
 * @property meshName
 * @property size
 * @property attributesData
 * @method getMeshName
 * @method genAttributes
 * @method position
 * @method normal
 * @method textcoord
 * @method colors
 * @method indices
 * @method verticesCount
 */
@Directive()
export abstract class MeshBase {

  abstract meshName: string;
  protected get getMeshName(): string {
    return this.meshName;
  }

  constructor() { };

  protected abstract size: number;
  protected attributesData: Array<number> = new Array();

  public abstract genAttributes(length: number): void;

  public get attributes(): Float32Array {
    return new Float32Array(this.attributesData);
  }

  /**
   * return vec3 position
   */
  protected abstract get position(): Float32Array;

  /**
   * return vec3 normal
  */
  protected abstract get normal(): Float32Array;

  /**
   * return ve2 texure coordinate
  */
  protected abstract get texcoord(): Float32Array;

  /**
   * return vec3 color
  */
  protected abstract get colors(): Float32Array;

  public abstract get indices(): Uint16Array;

  public get indicesCount(): number {
    return this.indices.length;
  }

  public abstract get verticesCount(): number;

}
