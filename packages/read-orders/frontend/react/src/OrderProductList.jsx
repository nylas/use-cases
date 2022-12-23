import React from 'react';
import PropTypes from 'prop-types';
import OrderLineItem from './OrderLineItem.jsx';

function OrderProductList({ items }) {
  return (
    <>
      <h3>Items ordered:</h3>
      <div className="order-list">
        {items.map((item) => {
          return <OrderLineItem key={item.name} item={item} />;
        })}
      </div>
    </>
  );
}

OrderProductList.propTypes = {
  items: PropTypes.array,
};

export default OrderProductList;
