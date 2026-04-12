import { OOMError } from './engine/types';

export class VRAMManager {
    private readonly MAX_VRAM = 8; // Simulate 8GB VRAM
    private currentVRAM = 0;
    private loadedEngines: { name: string; memory: number; lastUsed: number }[] = [];

    // Request VRAM to load an engine
    public requestVRAM(engineName: string, requiredVRAM: number): void {
        const existingEngine = this.loadedEngines.find(e => e.name === engineName);

        if (existingEngine) {
            existingEngine.lastUsed = Date.now();
            return; // Engine already loaded
        }

        if (requiredVRAM > this.MAX_VRAM) {
            throw new OOMError(`Engine ${engineName} requires ${requiredVRAM}GB VRAM, which exceeds the total available ${this.MAX_VRAM}GB VRAM`);
        }

        while (this.currentVRAM + requiredVRAM > this.MAX_VRAM && this.loadedEngines.length > 0) {
            // Sort by least recently used
            this.loadedEngines.sort((a, b) => a.lastUsed - b.lastUsed);
            const offloaded = this.loadedEngines.shift();
            if (offloaded) {
                console.log(`[VRAMManager] Offloading engine ${offloaded.name} to free ${offloaded.memory}GB VRAM`);
                this.currentVRAM -= offloaded.memory;
            }
        }

        if (this.currentVRAM + requiredVRAM > this.MAX_VRAM) {
            throw new OOMError(`VRAM completely exhausted while loading ${engineName}`);
        }

        this.loadedEngines.push({ name: engineName, memory: requiredVRAM, lastUsed: Date.now() });
        this.currentVRAM += requiredVRAM;
        console.log(`[VRAMManager] Loaded engine ${engineName} consuming ${requiredVRAM}GB VRAM. Current VRAM usage: ${this.currentVRAM}GB / ${this.MAX_VRAM}GB`);
    }

    public getStatus(): string {
        return `VRAM Usage: ${this.currentVRAM}GB / ${this.MAX_VRAM}GB. Loaded engines: ${this.loadedEngines.map(e => e.name).join(', ')}`;
    }
}

export const vramManager = new VRAMManager();
