import React, { Component } from "react";
import { Switch, Route, Link, BrowserRouter as Router } from "react-router-dom";
import axios from 'axios';
import io from 'socket.io-client';

import AddProduct from './components/AddProduct';
import Cart from './components/Cart';
import Login from './components/Login';
import ProductList from './components/ProductList';
import Checkout from './components/Checkout';
import Receipt from './components/Receipt';
import productList from './products.json';

import Context from "./Context";

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      cart: {},
      products: [],
      order: {},
    };
    this.routerRef = React.createRef();
  }

  async componentDidMount() {
    let user = localStorage.getItem("user");
    let cart = localStorage.getItem("cart");

    // console.log(productList.products);
    // const products = await axios.get('http://localhost:3001/products');

    user = user ? JSON.parse(user) : null;
    cart = cart? JSON.parse(cart) : {};

    // this.setState({ user,  products: products.data, cart });
    this.setState({ user,  products: productList.products, cart });
  }

  login = async (email, password) => {
    console.log('login --- ');
    let result;
    try {
      const API_URL = 'https://service.canum.io/auth/local';
      const data = { identifier: email, password: password };
      const headers = { 'Content-Type': 'application/json' };
      result = await axios.post(API_URL, data, headers);
//      console.log(result);
    }
    catch (err) {
      console.log(err);
      return { status: 401, message: 'Unauthorized' }
    }
    // const res = await axios.post(
    //   'http://localhost:3001/login',
    //   { email, password },
    // ).catch((res) => {
    //   return { status: 401, message: 'Unauthorized' }
    // })

    if(result.status === 200) {
//       const { email } = jwt_decode(result.data.accessToken)
      const user = {
        email,
        token: result.data.jwt,
        accessLevel: email === 'admin@example.com' ? 0 : 1
      }
      console.log(user);
      this.setState({ user });
      localStorage.setItem("user", JSON.stringify(user));
      return true;
    } else {
      return false;
    }
  }

  logout = e => {
    e.preventDefault();
    this.setState({ user: null });
    localStorage.removeItem("user");
  };

  addProduct = (product, callback) => {
    let products = this.state.products.slice();
    products.push(product);
    this.setState({ products }, () => callback && callback());
  };

  addToCart = cartItem => {
    let cart = this.state.cart;
    if (cart[cartItem.id]) {
      cart[cartItem.id].amount += cartItem.amount;
    } else {
      cart[cartItem.id] = cartItem;
    }
    if (cart[cartItem.id].amount > cart[cartItem.id].product.stock) {
      cart[cartItem.id].amount = cart[cartItem.id].product.stock;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    this.setState({ cart });
  };

  waitForTransactionComplete = async (id) => {
    const TRANSACTION_SOCKET = 'https://transaction.canum.io';
    const socket = io(TRANSACTION_SOCKET);
    const params = {
      room: id,
      name: "buyer",
    };
    socket.on('transactionResult', result => {
      console.log('transactionResult + ', result);
      this.setState(
        {
          transactionStatus: result.status,
          displayMode: 'complete',
        },
        () => {
          // this.waitForTransactionComplete(id);
          socket.disconnect();
        }
      );
    });
    socket.emit('join', params, function(result) {
      if (result.error) {
          console.log('socket emmit commitTransaction err ---------------');
          console.log(params);
          console.log(result);
      }
      else {
        console.log('socket emmit commitTransaction ---------------');
        socket.emit('commitTransaction', params);
      }
    });
  }

  createOrder = (total, comment) => {
    const { token } = this.state.user;
    console.log(this.state.user);
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    const data = {
      amount: total,
      description: comment,
    }
    const API_URL = 'https://service.canum.io/purchases';
    axios.post(API_URL, data, config)
    .then(result => {
      console.log('OK --> ');
      console.log(result);
      this.setState({ order: {
        id: result.data.id,
        amount: total,
        description: comment,
        isCallSocket: false,
        error: '',
      }});
      this.routerRef.current.history.push("/receipt");
    })
    .catch (err => {
      console.log('ERROR --> ');
      console.log(err);
      this.setState({ order: {
        id: '',
        amount: 0,
        description: '',
        error: err.error,
      }});
    });
  }

  receipt = () => {
    this.clearCart();
  }

  removeFromCart = cartItemId => {
    let cart = this.state.cart;
    delete cart[cartItemId];
    localStorage.setItem("cart", JSON.stringify(cart));
    this.setState({ cart });
  };

  clearCart = () => {
    let cart = {};
    localStorage.removeItem("cart");
    this.setState({ cart });
  };

  checkout = () => {
    if (!this.state.user) {
      this.routerRef.current.history.push("/login");
      return;
    }
    this.routerRef.current.history.push("/checkout");

    // const cart = this.state.cart;

    // const products = this.state.products.map(p => {
    //   if (cart[p.name]) {
    //     p.stock = p.stock - cart[p.name].amount;

    //     axios.put(
    //       `http://localhost:3001/products/${p.id}`,
    //       { ...p },
    //     )
    //   }
    //   return p;
    // });


    // this.setState({ products });
    // this.clearCart();
  };

  render() {
    return (
      <Context.Provider
        value={{
          ...this.state,
          removeFromCart: this.removeFromCart,
          addToCart: this.addToCart,
          login: this.login,
          addProduct: this.addProduct,
          clearCart: this.clearCart,
          checkout: this.checkout,
          createOrder: this.createOrder,
          receipt: this.receipt,
          waitForTransactionComplete: this.waitForTransactionComplete,
        }}
      >
        <Router ref={this.routerRef}>
        <div className="App">
          <nav
            className="navbar container"
            role="navigation"
            aria-label="main navigation"
          >
            <div className="navbar-brand">
              <b className="navbar-item is-size-4 ">ecommerce</b>
              <label
                role="button"
                class="navbar-burger burger"
                aria-label="menu"
                aria-expanded="false"
                data-target="navbarBasicExample"
                onClick={e => {
                  e.preventDefault();
                  this.setState({ showMenu: !this.state.showMenu });
                }}
              >
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
              </label>
            </div>
              <div className={`navbar-menu ${
                  this.state.showMenu ? "is-active" : ""
                }`}>
                <Link to="/products" className="navbar-item">
                  Products
                </Link>
                {this.state.user && this.state.user.accessLevel < 1 && (
                  <Link to="/add-product" className="navbar-item">
                    Add Product
                  </Link>
                )}
                <Link to="/cart" className="navbar-item">
                  Cart
                  <span
                    className="tag is-primary"
                    style={{ marginLeft: "5px" }}
                  >
                    { Object.keys(this.state.cart).length }
                  </span>
                </Link>
                {!this.state.user ? (
                  <Link to="/login" className="navbar-item">
                    Login
                  </Link>
                ) : (
                  <Link to="/" onClick={this.logout} className="navbar-item">
                    Logout
                  </Link>
                )}
              </div>
            </nav>
            <Switch>
              <Route exact path="/" component={ProductList} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/cart" component={Cart} />
              <Route exact path="/add-product" component={AddProduct} />
              <Route exact path="/products" component={ProductList} />
              <Route exact path="/checkout" component={Checkout} />
              <Route exact path="/receipt" component={Receipt} />
            </Switch>
          </div>
        </Router>
      </Context.Provider>
    );
  }
}
