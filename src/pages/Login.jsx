import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHistory, useLocation } from 'react-router-dom';
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner,
  useIonToast,
  isPlatform,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const [present] = useIonToast();

  useEffect(() => {
    if (currentUser) {
      const { from } = location.state || { from: { pathname: '/translation' } };
      history.replace(from);
    }
  }, [currentUser, history, location]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      
      present({
        message: 'Successfully logged in!',
        duration: isPlatform('mobile') ? 2000 : 1500,
        position: isPlatform('mobile') ? 'bottom' : 'top',
        color: 'success'
      });
      
      const { from } = location.state || { from: { pathname: '/translation' } };
      history.replace(from);
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to sign in: ' + error.message);
      present({
        message: 'Failed to sign in: ' + error.message,
        duration: 3000,
        position: isPlatform('mobile') ? 'bottom' : 'top',
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Login</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid fixed>
          <IonRow class="ion-justify-content-center ion-align-items-center" style={{ height: '100%' }}>
            <IonCol size="12" sizeMd="8" sizeLg="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle className="ion-text-center">Welcome Back!</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {error && (
                    <IonText color="danger" className="ion-text-center">
                      <p>{error}</p>
                    </IonText>
                  )}
                  <form onSubmit={handleSubmit}>
                    <IonItem>
                      <IonLabel position="floating">Email</IonLabel>
                      <IonInput
                        type="email"
                        value={email}
                        onIonChange={e => setEmail(e.detail.value)}
                        required
                        disabled={loading}
                        autocomplete="email"
                      />
                    </IonItem>
                    <IonItem className="ion-margin-bottom">
                      <IonLabel position="floating">Password</IonLabel>
                      <IonInput
                        type="password"
                        value={password}
                        onIonChange={e => setPassword(e.detail.value)}
                        required
                        disabled={loading}
                        autocomplete="current-password"
                      />
                    </IonItem>
                    <IonButton
                      expand="block"
                      type="submit"
                      disabled={loading}
                      className="ion-margin-top"
                    >
                      {loading ? (
                        <>
                          <IonSpinner name="crescent" />
                          <span className="ion-padding-start">Logging in...</span>
                        </>
                      ) : (
                        'Login'
                      )}
                    </IonButton>
                  </form>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Login;
