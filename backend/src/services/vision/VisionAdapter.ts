export interface VisionAdapter { 
    annotateImage(base64: string): Promise<string>;
}