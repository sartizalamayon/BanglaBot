import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { 
  language, 
  document, 
  chatbubbles, 
  search, 
  bookmarks,
  trophy,
  analytics,
  person,
  statsChart
} from 'ionicons/icons';
import Translation from './pages/Translation';
import ContentManager from './pages/ContentManager';
import Login from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import ChatBot from './pages/ChatBot';
import Dashboard from './pages/Dashboard';
// import Search from './pages/Search';
// import MangaCreator from './pages/MangaCreator';
// import Leaderboard from './pages/Leaderboard';
// import Analytics from './pages/Analytics';
// import Profile from './pages/Profile';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// Call the element loader before the render call
defineCustomElements(window);

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const AppContent = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) {
        CapacitorApp.exitApp();
      } else {
        window.history.back();
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  return (
    <IonReactRouter>
      {!currentUser ? (
        <IonRouterOutlet>
          <Route exact path="/login" component={Login} />
          <Route exact path="/">
            <Redirect to="/login" />
          </Route>
          <Route>
            <Redirect to="/login" />
          </Route>
        </IonRouterOutlet>
      ) : (
        <IonTabs>
          <IonRouterOutlet>
            <PrivateRoute exact path="/translation" component={Translation} />
            <PrivateRoute exact path="/content" component={ContentManager} />
            <PrivateRoute exact path="/chatbot" component={ChatBot} />
            <PrivateRoute exact path="/dashboard" component={Dashboard} />
            {/* These routes will be uncommented when their components are created */}
            {/* <PrivateRoute exact path="/search" component={Search} />
            <PrivateRoute exact path="/manga" component={MangaCreator} />
            <PrivateRoute exact path="/leaderboard" component={Leaderboard} />
            <PrivateRoute exact path="/analytics" component={Analytics} />
            <PrivateRoute path="/profile" component={Profile} /> */}
            <Route exact path="/">
              <Redirect to="/translation" />
            </Route>
            <Route>
              <Redirect to="/translation" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="translation" href="/translation">
              <IonIcon icon={language} />
              <IonLabel>Translation</IonLabel>
            </IonTabButton>
            <IonTabButton tab="chatbot" href="/chatbot">
              <IonIcon icon={chatbubbles} />
              <IonLabel>Chat</IonLabel>
            </IonTabButton>
            <IonTabButton tab="dashboard" href="/dashboard">
              <IonIcon icon={statsChart} />
              <IonLabel>Dashboard</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      )}
    </IonReactRouter>
  );
};

function App() {
  return (
    <IonApp>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </IonApp>
  );
}

export default App;
