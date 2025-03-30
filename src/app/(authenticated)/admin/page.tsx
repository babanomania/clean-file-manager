'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { supabase } from "@/services/supabase"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, RefreshCw, UserCheck, UserX, ShieldCheck } from "lucide-react"

interface UserProfile {
  id: string
  email: string
  name: string
  is_approved: boolean
  role: string
  created_at: string
  last_sign_in_at?: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check if current user is an admin
    const checkAdminStatus = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data.role === 'admin') {
          setIsAdmin(true)
          fetchUsers()
        } else {
          toast({
            title: "Access Denied",
            description: "You do not have permission to access the admin panel.",
            variant: "destructive",
          })
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, router, toast])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprovalToggle = async (userId: string, currentStatus: boolean) => {
    try {
      // Find user for notification message
      const targetUser = users.find(u => u.id === userId);
      const userName = targetUser?.name || 'User';
      const userEmail = targetUser?.email || '';
      
      // Show loading state
      setIsLoading(true);
      
      // First verify admin permissions to avoid permission errors
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
        
      if (adminCheckError || adminCheck?.role !== 'admin') {
        throw new Error('You do not have permission to perform this action. Please refresh the page and try again.');
      }
      
      // Update the profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_approved: !currentStatus })
        .eq('id', userId)

      if (profileError) throw profileError

      // Update the user metadata in auth.users
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { is_approved: !currentStatus } }
      )

      if (authError) throw authError

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_approved: !currentStatus } : u
      ))

      // Show more detailed toast notification
      toast({
        title: !currentStatus ? "User Approved " : "User Access Revoked ",
        description: !currentStatus 
          ? `${userName} (${userEmail}) can now access the system.`
          : `${userName} (${userEmail}) can no longer access the system.`,
        variant: !currentStatus ? "default" : "destructive",
      })
    } catch (error: any) {
      console.error('Error updating user approval status:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  }

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    
    try {
      // Find user for notification message
      const targetUser = users.find(u => u.id === userId);
      const userName = targetUser?.name || 'User';
      const userEmail = targetUser?.email || '';
      
      // Show loading state
      setIsLoading(true);
      
      // First verify admin permissions to avoid permission errors
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();
        
      if (adminCheckError || adminCheck?.role !== 'admin') {
        throw new Error('You do not have permission to perform this action. Please refresh the page and try again.');
      }
      
      // Update the profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (profileError) throw profileError

      // Update the user metadata in auth.users
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        { user_metadata: { role: newRole } }
      )

      if (authError) throw authError

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))

      // Show more detailed toast notification with role-specific styling
      toast({
        title: newRole === 'admin' ? "Admin Role Granted " : "Admin Role Removed ",
        description: newRole === 'admin'
          ? `${userName} (${userEmail}) now has administrator privileges.`
          : `${userName} (${userEmail}) now has standard user permissions.`,
        variant: "default",
      })
    } catch (error: any) {
      console.error('Error updating user role:', error)
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Admin Panel</h3>
        <p className="text-sm text-gray-500">
          Manage users and system settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Approve users and manage roles</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchUsers}
              className="flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.is_approved ? "default" : "destructive"}
                          className={`flex items-center w-fit ${user.is_approved ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                        >
                          {user.is_approved ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === 'admin' ? "outline" : "secondary"}
                          className="flex items-center w-fit"
                        >
                          {user.role === 'admin' ? (
                            <>
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            'User'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprovalToggle(user.id, user.is_approved)}
                            className={user.is_approved ? "text-red-500 border-red-200" : "text-green-500 border-green-200"}
                          >
                            {user.is_approved ? (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Revoke
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleToggle(user.id, user.role)}
                          >
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
