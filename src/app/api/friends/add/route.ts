import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate the email - fix: validate body.email instead of entire body
    const { email: emailToAdd } = addFriendValidator.parse({ email: body.email });
    console.log("Processing friend request for email:", emailToAdd);
    
    const idToAdd = await fetchRedis("get", `user:email:${emailToAdd}`);
    
    if (!idToAdd) {
      console.log("User not found with email:", emailToAdd);
      return new Response("This person does not exist", { status: 400 });
    }
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const currentUserId = session.user.id;
    if (idToAdd === currentUserId) {
      return new Response("You cannot add yourself as a friend", { status: 400 });
    }
    
    const isAlreadyAdded = await fetchRedis(
      "sismember",
      `user:${idToAdd}:incoming_friend_requests`,
      currentUserId
    );
    
    if (isAlreadyAdded === 1) {
      return new Response("Already added this user", { status: 400 });
    }
    
    const isAlreadyFriends = await fetchRedis(
      "sismember",
      `user:${currentUserId}:friends`,
      idToAdd
    );
    
    if (isAlreadyFriends === 1) {
      return new Response("Already friends with this user", { status: 400 });
    }
    
    // Fix: there was a space after the colon in the Pusher channel key
    try {
      await pusherServer.trigger(
        toPusherKey(`user:${idToAdd}:incoming_friend_requests`), // Fixed space after colon
        'incoming_friend_requests',
        {
          senderId: session.user.id,
          senderEmail: session.user.email
        }
      );
      
      // Add to friend requests collections
      await fetchRedis("sadd", `user:${idToAdd}:incoming_friend_requests`, currentUserId);
      await fetchRedis("sadd", `user:${currentUserId}:outgoing_friend_requests`, idToAdd);
      
      console.log("Friend request sent from", currentUserId, "to", idToAdd);
      return new Response("ok");
    } catch (pusherError) {
      console.error("Pusher notification error:", pusherError);
      return new Response("Failed to send friend request notification", { status: 500 });
    }
  } catch (error) {
    console.error("Friend request error:", error);
    if (error instanceof z.ZodError) {
      return new Response(`Invalid request payload: ${error.message}`, { status: 422 });
    }
    return new Response("Invalid request", { status: 400 });
  }
}