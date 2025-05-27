'use client'

import { pusherClient } from '@/lib/pusher'
import { toPusherKey } from '@/lib/utils'
import axios from 'axios'
import { Check, UserPlus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useState } from 'react'

// Define the interface for friend requests
interface IncomingFriendRequest {
  senderId: string
  senderEmail: string
}

interface FriendRequestsProps {
  incomingFriendRequests: IncomingFriendRequest[]
  sessionId: string
}

const FriendRequests: FC<FriendRequestsProps> = ({
  incomingFriendRequests,
  sessionId,
}) => {
  const router = useRouter()
  const [friendRequests, setFriendRequests] = useState<IncomingFriendRequest[]>(
    incomingFriendRequests
  )

  useEffect(() => {
    pusherClient.subscribe(toPusherKey (`user:${sessionId}:incoming_friend_requests`))

    const friendRequestHandler = ({senderId, senderEmail}: IncomingFriendRequest) => {
      setFriendRequests((prev) => [...prev,{senderId, senderEmail}])
      

    }

    pusherClient.bind('incoming_friend_requests', friendRequestHandler)


    return () => {
       pusherClient.unsubscribe(toPusherKey (`user:${sessionId}:incoming_friend_requests`))

       pusherClient.unbind('incoming_friend_requests', friendRequestHandler)


    }

  }, [])

  const acceptFriend = async (senderId: string) => {
    try {
      // Make the request to accept the friend
      const response = await axios.post('/api/friends/accept', {
        id: senderId
      })
      
      console.log('Accept response:', response.data)
      
      // Update local state to remove the accepted request
      setFriendRequests((prev) =>
        prev.filter((request) => request.senderId !== senderId)
      )
      
      // Refresh the page to update the UI
      router.refresh()
    } catch (error: unknown) {
      console.log('Error occurred, removing request from UI anyway')
      
      // Even if there's an error (like "Already friends"), 
      // still update the UI to remove the request
      setFriendRequests((prev) =>
        prev.filter((request) => request.senderId !== senderId)
      )
      
      // Force refresh to make sure notification badge updates
      router.refresh()
    }
  }

  const denyFriend = async (senderId: string) => {
    try {
      // Make the request to deny the friend
      await axios.post('/api/friends/deny', {
        id: senderId
      })
      
      // Update local state to remove the denied request
      setFriendRequests((prev) =>
        prev.filter((request) => request.senderId !== senderId)
      )
      
      // Refresh the page to update the UI
      router.refresh()
    } catch (error: unknown) {
      console.log('Error occurred denying request, removing from UI anyway')
      
      // Even if there's an error, still update the UI to remove the request
      setFriendRequests((prev) =>
        prev.filter((request) => request.senderId !== senderId)
      )
      
      // Force refresh to make sure notification badge updates
      router.refresh()
    }
  }

  return (
    <>
      {friendRequests.length === 0 ? (
        <p className="text-sm text-zinc-500">Nothing to show here...</p>
      ) : (
        friendRequests.map((request) => (
          <div key={request.senderId} className="flex gap-4 items-center">
            <UserPlus className="text-black" />
            <p className="font-medium text-lg">{request.senderEmail}</p>
            
            <button
              onClick={() => acceptFriend(request.senderId)}
              aria-label="accept friend"
              className="w-8 h-8 bg-green-500 hover:bg-green-600 grid place-items-center rounded-full transition hover:shadow-md"
            >
              <Check className="font-semibold text-white w-3/4 h-3/4" />
            </button>
            
            <button
              onClick={() => denyFriend(request.senderId)}
              aria-label="deny friend"
              className="w-8 h-8 bg-red-600 hover:bg-red-700 grid place-items-center rounded-full transition hover:shadow-md"
            >
              <X className="font-semibold text-white w-3/4 h-3/4" />
            </button>
          </div>
        ))
      )}
    </>
  )
}

export default FriendRequests