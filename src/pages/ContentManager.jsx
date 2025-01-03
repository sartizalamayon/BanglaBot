import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonButton, IonIcon, IonFab, IonFabButton, IonButtons } from '@ionic/react';
import { add, document, createOutline, logOut } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import './ContentManager.css';

const ContentManager = () => {
  const { logout } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    try {
      await logout();
      history.push('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Content Manager</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <IonIcon slot="icon-only" icon={logOut} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          <IonItem>
            <IonIcon icon={document} slot="start" />
            <IonLabel>
              <h2>My First Story</h2>
              <p>Last edited: 2 hours ago</p>
            </IonLabel>
            <IonButton fill="clear">
              <IonIcon icon={createOutline} />
            </IonButton>
          </IonItem>
        </IonList>
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default ContentManager;
