import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home', () => {
  it('renders the Porteiro Virtual heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { name: /porteiro virtual/i });
    expect(heading).toBeInTheDocument();
  });
});
