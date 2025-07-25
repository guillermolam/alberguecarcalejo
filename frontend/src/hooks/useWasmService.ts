import { useCallback, useEffect, useState } from 'react'

interface WasmService {
  load: () => Promise<any>
  instance: any
}

export function useWasmService(serviceName: string): WasmService {
  const [instance, setInstance] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (instance) return instance
    
    setIsLoading(true)
    try {
      // Dynamically import WASM service
      const wasmModule = await import(`@wasm/${serviceName}/pkg`)
      await wasmModule.default()
      setInstance(wasmModule)
      return wasmModule
    } catch (error) {
      console.error(`Failed to load WASM service ${serviceName}:`, error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [serviceName, instance])

  useEffect(() => {
    load()
  }, [load])

  return { load, instance }
}