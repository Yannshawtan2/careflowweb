import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'
import type { DonationCampaign } from '@/lib/types'

export function useCampaignUpdates(campaignId: string) {
  const [campaign, setCampaign] = useState<DonationCampaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignId) {
      setIsLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      doc(db, 'campaigns', campaignId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setCampaign({
            id: doc.id,
            ...data,
          } as DonationCampaign)
        } else {
          setError('Campaign not found')
        }
        setIsLoading(false)
      },
      (error) => {
        console.error('Error listening to campaign updates:', error)
        setError('Failed to load campaign')
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [campaignId])

  return { campaign, isLoading, error }
} 