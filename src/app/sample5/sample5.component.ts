import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { mat4, vec3 } from 'gl-matrix';

import { ShaderInfo } from '../services/shader.service';
import { MeshInfo, meshType } from '../services/mesh.service';
import { MeshCubeService } from '../services/mesh-cube.service';

import { WebGLBase } from '../webglbase';

@Component({
  selector: 'app-sample5',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './sample5.component.html',
  styleUrl: './sample5.component.css',
  providers: []
})
export class Sample5Component extends WebGLBase {

  override title = "Sample5";

  constructor(protected cube: MeshCubeService) {

    super();

    // let's create renderring instruction
    this.setHowToDraw(
      [
        {
          drawId: "Cube5",
          meshName: "cube",
          shaderName: "sample5",
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
          name: "sample5",
          vsSrc: "./app/shaders/sample5.vs",
          fsSrc: "./app/shaders/sample5.fs",
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
          name: "cube",
          vao: null,
          abo: null,
          eabo: null,
          mesh: this.cube,
          meshSize: 1.0
        },
      ]
    );
  }

  override initTexture(): void {

    this.textureService = null;

  }

  override initGlBuffers(): void {

    // buffer creation

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
      let colorOffset: number = 0;

      let meshinfo: MeshInfo;

      switch (shadername) {
        case "sample5": {

          meshinfo = this.meshService?.meshes.get("cube") as MeshInfo;

          // calc stride and offset
          stride = 11 * Float32Array.BYTES_PER_ELEMENT; // 3 for position, 3 for normal and 2 for texcoord, 3 for facecolor
          posOffset = 0;
          colorOffset = 8 * Float32Array.BYTES_PER_ELEMENT

          this.gl.useProgram(shaderinfo.program);

          this.gl.bindVertexArray(meshinfo.vao);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshinfo.abo);
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, meshinfo.eabo);

          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_position", 3, this.gl.FLOAT, false, stride, posOffset);
          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_color", 3, this.gl.FLOAT, false, stride, colorOffset);

        }
      }
    });

  }

  override draw(): void {

    this.now = performance.now(); // convert to miliseconds
    const deltaTime = this.now - this.then;
    this.then = this.now;
    this.rotationAngle += deltaTime / 1000;

    this.howToDraw.forEach((howtodraw, drawId) => {

      let model: mat4;

      const shaderinfo = this.shaderService?.shaders.get(howtodraw.shaderName) as ShaderInfo;

      const meshinfo = this.meshService?.meshes.get(howtodraw.meshName) as MeshInfo;

      this.gl.useProgram(shaderinfo.program);
      this.gl.bindVertexArray(meshinfo.vao);
      this.setPerspective(shaderinfo.program);

      switch (drawId) {
        case "Cube5": {

          model = mat4.create();
          mat4.translate(model, model, [0.0, 0.0, -5]);

          // axis to rotate around Z
          mat4.rotate(model, model, this.rotationAngle, vec3.fromValues(0.0, 0.0, 1.0));
          // axis to rotate around Y
          mat4.rotate(model, model, this.rotationAngle * 0.7, vec3.fromValues(0.0, 1.0, 0.0));
          // axis to rotate around X
          mat4.rotate(model, model, this.rotationAngle * 0.3, vec3.fromValues(1.0, 0.0, 0.0));

          this.shaderService?.setMat4(this.gl, shaderinfo.program, "model", model);

          const mesh = meshinfo.mesh as MeshCubeService;
          this.gl.drawElements(this.gl.TRIANGLES, mesh.indicesCount, this.gl.UNSIGNED_SHORT, 0);

        }
      }

    });

  }

}



