'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import Logo from "@/components/Logo"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/50">
      <Link href="/" className="mb-8">
        <Logo size="lg" />
      </Link>
      <Card className="w-[450px]" variant="blue-outline">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle>Registration Complete!</CardTitle>
          <CardDescription>Your account has been created successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-4">
            <p>
              Thank you for signing up for CleanFS. Your account is now pending approval from an administrator.
            </p>
            <p>
              You will receive a notification once your account has been approved, and then you will be able to log in.
            </p>
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
              <p className="font-medium">What happens next?</p>
              <ul className="list-disc list-inside mt-2 text-left">
                <li>An administrator will review your registration</li>
                <li>Once approved, you can log in to your account</li>
                <li>You'll have access to all CleanFS features</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Button asChild variant="outline">
              <Link href="/login">Go to Login</Link>
            </Button>
            <Button asChild>
              <Link href="/">Return Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
