import { Injectable } from '@angular/core';

import { MeshCubeService } from './mesh-cube.service';
import { MeshPlaneService } from './mesh-plane.service';


type meshTypeArray = { cube: MeshCubeService, plane: MeshPlaneService };
export type meshType = meshTypeArray[keyof meshTypeArray];

export interface MeshInfo{
  name: string,
  vao: WebGLVertexArrayObject | null,
  abo: WebGLBuffer | null,
  eabo: WebGLBuffer | null,
  mesh: meshType | null,
  meshSize: number,
  // type: <Type>(arg: Object | null)=> Type ,
}

@Injectable({
  providedIn: 'root'
})
export class MeshService {

  title = "MeshService";


  protected isbrowser: boolean = false as boolean;
  public get isBrowser() { return this.isbrowser; }
  public set isBrowser(b: boolean) { this.isbrowser = b; }

  constructor() { }

  private meshinfos: MeshInfo[] = [];
  private get meshInfos(): MeshInfo[] {
    return this.meshinfos;
  }
  private set meshInfos(infos: MeshInfo[]) {
    this.meshinfos = infos;
  }

  public setMeshInfos(infos: MeshInfo[]): void {
    this.meshInfos = infos;
    this.meshInfos.map((value, index) => {
      this.meshesmap.set(value.name, value);
    });
  }

  private meshesmap: Map<string, MeshInfo> = new Map<string, MeshInfo>();
  public get meshes() {
    return this.meshesmap;
  }

  public setMesh(meshinfo:
    MeshInfo) {
    this.meshesmap.set(meshinfo.name, meshinfo);
  }

  public deleteMeshes(gl: WebGL2RenderingContext): void{
    this.meshesmap.forEach((meshinfo, name) => {
      // VAO
      gl.deleteVertexArray(meshinfo.vao);

      // ABO
      gl.bindBuffer(gl.ARRAY_BUFFER, meshinfo.abo);
      gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
      gl.deleteBuffer(meshinfo.abo);

      // EABO
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshinfo.eabo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 1, gl.STATIC_DRAW);
      gl.deleteBuffer(meshinfo.eabo);

      meshinfo.mesh = null;
      meshinfo.vao = null;
      meshinfo.abo = null;
      meshinfo.eabo = null;

    });

    this.meshesmap.clear();
    this.meshinfos = [];
  }

}
