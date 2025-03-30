import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function UIComponentsPage() {
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-blue-950/50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <Logo size="md" />
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
            <span>Back to Home</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">CleanFS UI Components</h1>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Buttons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Default Buttons</CardTitle>
                <CardDescription>Standard button variants from Shadcn UI</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </CardContent>
            </Card>

            <Card variant="blue-subtle">
              <CardHeader>
                <CardTitle>Blue Buttons</CardTitle>
                <CardDescription>Custom blue-themed button variants</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="blue">Blue</Button>
                <Button variant="blue-outline">Blue Outline</Button>
                <Button variant="blue-ghost">Blue Ghost</Button>
                <Button variant="blue-subtle">Blue Subtle</Button>
                <Button variant="blue-link">Blue Link</Button>
                <Button variant="gradient">Gradient</Button>
              </CardContent>
            </Card>

            <Card variant="gradient">
              <CardHeader>
                <CardTitle>Button Sizes</CardTitle>
                <CardDescription>Different button size options</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 items-center">
                <Button variant="blue" size="sm">Small</Button>
                <Button variant="blue" size="default">Default</Button>
                <Button variant="blue" size="lg">Large</Button>
                <Button variant="blue" size="xl">Extra Large</Button>
                <Button variant="blue" size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card with default styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the default card style from Shadcn UI with the updated blue theme variables.</p>
              </CardContent>
              <CardFooter>
                <Button>Action</Button>
              </CardFooter>
            </Card>

            <Card variant="blue">
              <CardHeader>
                <CardTitle>Blue Card</CardTitle>
                <CardDescription>Card with blue styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card uses the blue variant for a consistent theme throughout the application.</p>
              </CardContent>
              <CardFooter>
                <Button variant="blue-outline">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="blue-outline">
              <CardHeader>
                <CardTitle>Blue Outline Card</CardTitle>
                <CardDescription>Card with blue outline styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card uses the blue-outline variant for a subtle blue-themed appearance.</p>
              </CardContent>
              <CardFooter>
                <Button variant="blue">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="gradient">
              <CardHeader>
                <CardTitle>Gradient Card</CardTitle>
                <CardDescription>Card with gradient background</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card uses a blue gradient background for a more eye-catching appearance.</p>
              </CardContent>
              <CardFooter>
                <Button variant="gradient">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="blue-subtle">
              <CardHeader>
                <CardTitle>Blue Subtle Card</CardTitle>
                <CardDescription>Card with subtle blue styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card uses a subtle blue background that works well for secondary content.</p>
              </CardContent>
              <CardFooter>
                <Button variant="blue-subtle">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="subtle">
              <CardHeader>
                <CardTitle>Subtle Card</CardTitle>
                <CardDescription>Card with subtle styling</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card uses the subtle variant for a more muted appearance.</p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Badges</h2>
          <Card>
            <CardHeader>
              <CardTitle>Badge Variants</CardTitle>
              <CardDescription>Different badge styles for various use cases</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="blue">Blue</Badge>
              <Badge variant="blue-light">Blue Light</Badge>
              <Badge variant="blue-outline">Blue Outline</Badge>
              <Badge variant="gradient">Gradient</Badge>
            </CardContent>
          </Card>
        </section>

        <div className="text-center mt-16 mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Ready to use these components?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            CleanFS provides a consistent blue-themed UI component library built on top of Shadcn UI.
            Use these components to build beautiful and functional interfaces for your file management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gradient" size="lg">
              Get Started
            </Button>
            <Button variant="blue-outline" size="lg">
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
