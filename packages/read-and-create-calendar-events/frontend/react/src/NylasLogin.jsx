import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import AppContext from './contexts/AppContext';

const NylasLogin = ({ email, setEmail }) => {
  const nylas = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false);

  const loginUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      nylas.setEmailAddress(email);
      const authUrl = await nylas.api.getAuthorizationUrl(email);
      window.location.href = authUrl;
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
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

NylasLogin.propTypes = {
  email: PropTypes.string.isRequired,
  setEmail: PropTypes.func.isRequired,
};

export default NylasLogin;
