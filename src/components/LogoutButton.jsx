import { IonButton, IonIcon, useIonAlert } from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import './LogoutButton.css';

const LogoutButton = () => {
  const { logout } = useAuth();
  const history = useHistory();
  const [presentAlert] = useIonAlert();

  const handleLogout = async () => {
    presentAlert({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Logout',
          role: 'confirm',
          handler: async () => {
            try {
              await logout();
              history.push('/login');
            } catch (error) {
              console.error('Logout failed:', error);
            }
          },
        },
      ],
    });
  };

  return (
    <IonButton
      fill="clear"
      className="logout-button"
      onClick={handleLogout}
    >
      <IonIcon icon={logOutOutline} slot="icon-only" />
    </IonButton>
  );
};

export default LogoutButton;
