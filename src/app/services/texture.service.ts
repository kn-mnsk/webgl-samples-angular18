import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

export interface TextureInfo {
  name: string,
  src: string,
  type: string,
  mediaData: HTMLVideoElement | HTMLImageElement | null,
  mediaDataReady: boolean,
  texture: WebGLTexture | null,
  textureUnit: number
}

@Injectable({
  providedIn: 'root'
})
export class TextureService {

  title = "TextureService";

  protected isbrowser: boolean = false as boolean;
  public get isBrowser() { return this.isbrowser; }
  public set isBrowser(b: boolean) { this.isbrowser = b; }

  private videoPlayPromise = {} as Promise<void>;

  private textureinfos: TextureInfo[] = [];
  public get textureInfos(): TextureInfo[] {
    return this.textureinfos;
  }
  private set textureInfos(infos: TextureInfo[]) {
    this.textureinfos = infos;
  }

  private texturesmap: Map<string, TextureInfo> = new Map<string, TextureInfo>();
  public get textures() {
    return this.texturesmap;
  }

  private setTexture(textureinfo:
    TextureInfo) {
    this.texturesmap.set(textureinfo.name, textureinfo);
  }

  private texturesGenerationIsCompleted: boolean = false;

  public get isTexturesCompleted(): boolean {
    return this.texturesGenerationIsCompleted;
  }
  private set isTexturesCompleted(status: boolean) {
    this.texturesGenerationIsCompleted = status;
  }

  // Debug to check media loading time
  private delayElapsed: number = 0;
  private delay: number = 3;

  private renderer = {} as Renderer2;

  constructor(private rendererFactory: RendererFactory2) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  public genTexture(gl: WebGL2RenderingContext, textureinfo: TextureInfo): void {

    textureinfo.texture = gl.createTexture();

    this.updateDummyTexture(gl, textureinfo);

    // Turn off mips and set wrapping to clamp to edge so it
    // will work regardless of the dimensions of the video.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  }

  /**
   *Because media has to be download over the internet, they might take a moment until it's ready, so put a single pixel in the texture so we can use it immediately to avoid gl error.
   * @param gl
   * @param texture
   */
  private updateDummyTexture(gl: WebGL2RenderingContext, textureinfo: TextureInfo): void {

    gl.activeTexture(textureinfo.textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, textureinfo.texture);
    const level: GLint = 0;
    const internalformat: GLenum = gl.RGBA;
    const width: GLsizei = 1;
    const height: GLsizeiptr = 1;
    const border: GLint = 0;
    const format: GLenum = gl.RGBA;
    const type: GLenum = gl.UNSIGNED_BYTE;
    const dummyMedia = new Uint8Array([64, 128, 255, 255]); // opaque blue

    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalformat,
      width,
      height,
      border,
      format,
      type,
      dummyMedia
    );

  }

  /**
   * @see https://stackoverflow.com/questions/46565413/teximage2d-invalid-image-after-xmlhttprequest
   * @param gl
   * @param textureinfo
   * @returns
   */
  public updateTexture(gl: WebGL2RenderingContext, textureinfo: TextureInfo): void {

    if (!this.isBrowser) { return; }

    if (textureinfo.texture == null) { return; }

    if (!textureinfo.mediaDataReady) {
      this.updateDummyTexture(gl, textureinfo);
      return;
    }
    const mediaType = textureinfo.type;
    let mediaData: HTMLVideoElement | HTMLImageElement;
    let width: GLsizei;
    let height: GLsizei;
    let border: GLint;
    let level: GLint;
    let internalformat: GLenum;
    let format: GLenum;
    let type: GLenum;

    gl.activeTexture(textureinfo.textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, textureinfo.texture);

    switch (mediaType) {
      case "video/mp4": {
        mediaData = textureinfo.mediaData as HTMLVideoElement;
        width = mediaData.videoWidth;
        height = mediaData.videoHeight;
        border = 0;
        level = 0;
        internalformat = gl.RGBA;
        format = gl.RGBA;
        type = gl.UNSIGNED_BYTE;

        gl.texImage2D(gl.TEXTURE_2D, level, internalformat, width, height, border, format, type, mediaData);

        break;
      }
      case "img": {// image
        mediaData = textureinfo.mediaData as HTMLImageElement;
        width = mediaData.width;
        height = mediaData.height;
        border = 0;
        level = 0;
        internalformat = gl.RGBA;
        format = gl.RGBA;
        type = gl.UNSIGNED_BYTE;

        gl.texImage2D(gl.TEXTURE_2D, level, internalformat, width, height, border, format, type, mediaData);

        break;
      }
      default: {

        throw new Error(`${this.title} updateTexture: Unexpected media: type=${mediaType}`);

      }

    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  }

  private checkVideoReady(textureinfo: TextureInfo, event: Event, playing: boolean, timeupdate: boolean) {
    if (playing && timeupdate) {
      textureinfo.mediaDataReady = true;
      textureinfo.mediaData = event.currentTarget as HTMLVideoElement;
      // console.log("event current target", event.currentTarget);
    } else {
      textureinfo.mediaDataReady = false;
    }

  }

  public async asyncLoadVideo(textureinfo: TextureInfo): Promise<void> {
    return new Promise((resolve, reject) => {

      const video = textureinfo.mediaData as HTMLVideoElement;

      fetch(textureinfo.src)
        .then(response => {
          if (!response.ok) {
            throw new Error(`${this.title}: asyncLoadVideo saying HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {

          // video.srcObject = blob;
          video.src = URL.createObjectURL(blob);
          let playing = false;
          let timeupdate = false;

          video.playsInline = true;
          video.muted = true;
          //video.muted = false;
          video.loop = true;
          // video.preload = "auto";

          // Waiting for these 2 events ensures
          // there is data in the video
          video.addEventListener(
            "playing",
            (e) => {
              playing = true;
              this.checkVideoReady(textureinfo, e, playing, timeupdate);
            },
            true
          );

          video.addEventListener(
            "timeupdate",
            (e) => {
              timeupdate = true;
              this.checkVideoReady(textureinfo, e, playing, timeupdate);
            },
            true
          );

          resolve();

          /**
           * @see https://developer.chrome.com/blog/play-request-was-interrupted/
           */
          this.videoPlayPromise = video.play();
          if (this.videoPlayPromise !== undefined) {
            this.videoPlayPromise.then(_ => {
              // code if necessary

            })
              .catch(error => {
                /**
                 * skip error; just go through here to avoid video.play error when video.pause
                */

                console.log(`Warning: ${this.title} asyncLoadVideo : ${error}`);

              })

          }

        })
        .catch(error => {
          console.error(`${this.title} saying asyncLoadVideo Fetch Error:`, error, video);
          reject(error);
        });
    });
  }

  public async asyncLoadImage(textureinfo: TextureInfo): Promise<HTMLImageElement> {

    return new Promise((resolve, reject) => {

      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = textureinfo.src;

      textureinfo.mediaData = image;
      // textureinfo.mediaDataReady = true;
    });

  }

  public checkAllTexturesReady(callback: () => void, textureinfos: TextureInfo[]) {

    if (!this.isBrowser) { return; }

    if (this.textures.size == textureinfos.length) {
      callback();
      return;
    }

    setTimeout(() => { this.checkAllTexturesReady(callback, textureinfos), this.delay });

  }

  private checkTextureReady(callback: () => void, textureinfo: TextureInfo) {

    if (!this.isBrowser) { return; }

    if (textureinfo.mediaData != null && textureinfo.mediaDataReady) {

      // console.log(`Debug  ${this.title} checkTextureReady ${textureinfo.name}:${this.delayElapsed} MilliSeconds to Load`, textureinfo.mediaData);

      // this.delayElapsed = 0; //  reset

      callback();
      return;
    }

    setTimeout(() => { this.checkTextureReady(callback, textureinfo), this.delay });
    this.delayElapsed += this.delay;

  }

  public async asyncLoadTextures(gl: WebGL2RenderingContext, infos: TextureInfo[]): Promise<void> {

    this.textureInfos = infos;

    //
    this.textureInfos.map((textureinfo, index) => {
      this.textures.set(textureinfo.name, textureinfo)
    });


    for (let textureinfo of this.textureInfos) {

      this.genTexture(gl, textureinfo);

      switch (textureinfo.type) {
        case "video/mp4": {
          try {

            textureinfo.mediaData = this.renderer.createElement("video") as HTMLVideoElement;
            // console.log(`Debug asyncLoadTextures video: `, video);

          } catch (e: any) {
            throw new Error(`${this.title} asyncLoadTextures: Failed to get HTMLVideoElement!`, e)
          }

          await this.asyncLoadVideo(textureinfo)
            .then(() => {

              /** note
               * @see checkVideoReady;
              */

              this.setTexture(textureinfo);

            })
            .catch(error => {
              throw new Error(`${this.title} loadTexture: Error in asyncLoadVideo - ${error}`);
            }
            );

          break;
        }
        case "img": {

          await this.asyncLoadImage(textureinfo).then((image) => {

            textureinfo.mediaDataReady = true;
            textureinfo.mediaData = image;

            this.setTexture(textureinfo);

          })
            .catch(error => {
              throw new Error(`${this.title} bindImage Error:`, error);
            });

          break;
        }

      }

    }

  }


  /**
   * sound, music, video, movies, etc. to stop, if any, in ngOnDestroy
   */
  public stopMultiMedias(): void {

    this.textures.forEach((textureinfo, key) => {
      if (textureinfo.type == "video/mp4") {
        const video = textureinfo.mediaData as HTMLVideoElement;

        /**
         * @see https://developer.chrome.com/blog/play-request-was-interrupted/
         */
        video.pause();

        video.src = "";
        video.load();
        video.remove();
      }
    })
  }

  public deleteTextures(gl: WebGL2RenderingContext): void {

    this.textures?.forEach((textureinfo, index) => {
      gl.deleteTexture(textureinfo.texture);
      textureinfo.mediaData = null;
      textureinfo.texture = null;

    });
    this.texturesmap.clear();
    this.textureinfos = [];

  }

}
