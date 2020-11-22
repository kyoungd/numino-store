import React, {useState} from "react";
import withContext from "../withContext";
import CartItem from "./CartItem";

const Checkout = props => {
  const { cart } = props.context;
  const cartKeys = Object.keys(cart || {});
  const total = cartKeys && cartKeys.length > 0 ? cartKeys.reduce((sum, item) => (sum + cart[item].product.price), 0) : 0;
  const [comment, setComment] = useState('');
  const handleChange = e => setComment(e.target.value);
  return (
    <>
      <div className="hero is-primary">
        <div className="hero-body container">
          <h4 className="title">Checkout</h4>
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
                <label className="label">Total: ${total}</label>
                <br />
                <div className="field">
                  <label className="label">Comment: </label>
                  <input
                    className="input"
                    type="text"
                    name="comment"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="column is-12 is-clearfix">
              <br />
              <div className="is-pulled-right">
                <button
                  className="button is-success"
                  onClick={() => props.context.createOrder(total, comment)}
                >
                  Confirmation
                </button>
              </div>
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

export default withContext(Checkout);
