import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-blue-950/50">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/features" className="text-blue-700 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 transition">
              Features
            </Link>
            <Link href="/docs" className="text-blue-700 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 transition">
              Documentation
            </Link>
            <Link href="https://github.com/yourusername/cleanfs" className="text-blue-700 dark:text-blue-300 hover:text-blue-500 dark:hover:text-blue-400 transition flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-md transition">
              Sign In
            </Link>
          </div>
          <button className="md:hidden text-blue-700 dark:text-blue-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-1 rounded-full text-sm font-medium mb-6">
              Open Source File Management
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Simple, Secure <span className="text-blue-600 dark:text-blue-400">File Management</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              CleanFS is a free, open-source file management system that provides a clean, intuitive interface for organizing and sharing your files securely.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-md shadow-lg transition text-center">
                Get Started Free
              </Link>
              <Link href="https://github.com/yourusername/cleanfs" className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 font-medium px-8 py-3 rounded-md shadow-md transition text-center flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Star on GitHub
              </Link>
            </div>
            <div className="mt-8 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <div className="flex -space-x-2 mr-3">
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" src="https://randomuser.me/api/portraits/men/1.jpg" alt="Contributor" />
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" src="https://randomuser.me/api/portraits/women/2.jpg" alt="Contributor" />
                <img className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" src="https://randomuser.me/api/portraits/men/3.jpg" alt="Contributor" />
              </div>
              <span>Backed by a growing community of contributors</span>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-full max-w-lg">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 relative z-10">
                  <div className="flex justify-between items-center mb-6">
                    <Logo size="sm" />
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="w-full h-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                    <div className="flex space-x-4">
                      <div className="w-1/3 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                      <div className="w-1/3 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse animation-delay-500"></div>
                      <div className="w-1/3 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse animation-delay-1000"></div>
                    </div>
                    <div className="w-full h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Upload Files</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-blue-50 dark:bg-blue-950/50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Key Features
          </h2>
          <p className="text-center text-blue-600 dark:text-blue-400 mb-12 max-w-2xl mx-auto">
            CleanFS is built with modern technologies and designed to be simple, secure, and extensible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md transition hover:shadow-lg border-t-4 border-blue-500">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Easy File Uploads
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Drag and drop files or use the file browser to upload your documents, images, and more.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md transition hover:shadow-lg border-t-4 border-blue-500">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Secure Sharing
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share files with password protection and expiration dates for enhanced security.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md transition hover:shadow-lg border-t-4 border-blue-500">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                File Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Track file downloads, views, and sharing activity with detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 overflow-hidden">
              <pre className="text-xs md:text-sm overflow-x-auto bg-gray-100 dark:bg-gray-900 p-4 rounded-md">
                <code className="language-typescript text-blue-600 dark:text-blue-400">
{`// Example file upload function
async function uploadFile(file: File) {
  try {
    const { data, error } = await supabase
      .storage
      .from('files')
      .upload(
        \`\${user.id}/\${file.name}\`, 
        file
      );
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}`}
                </code>
              </pre>
            </div>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              100% Open Source
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              CleanFS is completely open source and free to use. You can host it yourself or contribute to the project on GitHub.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-600 dark:text-gray-400">MIT License - Use for personal or commercial projects</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-600 dark:text-gray-400">Built with Next.js, Supabase, and TypeScript</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span className="text-gray-600 dark:text-gray-400">Easy to customize and extend with your own features</span>
              </li>
            </ul>
            <div className="mt-8">
              <Link href="https://github.com/yourusername/cleanfs" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                <span>View the source code</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0 md:mr-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-blue-100 text-lg">
                Join the community and start managing your files with CleanFS today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup" className="bg-white text-blue-600 font-medium px-8 py-3 rounded-md shadow-md hover:shadow-lg transition whitespace-nowrap">
                Sign Up Free
              </Link>
              <Link href="https://github.com/yourusername/cleanfs/stargazers" className="bg-blue-600 bg-opacity-30 text-white border border-white border-opacity-30 font-medium px-8 py-3 rounded-md shadow-md hover:shadow-lg transition whitespace-nowrap">
                Star on GitHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-50 dark:bg-blue-950/50 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <Logo size="sm" />
              <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-xs">
                CleanFS is a free, open-source file management system for individuals and teams.
              </p>
              <div className="flex space-x-4 mt-6">
                <a href="https://github.com/yourusername/cleanfs" className="text-blue-600 dark:text-blue-400 hover:text-blue-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://twitter.com/yourusername" className="text-blue-600 dark:text-blue-400 hover:text-blue-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="https://discord.gg/yourinvite" className="text-blue-600 dark:text-blue-400 hover:text-blue-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Project</h3>
                <ul className="space-y-2">
                  <li><Link href="/features" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Features</Link></li>
                  <li><Link href="/docs" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Documentation</Link></li>
                  <li><Link href="/roadmap" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Roadmap</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Community</h3>
                <ul className="space-y-2">
                  <li><Link href="/contribute" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Contribute</Link></li>
                  <li><Link href="https://github.com/yourusername/cleanfs/issues" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Report Issues</Link></li>
                  <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Contact Us</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">Terms of Service</Link></li>
                  <li><Link href="/license" className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">MIT License</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-blue-100 dark:border-blue-900 mt-12 pt-8">
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {new Date().getFullYear()} CleanFS. Open source under the MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
