import FriendRequests from '@/components/FriendRequests'
import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { FC } from 'react'

// Add User interface if not imported elsewhere
interface User {
  id: string
  email: string
  name: string
  image?: string
}

const page = async () => {
  const session = await getServerSession(authOptions)
  if (!session) notFound()

  // ids of people who sent current logged in user a friend requests
  const incomingSenderIds = (await fetchRedis(
    'smembers',
    `user:${session.user.id}:incoming_friend_requests`
  )) as string[]

  const incomingFriendRequests = await Promise.all(
    incomingSenderIds.map(async (senderId) => {
      try {
        const sender = (await fetchRedis('get', `user:${senderId}`)) as string
        
        // Make sure sender data exists
        if (!sender) {
          console.error(`No user data found for senderId: ${senderId}`)
          return {
            senderId,
            senderEmail: 'Unknown email',
          }
        }

        // Safely parse the JSON
        let senderParsed: User
        try {
          senderParsed = JSON.parse(sender) as User
        } catch (error) {
          console.error(`Failed to parse user data for senderId: ${senderId}`, error)
          return {
            senderId,
            senderEmail: 'Invalid user data',
          }
        }

        // Safely access the email property
        return {
          senderId,
          senderEmail: senderParsed?.email || 'No email available',
        }
      } catch (error) {
        console.error(`Error processing friend request from ${senderId}:`, error)
        return {
          senderId,
          senderEmail: 'Error retrieving email',
        }
      }
    })
  )

  return (
    <main className='pt-8'>
      <h1 className='font-bold text-5xl mb-8'>Add a friend</h1>
      <div className='flex flex-col gap-4'>
        <FriendRequests
          incomingFriendRequests={incomingFriendRequests}
          sessionId={session.user.id}
        />
      </div>
    </main>
  )
}

export default page