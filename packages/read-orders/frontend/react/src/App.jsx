import React, { useState, useEffect } from 'react';
import { useNylas } from '@nylas/nylas-react';
import NylasLogin from './NylasLogin';
import Layout from './components/Layout';
import OrderApp from './OrderApp';

function App() {
  const nylas = useNylas();
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const SERVER_URI = import.meta.env.VITE_SERVER_URI || 'http://localhost:9000';

  useEffect(() => {
    const userIdString = sessionStorage.getItem('userId');
    const userEmail = sessionStorage.getItem('userEmail');
    if (userIdString) {
      setUserId(userIdString);
    }
    if (userEmail) {
      setUserEmail(userEmail);
    }
  }, []);

  useEffect(() => {
    if (!nylas) {
      return;
    }

    // Handle the code that is passed in the query params from Nylas after a successful login
    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) {
      nylas
        .exchangeCodeFromUrlForToken()
        .then((user) => {
          const { id } = JSON.parse(user);
          setUserId(id);
          sessionStorage.setItem('userId', id);
        })
        .catch((error) => {
          console.error('An error occurred parsing the response:', error);
        });
    }
  }, [nylas]);

  useEffect(() => {
    if (userId?.length) {
      window.history.replaceState({}, '', `/?userId=${userId}`);
      getOrders();
    } else {
      window.history.replaceState({}, '', '/');
    }
  }, [userId]);

  const getOrders = async () => {
    setIsLoading(true);
    try {
      const url = SERVER_URI + '/nylas/get-orders';
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: userId,
          'Content-Type': 'message/rfc822',
        },
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        setOrders(processOrders(data));
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.warn(`Error retrieving emails:`, e);
      return false;
    }
    setIsLoading(false);
  };

  const getOrderStatus = (order) => {
    if (order.email_category === 'shipment_confirmation') {
      return 'SHIPPED';
    }
    if (order.email_category === 'order_confirmation') {
      return 'ORDERED';
    }
    return order.email_category; //
  };

  const processOrders = (ordersArray) => {
    const orders = {};
    // Combine emails, updating status if shipping confirmation is detected.
    // assume emails are retreived in reverse chrono order and reverse to process
    for (let idx = ordersArray.length - 1; idx >= 0; idx--) {
      const orderEmail = ordersArray[idx];
      const orderID = `${orderEmail.order.order_number}@${orderEmail.merchant.domain}`;
      const order = orders[orderID];

      if (order) {
        order.emails.push(orderEmail); //add order email to object
        order.status = getOrderStatus(orderEmail);
      } else {
        orders[orderID] = {
          id: orderID,
          emails: [orderEmail],
          status: getOrderStatus(orderEmail),
        };
      }
    }

    return Object.values(orders).sort((a, b) => {
      return (
        new Date(b.emails.slice(-1)[0].order.order_date) -
        new Date(a.emails.slice(-1)[0].order.order_date)
      );
    });
  };

  const disconnectUser = () => {
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userEmail');
    setUserId('');
    setUserEmail('');
  };

  const refresh = () => {
    getOrders();
  };

  return (
    <Layout
      showMenu={!!userId}
      disconnectUser={disconnectUser}
      refresh={refresh}
      isLoading={isLoading}
    >
      {!userId ? (
        <NylasLogin email={userEmail} setEmail={setUserEmail} />
      ) : (
        <div className="app-card">
          <OrderApp
            userEmail={userEmail}
            orders={orders}
            isLoading={isLoading}
            serverBaseUrl={SERVER_URI}
            userId={userId}
          />
        </div>
      )}
    </Layout>
  );
}

export default App;
