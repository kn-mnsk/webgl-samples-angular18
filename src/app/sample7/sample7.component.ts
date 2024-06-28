import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { mat4, vec3 } from 'gl-matrix';

import { ShaderInfo } from '../services/shader.service';
import { TextureInfo } from '../services/texture.service';
import { MeshInfo, meshType } from '../services/mesh.service';
import { MeshCubeService } from '../services/mesh-cube.service';

import { WebGLBase } from '../webglbase';


@Component({
  selector: 'app-sample7',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './sample7.component.html',
  styleUrl: './sample7.component.css',
  providers: []
})
export class Sample7Component extends WebGLBase {

  override title = "Sample7";

  constructor(protected cube: MeshCubeService) {

    super();

    this.setHowToDraw(
      [
        {
          drawId: "Cube7",
          meshName: "cube",
          shaderName: "sample7",
          textureName: "cubetexture"
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
          name: "sample7",
          vsSrc: "./app/shaders/sample7.vs",
          fsSrc: "./app/shaders/sample7.fs",
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

    this.textureService?.asyncLoadTextures(
      this.gl,
      [
        {
          name: "cubetexture",
          src: "./assets/textures/image/cubetexture.png",
          type: "img",
          mediaData: null,
          mediaDataReady: false,
          texture: null,
          textureUnit: this.gl.TEXTURE0
        },
      ]
    );

    // console.log(`Debug  ${this.title} initTexture : final Loaded Textures`, this.textureService?.textures);

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

    }
    );

    this.shaderService?.shaders.forEach((shaderinfo, shadername) => {

      let stride: number = 0;
      let posOffset: number = 0;
      let normalOffset: number = 0;
      let texOffset: number = 0;

      let meshinfo: MeshInfo;

      switch (shadername) {
        case "sample7": {

          meshinfo = this.meshService?.meshes.get("cube") as MeshInfo;

          // calc stride and offset
          stride = 11 * Float32Array.BYTES_PER_ELEMENT; // 3 for position, 3 for normal and 2 for texcoord, 3 for facecolor
          posOffset = 0;
          normalOffset = 3 * Float32Array.BYTES_PER_ELEMENT;
          texOffset = 6 * Float32Array.BYTES_PER_ELEMENT;

          this.gl.useProgram(shaderinfo.program);

          this.gl.bindVertexArray(meshinfo.vao);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshinfo.abo);
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, meshinfo.eabo);

          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_position", 3, this.gl.FLOAT, false, stride, posOffset);
          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_normal", 3, this.gl.FLOAT, false, stride, normalOffset);
          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_texcoord", 2, this.gl.FLOAT, false, stride, texOffset);

        }
      }
    });

  }

  override draw(): void {

    this.now = new Date().getTime(); // in seconds
    const deltaTime: number = this.now - this.then;
    this.then = this.now;
    this.rotationAngle += deltaTime / 1000;


    this.howToDraw.forEach((howtodraw, drawId) => {

      let model: mat4;
      let normal: mat4;


      const textureinfo = this.textureService?.textures.get(howtodraw.textureName) as TextureInfo;

      const shaderinfo = this.shaderService?.shaders.get(howtodraw.shaderName) as ShaderInfo;

      const meshinfo = this.meshService?.meshes.get(howtodraw.meshName) as MeshInfo;


      this.gl.useProgram(shaderinfo.program);
      this.gl.bindVertexArray(meshinfo.vao);
      this.setPerspective(shaderinfo.program);

      switch (drawId) {
        case "Cube7": {

          model = mat4.create();
          mat4.translate(model, model, [0.0, 0.0, -5]);
          // axis to rotate around Z
          mat4.rotate(model, model, this.rotationAngle, vec3.fromValues(0.0, 0.0, 1.0));
          // axis to rotate around Y
          mat4.rotate(model, model, this.rotationAngle * 0.7, vec3.fromValues(0.0, 1.0, 0.0));
          // axis to rotate around X
          mat4.rotate(model, model, this.rotationAngle * 0.3, vec3.fromValues(1.0, 0.0, 0.0));
          this.shaderService?.setMat4(this.gl, shaderinfo.program, "model", model);

          normal = mat4.create();
          mat4.invert(normal, model);
          mat4.transpose(normal, normal);
          this.shaderService?.setMat4(this.gl, shaderinfo.program, "normal", normal);

          this.textureService?.updateTexture(this.gl, textureinfo);

          const mesh = meshinfo.mesh as MeshCubeService;

          this.gl.drawElements(this.gl.TRIANGLES, mesh.indicesCount, this.gl.UNSIGNED_SHORT, 0);

          break;
        }

      }

    });

  }

}
