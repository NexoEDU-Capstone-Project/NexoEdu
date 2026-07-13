import './style.css'
import Auth from './modules/auth'
import Login from './views/Login'
import Router from './modules/router';

const routes = {
  "/": { view: Login, protected: false}
}

Auth.init();
Router.init(routes)