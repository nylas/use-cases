import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import OrderList from './OrderList';
import OrderDetail from './OrderDetail';
import EmailDetail from './EmailDetail';
import './styles/order.scss';

function OrderApp({ userEmail, orders, isLoading, serverBaseUrl, userId }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTabOrders, setSelectedTabOrders] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const tabs = ['All Orders', 'Shipped Orders', 'Placed Orders'];

  useEffect(() => {
    setSelectedOrder(null);
    setSelectedTab(0);
    setSelectedTabOrders(orders);
  }, [orders]);

  useEffect(() => {
    setSelectedEmail(null);
  }, [selectedOrder]);

  useEffect(() => {
    const filteredOrders = orders.filter((order) => {
      if (selectedTab === 0) {
        return true;
      } else if (selectedTab === 1) {
        return order.status === 'SHIPPED';
      } else if (selectedTab === 2) {
        return order.status === 'ORDERED';
      }
    });
    setSelectedTabOrders(filteredOrders);
    if (
      selectedOrder &&
      !filteredOrders.find((order) => order.id === selectedOrder.id)
    ) {
      setSelectedOrder(null);
      setSelectedEmail(null);
    }
  }, [selectedTab]);

  return (
    <>
      <div className={`order-app ${isLoading ? '' : 'loaded'}`}>
        {isLoading ? (
          <p className="loading-text">Loading orders...</p>
        ) : selectedTabOrders.length ? (
          <>
            <div className="left-panel">
              <div className="order-category-tab">
                {tabs.map((tab, index) => (
                  <div
                    key={index}
                    className={`order-category-tab-item ${
                      selectedTab === index ? 'active' : ''
                    }`}
                    onClick={() => setSelectedTab(index)}
                  >
                    {tab}
                  </div>
                ))}
              </div>
              <OrderList
                orders={selectedTabOrders}
                selectedOrder={selectedOrder}
                setSelectedOrder={setSelectedOrder}
              />
            </div>
            <div className="right-panel">
              {selectedEmail ? (
                <EmailDetail
                  selectedEmail={selectedEmail}
                  serverBaseUrl={serverBaseUrl}
                  setSelectedEmail={setSelectedEmail}
                  userEmail={userEmail}
                  userId={userId}
                />
              ) : (
                <OrderDetail
                  selectedOrder={selectedOrder}
                  serverBaseUrl={serverBaseUrl}
                  setSelectedEmail={setSelectedEmail}
                  userId={userId}
                />
              )}
            </div>
          </>
        ) : (
          <p className="loading-text">No available order</p>
        )}
      </div>
      <div className="mobile-warning hidden-desktop">
        <h2>
          Order sample app is currently designed for a desktop experience.
        </h2>
        <p>
          Visit Nylas dashboard for more use-cases: https://dashboard.nylas.com
        </p>
      </div>
    </>
  );
}

OrderApp.propTypes = {
  userEmail: PropTypes.string.isRequired,
  orders: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  serverBaseUrl: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};

export default OrderApp;
