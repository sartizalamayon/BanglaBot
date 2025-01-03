import { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
} from '@ionic/react';
import {
  timeOutline,
  documentTextOutline,
  trendingUpOutline,
  starOutline,
} from 'ionicons/icons';
import './Dashboard.css';

const Dashboard = () => {
  // Fake data for demonstration
  const stats = {
    totalTranslations: 156,
    todayTranslations: 12,
    averageLength: 45,
    accuracy: 98,
  };

  const recentTranslations = [
    {
      id: 1,
      banglish: "ami tomake valobashi",
      bangla: "আমি তোমাকে ভালোবাসি",
      timestamp: "2025-01-03T09:30:00",
      length: 18,
    },
    {
      id: 2,
      banglish: "kemon acho bondhu",
      bangla: "কেমন আছো বন্ধু",
      timestamp: "2025-01-03T09:15:00",
      length: 15,
    },
    {
      id: 3,
      banglish: "bangladesh amar desh",
      bangla: "বাংলাদেশ আমার দেশ",
      timestamp: "2025-01-03T09:00:00",
      length: 20,
    },
    {
      id: 4,
      banglish: "amar sonar bangla",
      bangla: "আমার সোনার বাংলা",
      timestamp: "2025-01-03T08:45:00",
      length: 16,
    },
  ];

  const popularPhrases = [
    { text: "Hello", count: 45 },
    { text: "Thank you", count: 38 },
    { text: "Good morning", count: 32 },
    { text: "How are you", count: 28 },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="dashboard-content">
        {/* Stats Cards */}
        <IonGrid>
          <IonRow>
            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-icon">
                    <IonIcon icon={documentTextOutline} />
                  </div>
                  <div className="stat-value">{stats.totalTranslations}</div>
                  <div className="stat-label">Total Translations</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-icon">
                    <IonIcon icon={timeOutline} />
                  </div>
                  <div className="stat-value">{stats.todayTranslations}</div>
                  <div className="stat-label">Today's Translations</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-icon">
                    <IonIcon icon={trendingUpOutline} />
                  </div>
                  <div className="stat-value">{stats.averageLength}</div>
                  <div className="stat-label">Avg. Characters</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6" sizeMd="3">
              <IonCard className="stat-card">
                <IonCardContent>
                  <div className="stat-icon">
                    <IonIcon icon={starOutline} />
                  </div>
                  <div className="stat-value">{stats.accuracy}%</div>
                  <div className="stat-label">Accuracy</div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Recent Translations */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Recent Translations</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {recentTranslations.map((translation) => (
              <IonItem key={translation.id} lines="full">
                <IonLabel>
                  <h2>{translation.bangla}</h2>
                  <p>{translation.banglish}</p>
                  <div className="translation-meta">
                    <small>
                      {new Date(translation.timestamp).toLocaleTimeString()}
                    </small>
                    <IonBadge color="primary">{translation.length} chars</IonBadge>
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonCardContent>
        </IonCard>

        {/* Popular Phrases */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Popular Phrases</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="popular-phrases">
              {popularPhrases.map((phrase, index) => (
                <IonChip key={index} color="primary" outline>
                  <IonLabel>{phrase.text}</IonLabel>
                  <IonBadge color="primary">{phrase.count}</IonBadge>
                </IonChip>
              ))}
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
