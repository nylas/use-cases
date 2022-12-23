import React from 'react';
import PropTypes from 'prop-types';

function OrderLineItem({ item }) {
  return (
    <div key={item.name} className="order-line-item">
      <div className="left-panel">
        <img
          src={item?.product_image_uri}
          alt="item-image"
          onError={({ currentTarget }) => {
            currentTarget.onerror = null; // prevents looping
            currentTarget.src = 'unknown.png';
          }}
        />
      </div>
      <div className="right-panel">
        <h3>{item.name}</h3>
        {item.product_id && (
          <p>
            <strong>Product No.:</strong> {item.product_id}
          </p>
        )}
        {item.quantity && (
          <p>
            <strong>Quantity:</strong> {item.quantity}
          </p>
        )}
        {item.unit_price && (
          <p>
            <strong>Unit Price:</strong> {item.unit_price / 100}
          </p>
        )}
        {item.color && (
          <p>
            <strong>Colour:</strong> {item.color}
          </p>
        )}
        {item.size && (
          <p>
            <strong>Colour:</strong> {item.color}
          </p>
        )}
      </div>
    </div>
  );
}

OrderLineItem.propTypes = {
  item: PropTypes.object,
};

export default OrderLineItem;
