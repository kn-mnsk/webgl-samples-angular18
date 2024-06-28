import { Injectable } from '@angular/core';

export interface ShaderInfo {
  name: string,
  vsSrc: string,
  fsSrc: string,
  program: WebGLProgram | null,
  programReady: boolean
}

@Injectable({
  providedIn: 'root'
})
export class ShaderService {

  private title = "SahderService";

  protected isbrowser: boolean = false as boolean;
  public get isBrowser() { return this.isbrowser; }
  public set isBrowser(b: boolean) { this.isbrowser = b; }

  // multi programs setting
  private shaderinfos: ShaderInfo[] = [];
  private get shaderInfos(): ShaderInfo[] {
    return this.shaderinfos;
  }
  private set shaderInfos(infos: ShaderInfo[]) {
    this.shaderinfos = infos;
  }

  private shadersmap: Map<string, ShaderInfo> = new Map<string, ShaderInfo>();

  public get shaders() {
    return this.shadersmap;
  }

  private setShader(shaderinfo:
    ShaderInfo) {
    this.shadersmap.set(shaderinfo.name, shaderinfo);
  }

  private shadersCompleted: boolean = false;

  public get isShadersCompleted(): boolean {
    return this.shadersCompleted;
  }
  public set isShadersCompleted(status: boolean) {
    this.shadersCompleted = status;
  }

  // Debug to check media loading time
  private delayElapsed: number = 0;
  private delay: number = 3;

  constructor() { }

  private checkShaderReady(callback: () => void, shaderinfo: ShaderInfo) {
    if (!this.isBrowser) { return; }

    if (shaderinfo.program == null) {
      setTimeout(() => { this.checkShaderReady(callback, shaderinfo), this.delay });

    } else {

      // console.log(`Debug  ${this.title} checkShaderReady : Created`);

      callback();
    }
  }

  private checkAllShadersReady(callback: () => void, shaderinfos: ShaderInfo[]) {
    if (!this.isBrowser) { return; }

    if (this.shaders.size < shaderinfos.length) {

      setTimeout(() => { this.checkAllShadersReady(callback, shaderinfos), this.delay });

      this.delayElapsed += this.delay;

    } else {

      // console.log(`Debug  ${this.title} checkAllShadersReady : ${this.delayElapsed} MilliSeconds to Load  `);

      this.delayElapsed = 0; //  reset
      callback();
    }
  }

  public async asyncLoadShaders(gl: WebGL2RenderingContext, infos: ShaderInfo[]): Promise<void> {

    try {

      this.shaderInfos = infos;

      for (let shaderinfo of this.shaderInfos) {

        await Promise.all([fetch(shaderinfo.vsSrc), fetch(shaderinfo.fsSrc)]).then((values) => {

          let vsText: string = "";
          let fsText: string = "";

          const cloneVs = values[0].clone();
          cloneVs.text().then(data => {

            vsText = data;

            const cloneFs = values[1].clone();
            cloneFs.text().then(data => {

              fsText = data;

              // console.log(`Debug ${this.title} asyncLoadShaders, \n${shaderinfo.name}.VS:\n${vsText} \n${shaderinfo.name}.FS:\n${fsText}`);

              const vsShader = this.compileShader(gl, vsText, gl.VERTEX_SHADER);
              const fsShader = this.compileShader(gl, fsText, gl.FRAGMENT_SHADER);

              shaderinfo.program = this.createProgram(gl, vsShader, fsShader);

              this.checkShaderReady(() => {
                shaderinfo.programReady = true;
                this.setShader(shaderinfo);
              },
                shaderinfo
              );

            });
          });
        }
        );
      }

      this.checkAllShadersReady(() => {

        this.isShadersCompleted = true;

        // console.log(`Debug: ${this.title} multi shaders`, this.shaders, ": numShaders=", this.shaderInfos.length);

      }, this.shaderInfos);

    } catch (error: any) {
      throw new Error(`Error: ${this.title} asyncLoadShaders :`, error);
    }
  }

  private compileShader(gl: WebGL2RenderingContext, shaderSource: string, type: number): WebGLShader {

    const shader = gl.createShader(type);
    if (shader == null) {
      throw new Error(`Error: ${this.title} compileShader: Failed to gl.createShader ${type}`);
    }

    try {

      gl.shaderSource(shader, shaderSource);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        throw new Error(`Error: ${this.title} compileShader:  \n${info}`);
      }

    } catch (e: unknown) {
      console.log(e);
      if (typeof e === "string") {
        e.toUpperCase() // works, `e` narrowed to string
        throw new Error(`Error: ${this.title} compileShader: ${e}`);

      } else if (e instanceof Error) {

        throw new Error(`Error: ${this.title} compileShader: ${e.message}`);

      }
    };

    return shader;
  }

  private createProgram(gl: WebGL2RenderingContext, vsShader: WebGLShader, fsShader: WebGLShader): WebGLProgram {

    const program = gl.createProgram();
    if (program == null) {
      throw new Error(`${this.title} createProgram: Failed to gl createProgram Null Returned`);
    }

    gl.attachShader(program, vsShader);
    gl.attachShader(program, fsShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program);
      throw new Error(`Failed in shader program LINking. \n${info}`);
    }

    return program;

  }


  /**
   * MultiShaders utility: Bind currently defined buffer to vertex attribute, specifing vertex attribute layout.
  * You have to make WebGLProgram 'Use' first:, othewise error
   * @param gl WebGL2RenderingContext
   * @param shadername key of shaders map
   * @param uniformname uniform name
   * @param size the number of components per vertex attribute. Must be 1, 2, 3, or 4.
   * @param type specifying the data type of each component in the array. Possible values: gl.BYTE, gl.SHORT, gl.UNSIGNED_BYTE, gl.UNSIGNED_SHORT, gl.FLOAT(32-bit)
   * @param normalized specifying whether integer data values should be normalized into a certain range when being cast to a float.
   * @param stride specifying the offset in bytes between the beginning of consecutive vertex attributes.
   * @param offset an offset in bytes of the first component in the vertex attribute array. Must be a multiple of the byte length of type.
   */
  public setAttribute(gl: WebGL2RenderingContext, program: WebGLProgram | null, uniformname: string, size: GLint, type: GLenum, normalized: GLboolean, stride: GLsizei, offset: GLintptr): void {

    // const program = this.getProgram(shaderinfo);// as WebGLProgram;
    // if (program == null) {
    //   console.error(`Error: ${this.title} setAttribute: Shaderinfo=`, shaderinfo);
    //   throw new Error(`Failed to get program setAttribute: Program == null!`);
    // }

    if (program == null) {
      throw new Error(`${this.title} setAttribute: program is null!`);
    }

    const attribIndex = gl.getAttribLocation(program, uniformname);
    gl.enableVertexAttribArray(attribIndex);
    gl.vertexAttribPointer(attribIndex, size, type, normalized, stride, offset);

  }

  /**
   * MultiShaders utility: Set the unifrom boolean to the specified boolean value.
   * @param gl WebGL2RenderingContext
   * @param shadername key of shaders map
   * @param uniformname uniform name
   * @param bool 1.0 as true or 0.0 as false assuming boolean value to use
   */
  public setBool(gl: WebGL2RenderingContext, program: WebGLProgram | null, uniformname: string, bool: 1.0 | 0.0): void {
    // const program = this.getProgram(shaderinfo) as WebGLProgram;

    if (program == null) {
      throw new Error(`${this.title} setBool: program is null!`);
    }
    gl.uniform1f(gl.getUniformLocation(program, uniformname), bool);
  }

  /**
   * MultiShaders utility: Set the unifrom integer to the specified integer value
   * @param gl WebGL2RenderingContext
   * @param shadername key of shaders map
   * @param uniformname uniform name
   * @param integer integer value to use
   */
  public setInt(gl: WebGL2RenderingContext, program: WebGLProgram | null, uniformname: string, integer: GLint): void {
    // const program = this.getProgram(shaderinfo) as WebGLProgram;

    if (program == null) {
      throw new Error(`${this.title} setInt: program is null!`);
    }
    gl.uniform1i(gl.getUniformLocation(program, uniformname), integer);
  }

  /**
   * MultiShader utility: Set the unifrom float  to the specified float value.
   * @param gl WebGL2RenderingContext
   * @param shadername key of shaders map
   * @param uniformname uniform name
   * @param float float value
   */
  public setFloat(gl: WebGL2RenderingContext, program: WebGLProgram | null, uniformname: string, float: GLfloat): void {
    // const program = this.getProgram(shaderinfo) as WebGLProgram;

    if (program == null) {
      throw new Error(`${this.title} setFloat: program is null!`);
    }
    gl.uniform1f(gl.getUniformLocation(program, uniformname), float);
  }

  /**
   * MultiShader utility: Set the uniform vec3 to the specified vec3.
   * @param gl WebGL2RenderingContext
    * @param shadername key of shaders map
   * @param uniformname uniform name
   * @param vec3 vec3 value
   */
  public setVec3(gl: WebGL2RenderingContext, program: WebGLProgram | null, uniformname: string, vec3: Float32List): void {
    // const program = this.getProgram(shaderinfo) as WebGLProgram;

    if (program == null) {
      throw new Error(`${this.title} setVec3: program is null!`);
    }
    gl.uniform3fv(gl.getUniformLocation(program, uniformname), vec3);
  }

  /**
   * MultiShader utility: Set the uniform vec4 to the specified vec4.
   * @param gl WebGL2RenderingContext
    * @param shadername key of shaders map
   * @param uniformname uniform name
   * @param vec3 vec3 value
   */
  public setVec4(gl: WebGL2RenderingContext, program: WebGLProgram | null, uniformname: string, vec4: Float32List): void {
    // const program = this.getProgram(shaderinfo) as WebGLProgram;

    if (program == null) {
      throw new Error(`${this.title} setVec4: program is null!`);
    }
    gl.uniform4fv(gl.getUniformLocation(program, uniformname), vec4);
  }

  /**
  * MultiShader utility: Set the uniform mat3 to the specified mat3.
  * @param gl WebGL2RenderingContext
   * @param shadername key of shaders map
  * @param uniformname uniform name
  * @param mat3 mat3 value
  */
  public setMat3(gl: WebGL2RenderingContext, program: WebGLProgram | null, uniformname: string, mat3: Float32List): void {
    // const program = this.getProgram(shaderinfo) as WebGLProgram;
    if (program == null) {
      throw new Error(`${this.title} setMat3: program is null!`);
    }
    gl.uniformMatrix3fv(gl.getUniformLocation(program, uniformname), false, mat3);
  }

  /**
   * MultiShader utility: Set the uniform mat4 to the specified mat4.
   * @param gl WebGL2RenderingContext
    * @param shadername key of shaders map
   * @param uniformname uniform name
   * @param mat4 mat4 value
   */
  public setMat4(gl: WebGL2RenderingContext, program: WebGLProgram | null, uniformname: string, mat4: Float32List): void {
    // const program = this.getProgram(shaderinfo) as WebGLProgram;
    if (program == null) {
      throw new Error(`${this.title} setmat4: program is null!`);
    }
    gl.uniformMatrix4fv(gl.getUniformLocation(program, uniformname), false, mat4);
  }

  public deleteShaders(gl: WebGL2RenderingContext): void {
    if (this.shaders.size > 0) {
      this.shaders.forEach((shaderinfo, shandername) => {
        gl.deleteProgram(shaderinfo.program);
        shaderinfo.program = null;
      });
      this.shaders.clear();
    }

  }

}


