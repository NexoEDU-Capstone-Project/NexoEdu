import './style.css'
import Auth from './modules/auth'
import Login from './views/Login'
import Router from './modules/router';
import { supabase } from './services/supabase.js'

console.log('Supabase conectado:', supabase)


const routes = {
  "/": { view: Login, protected: false}
}

Auth.init();
Router.init(routes)