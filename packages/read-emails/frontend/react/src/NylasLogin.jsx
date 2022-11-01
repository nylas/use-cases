import React, { useState } from 'react';
import { useNylas } from '@nylas/nylas-react';

const NylasLogin = () => {
  const nylas = useNylas();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loginUser = (e) => {
    e.preventDefault();
    setIsLoading(true);

    nylas.authWithRedirect({
      emailAddress: email,
      successRedirectUrl: '',
    });
  };

  return (
    <section className="login">
      <form onSubmit={loginUser}>
        <input
          required
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Connect email'}
        </button>
      </form>
    </section>
  );
};

export default NylasLogin;
