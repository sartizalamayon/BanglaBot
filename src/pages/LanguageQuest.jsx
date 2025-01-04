import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonCard,
  IonButton,
  IonIcon,
  IonBadge,
  IonModal,
  IonProgressBar,
  IonToast,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { map, trophy, school, star, closeOutline } from 'ionicons/icons';
import './LanguageQuest.css';
import QuestChallenge from '../components/QuestChallenge';
import BadgeCollection from '../components/BadgeCollection';
import RegionMap from '../components/RegionMap';

const regions = {
  sylhet: {
    name: 'সিলেট',
    color: '#4CAF50',
    icon: '🏞️',
    description: 'চা বাগান আর হাওরের দেশ',
    unlockRequirement: null, // First region, no requirement
  },
  chittagong: {
    name: 'চট্টগ্রাম',
    color: '#2196F3',
    icon: '🌊',
    description: 'সাগর আর পাহাড়ের লীলাভূমি',
    unlockRequirement: 'sylhet', // Need to complete Sylhet first
  },
  barishal: {
    name: 'বরিশাল',
    color: '#9C27B0',
    icon: '🚣',
    description: 'নদী আর নৌকার শহর',
    unlockRequirement: 'chittagong',
  },
  rajshahi: {
    name: 'রাজশাহী',
    color: '#FF5722',
    icon: '🍎',
    description: 'মিষ্টি আম আর রেশমের নগরী',
    unlockRequirement: 'barishal',
  },
};

const LanguageQuest = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [currentQuest, setCurrentQuest] = useState(null);
  const [userBadges, setUserBadges] = useState([]);
  const [showChallenge, setShowChallenge] = useState(false);
  const [progress, setProgress] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadUserProgress();
    loadUserBadges();
  }, []);

  const loadUserProgress = async () => {
    try {
      const response = await fetch('/api/progress/user');
      const data = await response.json();
      setProgress(data.progress);
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const loadUserBadges = async () => {
    try {
      const response = await fetch('/api/badges/user');
      const data = await response.json();
      setUserBadges(data.badges);
    } catch (error) {
      console.error('Failed to load badges:', error);
    }
  };

  const startQuest = async (region) => {
    try {
      // Check if region is unlocked
      if (!isRegionUnlocked(region)) {
        setToastMessage('এই অঞ্চল এখনও লক করা আছে! আগের অঞ্চল সম্পূর্ণ করুন।');
        setShowToast(true);
        return;
      }

      const response = await fetch(`/api/quests/${region}`);
      const quest = await response.json();
      setCurrentQuest(quest);
      setSelectedRegion(region);
      setShowChallenge(true);
    } catch (error) {
      console.error('Failed to start quest:', error);
      setToastMessage('কুইজ লোড করতে ব্যর্থ হয়েছে।');
      setShowToast(true);
    }
  };

  const isRegionUnlocked = (regionKey) => {
    const region = regions[regionKey];
    if (!region.unlockRequirement) return true;
    return progress[region.unlockRequirement]?.completed;
  };

  const handleChallengeComplete = async (result) => {
    try {
      // Update progress
      const response = await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          region: selectedRegion,
          result,
        }),
      });

      const data = await response.json();
      setProgress(data.progress);

      // Check for badges
      if (data.newBadges?.length) {
        setUserBadges([...userBadges, ...data.newBadges]);
        setToastMessage('অভিনন্দন! নতুন ব্যাজ অর্জন করেছেন!');
        setShowToast(true);
      }

      setShowChallenge(false);
      loadUserProgress(); // Refresh progress
    } catch (error) {
      console.error('Failed to complete challenge:', error);
      setToastMessage('অগ্রগতি আপডেট করতে ব্যর্থ হয়েছে।');
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/dashboard" />
          </IonButtons>
          <IonTitle>বাংলার ভাষা যাত্রা</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <RegionMap 
          regions={regions}
          progress={progress}
          onRegionSelect={startQuest}
          isRegionUnlocked={isRegionUnlocked}
        />

        <BadgeCollection badges={userBadges} />

        <IonModal isOpen={showChallenge} onDidDismiss={() => setShowChallenge(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>{regions[selectedRegion]?.name} - ভাষা চ্যালেঞ্জ</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowChallenge(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {currentQuest && (
              <QuestChallenge
                quest={currentQuest}
                onComplete={handleChallengeComplete}
                region={regions[selectedRegion]}
              />
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default LanguageQuest;
