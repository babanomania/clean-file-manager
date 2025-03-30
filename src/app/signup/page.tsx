'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { User, Lock, Mail } from "lucide-react"
import { useState } from "react"
import Logo from "@/components/Logo"
import Link from "next/link"
import { supabase } from "@/services/supabase"
import { useRouter } from "next/navigation"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  confirmPassword: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function SignupPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            is_approved: false, // User starts as not approved
            role: 'user', // Default role
          }
        }
      })
      
      if (error) throw error
      
      // Create a record in the profiles table with better error handling
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user?.id,
              email: values.email,
              name: values.name,
              is_approved: false,
              role: 'user',
              created_at: new Date().toISOString(),
            }
          ])
        
        if (profileError) {
          console.warn('Profile creation error:', profileError)
          // If the error is a duplicate key error, it might be fine (profile might already exist)
          if (!profileError.message.includes('duplicate key')) {
            throw profileError
          }
        }
      } catch (profileErr) {
        console.warn('Profile creation failed, but signup was successful:', profileErr)
        // We'll continue since the auth user was created successfully
      }
      
      // Show success message
      toast({
        title: "Registration Successful",
        description: "Your account has been created and is pending approval by an administrator.",
      })
      
      // Redirect to success page instead of login
      router.push('/signup/success')
    } catch (error: any) {
      console.error('Signup error:', error)
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/50">
      <Link href="/" className="mb-8">
        <Logo size="lg" />
      </Link>
      <Card className="w-[450px]" variant="blue-outline">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Sign up for CleanFS to start managing your files</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" method="POST">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-blue-500 dark:text-blue-400" />
                        <Input 
                          placeholder="John Doe" 
                          className="pl-10" 
                          {...field}
                          disabled={isLoading}
                          autoComplete="name"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-blue-500 dark:text-blue-400" />
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
                          disabled={isLoading}
                          type="password"
                          autoComplete="new-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-blue-500 dark:text-blue-400" />
                        <Input 
                          placeholder="••••••••" 
                          className="pl-10" 
                          {...field}
                          disabled={isLoading}
                          type="password"
                          autoComplete="new-password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
              
              <div className="text-center text-sm mt-4">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                  Sign in
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
