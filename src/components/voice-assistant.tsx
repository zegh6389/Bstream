"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  Volume2, 
  VolumeX,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceMessage {
  id: string
  text: string
  speaker: "user" | "assistant"
  timestamp: Date
  status?: "processing" | "completed" | "error"
  action?: {
    type: string
    data: any
  }
}

interface VoiceAssistantProps {
  className?: string
}

export function VoiceAssistant({ className }: VoiceAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [inputText, setInputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = false
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setInputText(transcript)
          handleSendMessage(transcript)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)
          addMessage("I'm sorry, I didn't catch that. Could you please repeat?", "assistant", "error")
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const addMessage = (text: string, speaker: "user" | "assistant", status?: "processing" | "completed" | "error", action?: any) => {
    const message: VoiceMessage = {
      id: Date.now().toString(),
      text,
      speaker,
      timestamp: new Date(),
      status,
      action,
    }
    setMessages(prev => [...prev, message])
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    // Add user message
    addMessage(text, "user")
    setInputText("")
    setIsProcessing(true)

    try {
      // Simulate AI processing
      addMessage("Processing your request...", "assistant", "processing")

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Remove processing message
      setMessages(prev => prev.filter(msg => msg.status !== "processing"))

      // Process the command and generate response
      const response = await processVoiceCommand(text)
      addMessage(response.text, "assistant", "completed", response.action)

      // Execute action if needed
      if (response.action) {
        await executeAction(response.action)
      }
    } catch (error) {
      console.error("Error processing voice command:", error)
      setMessages(prev => prev.filter(msg => msg.status !== "processing"))
      addMessage("I'm sorry, I encountered an error while processing your request.", "assistant", "error")
    } finally {
      setIsProcessing(false)
    }
  }

  const processVoiceCommand = async (command: string): Promise<{ text: string; action?: any }> => {
    const lowerCommand = command.toLowerCase()

    // Transaction-related commands
    if (lowerCommand.includes("add") && (lowerCommand.includes("income") || lowerCommand.includes("expense"))) {
      const isIncome = lowerCommand.includes("income")
      const amountMatch = command.match(/\$?(\d+(?:\.\d{2})?)/)
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0
      
      if (amount > 0) {
        return {
          text: `I'll help you add a ${isIncome ? "income" : "expense"} of $${amount.toFixed(2)}. Would you like me to proceed with adding this transaction?`,
          action: {
            type: "add_transaction",
            data: {
              type: isIncome ? "INCOME" : "EXPENSE",
              amount: amount,
              description: command
            }
          }
        }
      }
    }

    // Balance-related commands
    if (lowerCommand.includes("balance") || lowerCommand.includes("how much")) {
      return {
        text: "Your current balance is $3,250. You have $5,000 in income and $1,750 in expenses this month.",
        action: {
          type: "show_balance"
        }
      }
    }

    // Report-related commands
    if (lowerCommand.includes("report") || lowerCommand.includes("summary")) {
      return {
        text: "I can generate a financial report for you. Would you like a monthly summary, yearly overview, or custom date range?",
        action: {
          type: "generate_report"
        }
      }
    }

    // Category-related commands
    if (lowerCommand.includes("category") || lowerCommand.includes("categorize")) {
      return {
        text: "I can help you categorize transactions. Your top spending categories this month are: Office Supplies ($450), Utilities ($320), and Marketing ($280).",
        action: {
          type: "show_categories"
        }
      }
    }

    // Help commands
    if (lowerCommand.includes("help") || lowerCommand.includes("what can you do")) {
      return {
        text: "I can help you with:\n• Adding income and expenses\n• Checking your balance\n• Generating reports\n• Categorizing transactions\n• Setting reminders\n• Answering questions about your finances\n\nJust speak naturally and I'll understand!",
        action: {
          type: "show_help"
        }
      }
    }

    // Default response
    return {
      text: "I understand you said: \"" + command + "\". How can I help you with that? You can ask me about your balance, add transactions, generate reports, or get help with categories.",
    }
  }

  const executeAction = async (action: any) => {
    switch (action.type) {
      case "add_transaction":
        // Here you would integrate with your transaction system
        console.log("Adding transaction:", action.data)
        break
      case "show_balance":
        // Navigate to balance view
        console.log("Showing balance")
        break
      case "generate_report":
        // Generate and show report
        console.log("Generating report")
        break
      case "show_categories":
        // Show categories breakdown
        console.log("Showing categories")
        break
      case "show_help":
        // Show help dialog
        console.log("Showing help")
        break
      default:
        console.log("Unknown action:", action)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setInputText("")
      recognitionRef.current?.start()
      setIsListening(true)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "processing":
        return <Clock className="h-3 w-3 text-blue-500" />
      case "completed":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "error":
        return <AlertCircle className="h-3 w-3 text-red-500" />
      default:
        return null
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className={cn(
          "fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 shadow-lg",
          "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        )}
      >
        <Mic className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 w-96 max-h-[600px]", className)}>
      <Card className="shadow-2xl border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 rounded-full bg-gradient-to-b from-blue-500 to-purple-600"></div>
              <CardTitle className="text-lg">Voice Assistant</CardTitle>
              <Badge variant="secondary" className="text-xs">
                AI Powered
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                ×
              </Button>
            </div>
          </div>
          <CardDescription>
            Speak naturally or type to manage your business finances
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {/* Messages */}
          <ScrollArea className="h-96 px-4 py-2">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Hi! I'm your AI business assistant. How can I help you today?
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Try saying "Add expense of $50 for office supplies" or "What's my balance?"
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.speaker === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.speaker === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.speaker === "user"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : message.status === "error"
                        ? "bg-red-100 text-red-900 border border-red-200"
                        : message.status === "processing"
                        ? "bg-blue-100 text-blue-900 border border-blue-200"
                        : "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      {getStatusIcon(message.status)}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.speaker === "assistant" && message.action && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs opacity-70 hover:opacity-100"
                          onClick={() => executeAction(message.action)}
                        >
                          Execute
                        </Button>
                      )}
                    </div>
                  </div>

                  {message.speaker === "user" && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">Processing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator />

          {/* Input Area */}
          <div className="p-4">
            <div className="flex gap-2">
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={toggleListening}
                disabled={isProcessing}
                className="flex-shrink-0"
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type a message..."}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(inputText)
                  }
                }}
                disabled={isProcessing}
                className="flex-1"
              />
              
              <Button
                size="sm"
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isProcessing}
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {isListening && (
                  <Badge variant="destructive" className="text-xs">
                    Listening...
                  </Badge>
                )}
                {isMuted && (
                  <Badge variant="secondary" className="text-xs">
                    Muted
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  addMessage("What can you help me with?", "user")
                  setTimeout(() => {
                    handleSendMessage("What can you help me with?")
                  }, 100)
                }}
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                Help
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}