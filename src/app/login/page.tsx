'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { User, Lock } from "react-feather"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import Logo from "@/components/Logo"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
})

export default function LoginPage() {
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === 'true'

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      await signIn(values.email, values.password)
      // No need to show toast here as the user will be redirected
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: "Authentication Failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false) // Only set loading to false on error, successful login will redirect
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/50">
      <Link href="/" className="mb-8">
        <Logo size="lg" />
      </Link>
      <Card className="w-[400px]" variant="blue-outline">
        <CardHeader>
          <CardTitle>Welcome Back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {justRegistered && (
            <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
              <InfoIcon className="h-4 w-4 mr-2" />
              <AlertDescription>
                Your account has been created and is pending approval by an administrator. 
                You will be able to sign in once your account is approved.
              </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" method="POST">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-blue-500 dark:text-blue-400" />
                        <Input 
                          placeholder="you@example.com" 
                          className="pl-10" 
                          {...field}
                          disabled={isLoading}
                          type="email"
                          autoComplete="email"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-blue-500 dark:text-blue-400" />
                        <Input 
                          placeholder="••••••••" 
                          className="pl-10" 
                          {...field}
                          type="password"
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>Don't have an account? <Link href="/signup" className="text-blue-600 hover:underline">Sign up</Link></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
