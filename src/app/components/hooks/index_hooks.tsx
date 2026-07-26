/* eslint-disable @typescript-eslint/no-unused-vars */
import { getCookie } from '@/app/helpers/token_operations';
import { signUp } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';

function IndexHooks() {
  const websocketRef = useRef<WebSocket | null>(null);

  const buttonElement = useRef<HTMLButtonElement | null>(null);
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [repeatPass, setRepeatPass] = useState<string>('');
  const [activeUsers, setActiveUsers] = useState<string>('');
  const [error, setError] = useState('');
  const router = useRouter();
  const handleClick = async (e: FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError("Name's too short.");
      return;
    } else if (username.match(/\s/)) {
      setError("Name can't contain whitespace");
      return;
    } else if (/[<>#!]/.test(username)) {
      setError("Name can't contain special characters (<,>,#,!)");
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email must have an @ sign and a . sign.');
      return;
    } else if (
      !/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(password)
    ) {
      setError(
        'Password must have 8 characters, one special character, one uppercase letter and at least one number.'
      );
      return;
    } else if (password !== repeatPass) {
      setError("Passwords don't match.");
      return;
    } else {
      setError('');
      try {
        // Disable button during signup
        if (buttonElement.current) {
          buttonElement.current.disabled = true;
        }

        await signUp({
          username: username, // this should NOT be an email
          password: password,
          options: {
            userAttributes: {
              email: email, // actual email goes here
              name: username,
            },
            autoSignIn: true,
          },
        });

        // Store email for verification page
        sessionStorage.setItem('signupEmail', email);
        sessionStorage.setItem('signupUsername', username);

        // Redirect to verification page
        router.push('/confirm');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error('Signup error:', err);

        // Handle specific Amplify errors
        if (err.name === 'UsernameExistsException') {
          setError('An account with this email already exists');
        } else if (err.name === 'InvalidPasswordException') {
          setError('Password does not meet requirements');
        } else if (err.name === 'InvalidParameterException') {
          setError('Invalid email or password format');
        } else {
          setError(err.message || 'Signup failed. Please try again.');
        }

        if (buttonElement.current) {
          buttonElement.current.disabled = false;
        }
      }
    }
  };
  //   const tokenReference = useRef(null);

  useEffect(() => {
    const token = getCookie('token');

    if (token) {
      router.push('/');
      alert("You're already signed in.");
      return;
    } else {
      return;
    }
  }, [router]);

  return {
    username,
    error,
    setUsername,
    buttonElement,
    handleClick,
    activeUsers,
    email,
    setEmail,
    password,
    setPassword,
    repeatPass,
    setRepeatPass,
  };
}

export default IndexHooks;
