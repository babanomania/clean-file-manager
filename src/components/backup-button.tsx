'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Archive, CheckCircle, Download } from "react-feather"

export function BackupButton() {
  const [isBackupInProgress, setIsBackupInProgress] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { toast } = useToast()

  const simulateBackup = () => {
    setIsBackupInProgress(true)
    setProgress(0)
    setShowConfirmDialog(false)

    // Simulate backup progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsBackupInProgress(false)
          toast({
            title: "Backup completed",
            description: "Your files have been backed up successfully. Download ready.",
          })
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  return (
    <>
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isBackupInProgress}
          >
            <Archive className="h-4 w-4" />
            {isBackupInProgress ? "Backup in progress..." : "Create Backup"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Backup</DialogTitle>
            <DialogDescription>
              This will create a ZIP archive of all your files. The process may take a few minutes depending on the total size.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-2 text-sm">
              <Archive className="h-4 w-4 text-blue-500" />
              <span>Estimated backup size: 2.5 GB</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={simulateBackup}
            >
              Start Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isBackupInProgress && (
        <div className="fixed bottom-4 right-4 w-80 rounded-lg border bg-white p-4 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium">Backup in Progress</h3>
            {progress === 100 && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
          </div>
          <Progress value={progress} className="mb-2" />
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{progress}% complete</span>
            {progress === 100 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 p-2"
                onClick={() => {
                  // TODO: Implement actual backup download
                  toast({
                    title: "Download started",
                    description: "Your backup file will be downloaded shortly.",
                  })
                }}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
