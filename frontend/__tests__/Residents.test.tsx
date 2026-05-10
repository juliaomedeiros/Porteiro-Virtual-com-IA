import { render, screen, waitFor } from '@testing-library/react';
import ResidentsList from '@/app/residents/page';
import { moradoresApi } from '@/lib/api';

// Mock the API
jest.mock('@/lib/api', () => ({
  moradoresApi: {
    list: jest.fn(),
    delete: jest.fn(),
  },
  condominiosApi: {
    list: jest.fn(),
  },
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('ResidentsList', () => {
  const mockResidents = [
    {
      id: '1',
      name: 'John Doe',
      unit: '101',
      phone: '123456789',
      condominio_id: 'c1',
      is_active: true,
      cpf: '123'
    },
    {
      id: '2',
      name: 'Jane Smith',
      unit: '202',
      phone: '987654321',
      condominio_id: 'c1',
      is_active: true,
      cpf: '456'
    },
  ];

  beforeEach(() => {
    (moradoresApi.list as jest.Mock).mockResolvedValue({ data: mockResidents });
  });

  it('renders the residents list', async () => {
    render(<ResidentsList />);
    
    expect(screen.getByText(/loading residents.../i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
    
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('202')).toBeInTheDocument();
  });

  it('shows empty state when no residents are found', async () => {
    (moradoresApi.list as jest.Mock).mockResolvedValue({ data: [] });
    render(<ResidentsList />);
    
    await waitFor(() => {
      expect(screen.getByText(/no residents found/i)).toBeInTheDocument();
    });
  });
});
