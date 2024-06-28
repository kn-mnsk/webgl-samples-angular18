import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { WebGLBase } from '../webglbase';

@Component({
  selector: 'app-sample1',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './sample1.component.html',
  styleUrl: './sample1.component.css'
})
export class Sample1Component extends WebGLBase {

  override title = "Sample1";

  constructor() {

    super();

    // console.log(`Debug: ${this.title}Component extends ${this.baseClassName} - Instatiated`);
  }

  override initShader(): void {
    this.shaderService = null;
  }

  override initMesh(): void {
    this.meshService = null;
  }

  override initTexture(): void {

    this.textureService = null;

  }

  override initGlBuffers(): void {
    // no gl buffers
  }

  override draw(): void {
    // no drawing
  }

}
