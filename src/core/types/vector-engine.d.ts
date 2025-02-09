// src/types/vector-engine.d.ts
declare module VectorEngine {
    interface VectorEngineInstance {
      createRectangle(x: number, y: number, width: number, height: number): string;
      createCircle(cx: number, cy: number, radius: number): string;
      transformShape(id: string, tx: number, ty: number, rotation: number, sx: number, sy: number): void;
      getAllShapesSVG(): string;
    }
  
    interface VectorEngineModule {
      new(): VectorEngineInstance;
    }
  }
  
  declare function createVectorEngine(): Promise<VectorEngineModule>;