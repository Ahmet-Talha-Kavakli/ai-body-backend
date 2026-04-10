'use client'

import React, { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'

interface ShareAchievementProps {
  activityId: string
  description: string
  onShare?: () => void
}

export function ShareAchievement({ activityId, description, onShare }: ShareAchievementProps) {
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/activity/${activityId}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: 'Check out my achievement!',
        text: description,
        url: shareUrl,
      })
      onShare?.()
    } else {
      handleCopyLink()
    }
  }

  return (
    <>
      <button
        onClick={() => setShowShare(!showShare)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium"
      >
        <Share2 size={18} />
        Share Achievement
      </button>

      {showShare && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-bold mb-4">Share Your Achievement</h3>
            <p className="text-slate-600 mb-4">{description}</p>

            <div className="space-y-3">
              <button
                onClick={handleShare}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                {navigator.share ? '📱 Share' : '🔗 Copy Link'}
              </button>

              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-3">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="p-2 hover:bg-slate-200 rounded transition-colors"
                >
                  {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowShare(false)}
              className="w-full mt-4 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
