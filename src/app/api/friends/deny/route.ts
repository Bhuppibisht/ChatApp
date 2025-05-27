import { fetchRedis } from '@/helpers/redis'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Parse and validate the incoming request body
    const { id: idToDeny } = z.object({ id: z.string() }).parse(body)
    
    // Get the current user's session
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Check if friend request exists
    const hasFriendRequest = await fetchRedis(
      'sismember',
      `user:${session.user.id}:incoming_friend_requests`,
      idToDeny
    )
    
    if (!hasFriendRequest) {
      // For consistency, return success even if the request doesn't exist
      // This allows the UI to update properly in all cases
      console.log(`No friend request found from ${idToDeny} to ${session.user.id}, but returning success anyway`)
      return new Response('OK')
    }
    
    // Remove the friend request records
    await db.srem(`user:${idToDeny}:outbound_friend_requests`, session.user.id)
    await db.srem(`user:${session.user.id}:incoming_friend_requests`, idToDeny)
    
    return new Response('OK')
  } catch (error: unknown) {
    // Type checking for ZodError
    if (error instanceof z.ZodError) {
      return new Response('Invalid request payload', { status: 422 })
    }
    
    // Log the error with proper type handling
    console.error('Friend request denial error:', 
      error instanceof Error ? error.message : 'Unknown error'
    )
    
    return new Response('Invalid request', { status: 400 })
  }
}