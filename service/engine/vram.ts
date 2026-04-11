export class VRAMManager {
    private static MAX_VRAM = 8; // GB
    private currentVRAM = 0;
    private loadedEngines: Map<string, number> = new Map();

    async load(engineName: string, size: number): Promise<void> {
        if (this.loadedEngines.has(engineName)) {
            return;
        }

        while (this.currentVRAM + size > VRAMManager.MAX_VRAM) {
            // Need to offload an engine
            const entries = Array.from(this.loadedEngines.entries());
            if (entries.length === 0) break;
            const [offloadEngine, offloadSize] = entries[0];
            console.log(`[VRAMManager] Offloading ${offloadEngine} to free ${offloadSize}GB VRAM...`);
            this.loadedEngines.delete(offloadEngine);
            this.currentVRAM -= offloadSize;
            // Simulate offload delay
            await new Promise(r => setTimeout(r, 200));
        }

        console.log(`[VRAMManager] Loading ${engineName} into VRAM (${size}GB)...`);
        // Simulate cold start loading time
        await new Promise(r => setTimeout(r, 800));
        this.loadedEngines.set(engineName, size);
        this.currentVRAM += size;
    }
}

export const vramManager = new VRAMManager();
