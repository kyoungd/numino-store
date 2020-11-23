import React, { useEffect } from 'react';
import withContext from '../withContext';
import CartItem from './CartItem';
import QRCode from 'react-qr-code';

const Receipt = props => {
  const { cart, order, waitForTransactionComplete } = props.context;
  const id = order.id;
  console.log(order);
  useEffect(() => {
    console.log('useEffect, waitForTransactionComplete');
    waitForTransactionComplete(id);
  }, [waitForTransactionComplete, id]);
  const cartKeys = Object.keys(cart || {});
  return (
    <>
      <div className="hero is-primary">
        <div className="hero-body container">
          <h4 className="title">My Receipt</h4>
        </div>
      </div>
      <br />
      <div className="container">
        {cartKeys.length ? (
          <div className="column columns is-multiline">
            {cartKeys.map(key => (
              <CartItem
                cartKey={key}
                key={key}
                cartItem={cart[key]}
                removeFromCart={props.context.removeFromCart}
              />
            ))}
            <div className="column is-12 is-clearfix">
              <br />
              <div className="is-pulled-right">
                <label className="label">Comment: {order.description}</label>
                <label className="label">Total: ${order.amount}</label>
                <br />
                <QRCode 
                  value={ JSON.stringify(order) }
                />
              </div>
              <br />
            </div>
          </div>
        ) : (
          <div className="column">
            <div className="title has-text-grey-light">No item in cart!</div>
          </div>
        )}
      </div>
    </>
  );
};

export default withContext(Receipt);
