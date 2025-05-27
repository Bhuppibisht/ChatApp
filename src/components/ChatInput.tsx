'use client'

import { FC, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import Button from './ui/Button'
import toast from 'react-hot-toast'
import axios from 'axios'

interface ChatInputProps {
  chatPartner: User
  chatId: string
}

const ChatInput: FC<ChatInputProps> = ({ chatPartner, chatId }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')

  const sendMessage = async () => {
    if (!input) return
    setIsLoading(true)

    try {
      await axios.post('/api/message/send', { text: input, chatId })
      setInput('')
      textareaRef.current?.focus()
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="px-4 pt-4 mb-2 sm:mb-0">
      <div className="relative flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-600">
        <TextareaAutosize
          ref={textareaRef}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${chatPartner.name}`}
          className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
        <Button isLoading={isLoading} onClick={sendMessage} type="submit" className="ml-2">
          Post
        </Button>
      </div>
    </div>
  )
}

export default ChatInput
