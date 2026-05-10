import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import NewResident from '@/app/residents/new/page';
import { moradoresApi, condominiosApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock the API
jest.mock('@/lib/api', () => ({
  moradoresApi: {
    create: jest.fn(),
  },
  condominiosApi: {
    list: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('NewResident', () => {
  const mockCondominios = [
    { id: 'c1', name: 'Condominio A', cnpj: '123' },
    { id: 'c2', name: 'Condominio B', cnpj: '456' },
  ];

  const mockPush = jest.fn();

  beforeEach(() => {
    (condominiosApi.list as jest.Mock).mockResolvedValue({ data: mockCondominios });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders the form and submits data', async () => {
    render(<NewResident />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: '111222333' } });
    fireEvent.change(screen.getByLabelText(/unit/i), { target: { value: '303' } });
    fireEvent.change(screen.getByLabelText(/condominio/i), { target: { value: 'c2' } });
    
    (moradoresApi.create as jest.Mock).mockResolvedValue({ data: { id: '3' } });
    
    fireEvent.click(screen.getByRole('button', { name: /create resident/i }));
    
    await waitFor(() => {
      expect(moradoresApi.create).toHaveBeenCalledWith({
        name: 'Alice',
        phone: '111222333',
        cpf: '',
        unit: '303',
        condominio_id: 'c2',
      });
      expect(mockPush).toHaveBeenCalledWith('/residents');
    });
  });
});
