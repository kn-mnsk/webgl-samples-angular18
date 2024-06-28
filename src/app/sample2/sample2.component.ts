import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { mat4, vec3 } from 'gl-matrix';

import { ShaderInfo } from '../services/shader.service';
import { MeshInfo, meshType } from '../services/mesh.service';
import { MeshPlaneService } from '../services/mesh-plane.service';


import { WebGLBase } from '../webglbase';


@Component({
  selector: 'app-sample2',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './sample2.component.html',
  styleUrl: './sample2.component.css',
  providers: []
})
export class Sample2Component extends WebGLBase {
  override title = "Sample2";

  constructor(protected plane: MeshPlaneService) {

    super();
    // let's create renderring instruction
    this.setHowToDraw(
      [
        {
          drawId: "Plane",
          meshName: "plane",
          shaderName: "sample2",
          textureName: ""
        },
      ]
    );
    // console.log(`Debug: ${this.title}Component extends ${this.baseClassName} - Instatiated`);
  }

  override initShader(): void {

    this.shaderService?.asyncLoadShaders(
      this.gl,
      [
        {
          name: "sample2",
          vsSrc: "./app/shaders/sample2.vs",
          fsSrc: "./app/shaders/sample2.fs",
          program: null,
          programReady: false
        },
      ]
    );

  }

  override initMesh(): void {

    this.meshService?.setMeshInfos(
      [
        {
          name: "plane",
          vao: null,
          abo: null,
          eabo: null,
          mesh: this.plane,
          meshSize: 1.0
        }
      ]
    );

  }

  override initTexture(): void {
    this.textureService = null;
  }

  override initGlBuffers(): void {

    //Buffers creation and binding
    this.meshService?.meshes.forEach((meshinfo, meshname) => {

      meshinfo.vao = this.gl.createVertexArray();
      meshinfo.abo = this.gl.createBuffer();
      meshinfo.eabo = this.gl.createBuffer();

      this.gl.bindVertexArray(meshinfo.vao);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshinfo.abo);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, meshinfo.eabo);

      // set buffer to data
      const mesh = meshinfo.mesh as meshType;
      mesh.genAttributes(meshinfo.meshSize);

      this.gl.bufferData(this.gl.ARRAY_BUFFER, mesh.attributes, this.gl.STATIC_DRAW);

      this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, mesh.indices, this.gl.STATIC_DRAW);

      meshinfo.mesh = mesh;
      this.meshService?.setMesh(meshinfo);

    });


    this.shaderService?.shaders.forEach((shaderinfo, shadername) => {

      let stride: number = 0;
      let posOffset: number = 0;

      let meshinfo: MeshInfo;

      switch (shadername) {
        case "sample2": {

          meshinfo = this.meshService?.meshes.get("plane") as MeshInfo;

          // calc stride and offset
          stride = 5 * Float32Array.BYTES_PER_ELEMENT; // 2 for position, 3 for color
          posOffset = 0;

          this.gl.bindVertexArray(meshinfo.vao);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshinfo.abo);
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, meshinfo.eabo);

          this.gl.useProgram(shaderinfo.program);

          this.gl.bindVertexArray(meshinfo.vao);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshinfo.abo);
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, meshinfo.eabo);

          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_position", 2, this.gl.FLOAT, false, stride, posOffset);

          break;
        }
      }
    });

  }

  override draw(): void {

    this.howToDraw.forEach((howtodraw, drawId) => {

      let model: mat4;

      const shaderinfo = this.shaderService?.shaders.get(howtodraw.shaderName) as ShaderInfo;

      const meshinfo = this.meshService?.meshes.get(howtodraw.meshName) as MeshInfo;

      this.gl.useProgram(shaderinfo.program);
      this.gl.bindVertexArray(meshinfo.vao);

      this.setPerspective(shaderinfo.program);

      switch (drawId) {
        case "Plane": {

          model = mat4.create();

          mat4.translate(model, model, [0.0, 0.0, -7]);

          this.shaderService?.setMat4(this.gl, shaderinfo.program, "model", model);

          const mesh = meshinfo.mesh as MeshPlaneService;

          this.gl.drawElements(this.gl.TRIANGLES, mesh?.indicesCount, this.gl.UNSIGNED_SHORT, 0);

          break;
        }

      }
    });

  }

}

