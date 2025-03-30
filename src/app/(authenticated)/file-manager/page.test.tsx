import { render, screen, fireEvent, waitFor } from '@/lib/test-utils'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import FileManagerPage from './page'
import { files } from '@/services/supabase'

// Mock the Supabase config
vi.mock('@/config/supabase', () => ({
  SUPABASE_URL: 'https://mock-supabase-url.com',
  SUPABASE_ANON_KEY: 'mock-anon-key'
}))

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => {
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn()
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(['test']), error: null }),
        remove: vi.fn().mockResolvedValue({ error: null })
      })
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null })
    })
  }
  return {
    createClient: vi.fn().mockReturnValue(mockClient)
  }
})

// Mock the modules
vi.mock('@/services/supabase', () => ({
  files: {
    list: vi.fn().mockResolvedValue([]), // Default to empty array to prevent undefined
    upload: vi.fn(),
    delete: vi.fn(),
    download: vi.fn(),
  },
}))

describe('FileManagerPage', () => {
  const mockFiles = [
    {
      id: '1',
      name: 'test.pdf',
      type: 'application/pdf',
      size: 1024,
      storage_path: 'test.pdf',
      user_id: 'user-1',
      created_at: '2024-03-30T10:00:00Z',
      updated_at: '2024-03-30T10:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders file manager page with files', async () => {
    // Setup mock for this specific test
    (files.list as any).mockResolvedValue(mockFiles)
    
    render(<FileManagerPage />)
    
    // First check loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    
    // Wait for files to load
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })
    
    // Verify loading indicator is gone
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    
    // Check if file details are displayed correctly
    expect(screen.getByText('1 KB')).toBeInTheDocument()
    expect(screen.getByText('application/pdf')).toBeInTheDocument()
  })

  it('handles file upload', async () => {
    // Setup mocks for this specific test
    (files.list as any).mockResolvedValue(mockFiles)
    
    const file = new File(['test'], 'new-file.pdf', { type: 'application/pdf' })
    
    // Mock successful upload
    ;(files.upload as any).mockResolvedValue({ 
      id: '2', 
      name: 'new-file.pdf',
      type: 'application/pdf',
      size: 4,
      storage_path: 'user-1/new-file.pdf',
      user_id: 'user-1',
      created_at: '2024-03-30T11:00:00Z',
      updated_at: '2024-03-30T11:00:00Z'
    })
    
    // Mock list to be called again after upload with updated files
    const updatedFiles = [
      ...mockFiles,
      {
        id: '2', 
        name: 'new-file.pdf',
        type: 'application/pdf',
        size: 4,
        storage_path: 'user-1/new-file.pdf',
        user_id: 'user-1',
        created_at: '2024-03-30T11:00:00Z',
        updated_at: '2024-03-30T11:00:00Z'
      }
    ]
    ;(files.list as any).mockResolvedValueOnce(updatedFiles)
    
    const { container } = render(<FileManagerPage />)
    
    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })
    
    // Find the file input directly by type
    const input = container.querySelector('input[type="file"]')
    if (!input) throw new Error('File input not found')
    
    // Trigger file upload
    fireEvent.change(input, { target: { files: [file] } })
    
    // Wait for upload API call
    await waitFor(() => {
      expect(files.upload).toHaveBeenCalledWith(file, 'user-1')
    })
  })
})
