import { Directive, ViewChild, ElementRef, AfterViewInit, OnInit, OnDestroy, inject, PLATFORM_ID, NgZone, HostListener } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { mat4 } from 'gl-matrix';

import { MeshService } from './services/mesh.service';
import { ShaderService } from './services/shader.service';
import { TextureService } from './services/texture.service';

export interface HowToDraw {
  drawId: string,
  meshName: string,
  shaderName: string,
  textureName: string
}


/**
 * Abstract class for WebGL Rendering
 * @ShaderProgram Necessary
 * @Mesh Necessary
 * @Texture Necessary
 * The followings need to be implemented;
 * @property title
 * @method initShader
 * @method initMesh
 * @method initTexture
 * @method initGlBuffers
 * @method draw
 */
@Directive()
export abstract class WebGLBase implements OnInit, AfterViewInit, OnDestroy {

  protected baseClassName = "WebGLBase";

  protected abstract title: string;

  protected animationFrameId: number = 0;

  protected browserClientWidth: number = 0;//512;
  protected browserClientHeight: number = 0;//512;
  protected canvasWidth: number = 0;
  protected canvasHeight: number = 0;
  protected canvasClientWidth: number = 0;
  protected canvasClientHeight: number = 0;

  protected canvasClientScale: number = 1.0;
  protected canvasScale: number = 0.8;

  protected elapsed: number = 0;
  protected delay: number = 3;

  // protected video = null as HTMLVideoElement | null;

  protected webglCtx = {} as WebGL2RenderingContext;

  protected meshService = null as MeshService | null;
  protected shaderService = null as ShaderService | null;
  protected textureService = null as TextureService | null;
  protected ngzone = {} as NgZone;
  protected platformId = {} as Object;

  private howtodrawmap: Map<string, HowToDraw> = new Map();
  protected get howToDraw(): Map<string, HowToDraw> {
    return this.howtodrawmap;
  }
  /**
   * create renderring instruction
   * @param howtodraws
   */
  protected setHowToDraw(howtodraws: HowToDraw[]) {

    // to avoid type error on server side
    if (!this.isBrowser) { return; }

    howtodraws.forEach((howtodraw, index) => {
      this.howtodrawmap.set(howtodraw.drawId, howtodraw)
    });
  }

  @ViewChild('canvas', { static: false }) protected canvas = {} as ElementRef<HTMLCanvasElement>;

  protected get gl(): WebGL2RenderingContext {
    return this.webglCtx;
  }
  private set gl(webglctx: WebGL2RenderingContext) {
    this.webglCtx = webglctx;
  }

  protected isBrowser: boolean = false as boolean;
  protected InitializeAlreadyStarted: boolean = false;

  protected now = 0 as number;
  protected then = 0 as number;

  protected rotationAngle = 0 as number;
  protected currentRoute: string = "";

  constructor() {
    this.platformId = inject(PLATFORM_ID);
    this.isBrowser = isPlatformBrowser(this.platformId);

    this.meshService = inject(MeshService);
    this.meshService.isBrowser = this.isBrowser;

    this.shaderService = inject(ShaderService);
    this.shaderService.isShadersCompleted = false; // need to reset here
    this.shaderService.isBrowser = this.isBrowser;

    this.textureService = inject(TextureService);
    this.textureService.isBrowser = this.isBrowser;

    this.ngzone = inject(NgZone);

    // console.log(`Debug: ${this.baseClassName} - Instatiated, isBrowser=${this.isBrowser}`);
  }

  /**
   *
   */
  public ngOnInit(): void { }

  protected ngZoneRunOutsideAngular() {
    /**
     * To stabilize Angular hydration process to use NgZone
     * Loop outside of the Angular zone so the UI DOES NOT refresh after each setTimeout cycle;
     *
     * Enable to advance to the rendering process only after the completion pf processing of shader program generation following asynchronously reading shader source files
     *
     * @see https://angular.io/api/core/NgZone#usage-notes
     *
     */
    this.ngzone.runOutsideAngular(() => {
      this._initialize(() => {
        // reenter the Angular zone and display done
        this.ngzone.run(() => {
          // console.log('Debug  WegGL Initialization Done!: Outside of Angular Zone \nTotal elapsed time of initializing ', this.elapsed, 'miliseconds');

        });
      });
    });
  }

  /**
   * use ngZoneRunOutsideAngular()for implementation
   */
  public ngAfterViewInit(): void {
    // console.log(`Debug: ${this.title}Component  - ngAfterViewInit()`);

    this.ngZoneRunOutsideAngular();
  }

  /**
   *  animation to stop, if any in ngOnDestroy
   */
  private stopAnimation(): void {
    if (this.animationFrameId == 0) { return; }

    cancelAnimationFrame(this.animationFrameId);

  };

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   */
  private addEventListener(): void {

    this.gl.canvas.addEventListener("webglcontextcreationerror", this.webglcontextcreationerror, false);

    this.gl.canvas.addEventListener("webglcontextlost", this.webglcontextlost);

  };

  /**
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
   */
  private removeEventListener(): void {

    this.gl.canvas.removeEventListener("webglcontextcreationerror", this.webglcontextcreationerror);
    this.gl.canvas.removeEventListener("webglcontextlost", this.webglcontextlost);

  };

  /**
   * @see https://stackoverflow.com/questions/23598471/how-do-i-clean-up-and-unload-a-webgl-canvas-context-from-gpu-after-use
   *
   */
  private freeWebglResources(): void {

    // 1 Unbind textures
    var numTextureUnits = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);
    for (var unit = 0; unit < numTextureUnits; ++unit) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, null);
      this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
    }

    // Unbind the old buffers from the attributes.
    const buf = this.gl.createBuffer() as WebGLBuffer | null;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
    const numAttributes = this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS);
    for (let attrib = 0; attrib < numAttributes; ++attrib) {
      this.gl.vertexAttribPointer(attrib, 1, this.gl.FLOAT, false, 0, 0);
    }

    // delete meshes and buffers
    if (this.meshService != null) {
      this.meshService.deleteMeshes(this.gl);

      this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    }

    // delete shader programs
    if (this.shaderService != null) {
      this.shaderService?.deleteShaders(this.gl);
    }

    // delete textutes
    if (this.textureService !== null) {
      this.textureService?.deleteTextures(this.gl);
    }

    // set the canvas size to 1x1 pixel.
    if (this.gl != null) {
      this.gl.canvas.width = 1.0;
      this.gl.canvas.height = 1.0;

    }

    // then, finally remove canvas;
    this.canvas.nativeElement.remove();

    // console.log(`Debug  ${this.title}Component OnDestroy : freeWebglResources Completed `);

  }

  /**
   *@see https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_lose_context/loseContext
   *@see https://stackoverflow.com/questions/36052066/too-many-active-webgl-contexts-oldest-context-will-be-lost
   */
  private loseContext(): void {

    this.gl.getExtension("WEBGL_lose_context")?.loseContext();

  }

  /**
   *
   */
  public ngOnDestroy(): void {
    if (!this.isBrowser) {
      // must be in client side, otherwise type error on server side
      return;
    }

    this.textureService?.stopMultiMedias();

    this.stopAnimation();

    this.removeEventListener();

    this.loseContext();

    this.freeWebglResources();

  }

  @HostListener('window:resize', ['$event'])
  protected onResize(event: any) {
    this.getWindowSize();
  }

  protected getWindowSize() {

    this.browserClientWidth = window.innerWidth;
    this.browserClientHeight = window.innerHeight;

    if (this.browserClientHeight < this.browserClientWidth) {
      this.canvasWidth = this.browserClientHeight * this.canvasScale;
      this.canvasHeight = this.browserClientHeight * this.canvasScale;
    } else {

      this.canvasWidth = this.browserClientWidth * this.canvasScale;
      this.canvasHeight = this.browserClientWidth * this.canvasScale;

    }

    this.canvasClientWidth = this.browserClientWidth * this.canvasClientScale;
    this.canvasClientHeight = this.browserClientWidth * this.canvasClientScale;
  }

  /**
  *
  */
  protected _initialize(callback: () => void) {

    if (!this.isBrowser) {
      /** NOTE
       * this.isBorwser must be true, otherwise type error will happen, saying ' TypeError: Cannot read properties of undefined (reading 'nativeElement') on the server side' in the following this.initialize()
      */
      return;
    }

    if (!this.InitializeAlreadyStarted) {

      this.initialize();
      // console.log(`Debug  ${this.title}component: Initializing Done`);
    }

    if (this.shaderService?.isShadersCompleted || this.shaderService == null) {

      // console.log(`Debug  ${this.title}component: \nisProgramCompleted=${this.shaderService?.isProgramCompleted}, \nisMultiShadersCompleted=${this.shaderService?.isShadersCompleted}, \nshaderService=${this.shaderService}`);

      callback();

      this.drawScene();

      return;
    }

    setTimeout(() => this._initialize(callback), this.delay);

  }


  private webglcontextlost(e: any): void {
    // console.log(`Debug ${this.title}: webglcontextlost fired`);
  }

  private webglcontextcreationerror(e: any): void {
    console.log(
      `WebGL context creation failed: ${e.statusMessage || "Unknown error"}`,
    );
    throw new Error(`${this.title}: Failed to get WebGL2RenderingContext!`);
  }

  public createGlCtx(): void {

    const glctx = this.canvas.nativeElement.getContext('webgl2');
    if (glctx !== null) {

      this.gl = glctx;

    } else {

      throw new Error(`${this.title}: Failed to get WebGL2RenderingContext!`);

    }
    // console.log(`Debug: ${this.title} createWebglCtx this.gl=`, this.webglCtx);

    this.addEventListener();

    // console.log(`Debug: ${this.title} createWebglCtx events added to canvas; webglctx=`, this.getWebglCtx);


  }

  protected initGlContext(): void {

    this.createGlCtx();

    this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
    this.gl.depthRange(0, 1);
    this.gl.depthFunc(this.gl.LESS); // Near things obscure far things

  }


  abstract initShader(): void;

  abstract initMesh(): void;

  abstract initTexture(): void;

  abstract initGlBuffers(): void;

  /**
   *
   */
  protected initialize(): void {

    this.InitializeAlreadyStarted = true;

    this.initGlContext();

    this.initShader();

  }

  protected resizeCanvas(): void {

    this.getWindowSize();

    if (this.gl === null) { return; }

    this.gl.canvas.width = this.canvasWidth;
    this.gl.canvas.height = this.canvasHeight;

  }

  protected clearViewport(): void {

    if (this.gl === null) { return; }

    /*
     Clearing the viewport is left at this level (not in Program impl), because
     there might be more than one program for a single application, but the viewport
     is reset once per render() call.
     */
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

  }

  protected adjustViewportSize(): void {

    if (this.gl === null) { return; }

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

  }

  protected setPerspective(program: WebGLProgram | null): void {

    if (this.gl === null) { return; }

    const projection = mat4.create();
    const fieldOfView: number = (45 * Math.PI) / 180; // in radians

    const aspect: number = <number>(this.gl.canvas.width / this.gl.canvas.height);

    const zNear: number = 0.5;
    const zFar: number = 100;

    mat4.perspective(projection, fieldOfView, aspect, zNear, zFar);

    this.shaderService?.setMat4(this.gl, program, "projection", projection);


  }

  private drawScene(): void {
    this.initMesh();
    this.initTexture();
    this.initGlBuffers();
    this.render();
  }

  /**
   * implement how mesh model be drawed
   */
  abstract draw(): void;

  protected render(): void {

    this.resizeCanvas();

    this.clearViewport();

    this.adjustViewportSize();

    this.draw();

    this.animationFrameId = requestAnimationFrame(this.render.bind(this));

  }

}
