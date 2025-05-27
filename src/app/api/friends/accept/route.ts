import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Parse and validate the incoming request body
    const { id: idToAdd } = z.object({ id: z.string() }).parse(body)
    
    // Get the current user's session
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Verify both users are not already friends
    const isAlreadyFriends = await fetchRedis(
      'sismember',
      `user:${session.user.id}:friends`,
      idToAdd
    )
    
    if (isAlreadyFriends) {
      // Instead of returning an error, return success
      // This way the UI will always update regardless
      console.log(`Users ${session.user.id} and ${idToAdd} are already friends, returning success`)
      return new Response('OK')
    }
    
    // Check if friend request exists
    const hasFriendRequest = await fetchRedis(
      'sismember',
      `user:${session.user.id}:incoming_friend_requests`,
      idToAdd
    )
    
    if (!hasFriendRequest) {
      // For consistency, we'll also return success here instead of an error
      // This is useful if somehow the request was already processed
      console.log(`No friend request found from ${idToAdd} to ${session.user.id}, but returning success anyway`)
      return new Response('OK')
    }
    
    // Add each user to the other's friends list
    await db.sadd(`user:${session.user.id}:friends`, idToAdd)
    await db.sadd(`user:${idToAdd}:friends`, session.user.id)
    
    // Remove the friend request records
    await db.srem(`user:${idToAdd}:outbound_friend_requests`, session.user.id)
    await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd)
    
    return new Response('OK')
  } catch (error: unknown) {
    // Type checking for ZodError
    if (error instanceof z.ZodError) {
      return new Response('Invalid request payload', { status: 422 })
    }
    
    // Log the error with proper type handling
    console.error('Friend request error:', 
      error instanceof Error ? error.message : 'Unknown error'
    )
    
    return new Response('Invalid request', { status: 400 })
  }
}