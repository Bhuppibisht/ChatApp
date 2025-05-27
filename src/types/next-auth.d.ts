// types/next-auth.d.ts
import type { Session, User } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

type UserId = string

declare module 'next-auth' {
  interface Session {
    user: {
      id: UserId
      name: string
      email: string
      image: string
    }
  }

  interface User {
    id: UserId
    name: string
    email: string
    image: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: UserId
    name: string
    email: string
    picture: string
  }
}
