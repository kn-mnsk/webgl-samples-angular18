import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { mat4, vec3 } from 'gl-matrix';

import { ShaderInfo } from '../services/shader.service';
import { TextureInfo } from '../services/texture.service';
import { MeshInfo, meshType} from '../services/mesh.service';

import { MeshCubeService } from '../services/mesh-cube.service';
import { MeshPlaneService } from '../services/mesh-plane.service';

import { WebGLBase } from '../webglbase';

@Component({
  selector: 'app-sample8',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './sample8.component.html',
  styleUrl: './sample8.component.css',
  providers: []
})
export class Sample8Component extends WebGLBase {

  override title = "Sample8";

  constructor(protected cube: MeshCubeService, protected plane: MeshPlaneService) {

    super();

    // let's create renderring instruction
    this.setHowToDraw(
      [
        {
          drawId: "Solar01",
          meshName: "cube",
          shaderName: "sample7",
          textureName: "solar01"
        },
        {
          drawId: "Firefox",
          meshName: "cube",
          shaderName: "sample8",
          textureName: "firefox"
        },
        {
          drawId: "Cube7",
          meshName: "cube",
          shaderName: "sample7",
          textureName: "Xback"
        },
        {
          drawId: "Cube6",
          meshName: "cube",
          shaderName: "sample6",
          textureName: "cubetexture"
        },
        {
          drawId: "Plane",
          meshName: "plane",
          shaderName: "sample4",
          textureName: ""
        }
      ]
    );

    // console.log(`Debug: ${this.title}Component extends ${this.baseClassName} - Instatiated`);

  }

  override initShader(): void {

    //for multi shaders
    this.shaderService?.asyncLoadShaders(
      this.gl,
      [
        {
          name: "sample8",
          vsSrc: "./app/shaders/sample8.vs",
          fsSrc: "./app/shaders/sample8.fs",
          program: null,
          programReady: false
        },
        {
          name: "sample7",
          vsSrc: "./app/shaders/sample7.vs",
          fsSrc: "./app/shaders/sample7.fs",
          program: null,
          programReady: false
        },
        {
          name: "sample6",
          vsSrc: "./app/shaders/sample6.vs",
          fsSrc: "./app/shaders/sample6.fs",
          program: null,
          programReady: false
        },
        {
          name: "sample4",
          vsSrc: "./app/shaders/sample4.vs",
          fsSrc: "./app/shaders/sample4.fs",
          program: null,
          programReady: false
        },
      ]
    );

    // console.log(`Debug: ${this.title}Component multi shaders`, this.shaderService?.shaders);

  }

  override initMesh(): void {

    this.meshService?.setMeshInfos(
      [
        {
          name: "cube",
          vao: null,
          abo: null,
          eabo: null,
          mesh: this.cube, //as MeshCubeService,
          meshSize: 1.0
        },
        {
          name: "plane",
          vao: null,
          abo: null,
          eabo: null,
          mesh: this.plane, //as MeshPlaneService,
          meshSize: 1.0
        }
      ]
    );

    //console.log(`Debug: ${this.title}Component multi Meshes`, this.meshService?.meshes);

  }

  override initTexture(): void {

    this.textureService?.asyncLoadTextures(
      this.gl,
      [
        {
          name: "solar01",
          src: "./assets/textures/video/solar01.mp4",
          type: "video/mp4",
          mediaData: null,
          mediaDataReady: false,
          texture: null,
          textureUnit: this.gl.TEXTURE0
        },
        {
          name: "firefox",
          src: "./assets/textures/video/Firefox.mp4",
          type: "video/mp4",
          mediaData: null,
          mediaDataReady: false,
          texture: null,
          textureUnit: this.gl.TEXTURE0
        },
        {
          name: "Xback",
          src: "./assets/textures/image/back.jpg",
          type: "img",
          mediaData: null,
          mediaDataReady: false,
          texture: null,
          textureUnit: this.gl.TEXTURE0
        },
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

      meshinfo.mesh=mesh;
      this.meshService?.setMesh(meshinfo);

    });

    // console.log(`Debug: ${this.title}Component InitBuffers  multi Meshes`, this.meshService?.meshes);

    // Multi Shaders
    this.shaderService?.shaders.forEach((shaderinfo, shadername) => {

      let stride: number = 0;
      let posOffset: number = 0;
      let normalOffset: number = 0;
      let texOffset: number = 0;
      let colorOffset: number = 0;

      let meshinfo: MeshInfo;

      switch (shadername) {
        case "sample4": {

          meshinfo = this.meshService?.meshes.get("plane") as MeshInfo;

          // calc stride and offset
          stride = 5 * Float32Array.BYTES_PER_ELEMENT; // 2 for position, 3 for color
          posOffset = 0;
          colorOffset = 2 * Float32Array.BYTES_PER_ELEMENT;

          this.gl.bindVertexArray(meshinfo.vao);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshinfo.abo);
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, meshinfo.eabo);

          this.gl.useProgram(shaderinfo.program);

          this.gl.bindVertexArray(meshinfo.vao);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshinfo.abo);
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, meshinfo.eabo);

          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_position", 2, this.gl.FLOAT, false, stride, posOffset);
          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_color", 3, this.gl.FLOAT, false, stride, colorOffset);

          break;
        }

        case "sample6": {

          meshinfo = this.meshService?.meshes.get("cube") as MeshInfo;

          // calc stride and offset
          stride = 11 * Float32Array.BYTES_PER_ELEMENT; // 3 for position, 3 for normal and 2 for texcoord, 3 for facecolor
          posOffset = 0;
          texOffset = 6 * Float32Array.BYTES_PER_ELEMENT;

          this.gl.useProgram(shaderinfo.program);

          this.gl.bindVertexArray(meshinfo.vao);
          this.gl.bindBuffer(this.gl.ARRAY_BUFFER, meshinfo.abo);
          this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, meshinfo.eabo);

          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_position", 3, this.gl.FLOAT, false, stride, posOffset);
          this.shaderService?.setAttribute(this.gl, shaderinfo.program, "a_texcoord", 2, this.gl.FLOAT, false, stride, texOffset);

          break;
        }
        case "sample7": {

          meshinfo = this.meshService?.meshes.get("cube") as MeshInfo;

          // calc stride and offset
          stride = 11 * Float32Array.BYTES_PER_ELEMENT; // 3 for position, 3 for normal and 2 for texcoord
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

          break;
        }
        case "sample8": {

          meshinfo = this.meshService?.meshes.get("cube") as MeshInfo;

          // calc stride and offset
          stride = 11 * Float32Array.BYTES_PER_ELEMENT; // 3 for position, 3 for normal and 2 for texcoord
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

          break;
        }

      }

    });

  }

  protected override clearViewport(): void {
    this.gl.clearColor(0.8, 0.5, 0.8, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }


  override draw(): void {

    this.now = new Date().getTime(); // in seconds
    const deltaTime: number = this.now - this.then;
    this.then = this.now;
    this.rotationAngle += deltaTime / 1000;

    this.howToDraw.forEach((howtodraw, drawId) => {

      let offset: number;
      let model: mat4;
      let normal: mat4;
      let rotation: number;

      const textureinfo = this.textureService?.textures.get(howtodraw.textureName) as TextureInfo;

      const shaderinfo = this.shaderService?.shaders.get(howtodraw.shaderName) as ShaderInfo;

      const meshinfo = this.meshService?.meshes.get(howtodraw.meshName) as MeshInfo;

      this.gl.useProgram(shaderinfo.program);
      this.gl.bindVertexArray(meshinfo.vao);

      this.setPerspective(shaderinfo.program);

      switch (drawId) {
        case "Solar01":
        case "Firefox": {

          if (drawId == "Solar01") {
            rotation = this.rotationAngle;
            offset = 1.5;
          } else {
            rotation = this.rotationAngle / 2;
            offset = -1.5;
          }

          model = mat4.create();

          mat4.translate(model, model, [0.0, offset, -7]);
          // axis to rotate around Z
          mat4.rotate(model, model, rotation, vec3.fromValues(0.0, 0.0, 1.0));
          // axis to rotate around Y
          mat4.rotate(model, model, rotation * 0.7, vec3.fromValues(0.0, 1.0, 0.0));
          // axis to rotate around X
          mat4.rotate(model, model, rotation * 0.3, vec3.fromValues(1.0, 0.0, 0.0));
          this.shaderService?.setMat4(this.gl, shaderinfo.program, "model", model);

          normal = mat4.create();
          mat4.invert(normal, model);
          mat4.transpose(normal, normal);
          this.shaderService?.setMat4(this.gl, shaderinfo.program, "normal", normal);

          //this.gl.activeTexture(this.gl.TEXTURE0);
          this.textureService?.updateTexture(
            this.gl, textureinfo
          );

          const mesh = meshinfo.mesh as MeshCubeService;

          this.gl.drawElements(this.gl.TRIANGLES, mesh.indicesCount, this.gl.UNSIGNED_SHORT, 0);

          break;
        }
        case "Cube6": {

          offset = -1.5;

          model = mat4.create();
          mat4.translate(model, model, [offset, 0.0, -7]);
          // axis to rotate around Z
          mat4.rotate(model, model, -this.rotationAngle, vec3.fromValues(0.0, 0.0, 1.0));
          // axis to rotate around Y
          mat4.rotate(model, model, -this.rotationAngle * 0.7, vec3.fromValues(0.0, 1.0, 0.0));
          // axis to rotate around X
          mat4.rotate(model, model, -this.rotationAngle * 0.3, vec3.fromValues(1.0, 0.0, 0.0));
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
        case "Cube7": {

          offset = 1.5;

          model = mat4.create();
          mat4.translate(model, model, [offset, 0.0, -7]);
          // axis to rotate around Z
          mat4.rotate(model, model, -this.rotationAngle, vec3.fromValues(0.0, 0.0, 1.0));
          // axis to rotate around Y
          mat4.rotate(model, model, -this.rotationAngle * 0.7, vec3.fromValues(0.0, 1.0, 0.0));
          // axis to rotate around X
          mat4.rotate(model, model, -this.rotationAngle * 0.3, vec3.fromValues(1.0, 0.0, 0.0));
          this.shaderService?.setMat4(this.gl, shaderinfo.program, "model", model);

          normal = mat4.create();
          mat4.invert(normal, model);
          mat4.transpose(normal, normal);
          this.shaderService?.setMat4(this.gl, shaderinfo.program, "normal", normal);

          this.textureService?.updateTexture(this.gl, textureinfo);

          const mesh = meshinfo.mesh as MeshCubeService;
          this.gl.drawElements(this.gl.TRIANGLES, mesh.indicesCount, this.gl.UNSIGNED_SHORT, 0);

          // console.log(`Debug: Cube7`);

          break;
        }
        case "Plane": {

          model = mat4.create();

          mat4.translate(model, model, [0.0, 0.0, -15]);
          mat4.rotate(model, model, this.rotationAngle, vec3.fromValues(0.0, 0.0, 1.0));

          this.shaderService?.setMat4(this.gl, shaderinfo.program, "model", model);

          const mesh = meshinfo.mesh as MeshPlaneService;

          this.gl.drawElements(this.gl.TRIANGLES, mesh?.indicesCount, this.gl.UNSIGNED_SHORT, 0);

          // console.log(`Debug: Plane`, mesh);

          break;
        }
      }

    });

  }

}
