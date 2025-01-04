import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle } from '@ionic/react';

const BadgeCollection = ({ badges }) => {
  const categorizedBadges = {
    language: badges.filter(b => b.category === 'language'),
    cultural: badges.filter(b => b.category === 'cultural'),
    achievement: badges.filter(b => b.category === 'achievement')
  };

  return (
    <div className="badge-collection">
      <h2>আমার অর্জন</h2>
      
      {Object.entries(categorizedBadges).map(([category, categoryBadges]) => (
        <div key={category} className="badge-category">
          <h3 className="category-title">
            {category === 'language' && 'ভাষা ব্যাজ'}
            {category === 'cultural' && 'সাংস্কৃতিক ব্যাজ'}
            {category === 'achievement' && 'অর্জন ব্যাজ'}
          </h3>
          
          <div className="badges-grid">
            {categoryBadges.map(badge => (
              <IonCard key={badge.id} className="badge-item">
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
                <div className="badge-description">{badge.description}</div>
              </IonCard>
            ))}
            
            {/* Placeholder for locked badges */}
            {Array.from({ length: 3 - categoryBadges.length }).map((_, i) => (
              <IonCard key={`locked-${i}`} className="badge-item locked">
                <div className="badge-icon">🔒</div>
                <div className="badge-name">লক করা</div>
              </IonCard>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadgeCollection;
