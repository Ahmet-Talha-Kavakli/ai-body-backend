'use client'

import { useRef, useEffect } from 'react'
import { VideoOff, Mic, MicOff } from 'lucide-react'

interface UserCameraPanelProps {
  isVideoOn: boolean
  isMicOn: boolean
}

export function UserCameraPanel({ isVideoOn, isMicOn }: UserCameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isVideoOn) {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {})
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [isVideoOn])

  return (
    <div className="border-border/30 relative h-full w-full overflow-hidden rounded-2xl border bg-gray-900">
      {isVideoOn ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-full w-full scale-x-[-1] object-cover"
          />
          <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
            <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
              Canlı
            </span>
          </div>
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <VideoOff size={40} className="text-gray-600" />
        </div>
      )}

      {/* Mic indicator */}
      <div className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2 backdrop-blur-sm">
        {isMicOn ? (
          <Mic size={14} className="text-green-400" />
        ) : (
          <MicOff size={14} className="text-red-400" />
        )}
      </div>
    </div>
  )
}
