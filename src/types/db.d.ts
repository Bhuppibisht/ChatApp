interface User {
    name: string
    email: string
    image: string
    id: string
}

interface chat {
    id: string
    messages: Message[]
}

interface Message {
    id: string
    senderId: string
    reciverId: string
    text: string
    timestamp: number
}

interface FriendRequest {
    id: string
    senderId: string
    reciverId: string
}