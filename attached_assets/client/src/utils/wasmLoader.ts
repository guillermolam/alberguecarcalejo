// WASM Service Loader Utility
export class WasmLoader {
  private static services: Map<string, any> = new Map()

  static async loadService(serviceName: string) {
    if (this.services.has(serviceName)) {
      return this.services.get(serviceName)
    }

    try {
      console.log(`Loading WASM service: ${serviceName}`)
      
      // Dynamic import based on service name
      const wasmModule = await import(`@wasm/${serviceName}/pkg`)
      await wasmModule.default()
      
      this.services.set(serviceName, wasmModule)
      console.log(`✅ WASM service ${serviceName} loaded successfully`)
      
      return wasmModule
    } catch (error) {
      console.error(`❌ Failed to load WASM service ${serviceName}:`, error)
      throw new Error(`WASM service ${serviceName} not available`)
    }
  }

  static getService(serviceName: string) {
    return this.services.get(serviceName)
  }

  static isLoaded(serviceName: string): boolean {
    return this.services.has(serviceName)
  }
}