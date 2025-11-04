import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginPage from '../src/app/LoginPage';
import { supabase } from '../src/utils/supabase';

// Mock the supabase client
jest.mock('../src/utils/supabase', () => {
  return {
    supabase: {
      auth: {
        signInWithPassword: jest.fn()
      }
    }
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: 'Link'
}));

// Mock expo-router
jest.mock('expo-router', () => {
  return {
    Link: 'Link'
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByLabelText, getByPlaceholderText } = render(<LoginPage />);
    
    expect(getByLabelText('Log In')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('validates email format', async () => {
    const { getByPlaceholderText, getByLabelText, findByText } = render(<LoginPage />);
    
    const emailInput = getByPlaceholderText('Enter your email');
    fireEvent.changeText(emailInput, 'invalid-email');
    
    const loginButton = getByLabelText('Log In');
    fireEvent.press(loginButton);
    
    const errorMessage = await findByText('Please enter a valid email address');
    expect(errorMessage).toBeTruthy();
  });

  it('validates password is not empty', async () => {
    const { getByPlaceholderText, getByLabelText, findByText } = render(<LoginPage />);
    
    const emailInput = getByPlaceholderText('Enter your email');
    fireEvent.changeText(emailInput, 'valid@email.com');
    
    const loginButton = getByLabelText('Log In');
    fireEvent.press(loginButton);
    
    const errorMessage = await findByText('Please enter your password');
    expect(errorMessage).toBeTruthy();
  });

  it('submits form with valid data', async () => {
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
    mockSignIn.mockResolvedValueOnce({ data: { user: { id: '123' } }, error: null });

    const { getByPlaceholderText, getByLabelText } = render(<LoginPage />);
    
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    const loginButton = getByLabelText('Log In');
    fireEvent.press(loginButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('handles login error from Supabase', async () => {
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
    mockSignIn.mockResolvedValueOnce({ 
      data: null, 
      error: { message: 'Invalid login credentials' } 
    });

    const { getByPlaceholderText, getByLabelText, findByText } = render(<LoginPage />);
    
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    
    const loginButton = getByLabelText('Log In');
    fireEvent.press(loginButton);
    
    const errorMessage = await findByText('Invalid login credentials');
    expect(errorMessage).toBeTruthy();
  });

  it('handles unexpected errors during login', async () => {
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
    mockSignIn.mockRejectedValueOnce(new Error('Network error'));

    const { getByPlaceholderText, getByLabelText, findByText } = render(<LoginPage />);
    
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    const loginButton = getByLabelText('Log In');
    fireEvent.press(loginButton);
    
    const errorMessage = await findByText('An unexpected error occurred');
    expect(errorMessage).toBeTruthy();
  });
});
