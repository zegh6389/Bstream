import { buttonVariants } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { AlertDialog } from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function AdminBackupControls() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ fileName: string; metadata: any } | null>(null)

  const createBackup = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "full" }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create backup")
    } finally {
      setIsLoading(false)
    }
  }

  const restoreBackup = async (fileName: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/backup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore backup")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Backup Controls</h2>
      
      <div className="flex gap-4">
        <button
          onClick={createBackup}
          disabled={isLoading}
          className={cn(
            buttonVariants({ variant: "default" }),
            "min-w-[120px]"
          )}
        >
          {isLoading ? "Creating..." : "Create Backup"}
        </button>

        {result?.fileName && (
          <button
            onClick={() => restoreBackup(result.fileName)}
            disabled={isLoading}
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "min-w-[120px]"
            )}
          >
            {isLoading ? "Restoring..." : "Restore Latest"}
          </button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Backup file: {result.fileName}</p>
            <p>Type: {result.metadata.type}</p>
            <p>Tables: {result.metadata.tables.join(", ")}</p>
            <p>Created: {new Date(result.metadata.timestamp).toLocaleString()}</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
