// src/core/engine/wasm-bridge.ts
import { createContext, useContext } from 'react';

// We declare this function to match the export name we specified in our emcc command
// The name 'createVectorEngine' comes from the EXPORT_NAME setting in our build
declare function createVectorEngine(): Promise<any>;

// Define our engine interface - this helps TypeScript understand our engine's shape
interface VectorEngine {
    createRectangle: (x: number, y: number, width: number, height: number) => string;
    createCircle: (cx: number, cy: number, radius: number) => string;
    transformShape: (id: string, tx: number, ty: number, rotation: number, sx: number, sy: number) => void;
    getAllShapesSVG: () => string;
}

// Create a context to hold our engine instance
export const EngineContext = createContext<VectorEngine | null>(null);
// Create a singleton promise for our engine initialization
let enginePromise: Promise<VectorEngine> | null = null;

export async function initializeEngine(): Promise<VectorEngine> {
    // If we already have an initialization in progress, return that
    if (enginePromise) {
        return enginePromise;
    }

    enginePromise = (async () => {
        try {
            // In Vite, we can use the special ?url suffix to get the URL of a static asset
            const wasmUrl = new URL('../../../public/wasm/vector-engine.wasm', import.meta.url).href;
            console.log('Loading WebAssembly from:', wasmUrl);

            // Load the WebAssembly module
            const response = await fetch(wasmUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch WebAssembly module: ${response.statusText}`);
            }

            const wasmBinary = await response.arrayBuffer();
            
            // Create the import object with memory
            const imports = {
                env: {
                    memory: new WebAssembly.Memory({ initial: 256 }),
                    // Add any other required imports here
                },
                // The Emscripten-generated JavaScript file might need additional imports
                wasi_snapshot_preview1: {
                    proc_exit: (code: number) => console.log('Exit with code:', code),
                }
            };

            // Instantiate the module
            const { instance } = await WebAssembly.instantiate(wasmBinary, imports);
            console.log('WebAssembly module instantiated successfully');

            // Create our engine interface that wraps the raw WebAssembly exports
            const engine: VectorEngine = {
                createRectangle: (x: number, y: number, width: number, height: number) => {
                    try {
                        return instance.exports.createRectangle(x, y, width, height) as string;
                    } catch (error) {
                        console.error('Error creating rectangle:', error);
                        throw error;
                    }
                },
                createCircle: (cx: number, cy: number, radius: number) => {
                    try {
                        return instance.exports.createCircle(cx, cy, radius) as string;
                    } catch (error) {
                        console.error('Error creating circle:', error);
                        throw error;
                    }
                },
                transformShape: (id: string, tx: number, ty: number, rotation: number, sx: number, sy: number) => {
                    try {
                        instance.exports.transformShape(id, tx, ty, rotation, sx, sy);
                    } catch (error) {
                        console.error('Error transforming shape:', error);
                        throw error;
                    }
                },
                getAllShapesSVG: () => {
                    try {
                        return instance.exports.getAllShapesSVG() as string;
                    } catch (error) {
                        console.error('Error getting shapes:', error);
                        throw error;
                    }
                }
            };

            // Verify the engine works
            try {
                const testId = engine.createRectangle(0, 0, 1, 1);
                console.log('Engine verification successful, test shape created:', testId);
            } catch (error) {
                throw new Error(`Engine verification failed: ${error.message}`);
            }

            return engine;
        } catch (error) {
            console.error('Failed to initialize engine:', error);
            // Clear the promise so we can try again
            enginePromise = null;
            throw error;
        }
    })();

    return enginePromise;
}



// Our hook to access the engine remains the same
export function useVectorEngine() {
    const engine = useContext(EngineContext);
    if (!engine) {
        throw new Error('useVectorEngine must be used within an EngineProvider');
    }
    return engine;
}

// Our shape operations hook now includes better error handling
export function useShapeOperations() {
    const engine = useVectorEngine();

    return {
        createShape: (type: 'rectangle' | 'circle', params: any) => {
            try {
                switch (type) {
                    case 'rectangle': {
                        const { x, y, width, height } = params;
                        if (typeof x !== 'number' || typeof y !== 'number' || 
                            typeof width !== 'number' || typeof height !== 'number') {
                            throw new Error('Invalid rectangle parameters');
                        }
                        return engine.createRectangle(x, y, width, height);
                    }
                    case 'circle': {
                        const { cx, cy, radius } = params;
                        if (typeof cx !== 'number' || typeof cy !== 'number' || 
                            typeof radius !== 'number') {
                            throw new Error('Invalid circle parameters');
                        }
                        return engine.createCircle(cx, cy, radius);
                    }
                    default:
                        throw new Error(`Unsupported shape type: ${type}`);
                }
            } catch (error) {
                console.error(`Error creating ${type}:`, error);
                throw error;
            }
        },

        transformShape: (
            id: string,
            translate: { x: number; y: number },
            rotation: number,
            scale: { x: number; y: number }
        ) => {
            try {
                engine.transformShape(
                    id,
                    translate.x,
                    translate.y,
                    rotation,
                    scale.x,
                    scale.y
                );
            } catch (error) {
                console.error('Error transforming shape:', error);
                throw error;
            }
        },

        getAllShapes: () => {
            try {
                return engine.getAllShapesSVG();
            } catch (error) {
                console.error('Error getting shapes:', error);
                throw error;
            }
        }
    };
}