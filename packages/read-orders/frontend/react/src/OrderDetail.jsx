import React from 'react';
import PropTypes from 'prop-types';
import OrderProductList from './OrderProductList.jsx';
import { formatMMMDDYYYY } from './utils/date';

function OrderDetail({ selectedOrder, setSelectedEmail }) {
  const latestUpdateData = selectedOrder?.emails.slice(-1)[0];
  const orderConfirmationData = selectedOrder?.emails.find(
    (email) => email.email_category === 'order_confirmation'
  );

  const costs =
    orderConfirmationData && getFormattedCosts(orderConfirmationData.order);

  function getFormattedCosts(order) {
    const costs = { subtotal: null };

    // don't worry about displaying null costs
    if (order.shipping_total !== null) costs.shipping = order.shipping_total;
    if (order.total_tax_amount !== null) costs.tax = order.total_tax_amount;
    if (order.total !== null) costs.total = order.total_amount;

    const subtotal = getSubtotal(costs); // calculate subtotal (it's not a default parsing prop)
    if (subtotal !== null) {
      costs.subtotal = subtotal;
    } else {
      delete costs.subtotal;
    }

    Object.keys(costs).forEach(
      (key) => (costs[key] = (costs[key] / 100).toFixed(2))
    );

    return costs;
  }

  function getSubtotal(costs) {
    const { total, ...res } = costs;

    return Object.values(res).every((cost) => cost === null)
      ? null
      : total - Object.values(res).reduce((a, c) => a + +c);
  }

  function capitalizeFirstLetter(str) {
    return str[0].toUpperCase() + str.slice(1);
  }

  function showSelectedEmail(emailId) {
    // alert(emailId);
    const selectedEmail = selectedOrder.emails.find(
      (email) => email.original_email_object.id === emailId
    ).original_email_object;
    setSelectedEmail(selectedEmail);
  }

  return (
    <div className="order-detail-view">
      {selectedOrder ? (
        <div className="selected">
          <div className="heading">
            <h3 className="title">{`${orderConfirmationData.merchant.name} (Order No. ${orderConfirmationData.order.order_number})`}</h3>
          </div>

          <table>
            <tbody>
              <tr>
                <th>Date ordered:</th>
                <td>
                  {formatMMMDDYYYY(orderConfirmationData.order.order_date)}
                </td>
              </tr>
              <tr>
                <th>Last update:</th>
                <td>
                  {formatMMMDDYYYY(latestUpdateData.email_timestamp / 1000)}
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Cost breakdown:</h3>
          <table>
            <tbody>
              {Object.keys(costs).map((costType) => (
                <tr key={costType}>
                  <th>{capitalizeFirstLetter(costType)}:</th>
                  <td>
                    <span>$</span>
                    <span>{costs[costType]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Related emails:</h3>
          <table>
            <tbody>
              {selectedOrder.emails.map((email) => (
                <tr key={email.fetched_email_id}>
                  <th>{formatMMMDDYYYY(email.email_timestamp / 1000)}:</th>
                  <td>
                    <span
                      className="related-email"
                      onClick={() => showSelectedEmail(email.fetched_email_id)}
                    >
                      {capitalizeFirstLetter(
                        email.email_category.replaceAll('_', ' ')
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orderConfirmationData.order.line_items.length !== 0 && (
            <OrderProductList items={orderConfirmationData.order.line_items} />
          )}
        </div>
      ) : (
        <div className="empty-order">
          <div className="icon">🛒</div>
          <p>Select an order to view its details.</p>
        </div>
      )}
    </div>
  );
}

OrderDetail.propTypes = {
  selectedOrder: PropTypes.object,
  setSelectedEmail: PropTypes.func.isRequired,
};

export default OrderDetail;
