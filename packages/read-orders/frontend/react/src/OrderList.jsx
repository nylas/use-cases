import React from 'react';
import PropTypes from 'prop-types';
import { formatPreviewDate } from './utils/date';

function OrderList({ orders, selectedOrder, setSelectedOrder }) {
  const handleOrderSelect = (order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="order-list-view">
      <section>
        <p className="title">Recent orders</p>
      </section>
      <section className="order-list-container styled-scollbar">
        {orders.length === 0 ? (
          <p>Loading orders.</p>
        ) : (
          <table>
            <thead>
              <tr className="heading-row">
                <th>Last Updated</th>
                <th>Merchant</th>
                <th>Order No.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const lastUpdateEmail = order.emails.slice(-1)[0];

                return (
                  <tr
                    key={order.id}
                    onClick={() => handleOrderSelect(order)}
                    className={order.id === selectedOrder?.id ? 'selected' : ''}
                  >
                    <td>
                      {formatPreviewDate(
                        new Date(lastUpdateEmail.order.order_date)
                      )}
                    </td>
                    <td>
                      <img
                        src={`${lastUpdateEmail.merchant.name.toLowerCase()}.png`}
                        alt="merchant-logo"
                        onError={({ currentTarget }) => {
                          currentTarget.onerror = null; // prevents looping
                          currentTarget.src = 'unknown.png';
                        }}
                      />{' '}
                      {lastUpdateEmail.merchant.name}
                    </td>
                    <td>{lastUpdateEmail.order.order_number}</td>
                    <td>
                      <strong>{order.status}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

OrderList.propTypes = {
  orders: PropTypes.array.isRequired,
  selectedOrder: PropTypes.object,
  setSelectedOrder: PropTypes.func,
};

export default OrderList;
